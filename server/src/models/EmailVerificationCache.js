import mongoose from 'mongoose';

const EmailVerificationCacheSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  hasMx: {
    type: Boolean,
    required: true,
  },
  mxRecords: {
    type: [String],
    default: [],
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7, // TTL: automatically expire cache after 7 days (604800 seconds)
  },
});

export const EmailVerificationCache = mongoose.model(
  'EmailVerificationCache',
  EmailVerificationCacheSchema
);

