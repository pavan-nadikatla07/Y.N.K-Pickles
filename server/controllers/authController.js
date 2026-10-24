import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { normalizePhone, isValidPhone } from '../validators/phoneValidator.js';
import { signToken, setAuthCookie, clearAuthCookie, JWT_SECRET } from '../middleware/auth.js';
import { createAndSendOtp, verifyOtpChallenge } from '../utils/otpService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new customer
 * Strict: Requires name, email, phone, password, and verified location.
 * Public endpoint strictly restricts role to 'customer'.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, savedLocation } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    if (!email || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const normalized = normalizePhone(phone);
    if (!normalized || !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate phone
    const existingPhone = await User.findOne({ phone: normalized });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists. Please log in.'
      });
    }

    // Check duplicate email
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Validate location verification
    let locationData = {
      address: '',
      formattedAddress: '',
      placeId: '',
      latitude: null,
      longitude: null,
      isVerified: false
    };

    if (savedLocation && typeof savedLocation === 'object') {
      const { address, formattedAddress, placeId, latitude, longitude, isVerified } = savedLocation;
      if (!isVerified || latitude === null || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your delivery location using Google Maps address search or GPS.'
        });
      }
      locationData = {
        address: address || formattedAddress || '',
        formattedAddress: formattedAddress || address || '',
        placeId: placeId || '',
        latitude: Number(latitude),
        longitude: Number(longitude),
        isVerified: true
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Delivery location verification is mandatory for registration.'
      });
    }

    // Always enforce customer role for public registration
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalized,
      password,
      role: 'customer',
      isEmailVerified: true,
      savedLocation: locationData
    });

    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        savedLocation: user.savedLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login customer or admin (supports phone or email)
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, phone, email, password } = req.body;
    const inputId = identifier || phone || email;

    if (!inputId || !inputId.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Identifier (phone or email) and password are required.'
      });
    }

    const cleanInput = inputId.trim();
    let user = null;

    if (cleanInput.includes('@')) {
      user = await User.findOne({ email: cleanInput.toLowerCase() });
    } else {
      const normalized = normalizePhone(cleanInput);
      if (normalized) {
        user = await User.findOne({ phone: normalized });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your details and try again.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your details and try again.'
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        savedLocation: user.savedLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by clearing auth cookie
 */
export const logout = async (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      savedLocation: req.user.savedLocation
    }
  });
};

/**
 * Update authenticated user personal profile
 * Changes to email require OTP verification. Role escalation is strictly blocked.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, phone, savedLocation, newEmail, emailOtp } = req.body;

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (phone && phone.trim()) {
      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone || !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format.' });
      }

      // Check duplicate phone if changed
      if (normalizedPhone !== user.phone) {
        const existing = await User.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
        if (existing) {
          return res.status(409).json({ success: false, message: 'This phone number is already registered by another account.' });
        }
        user.phone = normalizedPhone;
      }
    }

    // Verify email change if requested
    if (newEmail && newEmail.trim() && newEmail.trim().toLowerCase() !== user.email) {
      const candidateEmail = newEmail.trim().toLowerCase();
      if (!EMAIL_REGEX.test(candidateEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address format.' });
      }

      if (!emailOtp) {
        return res.status(400).json({
          success: false,
          message: 'Verification code is required to change your registered email address.'
        });
      }

      // Verify OTP challenge for profile update
      const verification = await verifyOtpChallenge({
        email: candidateEmail,
        otp: emailOtp,
        purpose: 'profile_update',
        role: user.role
      });

      if (!verification.isValid) {
        return res.status(400).json({ success: false, message: verification.message });
      }

      // Check if candidate email is already taken
      const existingEmail = await User.findOne({ email: candidateEmail, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'Email address is already in use.' });
      }

      user.email = candidateEmail;
      user.isEmailVerified = true;
    }

    // Update verified location if provided
    if (savedLocation && typeof savedLocation === 'object') {
      const { address, formattedAddress, placeId, latitude, longitude, isVerified } = savedLocation;
      if (isVerified && latitude !== null && longitude !== null) {
        user.savedLocation = {
          address: address || formattedAddress || '',
          formattedAddress: formattedAddress || address || '',
          placeId: placeId || '',
          latitude: Number(latitude),
          longitude: Number(longitude),
          isVerified: true
        };
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        savedLocation: user.savedLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request OTP for changing email address in profile
 */
export const requestEmailChangeOtp = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !EMAIL_REGEX.test(newEmail.trim())) {
      return res.status(400).json({ success: false, message: 'Valid new email address is required.' });
    }

    const candidateEmail = newEmail.trim().toLowerCase();

    // Check if new email already belongs to another user
    const existing = await User.findOne({ email: candidateEmail, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already in use by another account.' });
    }

    await createAndSendOtp({
      email: candidateEmail,
      purpose: 'profile_update',
      role: req.user.role,
      userName: req.user.name
    });

    res.status(200).json({
      success: true,
      message: `A verification code has been sent to ${candidateEmail}.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - step 1: Request OTP
 * Generic response prevents account discovery / user enumeration
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email, role = 'customer' } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const enforcedRole = role === 'admin' ? 'admin' : 'customer';

    // Find account strictly matching both email and role
    const user = await User.findOne({ email: normalizedEmail, role: enforcedRole });

    // Always return generic acknowledgement to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address, a 6-digit verification code has been sent.'
    };

    if (!user || !user.isActive) {
      return res.status(200).json(genericResponse);
    }

    try {
      await createAndSendOtp({
        email: user.email,
        purpose: 'password_reset',
        role: enforcedRole,
        userName: user.name
      });
    } catch (mailErr) {
      console.error('[ForgotPassword] Failed to send OTP:', mailErr.message);
      // If SMTP is down or misconfigured, inform client actionably
      if (mailErr.message.includes('not configured')) {
        return res.status(503).json({
          success: false,
          message: 'The email notification system is currently unconfigured. Please contact support.'
        });
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - step 2: Verify OTP and issue password-reset session token
 */
export const verifyPasswordResetOtp = async (req, res, next) => {
  try {
    const { email, otp, role = 'customer' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const enforcedRole = role === 'admin' ? 'admin' : 'customer';

    const verification = await verifyOtpChallenge({
      email: normalizedEmail,
      otp,
      purpose: 'password_reset',
      role: enforcedRole
    });

    if (!verification.isValid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    // Issue a short-lived reset token (10 mins) bound to this verified email and role
    const resetToken = jwt.sign(
      { email: normalizedEmail, role: enforcedRole, purpose: 'password_reset_confirmed' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      success: true,
      message: 'Code verified successfully.',
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - step 3: Set new password using verified resetToken
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Reset session has expired or is invalid. Please request a new verification code.'
      });
    }

    if (decoded.purpose !== 'password_reset_confirmed') {
      return res.status(401).json({ success: false, message: 'Invalid token purpose.' });
    }

    const user = await User.findOne({ email: decoded.email, role: decoded.role });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password from Settings (for authenticated customer or admin)
 * Step 1: Request OTP to authenticated user's registered email
 */
export const requestPasswordChangeOtp = async (req, res, next) => {
  try {
    if (!req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'No registered email address found for your account. Please set an email first.'
      });
    }

    await createAndSendOtp({
      email: req.user.email,
      purpose: 'password_reset',
      role: req.user.role,
      userName: req.user.name
    });

    res.status(200).json({
      success: true,
      message: `A verification code has been sent to your registered email (${req.user.email}).`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password from Settings (for authenticated customer or admin)
 * Step 2: Verify OTP and save new password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Verification code is required.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const verification = await verifyOtpChallenge({
      email: req.user.email,
      otp,
      purpose: 'password_reset',
      role: req.user.role
    });

    if (!verification.isValid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    const user = await User.findById(req.user._id);
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
