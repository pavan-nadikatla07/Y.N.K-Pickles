import { calculateLogisticsQuote } from '../utils/logisticsService.js';

/**
 * Endpoint to calculate authoritative delivery logistics charges
 * Supports POST /api/v1/logistics/quote and GET /api/v1/logistics/quote
 */
export const getLogisticsQuote = async (req, res) => {
  try {
    const lat = req.body?.latitude ?? req.query?.lat ?? req.query?.latitude;
    const lng = req.body?.longitude ?? req.query?.lng ?? req.query?.longitude;
    const address = req.body?.address ?? req.query?.address ?? '';

    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return res.status(400).json({
        success: false,
        message: 'Delivery coordinates (latitude and longitude) are required to calculate logistics charges.'
      });
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude value provided.'
      });
    }

    const quote = await calculateLogisticsQuote({
      latitude: numLat,
      longitude: numLng,
      address: String(address).trim()
    });

    return res.status(200).json(quote);
  } catch (error) {
    console.error('[LogisticsController Error]:', error.message);

    // Differentiate between user-recoverable route issues and internal errors
    const isRouteError =
      error.message.includes('No practical driving road route') ||
      error.message.includes('boundary data is unavailable');

    return res.status(isRouteError ? 422 : 500).json({
      success: false,
      message: error.message || 'Failed to calculate logistics charge.'
    });
  }
};
