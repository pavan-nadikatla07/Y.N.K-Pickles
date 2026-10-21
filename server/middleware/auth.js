import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const JWT_SECRET = process.env.SESSION_SECRET || 'ynk_pickles_dev_secret_key_123456789';
export const TOKEN_COOKIE_NAME = 'ynk_auth_token';

/**
 * Signs a JWT token for the user
 */
export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      phone: user.phone,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Sets auth cookie on response
 */
export const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * Clears auth cookie on logout
 */
export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
};

/**
 * Middleware: Verify JWT from cookie or header and attach user
 */
export const authenticateToken = async (req, res, next) => {
  try {
    let token = req.cookies?.[TOKEN_COOKIE_NAME];

    // Fallback to Authorization: Bearer <token>
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      clearAuthCookie(res);
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated. Please log in again.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    clearAuthCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
};

/**
 * Middleware: Enforce administrator role strictly
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
  next();
};
