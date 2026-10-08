/**
 * Scoring & Self-Tuning Scorer Engine
 * Hand-written machine learning (Perceptron / Logistic update) with zero ML dependencies.
 */

export const DEFAULT_WEIGHTS = {
  industryMatch: 25,
  sizeMatch: 20,
  regionMatch: 15,
  seniorityMatch: 20,
  keywordMatch: 10,
  emailVerified: 10,
};

export const FEATURE_LABELS = {
  industryMatch: 'Industry fit',
  sizeMatch: 'Company size match',
  regionMatch: 'Target region',
  seniorityMatch: 'Decision maker seniority',
  keywordMatch: 'ICP keyword match',
  emailVerified: 'Verified business email',
};

/**
 * Extracts binary feature vector (0 or 1) for a lead against an ICP definition
 */
export function extractFeatures(lead, icp) {
  if (!lead || !icp) {
    return {
      industryMatch: 0,
      sizeMatch: 0,
      regionMatch: 0,
      seniorityMatch: 0,
      keywordMatch: 0,
      emailVerified: 0,
    };
  }

  // 1. Industry Match
  let industryMatch = 0;
  if (lead.industry && icp.targetIndustries && icp.targetIndustries.length > 0) {
    const leadInd = lead.industry.toLowerCase();
    const isMatched = icp.targetIndustries.some((ind) => {
      const target = ind.toLowerCase().trim();
      return (
        leadInd.includes(target) ||
        target.includes(leadInd) ||
        (leadInd === 'saas' && target.includes('software')) ||
        (target === 'saas' && leadInd.includes('software'))
      );
    });
    industryMatch = isMatched ? 1 : 0;
  }

  // 2. Company Size Match
  let sizeMatch = 0;
  if (lead.employeeCount && icp.companySize) {
    const min = icp.companySize.min ?? 0;
    const max = icp.companySize.max ?? 100000;
    sizeMatch = lead.employeeCount >= min && lead.employeeCount <= max ? 1 : 0;
  }

  // 3. Region / Location Match
  let regionMatch = 0;
  if (icp.targetRegions && icp.targetRegions.length > 0) {
    const leadLoc = `${lead.location || ''} ${lead.region || ''}`.toLowerCase();
    const isMatched = icp.targetRegions.some((reg) => {
      const target = reg.toLowerCase().trim();
      return leadLoc.includes(target) || (target === 'remote' && leadLoc.includes('remote'));
    });
    regionMatch = isMatched ? 1 : 0;
  }

  // 4. Seniority / Title Match
  let seniorityMatch = 0;
  if (lead.title && icp.targetSeniority && icp.targetSeniority.length > 0) {
    const leadTitle = lead.title.toLowerCase();
    const isMatched = icp.targetSeniority.some((sen) => {
      const target = sen.toLowerCase().trim();
      if (target === 'c-level') {
        return /\b(chief|ceo|cto|cfo|cmo|cro|coo|cpo|cio|founder|co-founder|president)\b/i.test(leadTitle);
      }
      return leadTitle.includes(target);
    });
    seniorityMatch = isMatched ? 1 : 0;
  }

  // 5. Keyword Match
  let keywordMatch = 0;
  if (icp.targetKeywords && icp.targetKeywords.length > 0) {
    const searchableText = `${lead.company || ''} ${lead.description || ''} ${lead.industry || ''} ${lead.title || ''}`.toLowerCase();
    const matchedCount = icp.targetKeywords.filter((kw) => {
      const target = kw.toLowerCase().trim();
      return target.length > 1 && searchableText.includes(target);
    }).length;
    keywordMatch = matchedCount > 0 ? 1 : 0;
  }

  // 6. Email Verified
  const emailVerified = lead.emailVerified ? 1 : 0;

  return {
    industryMatch,
    sizeMatch,
    regionMatch,
    seniorityMatch,
    keywordMatch,
    emailVerified,
  };
}

/**
 * Calculates normalized 0-100 score and human-readable breakdown for a feature vector
 */
export function calculateScoreAndBreakdown(features, weights = DEFAULT_WEIGHTS) {
  const activeWeights = { ...DEFAULT_WEIGHTS, ...weights };
  const featureKeys = Object.keys(DEFAULT_WEIGHTS);

  let rawSum = 0;
  let totalPositiveWeight = 0;
  const breakdown = [];

  for (const key of featureKeys) {
    const weight = Number(activeWeights[key]) || 0;
    const isMatch = features[key] === 1;
    const label = FEATURE_LABELS[key] || key;

    totalPositiveWeight += Math.max(weight, 0);

    if (isMatch) {
      rawSum += weight;
      breakdown.push(`+${weight} ${label}`);
    } else {
      breakdown.push(`+0 (no ${label.toLowerCase()})`);
    }
  }

  const normalizedTotal = totalPositiveWeight > 0 ? totalPositiveWeight : 100;
  const rawScore = (rawSum / normalizedTotal) * 100;
  const finalScore = Math.round(Math.min(100, Math.max(0, rawScore)));

  return {
    score: finalScore,
    breakdown,
  };
}

/**
 * Self-tuning perceptron update function
 * Updates weights based on user vote (1 = Thumbs Up, 0 = Thumbs Down)
 * Formula: w_i = clamp(w_i + lr * (label - predicted) * feature_i, minWeight, maxWeight)
 * 
 * @param {Object} currentWeights - Current ICP weights
 * @param {Object} features - Lead feature vector (0/1 values)
 * @param {number} userVote - 1 for Thumbs Up, 0 for Thumbs Down
 * @param {number} currentScore - Current lead score (0-100)
 * @param {number} learningRate - Step size (default 6.0)
 * @returns {{ newWeights: Object, notes: string[], delta: Object }}
 */
export function updateWeights(currentWeights, features, userVote, currentScore, learningRate = 6.0) {
  const weights = { ...DEFAULT_WEIGHTS, ...currentWeights };
  const newWeights = { ...weights };
  const notes = [];
  const delta = {};

  // Label: 1.0 (positive) or 0.0 (negative)
  const label = userVote === 1 ? 1.0 : 0.0;
  // Predicted probability normalized to 0.0 - 1.0
  const predicted = Math.min(1.0, Math.max(0.0, (currentScore || 50) / 100));
  // Prediction error: positive if user upvoted a low-scored lead; negative if user downvoted a high-scored lead
  const error = label - predicted;

  const MIN_WEIGHT = 5;
  const MAX_WEIGHT = 50;

  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    const fVal = features[key] ?? 0;
    const currentW = weights[key];

    // Standard perceptron gradient step:
    // If feature is active (1): adjust strongly in the direction of error
    // If feature is inactive (0) and vote was negative: slight penalty to inactive features or reward active ones
    let step = 0;
    if (fVal === 1) {
      step = Math.round(learningRate * error * 1.0);
    } else if (label === 0 && fVal === 0 && error < -0.2) {
      // If user rejected a lead that was missing this feature, this feature is even more essential for positive leads
      step = Math.round(learningRate * 0.2);
    }

    const updated = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, currentW + step));
    newWeights[key] = updated;
    delta[key] = updated - currentW;

    if (delta[key] !== 0) {
      const dir = delta[key] > 0 ? 'raised' : 'lowered';
      const labelName = FEATURE_LABELS[key] || key;
      notes.push(`${labelName} weight ${dir} from ${currentW} to ${updated} (${delta[key] > 0 ? '+' : ''}${delta[key]})`);
    }
  }

  if (notes.length === 0) {
    notes.push(`Model confidence reinforced for current weights.`);
  }

  return {
    newWeights,
    notes,
    delta,
  };
}

