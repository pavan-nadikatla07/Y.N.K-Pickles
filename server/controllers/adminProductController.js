import { Product } from '../models/Product.js';
import fs from 'fs';
import path from 'path';

/**
 * Utility to generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Get Admin Dashboard Overview Statistics
 * Strictly based on database inventory (no fake sales/orders)
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [totalProducts, activeProducts, inStockProducts, outOfStockProducts, inactiveProducts] =
      await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Product.countDocuments({ isActive: true, stockQuantity: { $gt: 0 } }),
        Product.countDocuments({ isActive: true, stockQuantity: { $lte: 0 } }),
        Product.countDocuments({ isActive: false })
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        inStockProducts,
        outOfStockProducts,
        inactiveProducts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all products (with filters)
 */
export const getAllProductsAdmin = async (req, res, next) => {
  try {
    const { search, status, unit } = req.query;
    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (status === 'out_of_stock') {
      filter.isActive = true;
      filter.stockQuantity = { $lte: 0 };
    }
    if (status === 'in_stock') {
      filter.isActive = true;
      filter.stockQuantity = { $gt: 0 };
    }

    if (unit && ['kg', 'g', 'piece'].includes(unit)) {
      filter.measurementUnit = unit;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get single product by ID (regardless of active status)
 */
export const getProductByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Create a new product
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      measurementUnit,
      price,
      priceBasis,
      priceBasisUnit,
      stockQuantity,
      minPurchaseQty,
      purchaseIncrement,
      isActive
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    if (!measurementUnit || !['kg', 'g', 'piece'].includes(measurementUnit)) {
      return res.status(400).json({
        success: false,
        message: 'Valid measurement unit (kg, g, or piece) is required.'
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number.'
      });
    }

    const parsedBasis = parseFloat(priceBasis) || 1;
    if (parsedBasis <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price basis must be greater than 0.'
      });
    }

    const parsedStock = parseFloat(stockQuantity) || 0;
    if (parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity cannot be negative.'
      });
    }

    // Handle image file or URL
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Product image is required.'
      });
    }

    // Generate unique slug
    let baseSlug = generateSlug(name);
    if (!baseSlug) baseSlug = `product-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const product = new Product({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      imageUrl,
      measurementUnit,
      price: parsedPrice,
      priceBasis: parsedBasis,
      priceBasisUnit: priceBasisUnit || (measurementUnit === 'kg' ? '1kg' : measurementUnit === 'g' ? '100g' : 'piece'),
      stockQuantity: parsedStock,
      isStockAvailable: parsedStock > 0,
      minPurchaseQty: parseFloat(minPurchaseQty) || 1,
      purchaseIncrement: parseFloat(purchaseIncrement) || 1,
      isActive: isActive === undefined ? true : String(isActive) === 'true' || isActive === true
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update existing product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    const {
      name,
      description,
      measurementUnit,
      price,
      priceBasis,
      priceBasisUnit,
      stockQuantity,
      minPurchaseQty,
      purchaseIncrement,
      isActive
    } = req.body;

    if (name && name.trim()) {
      product.name = name.trim();
      // If name changed, update slug
      const newSlug = generateSlug(name);
      if (newSlug !== product.slug) {
        let slug = newSlug;
        let counter = 1;
        while (await Product.findOne({ slug, _id: { $ne: product._id } })) {
          slug = `${newSlug}-${counter++}`;
        }
        product.slug = slug;
      }
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (measurementUnit && ['kg', 'g', 'piece'].includes(measurementUnit)) {
      product.measurementUnit = measurementUnit;
    }

    if (price !== undefined && price !== null && price !== '') {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price cannot be negative or invalid.' });
      }
      if (parsedPrice === 0) {
        return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
      }
      product.price = parsedPrice;
    }

    if (priceBasis !== undefined && priceBasis !== null && priceBasis !== '') {
      const parsedBasis = parseFloat(priceBasis);
      if (isNaN(parsedBasis) || parsedBasis <= 0) {
        return res.status(400).json({ success: false, message: 'Price basis must be > 0.' });
      }
      product.priceBasis = parsedBasis;
    }

    if (priceBasisUnit && typeof priceBasisUnit === 'string' && priceBasisUnit.trim()) {
      product.priceBasisUnit = priceBasisUnit.trim();
    }

    if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== '') {
      const parsedStock = parseFloat(stockQuantity);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ success: false, message: 'Stock cannot be negative.' });
      }
      product.stockQuantity = parsedStock;
      product.isStockAvailable = parsedStock > 0;
    }

    if (minPurchaseQty !== undefined && minPurchaseQty !== null && minPurchaseQty !== '') {
      product.minPurchaseQty = Math.max(1, parseFloat(minPurchaseQty) || 1);
    }

    if (purchaseIncrement !== undefined && purchaseIncrement !== null && purchaseIncrement !== '') {
      product.purchaseIncrement = Math.max(1, parseFloat(purchaseIncrement) || 1);
    }

    if (isActive !== undefined) {
      product.isActive = String(isActive) === 'true' || isActive === true;
    }

    // If new image uploaded
    if (req.file) {
      // Optional: clean up old local image file if inside uploads/
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        const oldPath = path.resolve(process.cwd(), product.imageUrl.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (e) {
            console.warn('Could not delete old image file:', e.message);
          }
        }
      }
      product.imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      product.imageUrl = req.body.imageUrl;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update product price directly (atomic operation)
 */
export const updateProductPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, priceBasis, priceBasisUnit } = req.body;

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: 'Price is required.' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative or invalid.' });
    }
    if (parsedPrice === 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than 0.' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    product.price = parsedPrice;

    if (priceBasis !== undefined && priceBasis !== null && priceBasis !== '') {
      const parsedBasis = parseFloat(priceBasis);
      if (isNaN(parsedBasis) || parsedBasis <= 0) {
        return res.status(400).json({ success: false, message: 'Price basis must be greater than 0.' });
      }
      product.priceBasis = parsedBasis;
    }

    if (priceBasisUnit && typeof priceBasisUnit === 'string' && priceBasisUnit.trim()) {
      product.priceBasisUnit = priceBasisUnit.trim();
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: `Price for "${product.name}" updated to ₹${product.price} per ${product.priceBasisUnit || product.measurementUnit}.`,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Update stock quantity directly
 */
export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    const parsedStock = parseFloat(stockQuantity);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative stock quantity is required.'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    product.stockQuantity = parsedStock;
    product.isStockAvailable = parsedStock > 0;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Stock updated to ${product.stockQuantity} ${product.measurementUnit}.`,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Delete product with safety confirmation
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.'
      });
    }

    // Clean up local uploaded image if exists
    if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
      const imgPath = path.resolve(process.cwd(), product.imageUrl.replace(/^\//, ''));
      if (fs.existsSync(imgPath)) {
        try {
          fs.unlinkSync(imgPath);
        } catch (e) {
          console.warn('Could not remove product image file:', e.message);
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
