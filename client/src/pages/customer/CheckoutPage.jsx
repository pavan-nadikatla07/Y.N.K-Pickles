import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  MapPin,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Compass,
  Home,
  Check,
  Truck
} from 'lucide-react';
import { formatCurrency, formatUnit, formatPriceBasisLabel } from '../../utils/pricing.js';
import { buildWhatsAppOrderMessage, createWhatsAppUrl } from '../../utils/whatsapp.js';
import { reverseGeocodeCoordinates } from '../../utils/googleMapsLoader.js';

export const CheckoutPage = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { cart, grandTotal, clearCart, refreshCart } = useCart();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  // WhatsApp Destination Number from backend settings
  const [destinationNumber, setDestinationNumber] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState(null);

  // Delivery Location Mode: 'saved' | 'current'
  const hasSavedLocation = Boolean(
    user?.savedLocation?.isVerified &&
      user?.savedLocation?.latitude !== null &&
      user?.savedLocation?.longitude !== null
  );

  const [locationMode, setLocationMode] = useState(hasSavedLocation ? 'saved' : 'current');

  // Current Location State
  const [currentCoords, setCurrentCoords] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [currentGpsStatus, setCurrentGpsStatus] = useState('idle'); // idle | locating | success | error
  const [currentGpsError, setCurrentGpsError] = useState('');
  const [saveCurrentToProfile, setSaveCurrentToProfile] = useState(false);

  // Delivery Notes
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Authoritative Logistics & Delivery State
  const [logisticsData, setLogisticsData] = useState(null);
  const [loadingLogistics, setLoadingLogistics] = useState(false);
  const [logisticsError, setLogisticsError] = useState(null);

  // Order submission modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [validatingOrder, setValidatingOrder] = useState(false);

  // Fetch trusted WhatsApp destination number from backend
  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      try {
        setLoadingSettings(true);
        const data = await api.getWhatsAppNumber();
        if (data.success && data.whatsappNumber) {
          setDestinationNumber(data.whatsappNumber);
        } else {
          setSettingsError(
            'Store WhatsApp number is currently unconfigured. Please check back shortly.'
          );
        }
      } catch (err) {
        setSettingsError('Failed to fetch store WhatsApp number: ' + err.message);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchWhatsAppNumber();
  }, []);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Request Device GPS Location
  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setCurrentGpsStatus('error');
      setCurrentGpsError('Your device or browser does not support GPS location.');
      return;
    }

    setCurrentGpsStatus('locating');
    setCurrentGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentCoords({ lat, lng });

        try {
          const geocoded = await reverseGeocodeCoordinates(lat, lng);
          setCurrentAddress(geocoded.formattedAddress);
          setCurrentGpsStatus('success');
        } catch {
          setCurrentAddress(`Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setCurrentGpsStatus('success');
        }
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access or use saved address.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please check GPS signal and try again.';
        }
        setCurrentGpsStatus('error');
        setCurrentGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Determine active location details for order
  const getActiveLocationDetails = () => {
    if (locationMode === 'saved' && hasSavedLocation) {
      const loc = user.savedLocation;
      return {
        address: loc.formattedAddress || loc.address,
        coords: { lat: loc.latitude, lng: loc.longitude },
        mapUrl: `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`,
        isVerified: true
      };
    }

    if (locationMode === 'current' && currentCoords) {
      return {
        address: currentAddress,
        coords: currentCoords,
        mapUrl: `https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`,
        isVerified: true
      };
    }

    return null;
  };

  const activeLocation = getActiveLocationDetails();

  // Authoritatively calculate logistics quote whenever active delivery location changes
  useEffect(() => {
    let isCancelled = false;

    if (!activeLocation || !activeLocation.coords) {
      setLogisticsData(null);
      setLogisticsError(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        setLoadingLogistics(true);
        setLogisticsError(null);
        const res = await api.getLogisticsQuote(
          activeLocation.coords.lat,
          activeLocation.coords.lng,
          activeLocation.address || ''
        );
        if (!isCancelled) {
          if (res.success) {
            setLogisticsData(res);
          } else {
            setLogisticsError(res.message || 'Unable to calculate delivery charges.');
            setLogisticsData(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setLogisticsError(err.message || 'Failed to calculate delivery logistics.');
          setLogisticsData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingLogistics(false);
        }
      }
    };

    fetchQuote();

    return () => {
      isCancelled = true;
    };
  }, [
    activeLocation?.coords?.lat,
    activeLocation?.coords?.lng,
    activeLocation?.address
  ]);

  // Validate prices, stock & logistics, then open WhatsApp
  const handlePlaceOrder = async () => {
    if (!activeLocation) {
      toastError('Please select and verify a delivery location before proceeding.');
      return;
    }

    if (loadingLogistics) {
      toastError('Calculating delivery logistics. Please wait a moment.');
      return;
    }

    if (logisticsError || !logisticsData) {
      toastError(
        logisticsError ||
          'Delivery charges could not be calculated. Please check your delivery location.'
      );
      return;
    }

    if (!destinationNumber) {
      toastError('Store WhatsApp number is unavailable.');
      return;
    }

    try {
      setValidatingOrder(true);

      // Revalidate cart prices and stock against database
      const latestCartData = await api.getCart();
      if (!latestCartData.success || !latestCartData.cart) {
        toastError('Failed to validate order. Please refresh your cart.');
        return;
      }

      if (latestCartData.cart.hasIssues) {
        toastError('Some items in your cart have stock or price updates. Please review your cart.');
        navigate('/cart');
        return;
      }

      // If user chose Option B and checked "save to profile", save in background
      if (locationMode === 'current' && saveCurrentToProfile && currentCoords) {
        try {
          await api.updateProfile({
            savedLocation: {
              address: currentAddress,
              formattedAddress: currentAddress,
              placeId: '',
              latitude: currentCoords.lat,
              longitude: currentCoords.lng,
              isVerified: true
            }
          });
          await refreshUser();
        } catch (saveErr) {
          console.warn('[Checkout] Failed to save current address to profile:', saveErr.message);
        }
      }

      const itemsSubtotal = latestCartData.cart.grandTotal;
      const logisticsCharge = logisticsData.logisticsCharge || 0;
      const calculatedFinalTotal = itemsSubtotal + logisticsCharge;

      const prefilledMessage = buildWhatsAppOrderMessage({
        customer: user,
        items: latestCartData.cart.items,
        subtotal: itemsSubtotal,
        logistics: logisticsData,
        finalTotal: calculatedFinalTotal,
        deliveryAddress: activeLocation.address,
        locationLink: activeLocation.mapUrl,
        deliveryNotes
      });

      const whatsAppUrl = createWhatsAppUrl(destinationNumber, prefilledMessage);
      if (!whatsAppUrl) {
        toastError('Failed to generate WhatsApp order link.');
        return;
      }

      // Open WhatsApp click-to-chat in new tab
      window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');

      // Show completion confirmation modal
      setShowCompletionModal(true);
    } catch (err) {
      toastError(err.message || 'Error preparing order. Please try again.');
    } finally {
      setValidatingOrder(false);
    }
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
          Select your delivery location, review order subtotals, and launch WhatsApp click-to-chat to place your order.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Customer Information */}
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

        {/* 2. Delivery Location Selection (Option A vs Option B) */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-olive-800 mb-2">
            Delivery Location Selection <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Choose whether to deliver to your verified profile address or your current GPS device location.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* OPTION A: Saved Location */}
            <button
              type="button"
              onClick={() => setLocationMode('saved')}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                locationMode === 'saved'
                  ? 'border-mango-500 bg-amber-50/50 ring-2 ring-mango-500/20'
                  : 'border-cream-200 bg-white hover:bg-cream-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Home
                      className={`w-4 h-4 ${
                        locationMode === 'saved' ? 'text-mango-600' : 'text-gray-400'
                      }`}
                    />
                    <span className="font-bold text-xs text-gray-900">Option A: Saved Location</span>
                  </div>
                  {locationMode === 'saved' && (
                    <span className="w-4 h-4 rounded-full bg-mango-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {hasSavedLocation ? (
                  <div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2">
                      {user.savedLocation.formattedAddress || user.savedLocation.address}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Coordinates
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    No verified address saved in your profile.{' '}
                    <Link to="/profile" className="text-mango-700 underline font-semibold">
                      Add in Settings
                    </Link>
                  </p>
                )}
              </div>
            </button>

            {/* OPTION B: Current Location */}
            <button
              type="button"
              onClick={() => {
                setLocationMode('current');
                if (!currentCoords && currentGpsStatus === 'idle') {
                  requestCurrentLocation();
                }
              }}
              className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                locationMode === 'current'
                  ? 'border-mango-500 bg-amber-50/50 ring-2 ring-mango-500/20'
                  : 'border-cream-200 bg-white hover:bg-cream-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Compass
                      className={`w-4 h-4 ${
                        locationMode === 'current' ? 'text-mango-600' : 'text-gray-400'
                      }`}
                    />
                    <span className="font-bold text-xs text-gray-900">Option B: Current Location</span>
                  </div>
                  {locationMode === 'current' && (
                    <span className="w-4 h-4 rounded-full bg-mango-600 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {currentCoords ? (
                  <div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-2">
                      {currentAddress || `${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}`}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                      <CheckCircle2 className="w-3 h-3" />
                      GPS Detected
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Acquire high-accuracy device GPS coordinates directly from your phone/browser.
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Location Mode Details & Actions */}
          {locationMode === 'saved' && (
            <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 text-xs">
              {hasSavedLocation ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">
                      {user.savedLocation.formattedAddress || user.savedLocation.address}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      Coordinates: {user.savedLocation.latitude?.toFixed(6)},{' '}
                      {user.savedLocation.longitude?.toFixed(6)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${user.savedLocation.latitude},${user.savedLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-mango-700 font-bold hover:underline shrink-0 ml-2"
                  >
                    <span>View Map</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="text-amber-800">
                  <p>You have not saved a verified delivery address in your profile.</p>
                  <div className="flex gap-2 mt-2">
                    <Link
                      to="/profile"
                      className="px-3 py-1.5 bg-white text-gray-800 border rounded-lg font-bold text-[11px]"
                    >
                      Configure in Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode('current');
                        requestCurrentLocation();
                      }}
                      className="px-3 py-1.5 bg-olive-800 text-white rounded-lg font-bold text-[11px]"
                    >
                      Use Current GPS Instead
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {locationMode === 'current' && (
            <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 text-xs space-y-3">
              {currentGpsStatus === 'locating' ? (
                <div className="flex items-center gap-2 text-gray-600 font-medium py-1">
                  <RefreshCw className="w-4 h-4 animate-spin text-mango-600" />
                  <span>Acquiring high-accuracy GPS coordinates...</span>
                </div>
              ) : currentCoords ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{currentAddress}</p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Coordinates: {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${currentCoords.lat},${currentCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-mango-700 font-bold hover:underline shrink-0 ml-2"
                    >
                      <span>View Map</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="mt-3 pt-2 border-t border-cream-200 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input
                        type="checkbox"
                        checked={saveCurrentToProfile}
                        onChange={(e) => setSaveCurrentToProfile(e.target.checked)}
                        className="rounded text-mango-600 focus:ring-mango-500"
                      />
                      <span>Save this address to my profile for future orders</span>
                    </label>

                    <button
                      type="button"
                      onClick={requestCurrentLocation}
                      className="text-mango-700 underline font-semibold text-[11px]"
                    >
                      Refresh GPS
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {currentGpsError && (
                    <p className="text-red-600 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentGpsError}</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={requestCurrentLocation}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-olive-800 text-white font-bold rounded-xl text-xs hover:bg-olive-900 transition"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Detect Device GPS Location</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Items Summary */}
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
                        {formatPriceBasisLabel(
                          p.price,
                          p.priceBasis,
                          p.priceBasisUnit,
                          p.measurementUnit
                        )}
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

          {/* Pricing Breakdown with Authoritative Logistics */}
          <div className="mt-5 pt-4 border-t border-cream-200 space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-gray-600">
              <span>Product Subtotal:</span>
              <span className="font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-mango-600 shrink-0" />
                <span className="font-medium text-gray-700">Delivery & Logistics:</span>
                {logisticsData?.isInside && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tanuku Circle
                  </span>
                )}
              </div>

              <div className="text-right">
                {loadingLogistics ? (
                  <span className="inline-flex items-center gap-1 text-xs text-mango-700 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating road route...</span>
                  </span>
                ) : logisticsError ? (
                  <span className="text-xs text-red-600 font-medium">
                    ⚠️ {logisticsError}
                  </span>
                ) : logisticsData ? (
                  logisticsData.isInside ? (
                    <div>
                      <span className="text-sm font-black text-emerald-700">FREE DELIVERY</span>
                      <p className="text-[10px] text-gray-400">Inside Tanuku Circle (₹0)</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-black text-gray-900">
                        {formatCurrency(logisticsData.logisticsCharge)}
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {logisticsData.distanceKm} km road distance @ ₹{logisticsData.ratePerKm}/km
                      </p>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-gray-400 italic">Select location above</span>
                )}
              </div>
            </div>

            {/* Final Total */}
            <div className="pt-3 border-t border-cream-200 flex items-center justify-between">
              <div>
                <span className="font-display font-bold text-gray-900 text-base">Final Total:</span>
                <p className="text-[11px] text-gray-500">
                  {logisticsData?.isInside
                    ? 'Includes free delivery inside Tanuku Circle'
                    : logisticsData
                    ? `Includes ₹${logisticsData.logisticsCharge} delivery logistics`
                    : 'Awaiting verified delivery location'}
                </p>
              </div>
              <span className="text-2xl font-black text-olive-800">
                {formatCurrency(grandTotal + (logisticsData ? logisticsData.logisticsCharge : 0))}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Optional Delivery Notes */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-olive-800 mb-1.5">
            Special Delivery Instructions (Optional)
          </label>
          <input
            type="text"
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            placeholder="e.g. Leave with security guard, call before arriving..."
            className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-mango-500"
          />
        </div>

        {/* 5. Destination WhatsApp Preview */}
        <div className="bg-white rounded-3xl border border-cream-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Official Store WhatsApp:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">+{destinationNumber}</span>
          </div>
        </div>

        {/* 6. Place Order Button */}
        <div className="bg-gradient-to-br from-olive-800 to-olive-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-olive-300 font-semibold uppercase tracking-wider">
                Direct WhatsApp Checkout
              </p>
              <h3 className="text-xl font-display font-black text-white mt-0.5">
                Ready to Send via WhatsApp
              </h3>
              <p className="text-xs text-olive-200 mt-1 max-w-md">
                Clicking opens WhatsApp with your items, verified logistics charges, and delivery location. You will press Send in WhatsApp.
              </p>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={
                validatingOrder ||
                loadingSettings ||
                loadingLogistics ||
                !destinationNumber ||
                !activeLocation ||
                !logisticsData ||
                Boolean(logisticsError)
              }
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold px-6 py-4 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition active:scale-[0.98] text-sm shrink-0"
            >
              {validatingOrder ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Validating Order...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>Place Order via WhatsApp</span>
                </>
              )}
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
                Important: Remember to press "Send" in WhatsApp to deliver your order to Y.N.K Pickles.
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
