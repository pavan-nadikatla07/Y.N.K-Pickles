import express from 'express';
import { getActiveProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getActiveProducts);
router.get('/:id', getProductById);

export default router;
