import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { User, Phone, Lock, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, password, confirmPassword } = formData;

    if (!name.trim()) {
      error('Full name is required.');
      return;
    }

    if (!phone.trim()) {
      error('Phone number is required.');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(name, phone, password, confirmPassword);
      success('Account created successfully! Welcome to YNK Pickles.');
      navigate('/');
    } catch (err) {
      error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-cream-200 p-8 sm:p-10 max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-mango-400 to-mango-600 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-xl mx-auto mb-3 shadow-sm">
            YNK
          </div>
          <h1 className="text-2xl font-display font-black text-gray-900">Create Customer Account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Join YNK Pickles for quick doorstep ordering.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Suresh Kumar"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Your 10-digit mobile number will be your login ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-mango-500 to-mango-600 hover:from-mango-600 hover:to-mango-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-2xl shadow hover:shadow-md transition active:scale-[0.99] text-sm"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-cream-100 text-center">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-mango-700 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
