import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'whatsapp',
      index: true
    },
    whatsappNumber: {
      type: String,
      required: [true, 'WhatsApp destination number is required'],
      trim: true
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

export const Settings = mongoose.model('Settings', settingsSchema);
