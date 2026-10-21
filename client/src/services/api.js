/**
 * YNK Pickles API Client
 * Built on native fetch with cookie-based credentials
 */

const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers
    }
  };

  // If body is JSON object (not FormData)
  if (config.body && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({
    success: false,
    message: 'An unexpected response was received from the server.'
  }));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Customer Products
  getProducts: (params = '') => request(`/products${params}`),
  getProductById: (id) => request(`/products/${id}`),

  // Public Settings
  getWhatsAppNumber: () => request('/settings/whatsapp'),

  // Customer Cart
  getCart: () => request('/cart'),
  addToCart: (productId, quantity) => request('/cart', { method: 'POST', body: { productId, quantity } }),
  updateCartItem: (productId, quantity) => request('/cart/item', { method: 'PUT', body: { productId, quantity } }),
  removeCartItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Admin APIs (Protected by backend session & admin role)
  getAdminStats: () => request('/admin/stats'),
  getAdminProducts: (params = '') => request(`/admin/products${params}`),
  createProduct: (formData) => request('/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => request(`/admin/products/${id}`, { method: 'PATCH', body: formData }),
  updateStock: (id, stockQuantity) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: { stockQuantity } }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  getAdminWhatsApp: () => request('/admin/settings/whatsapp'),
  updateAdminWhatsApp: (whatsappNumber) => request('/admin/settings/whatsapp', { method: 'PATCH', body: { whatsappNumber } })
};
