import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { normalizePhone } from '../validators/phoneValidator.js';

const seedAdmin = async () => {
  await connectDB();

  const adminName = process.env.INITIAL_ADMIN_NAME || 'YNK Pickles Admin';
  const rawPhone = process.env.INITIAL_ADMIN_PHONE || '919876543210';
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@ynkpickles.com').toLowerCase().trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456';
  const defaultWhatsApp = process.env.DEFAULT_WHATSAPP_NUMBER || rawPhone;

  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone) {
    console.error('[Seed Error] Invalid admin phone number in configuration.');
    process.exit(1);
  }

  let admin = await User.findOne({ phone: normalizedPhone });
  if (admin) {
    admin.role = 'admin';
    admin.email = adminEmail;
    admin.isEmailVerified = true;
    admin.password = adminPassword; // Will trigger pre-save bcrypt hash
    await admin.save();
    console.log(`[Seed] Existing user with phone ${normalizedPhone} updated to Admin with email ${adminEmail}.`);
  } else {
    admin = new User({
      name: adminName,
      email: adminEmail,
      phone: normalizedPhone,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true
    });
    await admin.save();
    console.log(`[Seed] New Admin user created: ${adminName} (${normalizedPhone}, ${adminEmail})`);
  }

  // Ensure default WhatsApp destination setting exists
  const cleanWhatsApp = normalizePhone(defaultWhatsApp) || normalizedPhone;
  let setting = await Settings.findOne({ key: 'whatsapp' });
  if (!setting) {
    await Settings.create({
      key: 'whatsapp',
      whatsappNumber: cleanWhatsApp,
      updatedBy: admin._id
    });
    console.log(`[Seed] WhatsApp destination set to: ${cleanWhatsApp}`);
  } else {
    console.log(`[Seed] WhatsApp destination already configured: ${setting.whatsappNumber}`);
  }

  console.log('[Seed] Admin provisioning complete.');
  await disconnectDB();
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
