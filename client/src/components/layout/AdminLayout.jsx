import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Layers,
  MessageCircle,
  Mail,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  CheckCircle2,
  ChevronRight,
  Sparkles
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
    {
      name: 'Operations Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      name: 'Products & Pricing',
      path: '/admin/products',
      icon: Package,
      badge: 'Core'
    },
    {
      name: 'Add New Pickle',
      path: '/admin/products/new',
      icon: PlusCircle
    },
    {
      name: 'Stock Management',
      path: '/admin/stock',
      icon: Layers
    },
    {
      name: 'WhatsApp Settings',
      path: '/admin/settings/whatsapp',
      icon: MessageCircle
    },
    {
      name: 'Email / SMTP Settings',
      path: '/admin/settings/email',
      icon: Mail
    },
    {
      name: 'Admin Profile Settings',
      path: '/admin/profile',
      icon: User
    }
  ];

  const isActive = (path) => {
    if (path === '/admin/products') {
      return location.pathname === '/admin/products';
    }
    return location.pathname.startsWith(path);
  };

  // Get current active title
  const currentNav = navItems.find((item) => isActive(item.path)) || {
    name: location.pathname.includes('/edit') ? 'Edit Product' : 'Admin Portal'
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header (Agrinex Command Bar) */}
      <header className="md:hidden bg-gradient-to-r from-stone-950 via-amber-950 to-stone-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-wide flex items-center gap-1.5">
              <span>YNK Admin</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/20">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-stone-300">Operations Command</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation (Agrinex Structure) */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-72 bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950/95 text-stone-200 flex flex-col justify-between p-5 border-r border-stone-800 shadow-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Admin Header with Brand & Badge */}
          <div className="pb-5 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white font-extrabold font-display shadow-md shadow-amber-900/30 border border-amber-400/40">
                <span className="text-base tracking-tight">YNK</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display font-black text-white text-base tracking-tight truncate">
                    YNK Pickles
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Admin Portal
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-3 font-medium">
              Operations &bull; Live Price Engine &bull; Inventory
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-3 pb-1">
              Store Management
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                    active
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-950/40 border border-amber-500/40'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        active ? 'text-amber-200' : 'text-stone-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        active
                          ? 'bg-amber-800/80 text-amber-100'
                          : 'bg-stone-800 text-stone-400 group-hover:bg-stone-700 group-hover:text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition ${
                        active ? 'opacity-100 text-amber-200' : 'text-stone-500'
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section (Admin Identity & Actions) */}
        <div className="pt-4 border-t border-stone-800 space-y-3">
          {/* Admin User Profile Pill */}
          <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-white truncate">
                  {user?.name || 'Administrator'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                +{user?.phone || '919876543210'}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-amber-300 border border-stone-700 uppercase">
              Root
            </span>
          </div>

          {/* Storefront Link (Opens in new tab) */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs font-semibold text-stone-300 hover:text-amber-300 px-3 py-2 rounded-xl bg-stone-900/50 hover:bg-stone-800/80 border border-stone-800/80 transition group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Storefront</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-300 transition" />
          </Link>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-red-300 hover:text-white hover:bg-red-950/50 border border-red-900/30 rounded-xl transition active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Desktop Breadcrumb / System Status Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <span>Admin Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-900 font-bold">{currentNav.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>MongoDB Connected</span>
            </div>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
