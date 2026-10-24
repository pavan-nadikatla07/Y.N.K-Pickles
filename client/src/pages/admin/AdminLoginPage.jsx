import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ShieldCheck, Lock, Phone, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react';

export const AdminLoginPage = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password) {
      error('Administrator phone number and password are required.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(phone, password);
      if (user.role !== 'admin') {
        error('Access denied. Administrator privileges required.');
        navigate('/');
        return;
      }
      success('Welcome to YNK Pickles Operations Command Center.');
      navigate('/admin/dashboard');
    } catch (err) {
      error(err.message || 'Authentication failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-md">
        {/* Top Back Link */}
        <div className="mb-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Customer Storefront</span>
          </Link>
        </div>

        {/* Login Card (Agrinex Operations Command Aesthetic) */}
        <div className="bg-stone-900/95 border border-stone-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md text-white">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-950/40 border-2 border-amber-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-display font-black text-white tracking-tight">
                YNK Operations
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Restricted portal &bull; Inventory & Live Price Engine
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Administrator Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 919876543210"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-sm font-mono text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Security Password
                </label>
                <Link
                  to="/forgot-password?role=admin"
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-sm text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-950/40 border border-amber-500/30 transition active:scale-[0.99] text-xs uppercase tracking-wider"
            >
              <span>{loading ? 'Verifying Authorization...' : 'Enter Command Center'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-stone-800 text-center text-[11px] text-stone-500 leading-relaxed">
            Authorized personnel only. All price, inventory, and settings adjustments are logged.
          </div>
        </div>
      </div>
    </div>
  );
};
