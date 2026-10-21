import React from 'react';
import { Heart, ShieldCheck, Truck, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-cream-200 mt-20">
      {/* Values highlights */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left border-b border-cream-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-mango-100 text-mango-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-gray-900 text-sm">Authentic Homestyle</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Traditional recipes prepared with premium spices and cold-pressed oils.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-olive-100 text-olive-800 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-gray-900 text-sm">No Artificial Preservatives</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Pure sea salt, fresh lemons, and traditional curing techniques.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-gray-900 text-sm">Direct WhatsApp Ordering</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Connect directly with our kitchen for personalized delivery confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-gray-900">YNK Pickles</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>for authentic taste</span>
        </div>
      </div>
    </footer>
  );
};
