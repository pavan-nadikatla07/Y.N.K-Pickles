import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingBag, AlertTriangle, Check, Info } from 'lucide-react';
import {
  formatCurrency,
  formatPriceBasisLabel,
  formatUnit,
  calculateItemSubtotal
} from '../../utils/pricing.js';
import { useCart } from '../../context/CartContext.jsx';

export const ProductCard = ({ product }) => {
  const { addToCart, loading } = useCart();

  const isAvailable = product.isActive && product.stockQuantity > 0 && product.isStockAvailable;
  const isGramUnit = product.measurementUnit === 'g';
  const increment =
    product.purchaseIncrement || (isGramUnit ? 100 : product.measurementUnit === 'piece' ? 1 : 0.5);
  const minQty = product.minPurchaseQty || (isGramUnit ? 100 : product.measurementUnit === 'piece' ? 1 : 0.25);

  const [quantity, setQuantity] = useState(minQty);
  const [inputVal, setInputVal] = useState(String(minQty));
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Synchronize when product changes
  useEffect(() => {
    setQuantity(minQty);
    setInputVal(String(minQty));
  }, [product._id]);

  // Handle manual input change
  const handleInputChange = (e) => {
    const raw = e.target.value;
    setInputVal(raw);

    if (raw === '') {
      setValidationError('Please enter a quantity.');
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed <= 0) {
      setValidationError('Please enter a valid positive quantity.');
      return;
    }

    if (parsed > product.stockQuantity) {
      setValidationError(`Exceeds stock of ${product.stockQuantity} ${product.measurementUnit}.`);
      return;
    }

    if (parsed < minQty) {
      setValidationError(`Minimum order is ${minQty} ${product.measurementUnit}.`);
      return;
    }

    setValidationError('');
    setQuantity(parsed);
  };

  const handleIncrement = () => {
    const next = Math.round((quantity + increment) * 100) / 100;
    if (next <= product.stockQuantity) {
      setQuantity(next);
      setInputVal(String(next));
      setValidationError('');
    }
  };

  const handleDecrement = () => {
    const prev = Math.round((quantity - increment) * 100) / 100;
    if (prev >= minQty) {
      setQuantity(prev);
      setInputVal(String(prev));
      setValidationError('');
    }
  };

  const handleAddToCart = async () => {
    const num = parseFloat(inputVal);
    if (isNaN(num) || num <= 0 || validationError || !isAvailable) return;
    await addToCart(product._id, num);
  };

  const currentSubtotal = calculateItemSubtotal(
    product,
    parseFloat(inputVal) > 0 ? parseFloat(inputVal) : 0
  );

  // Safe image fallback
  const fallbackImage =
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80';
  const displayImage = imageError || !product.imageUrl ? fallbackImage : product.imageUrl;

  return (
    <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] w-full bg-cream-100 overflow-hidden">
        <img
          src={displayImage}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-700/90 text-white backdrop-blur-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-600/95 text-white backdrop-blur-md shadow-xs">
              <AlertTriangle className="w-3 h-3" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Unit Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-gray-800 backdrop-blur-md uppercase tracking-wider shadow-xs">
            {product.measurementUnit}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display font-bold text-gray-900 text-lg leading-snug group-hover:text-mango-700 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-cream-100">
          {/* Price display with unit basis */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-gray-500 font-medium ml-1">
                / {product.priceBasisUnit || (product.priceBasis > 1 ? `${product.priceBasis} ${product.measurementUnit}` : product.measurementUnit)}
              </span>
            </div>

            {isAvailable && (
              <span className="text-[11px] text-gray-400 font-mono">
                Stock: {product.stockQuantity} {product.measurementUnit}
              </span>
            )}
          </div>

          {/* Manual Quantity Entry with Plus/Minus Shortcuts */}
          {isAvailable ? (
            <div className="space-y-2.5">
              {/* Quantity Input Group */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>Enter Quantity:</span>
                  {currentSubtotal > 0 && !validationError && (
                    <span className="font-bold text-olive-800">
                      Subtotal: {formatCurrency(currentSubtotal)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-cream-50 rounded-2xl p-1.5 border border-cream-200">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= minQty}
                    className="w-8 h-8 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-30 transition shadow-2xs shrink-0"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex-1 flex items-center justify-center relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={inputVal}
                      onChange={handleInputChange}
                      className="w-full text-center font-mono font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                    />
                    <span className="text-xs font-semibold text-gray-500 mr-2 shrink-0">
                      {product.measurementUnit}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={quantity + increment > product.stockQuantity}
                    className="w-8 h-8 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-30 transition shadow-2xs shrink-0"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {validationError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={loading || Boolean(validationError)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-mango-500 to-mango-600 hover:from-mango-600 hover:to-mango-700 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs hover:shadow transition active:scale-[0.99] text-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart ({formatCurrency(currentSubtotal)})</span>
              </button>
            </div>
          ) : (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-400 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span>Currently Unavailable</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
