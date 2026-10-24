import crypto from 'crypto';
import { OtpChallenge } from '../models/OtpChallenge.js';
import { sendSystemEmail } from './emailService.js';

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Hash an OTP using SHA-256
 */
export const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Generate a cryptographically secure 6-digit OTP string
 */
export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Create an OTP challenge, invalidate previous active challenges, and send the email
 */
export const createAndSendOtp = async ({ email, purpose, role, userName = 'Valued Customer' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check resend cooldown
  const latestChallenge = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose,
    role,
    isUsed: false
  }).sort({ createdAt: -1 });

  if (latestChallenge) {
    const elapsedSeconds = (Date.now() - new Date(latestChallenge.createdAt).getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new Error(`Please wait ${waitTime} seconds before requesting a new verification code.`);
    }
  }

  // Invalidate any prior active challenges for this email and purpose
  await OtpChallenge.updateMany(
    { email: normalizedEmail, purpose, role, isUsed: false },
    { $set: { isUsed: true } }
  );

  const plainOtp = generateSecureOtp();
  const hashed = hashOtp(plainOtp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await OtpChallenge.create({
    email: normalizedEmail,
    otpHash: hashed,
    purpose,
    role,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    isUsed: false
  });

  // Purpose-specific email content
  let subject = 'Y.N.K Pickles — Verification Code';
  let purposeDesc = 'verify your account';

  if (purpose === 'password_reset') {
    subject = 'Y.N.K Pickles — Password Reset Code';
    purposeDesc = 'reset your password';
  } else if (purpose === 'profile_update') {
    subject = 'Y.N.K Pickles — Profile Update Verification';
    purposeDesc = 'confirm your email address change';
  }

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #b45309; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Y.N.K PICKLES</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Traditional Andhra Flavors & Purity</p>
      </div>

      <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          You requested a single-use verification code to ${purposeDesc}. Use the code below to complete your request:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #fef3c7; border: 2px dashed #f59e0b; padding: 14px 28px; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #92400e;">
            ${plainOtp}
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; text-align: center; margin: 0 0 8px 0;">
          This code is strictly valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
        </p>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          If you did not initiate this request, please disregard this email or contact support immediately.
        </p>
      </div>

      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Y.N.K Pickles. All rights reserved.
      </div>
    </div>
  `;

  const text = `Hello ${userName},\n\nYour Y.N.K Pickles verification code is: ${plainOtp}\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this, please ignore this email.`;

  await sendSystemEmail({
    to: normalizedEmail,
    subject,
    html,
    text
  });

  return { success: true, expiresAt };
};

/**
 * Verify an OTP challenge securely with attempt limits and timing-safe comparison
 */
export const verifyOtpChallenge = async ({ email, otp, purpose, role }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const challenge = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose,
    role,
    isUsed: false
  }).sort({ createdAt: -1 });

  if (!challenge) {
    return {
      isValid: false,
      message: 'No active verification code found for this request. Please request a new code.'
    };
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    challenge.isUsed = true;
    await challenge.save();
    return {
      isValid: false,
      message: 'The verification code has expired. Please request a new code.'
    };
  }

  // Check attempt limit
  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.isUsed = true;
    await challenge.save();
    return {
      isValid: false,
      message: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.'
    };
  }

  // Increment attempts
  challenge.attempts += 1;

  const candidateHash = hashOtp(otp);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(challenge.otpHash, 'hex')
  );

  if (!isMatch) {
    await challenge.save();
    const remaining = challenge.maxAttempts - challenge.attempts;
    return {
      isValid: false,
      message: remaining > 0
        ? `Invalid verification code. You have ${remaining} attempt(s) remaining.`
        : 'Invalid verification code. Maximum attempts exceeded. Please request a new code.'
    };
  }

  // Mark as used
  challenge.isUsed = true;
  await challenge.save();

  return { isValid: true, challenge };
};
