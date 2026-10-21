import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { ProductCard } from '../../components/products/ProductCard.jsx';
import { Search, Filter, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const MarketplacePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedUnit !== 'all') params.append('unit', selectedUnit);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const data = await api.getProducts(queryString);

      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      setError(err.message || 'Unable to load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedUnit]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Warm Foodie Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-700 via-mango-700 to-olive-900 text-white p-8 sm:p-12 mb-10 shadow-lg">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-mango-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-mango-300" />
            Handcrafted with Heritage Spices
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-tight mb-4">
            Authentic South Indian Pickles Delivered Fresh
          </h1>
          <p className="text-sm sm:text-base text-cream-100 font-normal leading-relaxed mb-6">
            Sun-dried mangoes, organic gongura, stone-ground masalas, and pure cold-pressed oils. Order in seconds directly via WhatsApp.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mango, gongura, lemon, garlic..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-cream-200 text-sm focus:outline-none focus:ring-2 focus:ring-mango-500 focus:border-transparent transition shadow-sm"
          />
        </div>

        {/* Unit Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Pickles' },
            { id: 'kg', label: 'By Kilogram (kg)' },
            { id: 'g', label: 'By Grams (g)' },
            { id: 'piece', label: 'Jars / Pieces' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedUnit(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedUnit === tab.id
                  ? 'bg-olive-800 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-cream-100 border border-cream-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Content State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-cream-200 overflow-hidden p-4 space-y-4 animate-pulse"
            >
              <div className="aspect-[4/3] bg-cream-100 rounded-2xl"></div>
              <div className="h-5 bg-cream-100 rounded-md w-3/4"></div>
              <div className="h-4 bg-cream-100 rounded-md w-1/2"></div>
              <div className="h-10 bg-cream-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">Could not load marketplace</h3>
          <p className="text-xs text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 bg-olive-800 hover:bg-olive-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🥒
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
          <p className="text-xs text-gray-500 mb-4">
            Try adjusting your search keywords or unit filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedUnit('all');
            }}
            className="text-xs font-semibold text-mango-700 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
