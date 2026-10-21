import React, { useState } from 'react';
import { Plus, Minus, ShoppingBag, AlertTriangle, Check } from 'lucide-react';
import { formatCurrency, formatPriceBasisLabel, formatUnit } from '../../utils/pricing.js';
import { useCart } from '../../context/CartContext.jsx';

export const ProductCard = ({ product }) => {
  const { addToCart, loading } = useCart();

  const isAvailable = product.isActive && product.stockQuantity > 0 && product.isStockAvailable;
  const increment = product.purchaseIncrement || (product.measurementUnit === 'g' ? 100 : 1);
  const minQty = product.minPurchaseQty || increment;

  const [quantity, setQuantity] = useState(minQty);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleIncrement = () => {
    if (quantity + increment <= product.stockQuantity) {
      setQuantity((prev) => prev + increment);
    }
  };

  const handleDecrement = () => {
    if (quantity - increment >= minQty) {
      setQuantity((prev) => prev - increment);
    }
  };

  const handleAddToCart = async () => {
    if (!isAvailable) return;
    await addToCart(product._id, quantity);
  };

  // Safe image fallback
  const fallbackImage =
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80';
  const displayImage = imageError || !product.imageUrl ? fallbackImage : product.imageUrl;

  return (
    <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-700/90 text-white backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-600/95 text-white backdrop-blur-md shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Unit Tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 text-gray-800 backdrop-blur-md uppercase tracking-wider shadow-sm">
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
          <div className="flex items-baseline justify-between mb-3">
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
                Available: {product.stockQuantity} {product.measurementUnit}
              </span>
            )}
          </div>

          {/* Quantity Controls & Add to Cart */}
          {isAvailable ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-cream-50 rounded-xl p-1 border border-cream-200">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= minQty}
                  className="w-8 h-8 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-40 transition shadow-sm"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-bold text-gray-900 font-mono">
                  {formatUnit(quantity, product.measurementUnit)}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity + increment > product.stockQuantity}
                  className="w-8 h-8 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-40 transition shadow-sm"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-mango-500 to-mango-600 hover:from-mango-600 hover:to-mango-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
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
