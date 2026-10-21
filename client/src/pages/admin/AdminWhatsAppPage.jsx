import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MessageCircle, Save, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';

export const AdminWhatsAppPage = () => {
  const { success, error } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminWhatsApp();
      if (data.success && data.setting) {
        setWhatsappNumber(data.setting.whatsappNumber || '');
        setUpdatedAt(data.setting.updatedAt);
        setUpdatedBy(data.setting.updatedBy);
      }
    } catch (err) {
      error(err.message || 'Failed to load WhatsApp settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) {
      error('WhatsApp destination number cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const data = await api.updateAdminWhatsApp(whatsappNumber.trim());
      if (data.success) {
        success('WhatsApp destination phone number updated successfully!');
        setWhatsappNumber(data.setting.whatsappNumber);
        setUpdatedAt(data.setting.updatedAt);
        setUpdatedBy(data.setting.updatedBy);
      }
    } catch (err) {
      error(err.message || 'Failed to update WhatsApp number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-black text-gray-900">
          WhatsApp Order Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Configure the official phone number that receives all customer order messages.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-950 text-xs">Dynamic Order Dispatch</h3>
            <p className="text-[11px] text-emerald-800">
              When a customer clicks "Place Order", WhatsApp opens with this number pre-filled. Updates take effect immediately without redeploying the app.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading current settings...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Destination Phone Number (with Country Code) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. 919876543210 (India)"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Enter digits only, including the country code (e.g. <strong>91</strong> for India followed by the 10-digit mobile). Do not include '+' or spaces.
              </p>
            </div>

            {updatedAt && (
              <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-gray-700">
                  {new Date(updatedAt).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow transition active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save WhatsApp Destination Number'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
