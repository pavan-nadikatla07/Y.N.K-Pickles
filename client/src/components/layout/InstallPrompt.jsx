import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt if user hasn't dismissed it in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-olive-900 text-white border-b border-olive-800 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <span className="p-1 bg-mango-500 rounded-lg text-white">
          <Download className="w-3.5 h-3.5" />
        </span>
        <span>
          Install <strong className="text-mango-300">YNK Pickles</strong> on your phone for instant ordering!
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-mango-500 hover:bg-mango-600 text-white font-semibold px-3 py-1 rounded-lg text-xs transition"
        >
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/70 hover:text-white p-1"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
