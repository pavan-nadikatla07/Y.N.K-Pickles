import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isCustomer } = useAuth();
  const { success, error } = useToast();

  const [cart, setCart] = useState({
    items: [],
    grandTotal: 0,
    hasIssues: false,
    issues: []
  });
  const [loading, setLoading] = useState(false);

  // Fetch server-persisted cart whenever authentication state changes
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], grandTotal: 0, hasIssues: false, issues: [] });
      return;
    }

    try {
      setLoading(true);
      const data = await api.getCart();
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.warn('Failed to fetch cart:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      error('Please log in or create an account to add items to your cart.');
      return false;
    }

    try {
      setLoading(true);
      const data = await api.addToCart(productId, quantity);
      if (data.success && data.cart) {
        setCart(data.cart);
        success(data.message || 'Added to cart!');
        return true;
      }
    } catch (err) {
      error(err.message || 'Could not add item to cart.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await api.updateCartItem(productId, quantity);
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      error(err.message || 'Could not update quantity.');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await api.removeCartItem(productId);
      if (data.success && data.cart) {
        setCart(data.cart);
        success('Item removed from cart.');
      }
    } catch (err) {
      error(err.message || 'Could not remove item.');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await api.clearCart();
      if (data.success) {
        setCart({ items: [], grandTotal: 0, hasIssues: false, issues: [] });
      }
    } catch (err) {
      console.warn('Could not clear cart:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cart.items.reduce((acc, item) => acc + (item.quantity > 0 ? 1 : 0), 0);

  const value = {
    cart,
    itemCount,
    grandTotal: cart.grandTotal,
    hasIssues: cart.hasIssues,
    issues: cart.issues,
    loading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
