/**
 * Google Maps JavaScript API Dynamic Loader and Geocoding Utility
 */

let googleMapsPromise = null;

export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const isGoogleMapsConfigured = () => {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 5);
};

/**
 * Dynamically load Google Maps script with Places library
 */
export const loadGoogleMapsScript = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window unavailable'));

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(
      new Error(
        'Google Maps API Key (VITE_GOOGLE_MAPS_API_KEY) is not configured in client environment.'
      )
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but window.google.maps is undefined.'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script. Check network connection or API Key.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Reverse geocode coordinates to a human-readable address
 */
export const reverseGeocodeCoordinates = async (latitude, longitude) => {
  if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
    throw new Error('Valid latitude and longitude are required.');
  }

  // If Google Maps is available, use Google Geocoder
  if (window.google && window.google.maps && window.google.maps.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({
        location: { lat: Number(latitude), lng: Number(longitude) }
      });

      if (response && response.results && response.results.length > 0) {
        const topResult = response.results[0];
        return {
          formattedAddress: topResult.formatted_address,
          placeId: topResult.place_id || '',
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: 'google'
        };
      }
    } catch (gErr) {
      console.warn('[Google Geocoder error, falling back]:', gErr.message);
    }
  }

  // Safe fallback: Free reverse geocoding via OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return {
          formattedAddress: data.display_name,
          placeId: String(data.place_id || ''),
          latitude: Number(latitude),
          longitude: Number(longitude),
          source: 'nominatim_fallback'
        };
      }
    }
  } catch (nomErr) {
    console.warn('[Nominatim reverse geocode error]:', nomErr.message);
  }

  // Fallback to coordinate string if services unavailable
  return {
    formattedAddress: `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    placeId: '',
    latitude: Number(latitude),
    longitude: Number(longitude),
    source: 'coordinates'
  };
};
