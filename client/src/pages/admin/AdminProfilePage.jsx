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
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AdminProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email Change OTP Modal State
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Administrator name is required.');
      return;
    }
    if (!phone.trim()) {
      error('Phone number is required.');
      return;
    }

    // If changing email, trigger verification modal
    if (email.trim().toLowerCase() !== (user?.email || '').toLowerCase()) {
      setPendingNewEmail(email.trim().toLowerCase());
      setShowEmailOtpModal(true);
      try {
        await api.requestEmailChangeOtp(email.trim().toLowerCase());
        success(`Verification code sent to ${email.trim().toLowerCase()}.`);
      } catch (err) {
        error(err.message || 'Failed to dispatch verification code.');
      }
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim()
      });
      if (res.success) {
        success('Administrator profile updated successfully.');
        await refreshUser();
      }
    } catch (err) {
      error(err.message || 'Failed to update administrator profile.');
    } finally {
      setSavingProfile(false);
    }
  };

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
        newEmail: pendingNewEmail,
        emailOtp: emailOtp.trim()
      });
      if (res.success) {
        success('Administrator email updated and verified successfully.');
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

  const handleRequestPasswordOtp = async () => {
    try {
      const res = await api.requestPasswordChangeOtp();
      success(res.message || 'Verification code sent to your registered email.');
      setShowPasswordModal(true);
    } catch (err) {
      error(err.message || 'Failed to dispatch verification code.');
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordOtp || passwordOtp.trim().length !== 6) {
      error('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
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
        success('Administrator password updated successfully.');
        setShowPasswordModal(false);
        setPasswordOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      error(err.message || 'Password update failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-black text-white tracking-tight">
            Administrator Profile & Credentials
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
            Privileged
          </span>
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Update your administrative contact details and manage security password with email OTP confirmation.
        </p>
      </div>

      {/* Main Admin Profile Form */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-stone-800 pb-2">
            Administrator Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Login Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">
                Registered Administrator Email
              </label>
              {user?.isEmailVerified && (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Used for receiving password reset codes and account notifications. Modifying this email requires confirmation code verification.
            </p>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Admin Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-display font-bold text-white">Administrator Password</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Change your command center password. A single-use verification code will be dispatched to your registered email.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRequestPasswordOtp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider transition shadow"
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Modal: Email Change Verification */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white">
            <h3 className="text-lg font-display font-bold mb-1">Verify New Administrator Email</h3>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              We sent a 6-digit verification code to <strong>{pendingNewEmail}</strong>. Enter it below to confirm:
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
                className="w-full py-2.5 px-4 text-center font-mono font-bold tracking-[6px] text-lg rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-400 bg-stone-800 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile || emailOtp.length !== 6}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  Verify & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-white">
            <h3 className="text-lg font-display font-bold mb-1">Update Administrator Password</h3>
            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              A 6-digit verification code has been dispatched to your email (<strong>{user?.email}</strong>).
            </p>
            <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
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
                  className="w-full py-2 px-4 text-center font-mono font-bold tracking-[6px] text-lg rounded-xl border border-stone-700 bg-stone-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  New Security Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-xl border border-stone-700 bg-stone-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-xl border border-stone-700 bg-stone-950 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-400 bg-stone-800 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword || passwordOtp.length !== 6}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
