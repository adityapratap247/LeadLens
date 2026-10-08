import { Icp } from '../models/Icp.js';
import { Lead } from '../models/Lead.js';
import { DEFAULT_WEIGHTS, extractFeatures, calculateScoreAndBreakdown } from '../services/scoringEngine.js';

/**
 * Get or create default ICP
 */
export async function getIcp(req, res) {
  try {
    let icp = await Icp.findOne().sort({ createdAt: -1 });
    if (!icp) {
      icp = await Icp.create({
        name: 'Primary Ideal Customer Profile',
        targetIndustries: ['SaaS', 'B2B Software', 'Fintech', 'AI/ML', 'Enterprise Software', 'Cybersecurity'],
        companySize: { min: 20, max: 500 },
        targetRegions: ['North America', 'United States', 'Europe', 'United Kingdom', 'Canada', 'Remote'],
        targetSeniority: ['C-level', 'VP', 'Director', 'Founder', 'Head of'],
        targetKeywords: ['b2b', 'enterprise', 'ai', 'cloud', 'security', 'analytics', 'automation', 'growth'],
        weights: DEFAULT_WEIGHTS,
        learningRate: 6.0,
      });
    }
    return res.json({ success: true, data: icp });
  } catch (err) {
    console.error('[IcpController] getIcp error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update ICP criteria and re-score all existing leads
 */
export async function updateIcp(req, res) {
  try {
    const { targetIndustries, companySize, targetRegions, targetSeniority, targetKeywords, weights } = req.body;

    let icp = await Icp.findOne().sort({ createdAt: -1 });
    if (!icp) {
      icp = new Icp();
    }

    if (targetIndustries !== undefined) icp.targetIndustries = targetIndustries;
    if (companySize !== undefined) icp.companySize = companySize;
    if (targetRegions !== undefined) icp.targetRegions = targetRegions;
    if (targetSeniority !== undefined) icp.targetSeniority = targetSeniority;
    if (targetKeywords !== undefined) icp.targetKeywords = targetKeywords;
    if (weights !== undefined) icp.weights = { ...icp.weights, ...weights };

    await icp.save();

    // Re-score all leads with updated ICP criteria and weights
    const leads = await Lead.find();
    if (leads.length > 0) {
      const bulkOps = leads.map((lead) => {
        const features = extractFeatures(lead, icp);
        const { score, breakdown } = calculateScoreAndBreakdown(features, icp.weights);
        return {
          updateOne: {
            filter: { _id: lead._id },
            update: {
              $set: {
                features,
                score,
                breakdown,
              },
            },
          },
        };
      });

      await Lead.bulkWrite(bulkOps);
    }

    return res.json({ success: true, data: icp, message: `ICP updated and ${leads.length} leads re-scored.` });
  } catch (err) {
    console.error('[IcpController] updateIcp error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Reset weights back to default values
 */
export async function resetWeights(req, res) {
  try {
    let icp = await Icp.findOne().sort({ createdAt: -1 });
    if (!icp) {
      icp = await Icp.create({ weights: DEFAULT_WEIGHTS });
    } else {
      icp.weights = { ...DEFAULT_WEIGHTS };
      icp.changeHistory.push({
        timestamp: new Date(),
        leadDomain: 'SYSTEM_RESET',
        company: 'Reset to Factory Defaults',
        vote: 0,
        previousWeights: icp.weights,
        newWeights: DEFAULT_WEIGHTS,
        notes: ['Weights manually reset to default initial state.'],
      });
      icp.totalVotes = 0;
      icp.upVotes = 0;
      icp.downVotes = 0;
      await icp.save();
    }

    // Re-score leads
    const leads = await Lead.find();
    if (leads.length > 0) {
      const bulkOps = leads.map((lead) => {
        const features = extractFeatures(lead, icp);
        const { score, breakdown } = calculateScoreAndBreakdown(features, icp.weights);
        return {
          updateOne: {
            filter: { _id: lead._id },
            update: {
              $set: {
                features,
                score,
                breakdown,
                userVote: null,
                voteTimestamp: null,
              },
            },
          },
        };
      });
      await Lead.bulkWrite(bulkOps);
    }

    return res.json({ success: true, data: icp, message: 'Weights reset and leads re-scored.' });
  } catch (err) {
    console.error('[IcpController] resetWeights error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

