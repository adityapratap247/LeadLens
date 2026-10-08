/**
 * Lead Normalizer & Deduplicator
 * Exact domain deduplication, title normalization, region mapping, and confidence flag assignment.
 */

// Common seniority mapping
const SENIORITY_MAP = [
  { match: /\b(chief|ceo|cto|cfo|cmo|cro|coo|cpo|cio|ciso|c-level|founder|co-founder|owner|president)\b/i, normalized: 'C-level / Founder' },
  { match: /\b(vp|vice president|svp|evp)\b/i, normalized: 'VP' },
  { match: /\b(director|head of|lead)\b/i, normalized: 'Director / Head' },
  { match: /\b(manager|lead|supervisor)\b/i, normalized: 'Manager' },
  { match: /\b(engineer|developer|specialist|consultant|analyst|associate|representative)\b/i, normalized: 'Individual Contributor' },
];

// Region normalization
const REGION_MAP = [
  { match: /\b(usa|united states|us|ny|ca|california|new york|texas|tx|san francisco|austin|seattle|boston|chicago|florida|fl)\b/i, region: 'North America', country: 'United States' },
  { match: /\b(canada|toronto|vancouver|montreal|ontario|bc)\b/i, region: 'North America', country: 'Canada' },
  { match: /\b(uk|united kingdom|london|england|great britain|manchester)\b/i, region: 'Europe', country: 'United Kingdom' },
  { match: /\b(germany|berlin|munich|france|paris|netherlands|amsterdam|sweden|stockholm|ireland|dublin|spain|madrid|italy|switzerland|poland)\b/i, region: 'Europe', country: 'Europe' },
  { match: /\b(singapore|australia|sydney|melbourne|india|bangalore|tokyo|japan|hong kong)\b/i, region: 'APAC', country: 'APAC' },
  { match: /\b(brazil|sao paulo|mexico|colombia|argentina)\b/i, region: 'LATAM', country: 'LATAM' },
  { match: /\b(remote|global|worldwide)\b/i, region: 'Remote', country: 'Remote' },
];

/**
 * Normalizes a raw domain string into clean domain (e.g., 'https://www.Stripe.com/about/' -> 'stripe.com')
 */
export function normalizeDomain(rawDomain) {
  if (!rawDomain || typeof rawDomain !== 'string') return '';
  let cleaned = rawDomain.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split('?')[0];
  cleaned = cleaned.split('#')[0];
  return cleaned.trim();
}

/**
 * Normalizes a job title
 */
export function normalizeTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  const trimmed = rawTitle.trim();
  for (const item of SENIORITY_MAP) {
    if (item.match.test(trimmed)) {
      return trimmed; // keep descriptive title, item.normalized is matched in ICP scoring
    }
  }
  return trimmed;
}

/**
 * Normalizes location and infers standard region
 */
export function inferRegion(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return { location: '', region: 'Other' };
  const trimmed = locationStr.trim();
  for (const item of REGION_MAP) {
    if (item.match.test(trimmed)) {
      return { location: trimmed, region: item.region };
    }
  }
  return { location: trimmed, region: 'Other' };
}

/**
 * Calculate lead confidence flag: High / Medium / Low
 */
export function calculateConfidence(lead) {
  let scorePoints = 0;
  
  if (lead.email && lead.email.includes('@')) {
    scorePoints += 2;
  }
  if (lead.emailVerified) {
    scorePoints += 3;
  }
  if (lead.contactName && lead.contactName.length > 2) {
    scorePoints += 2;
  }
  if (lead.title && lead.title.length > 2) {
    scorePoints += 2;
  }
  if (lead.employeeCount && lead.employeeCount > 0) {
    scorePoints += 1;
  }
  if (lead.industry && lead.industry !== 'Unknown') {
    scorePoints += 1;
  }
  if (lead.description && lead.description.length > 20) {
    scorePoints += 1;
  }

  if (scorePoints >= 7 && (lead.emailVerified || (lead.email && lead.contactName))) {
    return 'High';
  } else if (scorePoints >= 4) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Merges two lead records for the same exact domain, keeping the most complete fields
 */
export function mergeLeads(existing, incoming) {
  const merged = { ...existing };

  merged.company = incoming.company || existing.company || incoming.domain;
  merged.industry = (incoming.industry && incoming.industry !== 'Unknown') ? incoming.industry : existing.industry;
  merged.employeeCount = incoming.employeeCount || existing.employeeCount || 0;
  merged.location = incoming.location || existing.location || '';
  merged.region = incoming.region || existing.region || '';
  merged.contactName = incoming.contactName || existing.contactName || '';
  merged.title = incoming.title || existing.title || '';
  merged.email = incoming.email || existing.email || '';
  merged.description = incoming.description || existing.description || '';
  merged.socialLinks = Array.from(new Set([...(existing.socialLinks || []), ...(incoming.socialLinks || [])]));
  merged.emailVerified = incoming.emailVerified ?? existing.emailVerified ?? false;
  merged.source = incoming.source || existing.source || 'sample';
  
  merged.confidence = calculateConfidence(merged);
  return merged;
}

/**
 * Deduplicate an array of leads by exact domain and keep the most complete record
 */
export function deduplicateLeads(leads) {
  const leadMap = new Map();

  for (const rawLead of leads) {
    const domain = normalizeDomain(rawLead.domain || (rawLead.email ? rawLead.email.split('@')[1] : ''));
    if (!domain) continue;

    const regionInfo = inferRegion(rawLead.location || rawLead.region);
    const cleanedLead = {
      ...rawLead,
      domain,
      company: (rawLead.company || domain.split('.')[0]).trim(),
      industry: (rawLead.industry || 'Unknown').trim(),
      employeeCount: Number(rawLead.employeeCount) || 0,
      location: rawLead.location ? rawLead.location.trim() : regionInfo.location,
      region: rawLead.region ? rawLead.region.trim() : regionInfo.region,
      contactName: (rawLead.contactName || '').trim(),
      title: normalizeTitle(rawLead.title || ''),
      email: (rawLead.email || '').trim().toLowerCase(),
      description: (rawLead.description || '').trim(),
      socialLinks: Array.isArray(rawLead.socialLinks) ? rawLead.socialLinks : [],
      emailVerified: Boolean(rawLead.emailVerified),
      source: rawLead.source || 'csv',
    };

    cleanedLead.confidence = calculateConfidence(cleanedLead);

    if (leadMap.has(domain)) {
      const existing = leadMap.get(domain);
      leadMap.set(domain, mergeLeads(existing, cleanedLead));
    } else {
      leadMap.set(domain, cleanedLead);
    }
  }

  return Array.from(leadMap.values());
}

