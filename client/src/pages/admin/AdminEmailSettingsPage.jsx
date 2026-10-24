import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Mail,
  Server,
  Lock,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  ShieldCheck
} from 'lucide-react';

export const AdminEmailSettingsPage = () => {
  const { success, error } = useToast();

  const [settings, setSettings] = useState({
    senderEmail: '',
    senderName: 'Y.N.K Pickles',
    host: '',
    port: 587,
    secure: false,
    user: '',
    hasPassword: false,
    isConfigured: false,
    lastTestedAt: null,
    lastTestStatus: 'idle',
    lastTestError: ''
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  // Fetch current SMTP configuration
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminEmailSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
        setTestRecipient(res.settings.senderEmail || res.settings.user || '');
      }
    } catch (err) {
      error(err.message || 'Failed to load SMTP email settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save SMTP settings
  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings.host || !settings.user) {
      error('SMTP Host and Username are required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...settings,
        port: Number(settings.port) || 587,
        password: passwordInput ? passwordInput.trim() : undefined
      };

      const res = await api.updateAdminEmailSettings(payload);
      if (res.success) {
        success('SMTP Email settings saved successfully.');
        setSettings(res.settings);
        setPasswordInput('');
      }
    } catch (err) {
      error(err.message || 'Failed to save SMTP configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Send Test Email
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const payload = {
        host: settings.host,
        port: Number(settings.port) || 587,
        secure: settings.secure,
        user: settings.user,
        password: passwordInput ? passwordInput.trim() : undefined,
        senderEmail: testRecipient || settings.senderEmail || settings.user
      };

      const res = await api.testAdminEmailSettings(payload);
      if (res.success) {
        success(res.message);
        fetchSettings();
      }
    } catch (err) {
      error(err.message || 'SMTP Connection test failed.');
      fetchSettings();
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
        <span>Loading system email configuration...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-6">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-black text-white tracking-tight">
            Email & SMTP Configuration
          </h1>
          {settings.isConfigured ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
              <CheckCircle2 className="w-3 h-3" />
              Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              <AlertCircle className="w-3 h-3" />
              Unconfigured
            </span>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-1">
          Configure the official outgoing mail server used to dispatch customer verification codes and admin password resets.
        </p>
      </div>

      {/* Info Callout */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-300">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white block mb-0.5">Separate System Sender Account:</strong>
          This sender configuration is strictly used for outgoing system notifications. It operates independently from your personal administrator login email. Credentials are encrypted on the server and never exposed in API responses.
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Sender Display Name
              </label>
              <input
                type="text"
                name="senderName"
                value={settings.senderName}
                onChange={handleChange}
                placeholder="Y.N.K Pickles"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Sender Email Address
              </label>
              <input
                type="email"
                name="senderEmail"
                value={settings.senderEmail}
                onChange={handleChange}
                placeholder="notifications@ynkpickles.com"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                SMTP Host / Server
              </label>
              <div className="relative">
                <Server className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  name="host"
                  value={settings.host}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com or mail.yourdomain.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                SMTP Port
              </label>
              <input
                type="number"
                name="port"
                value={settings.port}
                onChange={handleChange}
                placeholder="587"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                SMTP Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  name="user"
                  value={settings.user}
                  onChange={handleChange}
                  placeholder="smtp_username or email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                SMTP Password or App Password {settings.hasPassword && <span className="text-emerald-400 font-normal">(Encrypted password saved)</span>}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={settings.hasPassword ? '•••••••••••• (Leave blank to keep current)' : 'Enter SMTP password'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Secure SSL/TLS Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="secure"
                checked={settings.secure}
                onChange={handleChange}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-stone-950 border-stone-700"
              />
              <span className="text-xs text-stone-300 font-semibold">
                Use Direct SSL/TLS Connection (Port 465). Uncheck for Port 587 STARTTLS.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Test recipient email"
                className="px-3 py-2 text-xs rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-full sm:w-60"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !settings.host || !settings.user}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-amber-300 rounded-xl text-xs font-bold transition shrink-0"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Live Test Status Feedback */}
        {settings.lastTestedAt && (
          <div className="mt-6 pt-4 border-t border-stone-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Last Test Result:</span>
              {settings.lastTestStatus === 'success' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passed ({new Date(settings.lastTestedAt).toLocaleString()})
                </span>
              ) : (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Failed ({new Date(settings.lastTestedAt).toLocaleString()})
                </span>
              )}
            </div>
            {settings.lastTestError && (
              <p className="mt-1 font-mono text-[11px] text-red-300 bg-red-950/40 border border-red-900/50 p-2 rounded-lg">
                Error: {settings.lastTestError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
