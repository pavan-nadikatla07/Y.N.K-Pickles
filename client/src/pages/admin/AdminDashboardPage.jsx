import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  ShieldCheck,
  PackageCheck,
  AlertTriangle,
  Archive,
  Layers,
  PlusCircle,
  MessageCircle,
  RefreshCw,
  TrendingUp,
  Tag,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { formatCurrency, formatPriceBasisLabel } from '../../utils/pricing.js';

export const AdminDashboardPage = () => {
  const { success, error } = useToast();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    inactiveProducts: 0
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Price Edit Modal state
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [newBasis, setNewBasis] = useState('1');
  const [newBasisUnit, setNewBasisUnit] = useState('1kg');
  const [updatingPrice, setUpdatingPrice] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProducts('?limit=6')
      ]);

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
      if (productsRes.success && productsRes.products) {
        setRecentProducts(productsRes.products);
      }
    } catch (err) {
      error(err.message || 'Failed to load dashboard data from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Open Quick Edit Price Modal
  const openQuickPriceModal = (product) => {
    setQuickEditProduct(product);
    setNewPrice(product.price.toString());
    setNewBasis((product.priceBasis || 1).toString());
    setNewBasisUnit(product.priceBasisUnit || (product.measurementUnit === 'kg' ? '1kg' : product.measurementUnit === 'g' ? '100g' : 'piece'));
  };

  // Submit Quick Price Change to MongoDB
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!quickEditProduct) return;

    const parsedPrice = parseFloat(newPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      error('Price must be a valid positive number greater than 0.');
      return;
    }

    const parsedBasis = parseFloat(newBasis);
    if (isNaN(parsedBasis) || parsedBasis <= 0) {
      error('Price basis quantity must be greater than 0.');
      return;
    }

    try {
      setUpdatingPrice(true);
      const res = await api.updateProductPrice(quickEditProduct._id, {
        price: parsedPrice,
        priceBasis: parsedBasis,
        priceBasisUnit: newBasisUnit.trim()
      });

      if (res.success) {
        success(`Price updated to ₹${parsedPrice} per ${newBasisUnit.trim()}! Saved to MongoDB.`);
        setQuickEditProduct(null);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.message || 'Failed to update price in database.');
    } finally {
      setUpdatingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Agrinex Operations Command Center Pattern) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-950 via-amber-950 to-stone-900 text-white shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-700/20 border-2 border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-black tracking-tight text-white">
                  Operations Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/25 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  Store Administrator
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-300 mt-1">
                Real-Time MongoDB Inventory &bull; Immediate Price Controls &bull; Dynamic WhatsApp Dispatch
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-bold transition shadow-sm"
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>

            <Link
              to="/admin/products/new"
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-md shadow-amber-950/40 border border-amber-400/30 active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Pickle</span>
            </Link>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center p-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
              title="Open Customer Marketplace"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Metric Bar (Agrinex Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Products */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block">
              Total Catalog
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-stone-900">
            {stats.totalProducts}
          </div>
          <span className="text-[11px] text-stone-400 font-medium block mt-1">
            Pickle items in database
          </span>
        </div>

        {/* Active on Marketplace */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block">
              Marketplace Active
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <PackageCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-emerald-700">
            {stats.activeProducts}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Visible to customers
          </span>
        </div>

        {/* In Stock */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block">
              In Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-blue-700">
            {stats.inStockProducts}
          </div>
          <span className="text-[11px] text-blue-700 font-medium block mt-1">
            Ready for instant dispatch
          </span>
        </div>

        {/* Out of Stock */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block">
              Out of Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-red-600">
            {stats.outOfStockProducts}
          </div>
          <span className="text-[11px] text-red-600 font-semibold block mt-1">
            {stats.outOfStockProducts > 0 ? 'Requires restocking' : 'All items in stock'}
          </span>
        </div>

        {/* Inactive / Archived */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-sm transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-wider block">
              Archived / Inactive
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
              <Archive className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-black text-stone-600">
            {stats.inactiveProducts}
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            Hidden from store catalog
          </span>
        </div>
      </div>

      {/* Quick Management Actions Grid (Agrinex Action Tiles) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-display font-black text-stone-900">
              Quick Administrative Actions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Direct access to essential catalog and store configuration tools.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Action 1: Products & Pricing */}
          <Link
            to="/admin/products"
            className="group p-4 rounded-2xl bg-stone-50 hover:bg-amber-50/70 border border-stone-200/80 hover:border-amber-300 transition shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-800 transition">
              Products & Pricing
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Audit and edit product prices, measurement units, and statuses.
            </p>
          </Link>

          {/* Action 2: Add New Pickle */}
          <Link
            to="/admin/products/new"
            className="group p-4 rounded-2xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200/80 hover:border-emerald-300 transition shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition">
              Add New Pickle
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Upload pickle photography, set pricing basis, and define increments.
            </p>
          </Link>

          {/* Action 3: Stock Management */}
          <Link
            to="/admin/stock"
            className="group p-4 rounded-2xl bg-stone-50 hover:bg-blue-50/70 border border-stone-200/80 hover:border-blue-300 transition shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm group-hover:text-blue-800 transition">
              Stock & Inventory
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Adjust available kilograms, grams, and jars with real-time sync.
            </p>
          </Link>

          {/* Action 4: WhatsApp Settings */}
          <Link
            to="/admin/settings/whatsapp"
            className="group p-4 rounded-2xl bg-stone-50 hover:bg-emerald-50/70 border border-stone-200/80 hover:border-emerald-300 transition shadow-2xs hover:shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition">
              WhatsApp Dispatch
            </h3>
            <p className="text-[11px] text-stone-500 mt-1">
              Update destination phone number for incoming customer orders.
            </p>
          </Link>
        </div>
      </div>

      {/* Live Inventory & Quick Price Engine (Agrinex Data Table) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-display font-black text-stone-900">
                Live Catalog & Price Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Direct MongoDB Sync
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Change prices instantly. Updates reflect immediately on the customer marketplace.
            </p>
          </div>

          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/90 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-3 px-4 sm:px-6">Pickle Product</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Current Price / Basis</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Quick Price Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>Synchronizing database catalog...</span>
                  </td>
                </tr>
              ) : recentProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No products found in database.
                  </td>
                </tr>
              ) : (
                recentProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  return (
                    <tr key={p._id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 text-sm truncate">{p.name}</p>
                            <p className="text-[11px] text-stone-400 font-mono">/{p.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold uppercase px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md border border-stone-200 text-[11px]">
                          {p.measurementUnit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-stone-900 text-sm">
                            {formatCurrency(p.price)}
                          </span>
                          <span className="text-[11px] text-stone-500 font-medium">
                            / {p.priceBasisUnit || (p.priceBasis > 1 ? `${p.priceBasis} ${p.measurementUnit}` : p.measurementUnit)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold text-xs ${
                            isOutOfStock ? 'text-red-600' : 'text-stone-800'
                          }`}
                        >
                          {p.stockQuantity} {p.measurementUnit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openQuickPriceModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition active:scale-[0.98]"
                            title="Edit Price Immediately"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Edit Price</span>
                          </button>

                          <Link
                            to={`/admin/products/${p._id}/edit`}
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                            title="Full Product Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Price Edit Modal (Agrinex Modal Pattern) */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-stone-900 text-base">
                    Quick Price Edit
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Live updates to MongoDB with instant marketplace reflection
                  </p>
                </div>
              </div>

              <button
                onClick={() => setQuickEditProduct(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Tag */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
              <img
                src={quickEditProduct.imageUrl}
                alt={quickEditProduct.name}
                className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-amber-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-stone-900 text-xs truncate">
                  {quickEditProduct.name}
                </h4>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Current Price: <strong>{formatCurrency(quickEditProduct.price)}</strong> per{' '}
                  {quickEditProduct.priceBasisUnit || quickEditProduct.measurementUnit}
                </p>
              </div>
            </div>

            {/* Price Edit Form */}
            <form onSubmit={handleSavePrice} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  New Price (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 350"
                    required
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Enter positive price. Example: change from 300 to 350.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Basis Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBasis}
                    onChange={(e) => setNewBasis(e.target.value)}
                    placeholder="e.g. 1 or 100"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Basis Unit Label *
                  </label>
                  <input
                    type="text"
                    value={newBasisUnit}
                    onChange={(e) => setNewBasisUnit(e.target.value)}
                    placeholder="e.g. 1kg, 100g, piece"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                  Marketplace Display Preview
                </span>
                <span className="font-extrabold text-stone-900 text-sm">
                  {formatCurrency(parseFloat(newPrice) || 0)} per {newBasisUnit || quickEditProduct.measurementUnit}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  disabled={updatingPrice}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-900/30 transition active:scale-[0.99]"
                >
                  <Check className="w-4 h-4" />
                  <span>{updatingPrice ? 'Saving to Database...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
