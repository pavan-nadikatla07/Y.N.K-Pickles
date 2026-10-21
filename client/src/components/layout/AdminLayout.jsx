import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Layers,
  MessageCircle,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'All Products', path: '/admin/products', icon: Package },
    { name: 'Add Product', path: '/admin/products/new', icon: PlusCircle },
    { name: 'Stock Management', path: '/admin/stock', icon: Layers },
    { name: 'WhatsApp Settings', path: '/admin/settings/whatsapp', icon: MessageCircle }
  ];

  const isActive = (path) => {
    if (path === '/admin/products') {
      return location.pathname === '/admin/products';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-800">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-olive-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-mango-400" />
          <span className="font-display font-bold text-sm tracking-wide">YNK Admin Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-olive-900 text-white"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-64 bg-olive-950 text-cream-100 flex flex-col justify-between p-5 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-olive-900/60">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mango-500 to-mango-600 flex items-center justify-center text-white font-extrabold font-display shadow">
              YNK
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm">YNK Pickles</div>
              <div className="text-[10px] text-olive-400 uppercase tracking-widest font-semibold">
                Administrator
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-mango-600 text-white shadow-sm'
                      : 'text-cream-200/80 hover:bg-olive-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 border-t border-olive-900/60 space-y-3">
          <div className="px-3.5 py-2 rounded-xl bg-olive-900/40 text-xs">
            <p className="font-bold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-olive-400 font-mono">+{user?.phone}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>

          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between text-[11px] text-olive-400 hover:text-white px-3.5 py-1 transition"
          >
            <span>Customer Storefront</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};
