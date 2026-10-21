import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';

describe('YNK Pickles API Integration Test Suite', () => {
  let customerCookie = '';
  let adminCookie = '';

  const testCustomer = {
    name: 'Suresh Kumar',
    phone: '9876500001',
    password: 'Password@123',
    confirmPassword: 'Password@123'
  };

  const testAdmin = {
    name: 'Test Administrator',
    phone: '9876500099',
    password: 'AdminPassword@123'
  };

  beforeAll(async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ynk_pickles_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }

    // Clean up test users
    await User.deleteMany({ phone: { $in: ['919876500001', '919876500099'] } });

    // Seed test admin directly
    const admin = new User({
      name: testAdmin.name,
      phone: '919876500099',
      password: testAdmin.password,
      role: 'admin'
    });
    await admin.save();

    // Seed a test product
    await Product.deleteMany({ slug: 'test-pickle-product' });
    await Product.create({
      name: 'Test Pickle Product',
      slug: 'test-pickle-product',
      description: 'A delicious test pickle',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc',
      measurementUnit: 'kg',
      price: 250,
      priceBasis: 1,
      priceBasisUnit: '1kg',
      stockQuantity: 10,
      isActive: true,
      isStockAvailable: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({ phone: { $in: ['919876500001', '919876500099'] } });
    await Product.deleteMany({ slug: 'test-pickle-product' });
    await mongoose.disconnect();
  });

  describe('1. Health Check', () => {
    it('GET /api/v1/health returns 200 and healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('YNK Pickles API');
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/v1/auth/register registers a new customer', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.phone).toBe('919876500001');
      expect(res.body.user.role).toBe('customer');

      // Verify cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      customerCookie = cookies[0].split(';')[0];
    });

    it('POST /api/v1/auth/register rejects duplicate phone number', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testCustomer);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login logs in customer and rejects invalid password', async () => {
      const badRes = await request(app).post('/api/v1/auth/login').send({
        phone: testCustomer.phone,
        password: 'WrongPassword!'
      });
      expect(badRes.status).toBe(401);

      const goodRes = await request(app).post('/api/v1/auth/login').send({
        phone: testCustomer.phone,
        password: testCustomer.password
      });
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.success).toBe(true);
      expect(goodRes.body.user.role).toBe('customer');
    });

    it('POST /api/v1/auth/login logs in admin with admin role', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        phone: testAdmin.phone,
        password: testAdmin.password
      });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      adminCookie = cookies[0].split(';')[0];
    });

    it('GET /api/v1/auth/me returns current user profile with valid cookie', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [customerCookie]);

      expect(res.status).toBe(200);
      expect(res.body.user.phone).toBe('919876500001');
      expect(res.body.user.role).toBe('customer');
    });

    it('Customer cannot access Admin endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', [customerCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Admin can access Admin endpoints (200 OK)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.activeProducts).toBe('number');
    });
  });

  describe('3. Products & Stock Calculations', () => {
    it('GET /api/v1/products returns active products list', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });

  describe('4. WhatsApp Business Settings', () => {
    it('GET /api/v1/settings/whatsapp returns public destination number', async () => {
      const res = await request(app).get('/api/v1/settings/whatsapp');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.whatsappNumber).toBeDefined();
      expect(res.body.isConfigured).toBe(true);
    });

    it('Admin can update WhatsApp destination number', async () => {
      const newNumber = '919811122233';
      const res = await request(app)
        .patch('/api/v1/admin/settings/whatsapp')
        .set('Cookie', [adminCookie])
        .send({ whatsappNumber: newNumber });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.setting.whatsappNumber).toBe(newNumber);

      // Verify public endpoint returns updated number
      const pubRes = await request(app).get('/api/v1/settings/whatsapp');
      expect(pubRes.body.whatsappNumber).toBe(newNumber);
    });
  });
});
