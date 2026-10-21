import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatPriceBasisLabel } from '../../utils/pricing.js';

export const AdminProductsPage = () => {
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Deletion Confirmation modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getAdminProducts(qs);
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      error(err.message || 'Failed to fetch products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter]);

  const handleToggleActive = async (product) => {
    try {
      const updated = !product.isActive;
      const data = await api.updateProduct(product._id, { isActive: updated });
      if (data.success) {
        success(`Product ${updated ? 'activated' : 'deactivated'}.`);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Could not update product status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      const data = await api.deleteProduct(deleteCandidate._id);
      if (data.success) {
        success('Product deleted successfully.');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-gray-900">Products Catalog</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your store's pickles, weights, pricing bases, and active status.
          </p>
        </div>

        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-mango-600 hover:bg-mango-700 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Pickle</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'active', 'inactive', 'out_of_stock'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Price / Basis</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading products catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                        {product.measurementUnit}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {formatPriceBasisLabel(
                        product.price,
                        product.priceBasis,
                        product.priceBasisUnit,
                        product.measurementUnit
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          product.stockQuantity <= 0 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {product.stockQuantity} {product.measurementUnit}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          product.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {product.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-500" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteCandidate(product)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-xl border border-gray-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Product?</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to delete <strong className="text-gray-800">{deleteCandidate.name}</strong>?
              This action cannot be undone. Consider deactivating instead if customers have it in active carts.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl"
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
