import { Settings } from '../models/Settings.js';
import { normalizePhone, isValidPhone } from '../validators/phoneValidator.js';

const SETTINGS_KEY = 'whatsapp';

/**
 * Public endpoint: Get configured business WhatsApp destination number
 * Needed by customer checkout to prepare wa.me link.
 */
export const getPublicWhatsAppSetting = async (req, res, next) => {
  try {
    let setting = await Settings.findOne({ key: SETTINGS_KEY });

    // Fallback to default if not yet seeded
    if (!setting) {
      const defaultNumber = normalizePhone(process.env.DEFAULT_WHATSAPP_NUMBER || '919876543210');
      setting = await Settings.create({
        key: SETTINGS_KEY,
        whatsappNumber: defaultNumber
      });
    }

    res.status(200).json({
      success: true,
      whatsappNumber: setting.whatsappNumber,
      isConfigured: Boolean(setting.whatsappNumber)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get WhatsApp number settings details (including updatedAt, updatedBy)
 */
export const getAdminWhatsAppSetting = async (req, res, next) => {
  try {
    let setting = await Settings.findOne({ key: SETTINGS_KEY }).populate('updatedBy', 'name phone');

    if (!setting) {
      const defaultNumber = normalizePhone(process.env.DEFAULT_WHATSAPP_NUMBER || '919876543210');
      setting = await Settings.create({
        key: SETTINGS_KEY,
        whatsappNumber: defaultNumber,
        updatedBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      setting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update WhatsApp destination number
 */
export const updateWhatsAppSetting = async (req, res, next) => {
  try {
    const { whatsappNumber } = req.body;

    if (!whatsappNumber || !whatsappNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number is required.'
      });
    }

    const normalized = normalizePhone(whatsappNumber);
    if (!normalized || !isValidPhone(whatsappNumber)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid WhatsApp destination phone number with country code (e.g. 919876543210).'
      });
    }

    let setting = await Settings.findOne({ key: SETTINGS_KEY });
    if (!setting) {
      setting = new Settings({
        key: SETTINGS_KEY,
        whatsappNumber: normalized,
        updatedBy: req.user._id
      });
    } else {
      setting.whatsappNumber = normalized;
      setting.updatedBy = req.user._id;
    }

    await setting.save();

    res.status(200).json({
      success: true,
      message: 'WhatsApp destination number updated successfully.',
      setting
    });
  } catch (error) {
    next(error);
  }
};
