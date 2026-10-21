import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { calculateCartDetails } from '../utils/pricing.js';

/**
 * Get customer cart with authoritative price and stock calculations
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ customer: req.user._id, items: [] });
    }

    // Filter out null products (in case product was deleted)
    const validItems = cart.items.filter((item) => Boolean(item.product));
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    const cartCalculation = calculateCartDetails(cart.items);

    res.status(200).json({
      success: true,
      cart: {
        id: cart._id,
        items: cartCalculation.items,
        grandTotal: cartCalculation.grandTotal,
        hasIssues: cartCalculation.hasIssues,
        issues: cartCalculation.issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or increment item in customer cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const qtyToAdd = parseFloat(quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is unavailable.'
      });
    }

    if (product.stockQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: `"${product.name}" is currently out of stock.`
      });
    }

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    let newTotalQty = qtyToAdd;
    if (existingIndex > -1) {
      newTotalQty = cart.items[existingIndex].quantity + qtyToAdd;
      if (newTotalQty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Available stock for "${product.name}" is ${product.stockQuantity} ${product.measurementUnit}.`
        });
      }
      cart.items[existingIndex].quantity = newTotalQty;
    } else {
      if (newTotalQty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock of ${product.stockQuantity} ${product.measurementUnit}.`
        });
      }
      cart.items.push({
        product: productId,
        quantity: newTotalQty
      });
    }

    await cart.save();
    await cart.populate('items.product');

    const cartCalculation = calculateCartDetails(cart.items);

    res.status(200).json({
      success: true,
      message: `Added ${product.name} to cart.`,
      cart: {
        id: cart._id,
        items: cartCalculation.items,
        grandTotal: cartCalculation.grandTotal,
        hasIssues: cartCalculation.hasIssues,
        issues: cartCalculation.issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update quantity of a product in cart
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const newQty = parseFloat(quantity);
    if (isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required.' });
    }

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingIndex === -1) {
      return res.status(404).json({ success: false, message: 'Product not in cart.' });
    }

    if (newQty === 0) {
      // Remove item
      cart.items.splice(existingIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Product is no longer active.'
        });
      }
      if (newQty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot exceed available stock of ${product.stockQuantity} ${product.measurementUnit}.`
        });
      }
      cart.items[existingIndex].quantity = newQty;
    }

    await cart.save();
    await cart.populate('items.product');

    const cartCalculation = calculateCartDetails(cart.items);

    res.status(200).json({
      success: true,
      cart: {
        id: cart._id,
        items: cartCalculation.items,
        grandTotal: cartCalculation.grandTotal,
        hasIssues: cartCalculation.hasIssues,
        issues: cartCalculation.issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from the cart
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId.toString());

    await cart.save();
    await cart.populate('items.product');

    const cartCalculation = calculateCartDetails(cart.items);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      cart: {
        id: cart._id,
        items: cartCalculation.items,
        grandTotal: cartCalculation.grandTotal,
        hasIssues: cartCalculation.hasIssues,
        issues: cartCalculation.issues
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all items from cart
 */
export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
      cart: {
        items: [],
        grandTotal: 0,
        hasIssues: false,
        issues: []
      }
    });
  } catch (error) {
    next(error);
  }
};
