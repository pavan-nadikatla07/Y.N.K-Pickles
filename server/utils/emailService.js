import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { EmailSettings } from '../models/EmailSettings.js';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SESSION_SECRET || 'ynk_pickles_super_secure_jwt_secret_key_2026_production_grade';
// Generate 32-byte key from secret
const CIPHER_KEY = crypto.createHash('sha256').update(SECRET_KEY).digest();
const IV_LENGTH = 16;

/**
 * Encrypt a plain-text password using AES-256-CBC
 */
export const encryptPassword = (text) => {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, CIPHER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt an encrypted password string
 */
export const decryptPassword = (cipherText) => {
  if (!cipherText || !cipherText.includes(':')) return '';
  try {
    const [ivHex, encryptedHex] = cipherText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, CIPHER_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[EmailService] Decryption error:', err.message);
    return '';
  }
};

/**
 * Get active nodemailer transporter based on database EmailSettings
 */
export const getTransporter = async () => {
  const settings = await EmailSettings.findOne({ key: 'smtp_config' });

  if (!settings || !settings.host || !settings.user || !settings.encryptedPass) {
    throw new Error('Email system is not configured. Please configure SMTP in Admin Settings.');
  }

  const plainPassword = decryptPassword(settings.encryptedPass);
  if (!plainPassword) {
    throw new Error('Failed to decrypt SMTP credentials. Please re-enter SMTP password in Admin Settings.');
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: Number(settings.port) || 587,
    secure: Boolean(settings.secure), // true for 465, false for 587/STARTTLS
    auth: {
      user: settings.user,
      pass: plainPassword
    },
    tls: {
      // Do not fail on invalid certs in dev environments, but prioritize secure transport
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  return {
    transporter,
    senderEmail: settings.senderEmail || settings.user,
    senderName: settings.senderName || 'Y.N.K Pickles'
  };
};

/**
 * Test SMTP connection using direct parameters
 */
export const testSmtpConfig = async ({ host, port, secure, user, pass, senderEmail }) => {
  const testTransporter = nodemailer.createTransport({
    host,
    port: Number(port) || 587,
    secure: Boolean(secure),
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  // Verify connection configuration
  await testTransporter.verify();

  // Send a test email to the sender's own address or designated email to verify deliverability
  const targetEmail = senderEmail || user;
  const info = await testTransporter.sendMail({
    from: `"Y.N.K Pickles Test" <${senderEmail || user}>`,
    to: targetEmail,
    subject: 'Y.N.K Pickles — SMTP Configuration Verification',
    text: 'This is a test email confirming that your SMTP configuration for Y.N.K Pickles is functioning properly.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #b45309; margin-bottom: 8px;">Y.N.K Pickles — System Email Test</h2>
        <p style="color: #334155; line-height: 1.5;">This email confirms that your outgoing mail server configuration is active and capable of sending system messages, password reset OTPs, and account notifications.</p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; color: #64748b; margin-top: 16px;">
          <strong>Host:</strong> ${host}:${port} | <strong>User:</strong> ${user} | <strong>Security:</strong> ${secure ? 'SSL/TLS' : 'STARTTLS'}
        </div>
      </div>
    `
  });

  return info;
};

/**
 * Send an email using configured SMTP settings
 */
export const sendSystemEmail = async ({ to, subject, html, text }) => {
  const { transporter, senderEmail, senderName } = await getTransporter();

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
