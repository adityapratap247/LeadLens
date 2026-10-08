import mongoose from 'mongoose';

const IcpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Primary Ideal Customer Profile',
      trim: true,
    },
    targetIndustries: {
      type: [String],
      default: ['SaaS', 'B2B Software', 'Fintech', 'AI/ML', 'Enterprise Software', 'Cybersecurity'],
    },
    companySize: {
      min: { type: Number, default: 20 },
      max: { type: Number, default: 500 },
    },
    targetRegions: {
      type: [String],
      default: ['North America', 'United States', 'Europe', 'United Kingdom', 'Canada', 'Remote'],
    },
    targetSeniority: {
      type: [String],
      default: ['C-level', 'VP', 'Director', 'Founder', 'Head of'],
    },
    targetKeywords: {
      type: [String],
      default: ['b2b', 'enterprise', 'ai', 'cloud', 'security', 'analytics', 'automation', 'growth'],
    },
    weights: {
      industryMatch: { type: Number, default: 25 },
      sizeMatch: { type: Number, default: 20 },
      regionMatch: { type: Number, default: 15 },
      seniorityMatch: { type: Number, default: 20 },
      keywordMatch: { type: Number, default: 10 },
      emailVerified: { type: Number, default: 10 },
    },
    learningRate: {
      type: Number,
      default: 6.0,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    upVotes: {
      type: Number,
      default: 0,
    },
    downVotes: {
      type: Number,
      default: 0,
    },
    changeHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        leadDomain: { type: String, default: '' },
        company: { type: String, default: '' },
        vote: { type: Number },
        previousWeights: { type: Object },
        newWeights: { type: Object },
        notes: { type: [String], default: [] },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Icp = mongoose.model('Icp', IcpSchema);

