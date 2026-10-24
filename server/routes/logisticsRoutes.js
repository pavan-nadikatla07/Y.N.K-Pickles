import express from 'express';
import { getLogisticsQuote } from '../controllers/logisticsController.js';

const router = express.Router();

// Logistics quote endpoints
router.post('/quote', getLogisticsQuote);
router.get('/quote', getLogisticsQuote);

export default router;
