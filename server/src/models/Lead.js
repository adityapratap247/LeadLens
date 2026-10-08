import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    industry: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    employeeCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    region: {
      type: String,
      default: '',
      trim: true,
    },
    contactName: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    socialLinks: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      enum: ['csv', 'sample', 'paste'],
      default: 'sample',
    },
    confidence: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    features: {
      industryMatch: { type: Number, default: 0 },
      sizeMatch: { type: Number, default: 0 },
      regionMatch: { type: Number, default: 0 },
      seniorityMatch: { type: Number, default: 0 },
      keywordMatch: { type: Number, default: 0 },
      emailVerified: { type: Number, default: 0 },
    },
    score: {
      type: Number,
      default: 0,
      index: true,
    },
    breakdown: {
      type: [String],
      default: [],
    },
    userVote: {
      type: Number, // 1 for Thumbs Up, -1 or 0 for Thumbs Down, null for Unvoted
      default: null,
    },
    voteTimestamp: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique domain if desired or query optimization
LeadSchema.index({ domain: 1 });
LeadSchema.index({ score: -1, createdAt: -1 });

export const Lead = mongoose.model('Lead', LeadSchema);
