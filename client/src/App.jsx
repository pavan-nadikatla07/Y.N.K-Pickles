import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Customer Layout & Pages
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { OfflineBanner } from './components/layout/OfflineBanner.jsx';
import { InstallPrompt } from './components/layout/InstallPrompt.jsx';
import { MarketplacePage } from './pages/customer/MarketplacePage.jsx';
import { CartPage } from './pages/customer/CartPage.jsx';
import { CheckoutPage } from './pages/customer/CheckoutPage.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage.jsx';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout.jsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.jsx';
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage.jsx';
import { AdminStockPage } from './pages/admin/AdminStockPage.jsx';
import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage.jsx';
import { AdminEmailSettingsPage } from './pages/admin/AdminEmailSettingsPage.jsx';
import { AdminProfilePage } from './pages/admin/AdminProfilePage.jsx';

/**
 * Route guard: Requires authenticated customer or admin
 */
const ProtectedCustomerRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-gray-400">
        Authenticating...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Route guard: Strictly requires authenticated administrator
 */
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-xs text-gray-400">
        Verifying administrator privileges...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

/**
 * Customer Layout Wrapper
 */
const CustomerWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <OfflineBanner />
        <InstallPrompt />
        <Navbar />
        <main>{children}</main>
      </div>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      {/* Customer Facing Routes */}
      <Route
        path="/"
        element={
          <CustomerWrapper>
            <MarketplacePage />
          </CustomerWrapper>
        }
      />
      <Route
        path="/cart"
        element={
          <CustomerWrapper>
            <CartPage />
          </CustomerWrapper>
        }
      />
      <Route
        path="/checkout"
        element={
          <CustomerWrapper>
            <ProtectedCustomerRoute>
              <CheckoutPage />
            </ProtectedCustomerRoute>
          </CustomerWrapper>
        }
      />
      <Route
        path="/login"
        element={
          <CustomerWrapper>
            <LoginPage />
          </CustomerWrapper>
        }
      />
      <Route
        path="/register"
        element={
          <CustomerWrapper>
            <RegisterPage />
          </CustomerWrapper>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <CustomerWrapper>
            <ForgotPasswordPage />
          </CustomerWrapper>
        }
      />
      <Route
        path="/profile"
        element={
          <CustomerWrapper>
            <ProtectedCustomerRoute>
              <CustomerProfilePage />
            </ProtectedCustomerRoute>
          </CustomerWrapper>
        }
      />
      <Route
        path="/settings"
        element={
          <CustomerWrapper>
            <ProtectedCustomerRoute>
              <CustomerProfilePage />
            </ProtectedCustomerRoute>
          </CustomerWrapper>
        }
      />

      {/* Admin Portal Login & Password Recovery */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Admin Portal with Sidebar */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/:id/edit" element={<AdminProductFormPage />} />
        <Route path="stock" element={<AdminStockPage />} />
        <Route path="settings/whatsapp" element={<AdminWhatsAppPage />} />
        <Route path="settings/email" element={<AdminEmailSettingsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>

      {/* Fallback 404 route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
