import React, { useState, useEffect, useRef } from 'react';
import { MapPin, CheckCircle2, AlertCircle, RefreshCw, Compass, ExternalLink } from 'lucide-react';
import {
  loadGoogleMapsScript,
  isGoogleMapsConfigured,
  reverseGeocodeCoordinates
} from '../../utils/googleMapsLoader.js';

export const AddressAutocompleteInput = ({
  initialLocation,
  onLocationVerified,
  disabled = false,
  label = 'Delivery Address / Location'
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState('');
  const [inputValue, setInputValue] = useState(
    initialLocation?.formattedAddress || initialLocation?.address || ''
  );
  const [verifiedLocation, setVerifiedLocation] = useState(initialLocation || null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Sync when initialLocation prop changes
  useEffect(() => {
    if (initialLocation && initialLocation.isVerified) {
      setVerifiedLocation(initialLocation);
      setInputValue(initialLocation.formattedAddress || initialLocation.address || '');
    }
  }, [initialLocation]);

  // Initialize Google Maps Places Autocomplete if key is available
  useEffect(() => {
    let isMounted = true;

    if (!isGoogleMapsConfigured()) {
      setMapsError(
        'Google Maps API Key is not configured (VITE_GOOGLE_MAPS_API_KEY). You can still verify using device GPS.'
      );
      return;
    }

    loadGoogleMapsScript()
      .then((maps) => {
        if (!isMounted || !inputRef.current) return;
        setMapsLoaded(true);
        setMapsError('');

        // Attach Autocomplete
        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'place_id', 'name'],
          componentRestrictions: { country: 'in' } // Default to India
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            setGpsError('Please select a valid place from the suggestions list.');
            return;
          }

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name;

          const verified = {
            address,
            formattedAddress: address,
            placeId: place.place_id || '',
            latitude: lat,
            longitude: lng,
            isVerified: true
          };

          setInputValue(address);
          setVerifiedLocation(verified);
          setGpsError('');
          if (onLocationVerified) onLocationVerified(verified);
        });
      })
      .catch((err) => {
        if (isMounted) {
          setMapsError(
            `Places Autocomplete unavailable: ${err.message}. You can use GPS coordinates below.`
          );
        }
      });

    return () => {
      isMounted = false;
      if (
        autocompleteRef.current &&
        window.google &&
        window.google.maps &&
        window.google.maps.event
      ) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // If user edits text manually after verification, invalidate until confirmed/selected
    if (verifiedLocation && val !== (verifiedLocation.formattedAddress || verifiedLocation.address)) {
      setVerifiedLocation(null);
      if (onLocationVerified) {
        onLocationVerified({
          address: val,
          formattedAddress: '',
          placeId: '',
          latitude: null,
          longitude: null,
          isVerified: false
        });
      }
    }
  };

  // Acquire current device location via Geolocation API
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsLocating(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geocoded = await reverseGeocodeCoordinates(latitude, longitude);

          const verified = {
            address: geocoded.formattedAddress,
            formattedAddress: geocoded.formattedAddress,
            placeId: geocoded.placeId,
            latitude,
            longitude,
            isVerified: true
          };

          setInputValue(geocoded.formattedAddress);
          setVerifiedLocation(verified);
          if (onLocationVerified) onLocationVerified(verified);
        } catch (err) {
          setGpsError(`Failed to reverse-geocode GPS position: ${err.message}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access in your browser.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('GPS location request timed out. Please try again.');
        } else {
          setGpsError(err.message || 'Unable to determine device location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          {label} <span className="text-red-500">*</span>
        </label>
        {verifiedLocation?.isVerified && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Location
          </span>
        )}
      </div>

      {/* Address Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <MapPin className="w-4 h-4 text-mango-600" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Search street, colony, landmark or city in India..."
          className="w-full pl-10 pr-24 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-mango-500/20 focus:border-mango-500 transition shadow-sm disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleUseCurrentGps}
          disabled={disabled || isLocating}
          title="Detect Current GPS Location"
          className="absolute inset-y-1 right-1 px-3 bg-white hover:bg-cream-100 text-olive-800 border border-cream-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
        >
          {isLocating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-mango-600" />
          ) : (
            <Compass className="w-3.5 h-3.5 text-mango-600" />
          )}
          <span className="hidden sm:inline">Use GPS</span>
        </button>
      </div>

      {/* Error or Configuration Notice */}
      {mapsError && !verifiedLocation?.isVerified && (
        <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{mapsError}</span>
        </p>
      )}

      {gpsError && (
        <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{gpsError}</span>
        </p>
      )}

      {/* Verified Coordinates badge & Map link */}
      {verifiedLocation?.isVerified && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold">{verifiedLocation.formattedAddress || verifiedLocation.address}</p>
              <p className="text-[11px] font-mono text-emerald-700">
                Coordinates: {verifiedLocation.latitude?.toFixed(6)}, {verifiedLocation.longitude?.toFixed(6)}
              </p>
            </div>
          </div>
          {verifiedLocation.latitude && verifiedLocation.longitude && (
            <a
              href={`https://www.google.com/maps?q=${verifiedLocation.latitude},${verifiedLocation.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-mango-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
            >
              <span>View Map</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {!verifiedLocation?.isVerified && inputValue.trim().length > 0 && (
        <p className="text-[11px] text-amber-600">
          ⚠️ Please select an address from Google suggestions or click <strong>"Use GPS"</strong> to verify your location coordinates.
        </p>
      )}
    </div>
  );
};
