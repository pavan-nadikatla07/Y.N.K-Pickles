import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../services/api.js';
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  MapPin,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AddressAutocompleteInput } from '../../components/common/AddressAutocompleteInput.jsx';

export const CustomerProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savedLocation, setSavedLocation] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Email Change OTP Modal State
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sendingPassOtp, setSendingPassOtp] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passOtpSent, setPassOtpSent] = useState(false);

  // Initialize from user object
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setSavedLocation(user.savedLocation || null);
    }
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Full name is required.');
      return;
    }

    if (!phone.trim()) {
      error('Phone number is required.');
      return;
    }

    // Check if user is attempting to change their email without OTP
    if (email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
      setPendingNewEmail(email.trim().toLowerCase());
      setShowEmailOtpModal(true);
      // Auto-request OTP for new email
      try {
        setSendingEmailOtp(true);
        await api.requestEmailChangeOtp(email.trim().toLowerCase());
        success(`Verification code sent to ${email.trim().toLowerCase()}.`);
      } catch (err) {
        error(err.message || 'Failed to send verification code to new email.');
      } finally {
        setSendingEmailOtp(false);
      }
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        savedLocation
      });
      if (res.success) {
        success('Profile updated successfully.');
        await refreshUser();
      }
    } catch (err) {
      error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Confirm Email Change with OTP
  const handleConfirmEmailChange = async (e) => {
    e.preventDefault();
    if (!emailOtp || emailOtp.trim().length !== 6) {
      error('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        savedLocation,
        newEmail: pendingNewEmail,
        emailOtp: emailOtp.trim()
      });
      if (res.success) {
        success('Email updated and verified successfully!');
        setShowEmailOtpModal(false);
        setEmailOtp('');
        await refreshUser();
      }
    } catch (err) {
      error(err.message || 'Email verification failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Step 1: Request Password Change OTP
  const handleRequestPasswordOtp = async () => {
    try {
      setSendingPassOtp(true);
      const res = await api.requestPasswordChangeOtp();
      success(res.message || 'Verification code sent to your registered email.');
      setPassOtpSent(true);
    } catch (err) {
      error(err.message || 'Failed to send verification code.');
    } finally {
      setSendingPassOtp(false);
    }
  };

  // Step 2: Submit New Password with OTP
  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordOtp || passwordOtp.trim().length !== 6) {
      error('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.changePassword({
        otp: passwordOtp.trim(),
        newPassword,
        confirmPassword
      });
      if (res.success) {
        success('Password changed successfully.');
        setShowPasswordModal(false);
        setPasswordOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setPassOtpSent(false);
      }
    } catch (err) {
      error(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900">
          Personal Settings & Profile
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your personal details, verified delivery location, and security settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Personal Profile Form */}
        <div className="bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800 border-b border-cream-100 pb-2">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Registered Email Address
                </label>
                {user?.isEmailVerified && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Changing your registered email will require OTP verification sent to the new email.
              </p>
            </div>

            {/* Verified Saved Address */}
            <div className="pt-2">
              <AddressAutocompleteInput
                label="Saved Delivery Location"
                initialLocation={savedLocation}
                onLocationVerified={(loc) => setSavedLocation(loc)}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-gradient-to-r from-mango-500 to-mango-600 hover:from-mango-600 hover:to-mango-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password Management */}
        <div className="bg-white rounded-3xl border border-cream-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-display font-bold text-gray-900">Account Security</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Protect your account with a secure password. Password changes require email OTP verification.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(true);
                handleRequestPasswordOtp();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-olive-800 hover:bg-olive-900 text-white text-xs font-bold transition shadow-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Email Change Verification */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-cream-200">
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              Verify New Email Address
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              We sent a 6-digit verification code to <strong>{pendingNewEmail}</strong>. Enter it below to confirm your new email address:
            </p>

            <form onSubmit={handleConfirmEmailChange} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                autoFocus
                className="w-full py-2.5 px-4 text-center font-mono font-bold tracking-[6px] text-lg rounded-xl border border-cream-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-mango-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 bg-cream-100 hover:bg-cream-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || emailOtp.length !== 6}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-mango-600 hover:bg-mango-700 disabled:opacity-50"
                >
                  {savingProfile ? 'Verifying...' : 'Verify & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password with OTP */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-cream-200">
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              Change Account Password
            </h3>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              A 6-digit verification code has been dispatched to your registered email (<strong>{user?.email}</strong>).
            </p>

            <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  6-Digit Email OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={passwordOtp}
                  onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full py-2 px-4 text-center font-mono font-bold tracking-[6px] text-lg rounded-xl border border-cream-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-mango-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 bg-cream-100 hover:bg-cream-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || passwordOtp.length !== 6}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-olive-800 hover:bg-olive-900 disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
