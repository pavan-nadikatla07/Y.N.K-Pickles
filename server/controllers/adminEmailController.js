import { EmailSettings } from '../models/EmailSettings.js';
import { encryptPassword, decryptPassword, testSmtpConfig } from '../utils/emailService.js';

/**
 * Get current SMTP settings (Never exposes plain or encrypted password)
 */
export const getAdminEmailSettings = async (req, res, next) => {
  try {
    let settings = await EmailSettings.findOne({ key: 'smtp_config' });

    if (!settings) {
      settings = await EmailSettings.create({
        key: 'smtp_config',
        senderName: 'Y.N.K Pickles',
        port: 587,
        secure: false,
        isConfigured: false
      });
    }

    res.status(200).json({
      success: true,
      settings: {
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        hasPassword: Boolean(settings.encryptedPass),
        isConfigured: settings.isConfigured,
        lastTestedAt: settings.lastTestedAt,
        lastTestStatus: settings.lastTestStatus,
        lastTestError: settings.lastTestError,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save / Update SMTP settings
 */
export const updateAdminEmailSettings = async (req, res, next) => {
  try {
    const { senderEmail, senderName, host, port, secure, user, password } = req.body;

    if (!host || !host.trim()) {
      return res.status(400).json({ success: false, message: 'SMTP Host is required.' });
    }

    if (!user || !user.trim()) {
      return res.status(400).json({ success: false, message: 'SMTP Username is required.' });
    }

    let settings = await EmailSettings.findOne({ key: 'smtp_config' });
    if (!settings) {
      settings = new EmailSettings({ key: 'smtp_config' });
    }

    settings.host = host.trim();
    settings.port = Number(port) || 587;
    settings.secure = Boolean(secure);
    settings.user = user.trim();
    settings.senderEmail = (senderEmail && senderEmail.trim()) || user.trim();
    settings.senderName = (senderName && senderName.trim()) || 'Y.N.K Pickles';
    settings.updatedBy = req.user._id;

    // Only update encryptedPass if a new non-empty password was explicitly provided
    if (password && password.trim()) {
      settings.encryptedPass = encryptPassword(password.trim());
    }

    settings.isConfigured = Boolean(settings.host && settings.user && settings.encryptedPass);
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Email configuration saved successfully.',
      settings: {
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        hasPassword: Boolean(settings.encryptedPass),
        isConfigured: settings.isConfigured,
        lastTestedAt: settings.lastTestedAt,
        lastTestStatus: settings.lastTestStatus,
        lastTestError: settings.lastTestError
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test SMTP connection and send a test email
 */
export const testAdminEmailSettings = async (req, res, next) => {
  try {
    const { host, port, secure, user, password, senderEmail } = req.body;

    let testHost = host;
    let testPort = port;
    let testSecure = secure;
    let testUser = user;
    let testPass = password;
    let testSender = senderEmail;

    const savedSettings = await EmailSettings.findOne({ key: 'smtp_config' });

    // Fallback to saved configuration if field not provided in payload
    if (!testHost && savedSettings) testHost = savedSettings.host;
    if (!testPort && savedSettings) testPort = savedSettings.port;
    if (testSecure === undefined && savedSettings) testSecure = savedSettings.secure;
    if (!testUser && savedSettings) testUser = savedSettings.user;
    if (!testSender && savedSettings) testSender = savedSettings.senderEmail;

    if (!testPass && savedSettings && savedSettings.encryptedPass) {
      testPass = decryptPassword(savedSettings.encryptedPass);
    }

    if (!testHost || !testUser || !testPass) {
      return res.status(400).json({
        success: false,
        message: 'Host, username, and password are required to test the connection.'
      });
    }

    try {
      await testSmtpConfig({
        host: testHost,
        port: testPort,
        secure: testSecure,
        user: testUser,
        pass: testPass,
        senderEmail: testSender
      });

      if (savedSettings) {
        savedSettings.lastTestedAt = new Date();
        savedSettings.lastTestStatus = 'success';
        savedSettings.lastTestError = '';
        await savedSettings.save();
      }

      res.status(200).json({
        success: true,
        message: `SMTP connection verified successfully! A test email has been sent to ${testSender || testUser}.`
      });
    } catch (testError) {
      if (savedSettings) {
        savedSettings.lastTestedAt = new Date();
        savedSettings.lastTestStatus = 'failed';
        savedSettings.lastTestError = testError.message;
        await savedSettings.save();
      }

      return res.status(400).json({
        success: false,
        message: `SMTP Connection test failed: ${testError.message}`
      });
    }
  } catch (error) {
    next(error);
  }
};
