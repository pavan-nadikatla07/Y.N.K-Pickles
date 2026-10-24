import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Tag,
  Layers,
  Check,
  X,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { formatCurrency, formatPriceBasisLabel } from '../../utils/pricing.js';

export const AdminProductsPage = () => {
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');

  // Quick Price Edit Modal State
  const [priceModalProduct, setPriceModalProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editBasis, setEditBasis] = useState('1');
  const [editBasisUnit, setEditBasisUnit] = useState('1kg');
  const [savingPrice, setSavingPrice] = useState(false);

  // Quick Stock Modal State
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  // Deletion Candidate Modal State
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle in progress ID
  const [togglingId, setTogglingId] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (unitFilter !== 'all') params.append('unit', unitFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getAdminProducts(qs);
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch products catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter, unitFilter]);

  // Open Quick Price Modal
  const openPriceModal = (product) => {
    setPriceModalProduct(product);
    setEditPrice(product.price.toString());
    setEditBasis((product.priceBasis || 1).toString());
    setEditBasisUnit(
      product.priceBasisUnit ||
        (product.measurementUnit === 'kg'
          ? '1kg'
          : product.measurementUnit === 'g'
          ? '100g'
          : 'piece')
    );
  };

  // Submit Quick Price Change
  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!priceModalProduct) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      error('Price must be a valid positive number greater than 0.');
      return;
    }

    const parsedBasis = parseFloat(editBasis);
    if (isNaN(parsedBasis) || parsedBasis <= 0) {
      error('Price basis quantity must be greater than 0.');
      return;
    }

    try {
      setSavingPrice(true);
      const res = await api.updateProductPrice(priceModalProduct._id, {
        price: parsedPrice,
        priceBasis: parsedBasis,
        priceBasisUnit: editBasisUnit.trim()
      });

      if (res.success) {
        success(
          `Price for "${priceModalProduct.name}" updated to ₹${parsedPrice} per ${editBasisUnit.trim()}. Saved to database!`
        );
        setPriceModalProduct(null);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to update price in database.');
    } finally {
      setSavingPrice(false);
    }
  };

  // Open Quick Stock Modal
  const openStockModal = (product) => {
    setStockModalProduct(product);
    setEditStock(product.stockQuantity.toString());
  };

  // Submit Quick Stock Change
  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    const parsedStock = parseFloat(editStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      error('Please enter a valid non-negative stock quantity.');
      return;
    }

    try {
      setSavingStock(true);
      const res = await api.updateStock(stockModalProduct._id, parsedStock);
      if (res.success) {
        success(
          `Stock for "${stockModalProduct.name}" updated to ${parsedStock} ${stockModalProduct.measurementUnit}.`
        );
        setStockModalProduct(null);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to update stock quantity.');
    } finally {
      setSavingStock(false);
    }
  };

  // Toggle Active/Inactive status
  const handleToggleActive = async (product) => {
    try {
      setTogglingId(product._id);
      const updated = !product.isActive;
      const data = await api.updateProduct(product._id, { isActive: updated });
      if (data.success) {
        success(
          `"${product.name}" marked as ${updated ? 'Active & Visible' : 'Inactive & Hidden'}.`
        );
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Could not update product status.');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      const data = await api.deleteProduct(deleteCandidate._id);
      if (data.success) {
        success(`Product "${deleteCandidate.name}" removed from database.`);
        setDeleteCandidate(null);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Could not delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions (Agrinex Command Pattern) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-black text-stone-900 tracking-tight">
              Products Catalog & Price Controls
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your South Indian pickles inventory, update prices with immediate database persistence, and adjust visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 transition shadow-2xs"
            title="Refresh Catalog Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/products/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-950/20 border border-amber-500/30 transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pickle</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar (Agrinex Filter Strip Pattern) */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by pickle name or slug..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Products' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
              { id: 'in_stock', label: 'In Stock' },
              { id: 'out_of_stock', label: 'Out of Stock' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Unit Filters */}
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

      {/* Products Table (Agrinex Data Table) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/90 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Pickle Product</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Live Price & Basis</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Marketplace Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>Loading products catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-stone-400">
                    <p className="text-sm font-bold text-stone-700">No products match the selected criteria.</p>
                    <p className="text-xs text-stone-400 mt-1">
                      Try clearing filters or search keywords.
                    </p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setUnitFilter('all');
                      }}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isOutOfStock = product.stockQuantity <= 0;
                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-amber-50/30 transition group"
                    >
                      {/* Product Name & Visual */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0 shadow-2xs"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 text-sm group-hover:text-amber-800 transition">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-stone-400 font-mono">/{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold uppercase px-2.5 py-1 bg-stone-100 text-stone-700 rounded-md border border-stone-200 text-[11px]">
                          {product.measurementUnit}
                        </span>
                      </td>

                      {/* Price & Basis (Clickable Quick Edit Trigger) */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => openPriceModal(product)}
                          className="flex items-center gap-2 group/price text-left p-1.5 -ml-1.5 rounded-xl hover:bg-amber-100/60 transition"
                          title="Click to edit price directly"
                        >
                          <div>
                            <span className="font-black text-stone-900 text-sm group-hover/price:text-amber-800 block">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium block">
                              per{' '}
                              {product.priceBasisUnit ||
                                (product.priceBasis > 1
                                  ? `${product.priceBasis} ${product.measurementUnit}`
                                  : product.measurementUnit)}
                            </span>
                          </div>
                          <span className="opacity-0 group-hover/price:opacity-100 p-1 rounded-md bg-amber-500 text-white transition text-[10px] font-bold">
                            <DollarSign className="w-3 h-3" />
                          </span>
                        </button>
                      </td>

                      {/* Available Stock */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => openStockModal(product)}
                          className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-stone-100 transition text-left"
                          title="Click to update stock"
                        >
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOutOfStock ? 'text-red-600' : 'text-stone-900'
                            }`}
                          >
                            {product.stockQuantity} {product.measurementUnit}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                            }`}
                          ></span>
                        </button>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          disabled={togglingId === product._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                            product.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                          }`}
                          title="Click to toggle visibility on customer store"
                        >
                          {togglingId === product._id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : product.isActive ? (
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-stone-500" />
                          )}
                          <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Price Edit Button */}
                          <button
                            onClick={() => openPriceModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200/80 transition"
                            title="Quick Edit Price"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                            <span>Edit Price</span>
                          </button>

                          {/* Full Edit Page Button */}
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                            title="Full Edit Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteCandidate(product)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* QUICK PRICE EDIT MODAL (Agrinex Modal Pattern) */}
      {priceModalProduct && (
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
                    Update Product Price
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Saves directly to MongoDB and updates customer marketplace instantly
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPriceModalProduct(null)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-xl hover:bg-stone-100 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Tag */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-3">
              <img
                src={priceModalProduct.imageUrl}
                alt={priceModalProduct.name}
                className="w-12 h-12 rounded-xl object-cover bg-stone-100 border border-amber-200 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-stone-900 text-xs truncate">
                  {priceModalProduct.name}
                </h4>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Current Database Price: <strong>{formatCurrency(priceModalProduct.price)}</strong> per{' '}
                  {priceModalProduct.priceBasisUnit || priceModalProduct.measurementUnit}
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
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="e.g. 350"
                    required
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Enter legitimate positive price. Decimals are supported (e.g. 35.50).
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
                    value={editBasis}
                    onChange={(e) => setEditBasis(e.target.value)}
                    placeholder="e.g. 1 or 100"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">e.g. 1 for kg, 100 for g</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Basis Unit Label *
                  </label>
                  <input
                    type="text"
                    value={editBasisUnit}
                    onChange={(e) => setEditBasisUnit(e.target.value)}
                    placeholder="e.g. 1kg, 100g, piece"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">Label shown to customer</p>
                </div>
              </div>

              {/* Dynamic Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                  Marketplace Display Preview
                </span>
                <span className="font-extrabold text-stone-900 text-sm">
                  {formatCurrency(parseFloat(editPrice) || 0)} per {editBasisUnit || priceModalProduct.measurementUnit}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPriceModalProduct(null)}
                  disabled={savingPrice}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPrice}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-900/30 transition active:scale-[0.99]"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingPrice ? 'Saving to Database...' : 'Save Price Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK EDIT MODAL */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-display font-black text-stone-900 text-base">
                  Update Stock Quantity
                </h3>
              </div>
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600">
              Product: <strong>{stockModalProduct.name}</strong>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Available Quantity ({stockModalProduct.measurementUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-bold text-stone-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalProduct(null)}
                  disabled={savingStock}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition"
                >
                  {savingStock ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Agrinex Destructive Pattern) */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-stone-200 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Delete Product?</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-800">{deleteCandidate.name}</strong>?
              This permanently removes the record from MongoDB. You can also deactivate it instead if you want to keep historical integrity.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
