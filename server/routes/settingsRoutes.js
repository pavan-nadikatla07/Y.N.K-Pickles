import express from 'express';
import { getPublicWhatsAppSetting } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/whatsapp', getPublicWhatsAppSetting);

export default router;
