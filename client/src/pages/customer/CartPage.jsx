import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { formatCurrency, formatPriceBasisLabel, formatUnit } from '../../utils/pricing.js';

export const CartPage = () => {
  const { cart, grandTotal, hasIssues, issues, updateQuantity, removeItem, clearCart, loading } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-mango-100 text-mango-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Please Log In</h2>
        <p className="text-sm text-gray-600 mb-6">
          Log in with your phone number to access your saved cart and place WhatsApp orders.
        </p>
        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full py-3 px-4 bg-mango-600 hover:bg-mango-700 text-white font-bold rounded-2xl shadow transition"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="block w-full py-3 px-4 bg-white hover:bg-cream-100 text-gray-700 font-bold rounded-2xl border border-cream-200 transition"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-cream-100 text-mango-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 mb-6">
          Explore our handcrafted South Indian pickles and add your favorites!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-olive-800 hover:bg-olive-900 text-white font-bold rounded-2xl transition shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Explore Marketplace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review your selected pickles and quantities before ordering via WhatsApp.
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium"
        >
          Clear Cart
        </button>
      </div>

      {/* Stock warning alert */}
      {hasIssues && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <strong className="font-bold">Cart Stock Updates:</strong>
            {issues.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-4 mb-8">
        {cart.items.map((item) => {
          const p = item.product;
          const increment = p.purchaseIncrement || (p.measurementUnit === 'g' ? 100 : 1);
          const minQty = p.minPurchaseQty || increment;
          const isStockExceeded = item.quantity > p.stockQuantity;

          return (
            <div
              key={p._id}
              className={`bg-white rounded-3xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-sm ${
                item.hasStockIssue ? 'border-amber-300 bg-amber-50/30' : 'border-cream-200'
              }`}
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-cream-100 shrink-0"
                />
                <div>
                  <h3 className="font-display font-bold text-gray-900 text-base leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unit Price:{' '}
                    <span className="font-semibold text-gray-700">
                      {formatPriceBasisLabel(
                        p.price,
                        p.priceBasis,
                        p.priceBasisUnit,
                        p.measurementUnit
                      )}
                    </span>
                  </p>

                  {item.hasStockIssue && (
                    <span className="inline-block mt-1 text-[11px] font-bold text-amber-700">
                      ⚠️ {item.stockIssueReason} (Available: {p.stockQuantity} {p.measurementUnit})
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-cream-100">
                {/* Quantity Box */}
                <div className="flex items-center gap-2 bg-cream-100 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(p._id, item.quantity - increment)}
                    disabled={loading || item.quantity <= minQty}
                    className="w-7 h-7 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-40 transition shadow-sm"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-xs font-bold text-gray-900 px-2 font-mono">
                    {formatUnit(item.quantity, p.measurementUnit)}
                  </span>

                  <button
                    onClick={() => updateQuantity(p._id, item.quantity + increment)}
                    disabled={loading || item.quantity + increment > p.stockQuantity}
                    className="w-7 h-7 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-cream-200 disabled:opacity-40 transition shadow-sm"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[90px]">
                  <p className="text-xs text-gray-400">Subtotal</p>
                  <p className="text-base font-black text-gray-900">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(p._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Card */}
      <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-sm">
        <div className="flex items-center justify-between py-2 text-sm text-gray-600">
          <span>Items Selected:</span>
          <span className="font-bold text-gray-900">{cart.items.length} items</span>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-cream-200 text-lg">
          <span className="font-display font-bold text-gray-900">Estimated Total:</span>
          <span className="text-2xl font-black text-olive-800">{formatCurrency(grandTotal)}</span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-cream-100 hover:bg-cream-200 text-gray-700 font-bold text-sm text-center transition"
          >
            Continue Shopping
          </Link>

          <button
            onClick={() => navigate('/checkout')}
            disabled={cart.items.length === 0 || hasIssues}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-mango-500 to-mango-600 hover:from-mango-600 hover:to-mango-700 disabled:opacity-50 text-white font-bold text-sm shadow hover:shadow-md transition"
          >
            <span>Proceed to Order Review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {hasIssues && (
          <p className="text-xs text-red-600 font-medium text-center mt-3">
            Please resolve the out-of-stock or excessive quantities above to proceed.
          </p>
        )}
      </div>
    </div>
  );
};
