import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  MessageCircle,
  Save,
  Phone,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';

export const AdminWhatsAppPage = () => {
  const { success, error } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminWhatsApp();
      if (data.success && data.setting) {
        setWhatsappNumber(data.setting.whatsappNumber || '');
        setUpdatedAt(data.setting.updatedAt);
      }
    } catch (err) {
      error(err.message || 'Failed to load WhatsApp destination configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = whatsappNumber.replace(/\D/g, '');
    if (!cleanNum || cleanNum.length < 10) {
      error('Please enter a valid phone number with country code (e.g. 919876543210).');
      return;
    }

    try {
      setSaving(true);
      const data = await api.updateAdminWhatsApp(cleanNum);
      if (data.success) {
        success('WhatsApp order destination number saved to MongoDB successfully!');
        setWhatsappNumber(data.setting.whatsappNumber);
        setUpdatedAt(data.setting.updatedAt);
      }
    } catch (err) {
      error(err.message || 'Failed to update WhatsApp destination.');
    } finally {
      setSaving(false);
    }
  };

  const cleanDigits = whatsappNumber.replace(/\D/g, '');
  const testWaUrl = cleanDigits
    ? `https://wa.me/${cleanDigits}?text=Test%20Order%20Dispatch%20Verification`
    : '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner (Agrinex Command Pattern) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white shadow-xl border border-stone-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
            <MessageCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-black text-white">
                WhatsApp Dispatch Settings
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 uppercase">
                Dynamic Routing
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              Configure the official business mobile number that receives all incoming customer orders.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <p className="font-bold mb-0.5">Instant Database Reflection</p>
            When a customer clicks <strong>"Place Order via WhatsApp"</strong> on the checkout page, WhatsApp opens automatically with this destination number pre-filled. Changes persist in MongoDB and take effect immediately without redeploying the website.
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-stone-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
            <span>Loading current WhatsApp destination...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Destination Phone Number (with Country Code) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 919876543210 (India)"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5">
                Include country code (e.g. <strong>91</strong> for India followed by the 10-digit mobile number). Do not include '+' or spaces.
              </p>
            </div>

            {/* Test Link Generator */}
            {testWaUrl && (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-stone-700 block">
                    Verify WhatsApp URL Preview:
                  </span>
                  <span className="text-[11px] font-mono text-stone-400 break-all">
                    {testWaUrl}
                  </span>
                </div>
                <a
                  href={testWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {updatedAt && (
              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-500 flex items-center justify-between border border-stone-100">
                <span>Last Updated:</span>
                <span className="font-mono font-bold text-stone-700">
                  {new Date(updatedAt).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-950/20 border border-emerald-500/30 transition active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Database...' : 'Save WhatsApp Destination Number'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
