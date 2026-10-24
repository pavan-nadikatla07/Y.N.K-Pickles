import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Layers,
  Check,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Ban,
  PackageCheck,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';

export const AdminStockPage = () => {
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');

  const [savingId, setSavingId] = useState(null);
  const [togglingActiveId, setTogglingActiveId] = useState(null);
  const [stockInputs, setStockInputs] = useState({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminProducts();
      if (data.success && data.products) {
        setProducts(data.products);
        const initialMap = {};
        data.products.forEach((p) => {
          initialMap[p._id] = p.stockQuantity;
        });
        setStockInputs(initialMap);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch inventory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockChange = (productId, val) => {
    setStockInputs((prev) => ({ ...prev, [productId]: val }));
  };

  const handleAdjustStock = (product, delta) => {
    const current = parseFloat(stockInputs[product._id] ?? product.stockQuantity) || 0;
    const nextVal = Math.max(0, current + delta);
    setStockInputs((prev) => ({ ...prev, [product._id]: nextVal }));
  };

  const handleSetZeroStock = (product) => {
    setStockInputs((prev) => ({ ...prev, [product._id]: 0 }));
  };

  const handleSaveStock = async (product) => {
    const newQty = parseFloat(stockInputs[product._id]);
    if (isNaN(newQty) || newQty < 0) {
      error('Please enter a valid non-negative stock quantity.');
      return;
    }

    try {
      setSavingId(product._id);
      const data = await api.updateStock(product._id, newQty);
      if (data.success) {
        success(
          `Stock for "${product.name}" updated to ${newQty} ${product.measurementUnit} (saved in MongoDB).`
        );
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to update stock quantity.');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      setTogglingActiveId(product._id);
      const updated = !product.isActive;
      const data = await api.updateProduct(product._id, { isActive: updated });
      if (data.success) {
        success(
          `"${product.name}" is now ${updated ? 'Active & Discoverable' : 'Inactive & Hidden'}.`
        );
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Could not update active status.');
    } finally {
      setTogglingActiveId(null);
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchesUnit = unitFilter === 'all' || p.measurementUnit === unitFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'in_stock') matchesStock = p.stockQuantity > 0;
    if (stockStatusFilter === 'out_of_stock') matchesStock = p.stockQuantity <= 0;
    if (stockStatusFilter === 'low_stock') {
      const threshold = p.measurementUnit === 'g' ? 500 : 5;
      matchesStock = p.stockQuantity > 0 && p.stockQuantity <= threshold;
    }

    return matchesSearch && matchesUnit && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header (Agrinex Command Pattern) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-black text-stone-900 tracking-tight">
              Stock & Inventory Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
              Live Stock
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time kitchen storage levels. Zero stock automatically disables customer purchase on storefront.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition shadow-2xs"
          title="Refresh Stock Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by pickle name..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Inventory' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'low_stock', label: 'Low Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStockStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  stockStatusFilter === f.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unit Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            Unit:
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'kg', label: 'Kilograms (kg)' },
              { id: 'g', label: 'Grams (g)' },
              { id: 'piece', label: 'Pieces/Jars' }
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setUnitFilter(u.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  unitFilter === u.id
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Cards Grid (Agrinex Card Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
            <span>Loading inventory records...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-3xl border border-stone-200">
            <p className="text-sm font-bold text-stone-700">No products match current stock filters.</p>
            <button
              onClick={() => {
                setSearch('');
                setUnitFilter('all');
                setStockStatusFilter('all');
              }}
              className="mt-3 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((product) => {
            const currentVal = stockInputs[product._id];
            const parsedCurrentVal = parseFloat(currentVal);
            const hasChanged =
              !isNaN(parsedCurrentVal) && parsedCurrentVal !== product.stockQuantity;
            const isOutOfStock = product.stockQuantity <= 0;
            const deltaStep = product.measurementUnit === 'g' ? 500 : 5;

            return (
              <div
                key={product._id}
                className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  isOutOfStock
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-100'
                    : 'border-stone-200/90'
                }`}
              >
                {/* Card Top: Visual & Identity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-2xl object-cover bg-stone-100 border border-stone-200 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] border border-stone-200">
                          {product.measurementUnit}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          /{product.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(product)}
                    disabled={togglingActiveId === product._id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition shrink-0 ${
                      product.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
                        : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                    }`}
                    title="Click to toggle marketplace discovery"
                  >
                    {product.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-stone-500" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Stock Status Indicator Bar */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Current Database Stock
                    </span>
                    <span
                      className={`text-base font-black font-mono ${
                        isOutOfStock ? 'text-red-600' : 'text-stone-900'
                      }`}
                    >
                      {product.stockQuantity} {product.measurementUnit}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : product.stockQuantity <= (product.measurementUnit === 'g' ? 500 : 5)
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isOutOfStock
                      ? 'Out of Stock'
                      : product.stockQuantity <= (product.measurementUnit === 'g' ? 500 : 5)
                      ? 'Low Stock Alert'
                      : 'Plentiful'}
                  </span>
                </div>

                {/* Quick Adjustment Controls */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-stone-500">Quick Steps:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(product, -deltaStep)}
                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition"
                    >
                      -{deltaStep} {product.measurementUnit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(product, deltaStep)}
                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition"
                    >
                      +{deltaStep} {product.measurementUnit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetZeroStock(product)}
                      className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold transition ml-auto"
                      title="Set stock to 0"
                    >
                      Mark 0 Stock
                    </button>
                  </div>

                  {/* Quantity Input & Save Button */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-600">New Quantity:</span>
                      <input
                        type="number"
                        min="0"
                        value={currentVal !== undefined ? currentVal : ''}
                        onChange={(e) => handleStockChange(product._id, e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs font-mono font-bold text-stone-500">
                        {product.measurementUnit}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSaveStock(product)}
                      disabled={savingId === product._id || !hasChanged}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                        hasChanged
                          ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingId === product._id ? 'Saving...' : 'Save Stock'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
