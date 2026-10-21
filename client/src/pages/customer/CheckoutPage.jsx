import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../services/api.js';
import {
  MapPin,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { formatCurrency, formatUnit, formatPriceBasisLabel } from '../../utils/pricing.js';
import { buildWhatsAppOrderMessage, createWhatsAppUrl } from '../../utils/whatsapp.js';

export const CheckoutPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, grandTotal, clearCart } = useCart();
  const navigate = useNavigate();

  // WhatsApp Destination Number from backend settings
  const [destinationNumber, setDestinationNumber] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  // Geolocation State
  const [coords, setCoords] = useState(null);
  const [locationLink, setLocationLink] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | locating | success | error | denied
  const [locationErrorMessage, setLocationErrorMessage] = useState('');

  // Order submission modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch trusted WhatsApp destination number from backend
  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        setLoadingSettings(true);
        const data = await api.getWhatsAppNumber();
        if (data.success && data.whatsappNumber) {
          setDestinationNumber(data.whatsappNumber);
        } else {
          setSettingsError('Store WhatsApp number is currently unconfigured. Please check back shortly.');
        }
      } catch (err) {
        setSettingsError('Failed to fetch store WhatsApp number: ' + err.message);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchWhatsAppNumber();
  }, []);

  // Redirect if cart is empty or unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Request Device GPS Location using Browser Geolocation API
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationErrorMessage('Your device or browser does not support GPS location.');
      return;
    }

    setLocationStatus('locating');
    setLocationErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setLocationLink(mapUrl);
        setLocationStatus('success');
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          msg = 'Location permission was denied. You can still order without GPS location.';
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('error');
          msg = 'Location request timed out. Please check your GPS signal and try again.';
        } else {
          setLocationStatus('error');
          msg = error.message || 'Position unavailable.';
        }
        setLocationErrorMessage(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  if (!isAuthenticated || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-4">No active cart items to review.</h2>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-olive-800 text-white rounded-xl text-sm font-semibold"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  // Pre-generate WhatsApp message
  const prefilledMessage = buildWhatsAppOrderMessage({
    customer: user,
    items: cart.items,
    grandTotal,
    locationLink
  });

  const whatsAppUrl = createWhatsAppUrl(destinationNumber, prefilledMessage);

  const handlePlaceOrder = () => {
    if (!whatsAppUrl) return;

    // Open WhatsApp directly via click-to-chat
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');

    // Show completion instructions
    setShowCompletionModal(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link
        to="/cart"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Cart</span>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900">
          Order Review & WhatsApp Checkout
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Review your items, attach your delivery GPS location, and send your order directly to our official WhatsApp.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Customer Profile Details */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800 mb-3">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Customer Name</span>
              <span className="font-bold text-gray-900">{user?.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Phone Number</span>
              <span className="font-mono font-bold text-gray-900">+{user?.phone}</span>
            </div>
          </div>
        </div>

        {/* 2. Items Summary */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800 mb-3">
            Order Items ({cart.items.length})
          </h2>
          <div className="divide-y divide-cream-100">
            {cart.items.map((item, idx) => {
              const p = item.product;
              return (
                <div key={p._id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}.</span>
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatUnit(item.quantity, p.measurementUnit)} •{' '}
                        {formatPriceBasisLabel(p.price, p.priceBasis, p.priceBasisUnit, p.measurementUnit)}
                      </p>
                    </div>
                  </div>
                  <div className="font-black text-gray-900 text-right">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
            <span className="font-display font-bold text-gray-900 text-base">Grand Total:</span>
            <span className="text-2xl font-black text-olive-800">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* 3. GPS Location Selection */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800">
                Delivery Location (GPS)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Share your device's exact GPS coordinates so our delivery team can locate your doorstep easily.
              </p>
            </div>
            <div className="p-2 bg-mango-100 text-mango-800 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 bg-cream-50 rounded-2xl p-4 border border-cream-200">
            {locationStatus === 'success' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>GPS Location Acquired Successfully</span>
                </div>
                <p className="text-xs font-mono text-gray-600">
                  Coordinates: {coords?.lat?.toFixed(6)}, {coords?.lng?.toFixed(6)}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-mango-700 font-semibold hover:underline"
                  >
                    <span>View on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-gray-300">•</span>
                  <button
                    onClick={requestCurrentLocation}
                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    Refresh Location
                  </button>
                </div>
              </div>
            ) : locationStatus === 'locating' ? (
              <div className="flex items-center gap-3 py-2 text-xs text-gray-600 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-mango-600" />
                <span>Acquiring high-accuracy GPS coordinates from device...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {locationErrorMessage && (
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{locationErrorMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={requestCurrentLocation}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-olive-800 hover:bg-olive-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Select Current Location (GPS)</span>
                </button>
                <p className="text-[11px] text-gray-400">
                  Browser will ask for one-time location permission. If declined, your order can still proceed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. WhatsApp Destination Preview */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800 mb-2">
            Destination WhatsApp Number
          </h2>
          {loadingSettings ? (
            <div className="text-xs text-gray-400">Loading store settings...</div>
          ) : settingsError ? (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{settingsError}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Official Store WhatsApp:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">+{destinationNumber}</span>
            </div>
          )}

          {/* Collapsible message preview */}
          <details className="mt-4 pt-3 border-t border-cream-100 text-xs">
            <summary className="font-semibold text-gray-700 cursor-pointer hover:text-mango-700 select-none">
              Preview Pre-filled WhatsApp Message
            </summary>
            <pre className="mt-3 p-3 bg-cream-100 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-gray-800 border border-cream-200 leading-relaxed">
              {prefilledMessage}
            </pre>
          </details>
        </div>

        {/* 5. Final Action: Place Order */}
        <div className="bg-gradient-to-br from-olive-800 to-olive-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-olive-300 font-semibold uppercase tracking-wider">
                Step 3 of 3 • Direct Checkout
              </p>
              <h3 className="text-xl font-display font-black text-white mt-0.5">
                Ready to Send via WhatsApp
              </h3>
              <p className="text-xs text-olive-200 mt-1 max-w-md">
                Clicking the button opens WhatsApp with your pre-filled items and delivery location. You will simply press Send.
              </p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loadingSettings || !destinationNumber}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold px-6 py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition active:scale-[0.98] text-sm shrink-0"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Place Order via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Completion Dialog Reminder */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-cream-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 fill-emerald-600" />
            </div>

            <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
              WhatsApp Opened!
            </h3>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Your complete order has been pre-filled in WhatsApp.
              <br />
              <strong className="text-gray-900 font-bold block mt-2">
                Important: Remember to press "Send" in WhatsApp to deliver your order to YNK Pickles.
              </strong>
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  clearCart();
                  setShowCompletionModal(false);
                  navigate('/');
                }}
                className="w-full py-3 bg-olive-800 hover:bg-olive-900 text-white font-bold rounded-2xl text-xs transition"
              >
                I Sent the Message (Clear Cart & Finish)
              </button>

              <button
                onClick={() => setShowCompletionModal(false)}
                className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
