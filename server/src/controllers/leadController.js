import csv from 'csv-parser';
import { Readable } from 'node:stream';
import { Lead } from '../models/Lead.js';
import { Icp } from '../models/Icp.js';
import { generateSampleLeads } from '../data/sampleLeads.js';
import { deduplicateLeads, normalizeDomain } from '../services/leadNormalizer.js';
import { verifyEmail } from '../services/emailValidator.js';
import { scrapeDomainsBatch } from '../services/domainScraper.js';
import {
  DEFAULT_WEIGHTS,
  extractFeatures,
  calculateScoreAndBreakdown,
  updateWeights,
} from '../services/scoringEngine.js';

async function getActiveIcp() {
  let icp = await Icp.findOne().sort({ createdAt: -1 });
  if (!icp) {
    icp = await Icp.create({ weights: DEFAULT_WEIGHTS });
  }
  return icp;
}

/**
 * Get all ranked and scored leads with filters
 */
export async function getLeads(req, res) {
  try {
    const { scoreMin, scoreMax, confidence, region, search } = req.query;
    const query = {};

    if (scoreMin !== undefined || scoreMax !== undefined) {
      query.score = {};
      if (scoreMin !== undefined && scoreMin !== '') query.score.$gte = Number(scoreMin);
      if (scoreMax !== undefined && scoreMax !== '') query.score.$lte = Number(scoreMax);
    }

    if (confidence && confidence !== 'all') {
      query.confidence = confidence;
    }

    if (region && region !== 'all') {
      query.region = region;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { company: regex },
        { domain: regex },
        { contactName: regex },
        { title: regex },
        { industry: regex },
        { description: regex },
      ];
    }

    const leads = await Lead.find(query).sort({ score: -1, createdAt: -1 }).lean();
    const totalCount = await Lead.countDocuments();

    return res.json({
      success: true,
      data: leads,
      totalCount,
      filteredCount: leads.length,
    });
  } catch (err) {
    console.error('[LeadController] getLeads error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Load ~200 realistic sample leads
 */
export async function loadSampleData(req, res) {
  try {
    const icp = await getActiveIcp();
    const rawSamples = generateSampleLeads(200);

    // Run verification/enrichment and scoring
    const scoredLeads = rawSamples.map((raw) => {
      const features = extractFeatures(raw, icp);
      const { score, breakdown } = calculateScoreAndBreakdown(features, icp.weights);
      return {
        ...raw,
        features,
        score,
        breakdown,
        userVote: null,
      };
    });

    const deduped = deduplicateLeads(scoredLeads);

    await Lead.deleteMany({});
    const inserted = await Lead.insertMany(deduped);

    return res.json({
      success: true,
      message: `Successfully loaded ${inserted.length} realistic sample leads.`,
      count: inserted.length,
    });
  } catch (err) {
    console.error('[LeadController] loadSampleData error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Upload CSV file (SaaSquatch format)
 */
export async function uploadCsv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded.' });
    }

    const icp = await getActiveIcp();
    const rawRows = [];

    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (row) => rawRows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (rawRows.length === 0) {
      return res.status(400).json({ success: false, error: 'CSV file is empty or invalid.' });
    }

    // Map common CSV header variations
    const parsedLeads = [];
    for (const row of rawRows) {
      const company = row.company || row['company name'] || row.organization || '';
      const domain = row.domain || row.website || row['company domain'] || (row.email ? row.email.split('@')[1] : '');
      const industry = row.industry || row.sector || row.category || 'Unknown';
      const employeeCount = Number(row['employee count'] || row.employees || row.size || row.employeecount || 0);
      const location = row.location || row.city || row.address || row.headquarters || '';
      const contactName = row['contact name'] || row.name || row.contact || `${row['first name'] || ''} ${row['last name'] || ''}`.trim();
      const title = row.title || row['job title'] || row.position || row.role || '';
      const email = row.email || row['contact email'] || row['email address'] || '';
      const description = row.description || row.about || row.summary || '';

      if (domain || company || email) {
        parsedLeads.push({
          company,
          domain: normalizeDomain(domain),
          industry,
          employeeCount,
          location,
          contactName,
          title,
          email,
          description,
          source: 'csv',
        });
      }
    }

    // Deduplicate parsed leads
    const deduped = deduplicateLeads(parsedLeads);

    // Verify emails for each deduplicated lead
    for (const lead of deduped) {
      if (lead.email) {
        const verification = await verifyEmail(lead.email);
        lead.emailVerified = verification.isValid;
      }
      const features = extractFeatures(lead, icp);
      const { score, breakdown } = calculateScoreAndBreakdown(features, icp.weights);
      lead.features = features;
      lead.score = score;
      lead.breakdown = breakdown;
    }

    // Upsert into DB by exact domain
    for (const lead of deduped) {
      await Lead.findOneAndUpdate(
        { domain: lead.domain },
        { $set: lead },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const totalLeads = await Lead.countDocuments();
    return res.json({
      success: true,
      message: `Processed ${deduped.length} leads from CSV upload.`,
      count: deduped.length,
      totalCount: totalLeads,
    });
  } catch (err) {
    console.error('[LeadController] uploadCsv error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Paste up to 20 domains for polite web enrichment
 */
export async function pasteDomains(req, res) {
  try {
    const { domains } = req.body;
    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide an array of domains (up to 20).' });
    }

    const icp = await getActiveIcp();
    const scrapedLeads = await scrapeDomainsBatch(domains, 3);
    const deduped = deduplicateLeads(scrapedLeads);

    for (const lead of deduped) {
      const features = extractFeatures(lead, icp);
      const { score, breakdown } = calculateScoreAndBreakdown(features, icp.weights);
      lead.features = features;
      lead.score = score;
      lead.breakdown = breakdown;

      await Lead.findOneAndUpdate(
        { domain: lead.domain },
        { $set: lead },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return res.json({
      success: true,
      message: `Enriched and saved ${deduped.length} domains.`,
      data: deduped,
    });
  } catch (err) {
    console.error('[LeadController] pasteDomains error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Self-Tuning Scorer Vote: Thumbs Up (1) or Thumbs Down (0)
 * Performs online perceptron update on weights, re-scores all leads, and logs model learning history
 */
export async function voteLead(req, res) {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 1 for Thumbs Up, 0 for Thumbs Down

    if (vote !== 1 && vote !== 0) {
      return res.status(400).json({ success: false, error: 'Vote must be 1 (up) or 0 (down).' });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found.' });
    }

    const icp = await getActiveIcp();
    const previousWeights = { ...icp.weights.toObject?.() || icp.weights };

    // Extract current features and calculate perceptron update
    const features = lead.features && Object.keys(lead.features).length > 0
      ? lead.features
      : extractFeatures(lead, icp);

    const { newWeights, notes, delta } = updateWeights(
      previousWeights,
      features,
      vote,
      lead.score,
      icp.learningRate || 6.0
    );

    // Save vote on lead
    lead.userVote = vote;
    lead.voteTimestamp = new Date();
    await lead.save();

    // Update ICP weights & stats
    icp.weights = newWeights;
    icp.totalVotes = (icp.totalVotes || 0) + 1;
    if (vote === 1) icp.upVotes = (icp.upVotes || 0) + 1;
    else icp.downVotes = (icp.downVotes || 0) + 1;

    icp.changeHistory.unshift({
      timestamp: new Date(),
      leadDomain: lead.domain,
      company: lead.company,
      vote,
      previousWeights,
      newWeights,
      notes,
    });

    // Keep history capped to last 50 events
    if (icp.changeHistory.length > 50) {
      icp.changeHistory = icp.changeHistory.slice(0, 50);
    }

    await icp.save();

    // Re-score all leads in DB with newly learned weights
    const allLeads = await Lead.find();
    if (allLeads.length > 0) {
      const bulkOps = allLeads.map((l) => {
        const feat = l.features && Object.keys(l.features).length > 0 ? l.features : extractFeatures(l, icp);
        const { score, breakdown } = calculateScoreAndBreakdown(feat, newWeights);
        return {
          updateOne: {
            filter: { _id: l._id },
            update: {
              $set: {
                features: feat,
                score,
                breakdown,
              },
            },
          },
        };
      });

      await Lead.bulkWrite(bulkOps);
    }

    // Fetch updated lead
    const updatedLead = await Lead.findById(id);

    return res.json({
      success: true,
      message: `Vote recorded. Weights updated and ${allLeads.length} leads re-ranked.`,
      data: {
        lead: updatedLead,
        icp,
        newWeights,
        delta,
        notes,
      },
    });
  } catch (err) {
    console.error('[LeadController] voteLead error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Export ranked leads to CSV
 */
export async function exportCsv(req, res) {
  try {
    const leads = await Lead.find().sort({ score: -1, createdAt: -1 }).lean();

    const headers = [
      'Rank',
      'Score (0-100)',
      'Confidence',
      'Company',
      'Domain',
      'Industry',
      'Employees',
      'Location',
      'Region',
      'Contact Name',
      'Title',
      'Email',
      'Email Verified',
      'Score Breakdown',
      'User Feedback',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = leads.map((lead, index) => {
      const userFeedback = lead.userVote === 1 ? 'Thumbs Up' : lead.userVote === 0 ? 'Thumbs Down' : 'Unvoted';
      const breakdownText = (lead.breakdown || []).join('; ');
      return [
        index + 1,
        lead.score,
        escapeCsv(lead.confidence),
        escapeCsv(lead.company),
        escapeCsv(lead.domain),
        escapeCsv(lead.industry),
        lead.employeeCount || 0,
        escapeCsv(lead.location),
        escapeCsv(lead.region),
        escapeCsv(lead.contactName),
        escapeCsv(lead.title),
        escapeCsv(lead.email),
        lead.emailVerified ? 'Yes' : 'No',
        escapeCsv(breakdownText),
        escapeCsv(userFeedback),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="caprae-leadlens-ranked-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[LeadController] exportCsv error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Clear all leads from collection
 */
export async function clearLeads(req, res) {
  try {
    await Lead.deleteMany({});
    return res.json({ success: true, message: 'All leads cleared.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

