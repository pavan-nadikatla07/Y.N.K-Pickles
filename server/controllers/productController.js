import { Product } from '../models/Product.js';

/**
 * Get active products for customer marketplace
 * Displays active products with availability status derived from stock.
 */
export const getActiveProducts = async (req, res, next) => {
  try {
    const { search, unit } = req.query;

    const filter = { isActive: true };

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (unit && ['kg', 'g', 'piece'].includes(unit)) {
      filter.measurementUnit = unit;
    }

    const products = await Product.find(filter)
      .sort({ isStockAvailable: -1, createdAt: -1 })
      .lean();

    // Map availability accurately
    const formatted = products.map((p) => ({
      ...p,
      isStockAvailable: p.stockQuantity > 0 && p.isStockAvailable !== false
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      products: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single active product by ID or slug
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const filter = isObjectId ? { _id: id, isActive: true } : { slug: id, isActive: true };

    const product = await Product.findOne(filter).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable.'
      });
    }

    res.status(200).json({
      success: true,
      product: {
        ...product,
        isStockAvailable: product.stockQuantity > 0 && product.isStockAvailable !== false
      }
    });
  } catch (error) {
    next(error);
  }
};
