import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Layers, Check, AlertTriangle, Search, RefreshCw } from 'lucide-react';

export const AdminStockPage = () => {
  const { success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
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
      error(err.message || 'Failed to fetch inventory.');
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

  const handleUpdateStock = async (product) => {
    const newQty = parseFloat(stockInputs[product._id]);
    if (isNaN(newQty) || newQty < 0) {
      error('Please enter a valid non-negative stock quantity.');
      return;
    }

    try {
      setSavingId(product._id);
      const data = await api.updateStock(product._id, newQty);
      if (data.success) {
        success(`Updated stock for ${product.name} to ${newQty} ${product.measurementUnit}`);
        fetchProducts();
      }
    } catch (err) {
      error(err.message || 'Failed to update stock.');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-gray-900">
            Stock & Inventory Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Quickly adjust available kilograms, grams, and jar quantities. Stock is validated in real-time.
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by pickle name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mango-500"
          />
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-gray-400">
            Loading inventory items...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-xs text-gray-400">
            No products found.
          </div>
        ) : (
          filtered.map((product) => {
            const currentVal = stockInputs[product._id];
            const hasChanged = parseFloat(currentVal) !== product.stockQuantity;
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <div
                key={product._id}
                className={`bg-white rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between ${
                  isOutOfStock ? 'border-red-200 bg-red-50/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-14 h-14 rounded-2xl object-cover bg-gray-100 shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {product.measurementUnit}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      Status:{' '}
                      {isOutOfStock ? (
                        <span className="text-red-600 font-bold">Out of Stock (0 {product.measurementUnit})</span>
                      ) : (
                        <span className="text-emerald-700 font-bold">
                          In Stock ({product.stockQuantity} {product.measurementUnit})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">New Quantity:</span>
                    <input
                      type="number"
                      min="0"
                      value={currentVal !== undefined ? currentVal : ''}
                      onChange={(e) => handleStockChange(product._id, e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-mango-500"
                    />
                    <span className="text-xs font-mono text-gray-500">{product.measurementUnit}</span>
                  </div>

                  <button
                    onClick={() => handleUpdateStock(product)}
                    disabled={savingId === product._id || !hasChanged}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                      hasChanged
                        ? 'bg-olive-800 hover:bg-olive-900 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingId === product._id ? 'Saving...' : 'Update'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
