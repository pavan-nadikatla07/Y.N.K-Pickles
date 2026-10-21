import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, LogOut, QrCode, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { QRCodeModal } from '../common/QRCodeModal.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mango-400 to-mango-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-display font-extrabold text-lg tracking-wider">YNK</span>
            </div>
            <div>
              <div className="font-display font-black text-lg tracking-tight text-gray-900 group-hover:text-mango-600 transition-colors">
                YNK Pickles
              </div>
              <div className="text-[10px] uppercase tracking-widest text-olive-700 font-semibold -mt-1">
                Authentic & Homemade
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className={`transition-colors ${
                isActive('/') ? 'text-mango-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Marketplace
            </Link>

            {/* QR Code trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-mango-700 transition"
              title="Show Website QR Code"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-mango-600 hover:bg-cream-100 rounded-xl transition"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-olive-700 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Profile / Auth State */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3 pl-2 border-l border-cream-200">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-full bg-olive-100 text-olive-800 font-bold flex items-center justify-center">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 truncate max-w-[120px]">{user?.name}</p>
                    <p className="text-gray-400 font-mono text-[10px]">+{user?.phone}</p>
                  </div>
                </div>

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
                  className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-mango-700 hover:bg-cream-100 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-mango-600 hover:bg-mango-700 rounded-xl shadow-sm transition"
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
          <div className="md:hidden border-t border-cream-200 bg-white px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-cream-100"
            >
              Marketplace
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-cream-100"
            >
              <span>Shopping Cart</span>
              {itemCount > 0 && (
                <span className="bg-olive-700 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                  {itemCount} items
                </span>
              )}
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowQrModal(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-base font-medium text-gray-700 hover:bg-cream-100"
            >
              <QrCode className="w-5 h-5 text-gray-400" />
              <span>Website QR Code</span>
            </button>

            <div className="pt-3 border-t border-cream-200">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-cream-50 rounded-xl text-xs">
                    <p className="font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-gray-500 font-mono">+{user?.phone}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
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
                    className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-gray-700 bg-cream-100 hover:bg-cream-200 rounded-xl text-center"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-mango-600 hover:bg-mango-700 rounded-xl text-center shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* QR Code Modal */}
      <QRCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </>
  );
};
