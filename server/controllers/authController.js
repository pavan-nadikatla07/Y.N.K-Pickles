import { User } from '../models/User.js';
import { normalizePhone, isValidPhone } from '../validators/phoneValidator.js';
import { signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';

/**
 * Register a new customer
 * Strict: Only customer role can be created via public endpoint.
 */
export const register = async (req, res, next) => {
  try {
    const { name, phone, password, confirmPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
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

    // Check if phone number already registered
    const existingUser = await User.findOne({ phone: normalized });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists. Please log in.'
      });
    }

    // Always enforce customer role for public registration
    const user = new User({
      name: name.trim(),
      phone: normalized,
      password,
      role: 'customer'
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
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login customer or admin
 */
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !phone.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required.'
      });
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number.'
      });
    }

    const user = await User.findOne({ phone: normalized });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone number or password.'
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
        message: 'Invalid phone number or password.'
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
        phone: user.phone,
        role: user.role
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
      phone: req.user.phone,
      role: req.user.role
    }
  });
};
