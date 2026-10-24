import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load official Tanuku Circle GeoJSON polygon boundary (from OpenStreetMap Relation 10143925)
const boundaryPath = path.resolve(__dirname, '../config/tanukuBoundary.json');
let boundaryPolygon = null;

try {
  const boundaryData = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
  boundaryPolygon = boundaryData.coordinates[0]; // Ring of [ [lng, lat], ... ]
} catch (err) {
  console.error('[Logistics] Error loading Tanuku boundary file:', err.message);
}

/**
 * Returns the boundary ring coordinates
 */
export const getTanukuBoundaryRing = () => boundaryPolygon;

/**
 * Point-in-polygon test using ray-casting algorithm
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - true if inside polygon, false otherwise
 */
export const isPointInTanukuCircle = (lat, lng) => {
  if (!boundaryPolygon || boundaryPolygon.length < 3) {
    throw new Error('Tanuku Circle boundary data is unavailable. Please configure boundary.');
  }

  const x = Number(lng);
  const y = Number(lat);
  let inside = false;

  for (let i = 0, j = boundaryPolygon.length - 1; i < boundaryPolygon.length; j = i++) {
    const xi = boundaryPolygon[i][0];
    const yi = boundaryPolygon[i][1];
    const xj = boundaryPolygon[j][0];
    const yj = boundaryPolygon[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

/**
 * Haversine formula to compute great-circle distance between two points on Earth in meters
 */
export const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Finds the closest point on the Tanuku boundary polygon to a given customer coordinate
 * by projecting the coordinate onto each polygon edge segment.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {{ lat: number, lng: number, distanceMeters: number }}
 */
export const findNearestPointOnBoundary = (lat, lng) => {
  if (!boundaryPolygon || boundaryPolygon.length < 3) {
    throw new Error('Tanuku Circle boundary data is unavailable.');
  }

  const px = Number(lng);
  const py = Number(lat);
  let minDistance = Infinity;
  let nearestPoint = null;

  for (let i = 0; i < boundaryPolygon.length - 1; i++) {
    const ax = boundaryPolygon[i][0];
    const ay = boundaryPolygon[i][1];
    const bx = boundaryPolygon[i + 1][0];
    const by = boundaryPolygon[i + 1][1];

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const qx = ax + t * dx;
    const qy = ay + t * dy;

    const dist = haversineMeters(py, px, qy, qx);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPoint = { lat: qy, lng: qx, distanceMeters: dist };
    }
  }

  return nearestPoint;
};

/**
 * Computes actual road driving distance in meters between two coordinates.
 * Multi-provider implementation:
 * 1. Checks if Google Routes/Directions API is configured and operational.
 * 2. Falls back to Open Source Routing Machine (OSRM) driving route API.
 * Never guesses or fabricates distances.
 */
export const computeRoadDistanceMeters = async (origin, destination) => {
  const originLat = Number(origin.lat);
  const originLng = Number(origin.lng);
  const destLat = Number(destination.lat);
  const destLng = Number(destination.lng);

  if (
    isNaN(originLat) ||
    isNaN(originLng) ||
    isNaN(destLat) ||
    isNaN(destLng) ||
    originLat < -90 ||
    originLat > 90 ||
    destLat < -90 ||
    destLat > 90
  ) {
    throw new Error('Invalid coordinate format for road distance calculation.');
  }

  // 1. Try Google Routes API if GOOGLE_MAPS_API_KEY is configured
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (googleApiKey && googleApiKey.trim().length > 10) {
    try {
      const response = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': googleApiKey.trim(),
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: originLat, longitude: originLng } } },
            destination: { location: { latLng: { latitude: destLat, longitude: destLng } } },
            travelMode: 'DRIVE'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes[0] && typeof data.routes[0].distanceMeters === 'number') {
          return {
            distanceMeters: data.routes[0].distanceMeters,
            provider: 'google_routes'
          };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn(
          '[Logistics] Google Routes API returned status',
          response.status,
          errJson.error?.message || ''
        );
      }
    } catch (gErr) {
      console.warn('[Logistics] Google Routes API error, falling back to OSRM:', gErr.message);
    }
  }

  // 2. High-precision OSRM Driving Road Routing Engine
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
  try {
    const res = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'YNKPickles-LogisticsService/1.0' },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Routing service responded with status ${res.status}`);
    }

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      return {
        distanceMeters: data.routes[0].distanceMeters || data.routes[0].distance,
        provider: 'osrm'
      };
    } else if (data.code === 'NoRoute') {
      throw new Error('No practical driving road route found between Tanuku Circle boundary and delivery location.');
    } else {
      throw new Error(`Routing calculation failed: ${data.message || data.code}`);
    }
  } catch (osrmErr) {
    throw new Error(`Road distance calculation failed: ${osrmErr.message}`);
  }
};

/**
 * Calculates authoritative logistics quote according to business rules:
 * - Inside Tanuku Circle boundary => ₹0 (Free Delivery)
 * - Outside Tanuku Circle boundary => Road distance from nearest boundary point to destination in km × ₹10
 *
 * @param {{ latitude: number, longitude: number, address?: string }} coords
 * @returns {Promise<object>}
 */
export const calculateLogisticsQuote = async ({ latitude, longitude, address = '' }) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Valid GPS coordinates (latitude and longitude) are required.');
  }

  const RATE_PER_KM = 10;
  const isInside = isPointInTanukuCircle(lat, lng);

  // Scenario 1: Inside Tanuku Circle => ₹0 (Free Delivery)
  if (isInside) {
    return {
      success: true,
      isInside: true,
      circleName: 'Tanuku Circle',
      distanceKm: 0,
      ratePerKm: RATE_PER_KM,
      logisticsCharge: 0,
      deliveryStatus: 'FREE_DELIVERY',
      displayLabel: 'FREE DELIVERY',
      explanation: 'Delivery location is inside Tanuku Circle boundary. Logistics charge is ₹0.',
      destinationCoords: { lat, lng }
    };
  }

  // Scenario 2: Outside Tanuku Circle => Calculate road distance from nearest boundary point
  const nearestBoundaryPoint = findNearestPointOnBoundary(lat, lng);
  if (!nearestBoundaryPoint) {
    throw new Error('Unable to determine closest Tanuku Circle boundary point.');
  }

  const roadResult = await computeRoadDistanceMeters(nearestBoundaryPoint, { lat, lng });
  const rawKm = roadResult.distanceMeters / 1000;
  // Round distance to 1 decimal place (e.g. 9.2 km)
  const distanceKm = Math.round(rawKm * 10) / 10;
  // Calculate charge: Distance in km × ₹10
  const logisticsCharge = Math.round(distanceKm * RATE_PER_KM);

  return {
    success: true,
    isInside: false,
    circleName: 'Tanuku Circle',
    distanceKm,
    ratePerKm: RATE_PER_KM,
    logisticsCharge,
    deliveryStatus: 'OUTSIDE_CIRCLE',
    displayLabel: `₹${logisticsCharge} (${distanceKm} km outside Tanuku Circle)`,
    explanation: `Delivery location is ${distanceKm} km road distance outside Tanuku Circle boundary charged at ₹${RATE_PER_KM}/km.`,
    boundaryPoint: {
      lat: Number(nearestBoundaryPoint.lat.toFixed(6)),
      lng: Number(nearestBoundaryPoint.lng.toFixed(6))
    },
    destinationCoords: { lat, lng },
    routingProvider: roadResult.provider
  };
};
