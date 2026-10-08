import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractFeatures,
  calculateScoreAndBreakdown,
  updateWeights,
  DEFAULT_WEIGHTS,
} from '../src/services/scoringEngine.js';
import { deduplicateLeads, normalizeDomain } from '../src/services/leadNormalizer.js';

describe('Caprae LeadLens Scoring & Self-Tuning Engine', () => {
  const sampleIcp = {
    targetIndustries: ['SaaS', 'Fintech'],
    companySize: { min: 50, max: 200 },
    targetRegions: ['North America', 'United States'],
    targetSeniority: ['C-level', 'VP'],
    targetKeywords: ['cloud', 'automation', 'b2b'],
    weights: { ...DEFAULT_WEIGHTS },
  };

  const highMatchLead = {
    company: 'SaaSify Inc',
    domain: 'saasify.io',
    industry: 'SaaS',
    employeeCount: 120,
    location: 'San Francisco, CA',
    region: 'North America',
    contactName: 'Alice Smith',
    title: 'Chief Technology Officer',
    email: 'alice@saasify.io',
    description: 'B2B cloud infrastructure automation platform.',
    emailVerified: true,
  };

  const lowMatchLead = {
    company: 'Local Bakery',
    domain: 'localbakery.com',
    industry: 'Food & Beverage',
    employeeCount: 8,
    location: 'Tokyo, Japan',
    region: 'APAC',
    contactName: 'Bob Brown',
    title: 'Assistant Baker',
    email: 'bob@localbakery.com',
    description: 'Fresh organic sourdough breads daily.',
    emailVerified: false,
  };

  it('extractFeatures should generate correct 0/1 binary feature vector', () => {
    const highFeatures = extractFeatures(highMatchLead, sampleIcp);
    assert.strictEqual(highFeatures.industryMatch, 1, 'Industry should match SaaS');
    assert.strictEqual(highFeatures.sizeMatch, 1, 'Size 120 should match 50-200');
    assert.strictEqual(highFeatures.regionMatch, 1, 'Region should match North America');
    assert.strictEqual(highFeatures.seniorityMatch, 1, 'CTO should match C-level');
    assert.strictEqual(highFeatures.keywordMatch, 1, 'Keywords cloud/automation should match');
    assert.strictEqual(highFeatures.emailVerified, 1, 'Email verified should be 1');

    const lowFeatures = extractFeatures(lowMatchLead, sampleIcp);
    assert.strictEqual(lowFeatures.industryMatch, 0);
    assert.strictEqual(lowFeatures.sizeMatch, 0);
    assert.strictEqual(lowFeatures.regionMatch, 0);
    assert.strictEqual(lowFeatures.seniorityMatch, 0);
    assert.strictEqual(lowFeatures.keywordMatch, 0);
    assert.strictEqual(lowFeatures.emailVerified, 0);
  });

  it('calculateScoreAndBreakdown should return 100 for perfect match and 0 for zero match', () => {
    const highFeatures = extractFeatures(highMatchLead, sampleIcp);
    const { score: highScore, breakdown: highBreakdown } = calculateScoreAndBreakdown(highFeatures, sampleIcp.weights);

    assert.strictEqual(highScore, 100, 'Perfect match should score 100');
    assert.ok(Array.isArray(highBreakdown), 'Breakdown should be an array');
    assert.ok(highBreakdown.some((b) => b.includes('+25 Industry fit')), 'Breakdown should list positive industry contribution');

    const lowFeatures = extractFeatures(lowMatchLead, sampleIcp);
    const { score: lowScore, breakdown: lowBreakdown } = calculateScoreAndBreakdown(lowFeatures, sampleIcp.weights);

    assert.strictEqual(lowScore, 0, 'Zero match should score 0');
    assert.ok(lowBreakdown.every((b) => b.includes('+0')));
  });

  it('updateWeights should adjust weights upwards on Thumbs Up (1) and log changes', () => {
    const features = {
      industryMatch: 1,
      sizeMatch: 1,
      regionMatch: 0,
      seniorityMatch: 1,
      keywordMatch: 0,
      emailVerified: 1,
    };

    const currentScore = 60; // Moderate score
    const userVote = 1; // Thumbs up

    const { newWeights, notes, delta } = updateWeights(
      DEFAULT_WEIGHTS,
      features,
      userVote,
      currentScore,
      8.0
    );

    assert.ok(newWeights.industryMatch > DEFAULT_WEIGHTS.industryMatch, 'Active industryMatch weight should increase');
    assert.ok(newWeights.seniorityMatch > DEFAULT_WEIGHTS.seniorityMatch, 'Active seniorityMatch weight should increase');
    assert.ok(Array.isArray(notes) && notes.length > 0, 'Notes should explain the weight adjustments');
    assert.ok(typeof delta === 'object', 'Delta object should be returned');
  });

  it('updateWeights should decrease weights on Thumbs Down (0) and clamp to safe bounds [5, 50]', () => {
    const features = {
      industryMatch: 1,
      sizeMatch: 1,
      regionMatch: 1,
      seniorityMatch: 1,
      keywordMatch: 1,
      emailVerified: 1,
    };

    const currentScore = 95; // Very high score
    const userVote = 0; // Thumbs down rejection

    const { newWeights } = updateWeights(
      DEFAULT_WEIGHTS,
      features,
      userVote,
      currentScore,
      10.0
    );

    for (const key of Object.keys(DEFAULT_WEIGHTS)) {
      assert.ok(newWeights[key] <= 50, `${key} should not exceed maximum bound 50`);
      assert.ok(newWeights[key] >= 5, `${key} should not go below minimum bound 5`);
      assert.ok(newWeights[key] <= DEFAULT_WEIGHTS[key], `${key} should decrease on thumbs down of high score`);
    }
  });

  it('deduplicateLeads should dedupe by exact domain and merge the most complete fields', () => {
    const leads = [
      {
        company: 'Stripe',
        domain: 'https://stripe.com/about',
        industry: 'Fintech',
        employeeCount: 0,
        email: '',
      },
      {
        company: 'Stripe Inc',
        domain: 'stripe.com',
        industry: 'Fintech / Payments',
        employeeCount: 8000,
        contactName: 'Patrick Collison',
        title: 'CEO',
        email: 'patrick@stripe.com',
        emailVerified: true,
      },
    ];

    const deduped = deduplicateLeads(leads);
    assert.strictEqual(deduped.length, 1, 'Should deduplicate down to 1 record');
    assert.strictEqual(deduped[0].domain, 'stripe.com');
    assert.strictEqual(deduped[0].employeeCount, 8000, 'Should retain employeeCount');
    assert.strictEqual(deduped[0].contactName, 'Patrick Collison', 'Should retain contactName');
    assert.strictEqual(deduped[0].email, 'patrick@stripe.com');
    assert.strictEqual(deduped[0].confidence, 'High', 'Should calculate high confidence for complete verified lead');
  });
});

