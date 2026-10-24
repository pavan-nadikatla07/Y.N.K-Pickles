import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Store, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mango-400 via-mango-500 to-mango-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-display font-black text-lg tracking-wider">YNK</span>
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-tight text-gray-900 group-hover:text-mango-600 transition-colors">
              YNK Pickles
            </div>
            <div className="text-[10px] uppercase tracking-widest text-olive-700 font-bold -mt-1">
              Authentic & Homemade
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          {/* Prominent Marketplace Navigation Option */}
          <Link
            to="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition duration-200 ${
              isActive('/')
                ? 'bg-amber-100/70 text-mango-700 font-bold border border-amber-300/60 shadow-2xs'
                : 'text-gray-700 hover:text-gray-950 hover:bg-cream-100 font-medium'
            }`}
          >
            <Store className={`w-4 h-4 ${isActive('/') ? 'text-mango-600' : 'text-gray-500'}`} />
            <span>Marketplace</span>
          </Link>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Prominent Cart Button with Visible Item Badge */}
          <Link
            to="/cart"
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl transition duration-200 ${
              isActive('/cart')
                ? 'bg-olive-800 text-white font-bold shadow-sm'
                : 'bg-cream-100 hover:bg-cream-200 text-gray-800 font-medium'
            }`}
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
            {itemCount > 0 ? (
              <span className="bg-amber-500 text-stone-950 font-black text-[11px] px-1.5 py-0.2 rounded-full border border-white shadow-xs">
                {itemCount}
              </span>
            ) : (
              <span className="text-[11px] opacity-60">0</span>
            )}
          </Link>

          {/* User Profile / Auth State */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3 pl-2 border-l border-cream-200">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-xs p-1.5 rounded-xl hover:bg-cream-100 transition group"
                title="My Profile & Settings"
              >
                <div className="w-8 h-8 rounded-full bg-olive-100 text-olive-800 font-bold flex items-center justify-center">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 group-hover:text-mango-700 transition truncate max-w-[120px]">
                    {user?.name}
                  </p>
                  <p className="text-gray-400 font-mono text-[10px]">Settings</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-mango-700 hover:bg-cream-100 rounded-xl transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-mango-600 hover:bg-mango-700 rounded-xl shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-cream-100 rounded-xl"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cream-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold ${
              isActive('/')
                ? 'bg-amber-100 text-mango-700 border border-amber-300'
                : 'text-gray-700 hover:bg-cream-100'
            }`}
          >
            <Store className="w-4 h-4 text-mango-600" />
            <span>Marketplace</span>
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-cream-100"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-olive-800" />
              <span>Shopping Cart</span>
            </div>
            {itemCount > 0 && (
              <span className="bg-olive-800 text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                {itemCount} items
              </span>
            )}
          </Link>

          {isAuthenticated && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-cream-100"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              <span>Personal Settings / Profile</span>
            </Link>
          )}

          <div className="pt-3 border-t border-cream-200">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-cream-50 rounded-xl text-xs">
                  <p className="font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-gray-500 font-mono">+{user?.phone}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-gray-700 bg-cream-100 hover:bg-cream-200 rounded-xl text-center"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-mango-600 hover:bg-mango-700 rounded-xl text-center shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
