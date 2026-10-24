import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Mail, KeyRound, Lock, ArrowRight, ShieldCheck, ChevronLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'customer';
  const isAdmin = initialRole === 'admin';

  const { success, error } = useToast();
  const navigate = useNavigate();

  // Wizard Steps: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      error('Please enter a valid registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.forgotPassword({
        email: email.trim().toLowerCase(),
        role: initialRole
      });
      success(res.message || 'Verification code sent to your email.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      error(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      error('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        role: initialRole
      });
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        success('Verification code verified successfully.');
        setStep(3);
      } else {
        error(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      await api.forgotPassword({
        email: email.trim().toLowerCase(),
        role: initialRole
      });
      success('A new verification code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      error(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.resetPassword({
        resetToken,
        newPassword,
        confirmPassword
      });
      success(res.message || 'Password reset successfully.');
      setStep(4);
    } catch (err) {
      error(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const loginRedirectPath = isAdmin ? '/admin/login' : '/login';

  return (
    <div
      className={`min-h-[85vh] flex items-center justify-center px-4 py-12 ${
        isAdmin ? 'bg-stone-950 text-white' : ''
      }`}
    >
      <div
        className={`rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-xl border ${
          isAdmin
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-white border-cream-200 text-gray-900'
        }`}
      >
        {/* Top Back Link */}
        <div className="mb-6">
          <Link
            to={loginRedirectPath}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              isAdmin ? 'text-stone-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-900'
            } transition`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to {isAdmin ? 'Admin Login' : 'Login'}</span>
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-cream-100">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 1
                  ? isAdmin
                    ? 'bg-amber-600 text-white'
                    : 'bg-mango-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              1
            </span>
            <span className="text-xs font-semibold">Email</span>
          </div>
          <div className="h-0.5 w-8 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 2
                  ? isAdmin
                    ? 'bg-amber-600 text-white'
                    : 'bg-mango-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </span>
            <span className="text-xs font-semibold">OTP</span>
          </div>
          <div className="h-0.5 w-8 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                step >= 3
                  ? isAdmin
                    ? 'bg-amber-600 text-white'
                    : 'bg-mango-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </span>
            <span className="text-xs font-semibold">Reset</span>
          </div>
        </div>

        {/* STEP 1: Enter Registered Email */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-mango-100 text-mango-600'
                }`}
              >
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight">
                {isAdmin ? 'Admin Password Recovery' : 'Forgot Password?'}
              </h1>
              <p className="text-xs opacity-75 mt-1 leading-relaxed">
                Enter your registered email address. We'll send a single-use 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    required
                    autoFocus
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                      isAdmin
                        ? 'bg-stone-950 border-stone-700 text-white focus:ring-amber-500'
                        : 'bg-cream-50 border-cream-200 text-gray-900 focus:ring-mango-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl shadow transition text-sm ${
                  isAdmin
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-mango-600 hover:bg-mango-700 text-white'
                } disabled:opacity-50`}
              >
                <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-mango-100 text-mango-600'
                }`}
              >
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight">Verify Your Email</h1>
              <p className="text-xs opacity-75 mt-1 leading-relaxed">
                We sent a 6-digit verification code to <strong>{email}</strong>. It expires in 5 minutes.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  6-Digit Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className={`w-full py-3 px-4 rounded-xl border text-center font-mono font-bold tracking-[8px] text-xl transition focus:outline-none focus:ring-2 ${
                    isAdmin
                      ? 'bg-stone-950 border-stone-700 text-white focus:ring-amber-500'
                      : 'bg-cream-50 border-cream-200 text-gray-900 focus:ring-mango-500'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full mt-2 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl shadow transition text-sm ${
                  isAdmin
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-mango-600 hover:bg-mango-700 text-white'
                } disabled:opacity-50`}
              >
                <span>{loading ? 'Verifying...' : 'Verify Code & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-3 text-xs opacity-80">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:underline"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="font-bold hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-mango-100 text-mango-600'
                }`}
              >
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-display font-black tracking-tight">Set New Password</h1>
              <p className="text-xs opacity-75 mt-1 leading-relaxed">
                Choose a strong new password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    autoFocus
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                      isAdmin
                        ? 'bg-stone-950 border-stone-700 text-white focus:ring-amber-500'
                        : 'bg-cream-50 border-cream-200 text-gray-900 focus:ring-mango-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 ${
                      isAdmin
                        ? 'bg-stone-950 border-stone-700 text-white focus:ring-amber-500'
                        : 'bg-cream-50 border-cream-200 text-gray-900 focus:ring-mango-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl shadow transition text-sm ${
                  isAdmin
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-mango-600 hover:bg-mango-700 text-white'
                } disabled:opacity-50`}
              >
                <span>{loading ? 'Saving...' : 'Update Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Reset Success */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-display font-black text-gray-900 mb-2">
              Password Reset Complete!
            </h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Your password has been securely updated. You can now log in with your new credentials.
            </p>
            <button
              onClick={() => navigate(loginRedirectPath)}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow transition ${
                isAdmin
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-mango-600 hover:bg-mango-700'
              }`}
            >
              Proceed to Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
