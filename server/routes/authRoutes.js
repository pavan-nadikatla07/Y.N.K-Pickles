import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  requestEmailChangeOtp,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  requestPasswordChangeOtp,
  changePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Strict rate limiting for authentication endpoints to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiter for OTP requests (5 per 15 minutes)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many verification code requests. Please wait a few minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public Authentication
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Password Recovery (Role-isolated & Rate-limited)
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyPasswordResetOtp);
router.post('/reset-password', authLimiter, resetPassword);

// Authenticated User Profile & Settings
router.get('/me', authenticateToken, getMe);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/profile/email-otp', authenticateToken, otpLimiter, requestEmailChangeOtp);
router.post('/password/otp', authenticateToken, otpLimiter, requestPasswordChangeOtp);
router.post('/password/change', authenticateToken, changePassword);

export default router;
