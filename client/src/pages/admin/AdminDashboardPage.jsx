import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import {
  PackageCheck,
  AlertTriangle,
  Archive,
  Layers,
  PlusCircle,
  MessageCircle,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    inactiveProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminStats();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-gray-900">
            Inventory Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time product inventory overview derived directly from MongoDB.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Database Derived Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Products */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Products
            </span>
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-gray-900">
            {stats.activeProducts}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Visible on customer marketplace</p>
        </div>

        {/* In-Stock Products */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              In Stock
            </span>
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-emerald-600">
            {stats.inStockProducts}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Ready for instant ordering</p>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-red-600">
            {stats.outOfStockProducts}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Requires kitchen restocking</p>
        </div>

        {/* Inactive Products */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Inactive / Archived
            </span>
            <div className="p-2.5 bg-gray-100 text-gray-700 rounded-xl">
              <Archive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-display font-black text-gray-600">
            {stats.inactiveProducts}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Hidden from customers</p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm">
        <h2 className="text-base font-display font-bold text-gray-900 mb-4">
          Quick Management Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/products/new"
            className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/60 text-amber-900 font-bold text-xs transition"
          >
            <PlusCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p>Add New Product</p>
              <p className="text-[11px] font-normal text-amber-700">Upload image and configure units</p>
            </div>
          </Link>

          <Link
            to="/admin/stock"
            className="flex items-center gap-3 p-4 rounded-2xl bg-olive-50 hover:bg-olive-100/70 border border-olive-200/60 text-olive-900 font-bold text-xs transition"
          >
            <Layers className="w-5 h-5 text-olive-700 shrink-0" />
            <div>
              <p>Stock Management</p>
              <p className="text-[11px] font-normal text-olive-700">Update grams, kg, or jars inventory</p>
            </div>
          </Link>

          <Link
            to="/admin/settings/whatsapp"
            className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/60 text-emerald-900 font-bold text-xs transition"
          >
            <MessageCircle className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p>WhatsApp Settings</p>
              <p className="text-[11px] font-normal text-emerald-700">Change order recipient phone number</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
