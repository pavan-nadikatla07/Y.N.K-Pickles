import mongoose from 'mongoose';

const emailSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'smtp_config',
      unique: true,
      index: true
    },
    senderEmail: {
      type: String,
      trim: true,
      default: ''
    },
    senderName: {
      type: String,
      trim: true,
      default: 'Y.N.K Pickles'
    },
    host: {
      type: String,
      trim: true,
      default: ''
    },
    port: {
      type: Number,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    },
    user: {
      type: String,
      trim: true,
      default: ''
    },
    encryptedPass: {
      type: String,
      default: ''
    },
    isConfigured: {
      type: Boolean,
      default: false
    },
    lastTestedAt: {
      type: Date,
      default: null
    },
    lastTestStatus: {
      type: String,
      enum: ['idle', 'success', 'failed'],
      default: 'idle'
    },
    lastTestError: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const EmailSettings = mongoose.model('EmailSettings', emailSettingsSchema);
