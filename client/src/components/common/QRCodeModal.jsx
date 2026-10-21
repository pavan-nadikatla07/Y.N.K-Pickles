import React, { useState } from 'react';
import { QrCode, Copy, Check, X, ExternalLink } from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ynkpickles.com';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    currentUrl
  )}&margin=10&color=92400E&bgcolor=FAF6ED`;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-cream-200 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-cream-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 bg-mango-100 text-mango-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-display font-bold text-gray-900 mb-1">
          Scan to Open YNK Pickles
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Scan with your smartphone camera to browse authentic South Indian pickles directly.
        </p>

        {/* QR Code container */}
        <div className="bg-cream-100 p-4 rounded-2xl inline-block border border-cream-200 shadow-inner mb-6">
          <img
            src={qrUrl}
            alt="YNK Pickles Marketplace QR Code"
            className="w-48 h-48 rounded-xl object-contain"
            loading="lazy"
          />
        </div>

        {/* Website link copy box */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-cream-50 rounded-xl border border-cream-200 text-xs mb-4">
          <span className="truncate text-gray-600 font-mono select-all text-left">{currentUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-mango-500 hover:bg-mango-600 text-white font-medium px-3 py-1.5 rounded-lg transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-[11px] text-gray-400">
          Tip: Print this QR code to display in your storefront, packaging, or marketing cards!
        </p>
      </div>
    </div>
  );
};
