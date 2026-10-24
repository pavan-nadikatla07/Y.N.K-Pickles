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

  // Customer & Admin Profile & Password Management
  updateProfile: (profileData) => request('/auth/profile', { method: 'PATCH', body: profileData }),
  requestEmailChangeOtp: (newEmail) => request('/auth/profile/email-otp', { method: 'POST', body: { newEmail } }),
  requestPasswordChangeOtp: () => request('/auth/password/otp', { method: 'POST' }),
  changePassword: (data) => request('/auth/password/change', { method: 'POST', body: data }),

  // Password Recovery
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: data }),
  verifyResetOtp: (data) => request('/auth/verify-reset-otp', { method: 'POST', body: data }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: data }),

  // Customer Products
  getProducts: (params = '') => request(`/products${params}`),
  getProductById: (id) => request(`/products/${id}`),

  // Public Settings
  getWhatsAppNumber: () => request('/settings/whatsapp'),

  // Logistics & Delivery Pricing
  getLogisticsQuote: (latitude, longitude, address = '') =>
    request('/logistics/quote', { method: 'POST', body: { latitude, longitude, address } }),

  // Customer Cart
  getCart: () => request('/cart'),
  addToCart: (productId, quantity) => request('/cart', { method: 'POST', body: { productId, quantity } }),
  updateCartItem: (productId, quantity) => request('/cart/item', { method: 'PUT', body: { productId, quantity } }),
  removeCartItem: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Admin APIs (Protected by backend session & admin role)
  getAdminStats: () => request('/admin/stats'),
  getAdminProducts: (params = '') => request(`/admin/products${params}`),
  getAdminProductById: (id) => request(`/admin/products/${id}`),
  createProduct: (formData) => request('/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formDataOrJson) => request(`/admin/products/${id}`, { method: 'PATCH', body: formDataOrJson }),
  updateProductPrice: (id, priceData) => request(`/admin/products/${id}/price`, { method: 'PATCH', body: priceData }),
  updateStock: (id, stockQuantity) => request(`/admin/products/${id}/stock`, { method: 'PATCH', body: { stockQuantity } }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  getAdminWhatsApp: () => request('/admin/settings/whatsapp'),
  updateAdminWhatsApp: (whatsappNumber) => request('/admin/settings/whatsapp', { method: 'PATCH', body: { whatsappNumber } }),
  getAdminEmailSettings: () => request('/admin/settings/email'),
  updateAdminEmailSettings: (settings) => request('/admin/settings/email', { method: 'PATCH', body: settings }),
  testAdminEmailSettings: (testData) => request('/admin/settings/email/test', { method: 'POST', body: testData })
};
