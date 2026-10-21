import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getAdminStats,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct
} from '../controllers/adminProductController.js';
import {
  getAdminWhatsAppSetting,
  updateWhatsAppSetting
} from '../controllers/settingsController.js';

const router = express.Router();

// Strict authorization: Requires valid session AND admin role on every endpoint
router.use(authenticateToken, requireAdmin);

// Admin Dashboard stats
router.get('/stats', getAdminStats);

// Product management
router.get('/products', getAllProductsAdmin);
router.post('/products', upload.single('image'), createProduct);
router.patch('/products/:id', upload.single('image'), updateProduct);
router.patch('/products/:id/stock', updateStock);
router.delete('/products/:id', deleteProduct);

// WhatsApp Destination Settings
router.get('/settings/whatsapp', getAdminWhatsAppSetting);
router.patch('/settings/whatsapp', updateWhatsAppSetting);

export default router;
