import mongoose from 'mongoose';

const otpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP challenge'],
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: [true, 'OTP hash is required']
    },
    purpose: {
      type: String,
      enum: ['password_reset', 'email_verification', 'profile_update'],
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      required: true,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB TTL index to automatically purge expired records
    }
  },
  {
    timestamps: true
  }
);

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema);
