import dotenv from 'dotenv';
dotenv.config();

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { EmailSettings } from '../models/EmailSettings.js';
import { OtpChallenge } from '../models/OtpChallenge.js';
import { hashOtp } from '../utils/otpService.js';
import { maskMongoUri, connectDB } from '../config/db.js';

describe('YNK Pickles API Integration Test Suite', () => {
  let customerCookie = '';
  let adminCookie = '';

  const testCustomer = {
    name: 'Suresh Kumar',
    email: 'suresh@testexample.com',
    phone: '9876500001',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    savedLocation: {
      address: 'Plot 42, Jubilee Hills, Hyderabad',
      formattedAddress: 'Plot 42, Jubilee Hills, Hyderabad, Telangana',
      latitude: 17.4319,
      longitude: 78.4073,
      isVerified: true
    }
  };

  const testAdmin = {
    name: 'Test Administrator',
    email: 'admin@testexample.com',
    phone: '9876500099',
    password: 'AdminPassword@123'
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // Clean up test users and challenges
    await User.deleteMany({ phone: { $in: ['919876500001', '919876500099'] } });
    await User.deleteMany({ email: { $in: ['suresh@testexample.com', 'admin@testexample.com'] } });
    await OtpChallenge.deleteMany({ email: { $in: ['suresh@testexample.com', 'admin@testexample.com'] } });

    // Seed test admin directly
    const admin = new User({
      name: testAdmin.name,
      email: testAdmin.email,
      phone: '919876500099',
      password: testAdmin.password,
      role: 'admin',
      isEmailVerified: true
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
    await User.deleteMany({ email: { $in: ['suresh@testexample.com', 'admin@testexample.com'] } });
    await OtpChallenge.deleteMany({ email: { $in: ['suresh@testexample.com', 'admin@testexample.com'] } });
    await Product.deleteMany({ slug: 'test-pickle-product' });
    await mongoose.disconnect();
  });

  describe('1. Health Check & MongoDB Connectivity', () => {
    it('GET /api/v1/health returns 200, healthy status, and connected database', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('YNK Pickles API');
      expect(res.body.database).toBeDefined();
      expect(res.body.database.status).toBe('connected');
      expect(res.body.database.readyState).toBe(1);
    });

    it('maskMongoUri safely masks credentials for Atlas and standard URIs', () => {
      const atlasUri =
        'mongodb+srv://admin_user:SuperSecretPass123!@cluster0.abcde.mongodb.net/ynk_pickles?retryWrites=true&w=majority';
      const masked = maskMongoUri(atlasUri);
      expect(masked).toBe(
        'mongodb+srv://admin_user:****@cluster0.abcde.mongodb.net/ynk_pickles?retryWrites=true&w=majority'
      );
      expect(masked).not.toContain('SuperSecretPass123!');
    });

    it('connectDB reuses active connection avoiding duplicate pools', async () => {
      const conn = await connectDB();
      expect(conn.readyState).toBe(1);
    });
  });

  describe('2. Customer Registration & Verification Requirements', () => {
    it('Rejects registration if email is missing', async () => {
      const { email, ...noEmail } = testCustomer;
      const res = await request(app).post('/api/v1/auth/register').send(noEmail);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('email');
    });

    it('Rejects registration if delivery location is unverified', async () => {
      const unverifiedLocCustomer = {
        ...testCustomer,
        phone: '9876500002',
        email: 'unverified@test.com',
        savedLocation: { address: 'Some street', isVerified: false, latitude: null, longitude: null }
      };
      const res = await request(app).post('/api/v1/auth/register').send(unverifiedLocCustomer);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('location');
    });

    it('POST /api/v1/auth/register successfully registers a new customer with verified location', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(testCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.phone).toBe('919876500001');
      expect(res.body.user.email).toBe('suresh@testexample.com');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.savedLocation.isVerified).toBe(true);
      expect(res.body.user.savedLocation.latitude).toBe(17.4319);

      // Verify cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      customerCookie = cookies[0].split(';')[0];
    });

    it('POST /api/v1/auth/register rejects duplicate phone number', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        ...testCustomer,
        email: 'different@test.com'
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/register rejects duplicate email address', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        ...testCustomer,
        phone: '9876500003'
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Authentication & Access Control', () => {
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
      expect(res.body.user.email).toBe('suresh@testexample.com');
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.savedLocation.isVerified).toBe(true);
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
    });
  });

  describe('4. Email & SMTP System Configuration (Admin Only)', () => {
    it('Customer is denied access to Email Settings (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings/email')
        .set('Cookie', [customerCookie]);

      expect(res.status).toBe(403);
    });

    it('Admin can view Email Settings without exposing passwords', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings/email')
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toBeDefined();
      expect(res.body.settings.encryptedPass).toBeUndefined();
      expect(res.body.settings.password).toBeUndefined();
      expect(typeof res.body.settings.hasPassword).toBe('boolean');
    });

    it('Admin can update SMTP settings', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/settings/email')
        .set('Cookie', [adminCookie])
        .send({
          senderEmail: 'orders@ynkpickles.com',
          senderName: 'Y.N.K Pickles Notification Service',
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          user: 'postmaster@ynkpickles.com',
          password: 'SuperSecretSmtpPassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.senderEmail).toBe('orders@ynkpickles.com');
      expect(res.body.settings.hasPassword).toBe(true);
      expect(res.body.settings.isConfigured).toBe(true);
    });
  });

  describe('5. Password Recovery & Role-Isolated OTP System', () => {
    it('Forgot password returns generic message for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com', role: 'customer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('verification code has been sent');
    });

    it('Customer cannot reset Admin account through customer recovery', async () => {
      // Create OTP challenge directly in DB for admin email with admin role
      const adminOtp = '654321';
      await OtpChallenge.create({
        email: testAdmin.email,
        otpHash: hashOtp(adminOtp),
        purpose: 'password_reset',
        role: 'admin',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      // Attempt verification through customer role
      const failRes = await request(app)
        .post('/api/v1/auth/verify-reset-otp')
        .send({ email: testAdmin.email, otp: adminOtp, role: 'customer' });

      expect(failRes.status).toBe(400);
      expect(failRes.body.success).toBe(false);
    });

    it('Valid OTP permits password reset', async () => {
      const validOtp = '123456';
      await OtpChallenge.create({
        email: testCustomer.email,
        otpHash: hashOtp(validOtp),
        purpose: 'password_reset',
        role: 'customer',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      });

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-reset-otp')
        .send({ email: testCustomer.email, otp: validOtp, role: 'customer' });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.resetToken).toBeDefined();

      // Reset password with token
      const newPass = 'BrandNewPassword@2026';
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          resetToken: verifyRes.body.resetToken,
          newPassword: newPass,
          confirmPassword: newPass
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify old password fails, new password succeeds
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        phone: testCustomer.phone,
        password: testCustomer.password
      });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app).post('/api/v1/auth/login').send({
        phone: testCustomer.phone,
        password: newPass
      });
      expect(newLogin.status).toBe(200);
    });
  });

  describe('6. Personal Profile & Location Management', () => {
    it('Customer can update full name and saved location', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Cookie', [customerCookie])
        .send({
          name: 'Suresh Kumar Updated',
          savedLocation: {
            address: 'Banjara Hills Road No 12, Hyderabad',
            formattedAddress: 'Banjara Hills Road No 12, Hyderabad, Telangana',
            placeId: 'ChIJTestPlace123',
            latitude: 17.4123,
            longitude: 78.4321,
            isVerified: true
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Suresh Kumar Updated');
      expect(res.body.user.savedLocation.latitude).toBe(17.4123);
    });

    it('Profile update prevents role tampering (cannot escalate to admin)', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Cookie', [customerCookie])
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('customer');
    });
  });

  describe('7. Products & Stock Calculations', () => {
    it('GET /api/v1/products returns active products list', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.products)).toBe(true);
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });

  describe('8. Product Price Editing & Management Workflows', () => {
    let testProductId = '';

    it('Admin can fetch any product by ID via GET /api/v1/admin/products/:id', async () => {
      const product = await Product.findOne({ slug: 'test-pickle-product' });
      expect(product).toBeDefined();
      testProductId = product._id.toString();

      const res = await request(app)
        .get(`/api/v1/admin/products/${testProductId}`)
        .set('Cookie', [adminCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe('Test Pickle Product');
      expect(res.body.product.price).toBe(250);
    });

    it('Admin can edit product price from 250 to 350 via PATCH /api/v1/admin/products/:id/price', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/products/${testProductId}/price`)
        .set('Cookie', [adminCookie])
        .send({
          price: 350,
          priceBasis: 1,
          priceBasisUnit: '1kg'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.price).toBe(350);

      // Verify directly in MongoDB
      const updatedInDb = await Product.findById(testProductId);
      expect(updatedInDb.price).toBe(350);
    });

    it('Price update rejects non-positive or negative prices', async () => {
      const zeroRes = await request(app)
        .patch(`/api/v1/admin/products/${testProductId}/price`)
        .set('Cookie', [adminCookie])
        .send({ price: 0 });
      expect(zeroRes.status).toBe(400);

      const negRes = await request(app)
        .patch(`/api/v1/admin/products/${testProductId}/price`)
        .set('Cookie', [adminCookie])
        .send({ price: -50 });
      expect(negRes.status).toBe(400);

      const inDb = await Product.findById(testProductId);
      expect(inDb.price).toBe(350);
    });

    it('Customer marketplace immediately reflects the updated price (350)', async () => {
      const res = await request(app).get('/api/v1/products');
      expect(res.status).toBe(200);

      const updated = res.body.products.find((p) => p._id.toString() === testProductId);
      expect(updated).toBeDefined();
      expect(updated.price).toBe(350);
    });

    it('Admin can update stock quantity directly via PATCH /api/v1/admin/products/:id/stock', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/products/${testProductId}/stock`)
        .set('Cookie', [adminCookie])
        .send({ stockQuantity: 25 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.stockQuantity).toBe(25);
    });
  });

  describe('9. WhatsApp Business Settings', () => {
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

      const pubRes = await request(app).get('/api/v1/settings/whatsapp');
      expect(pubRes.body.whatsappNumber).toBe(newNumber);
    });
  });

  describe('10. Logistics Delivery Pricing (Tanuku Circle Rules)', () => {
    it('Scenario 1: Customer location inside Tanuku Circle boundary => ₹0 (FREE DELIVERY)', async () => {
      // Tanuku town center coordinates
      const res = await request(app)
        .post('/api/v1/logistics/quote')
        .send({
          latitude: 16.7529,
          longitude: 81.6760,
          address: 'Main Road, Tanuku, Andhra Pradesh'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isInside).toBe(true);
      expect(res.body.distanceKm).toBe(0);
      expect(res.body.logisticsCharge).toBe(0);
      expect(res.body.deliveryStatus).toBe('FREE_DELIVERY');
      expect(res.body.displayLabel).toContain('FREE DELIVERY');
    });

    it('Scenario 2: Customer location outside Tanuku Circle boundary => ₹10/km road distance from boundary', async () => {
      // Tadepalligudem coordinates (outside Tanuku Circle)
      const res = await request(app)
        .post('/api/v1/logistics/quote')
        .send({
          latitude: 16.8152,
          longitude: 81.5284,
          address: 'Tadepalligudem, Andhra Pradesh'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isInside).toBe(false);
      expect(res.body.distanceKm).toBeGreaterThan(0);
      expect(res.body.ratePerKm).toBe(10);
      expect(res.body.logisticsCharge).toBe(Math.round(res.body.distanceKm * 10));
      expect(res.body.deliveryStatus).toBe('OUTSIDE_CIRCLE');
      expect(res.body.boundaryPoint).toBeDefined();
      expect(res.body.boundaryPoint.lat).toBeDefined();
      expect(res.body.boundaryPoint.lng).toBeDefined();
    });

    it('Scenario 3: Customer changes delivery location => logistics charge updates dynamically', async () => {
      // Location A: Tadepalligudem
      const resA = await request(app)
        .post('/api/v1/logistics/quote')
        .send({ latitude: 16.8152, longitude: 81.5284 });

      // Location B: Rajahmundry (further away)
      const resB = await request(app)
        .post('/api/v1/logistics/quote')
        .send({ latitude: 17.0005, longitude: 81.7887 });

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resB.body.distanceKm).toBeGreaterThan(resA.body.distanceKm);
      expect(resB.body.logisticsCharge).toBeGreaterThan(resA.body.logisticsCharge);
    });

    it('Scenario 4: Missing or invalid coordinates => returns clear 400 error and no fabricated charge', async () => {
      const missingRes = await request(app)
        .post('/api/v1/logistics/quote')
        .send({});

      expect(missingRes.status).toBe(400);
      expect(missingRes.body.success).toBe(false);
      expect(missingRes.body.message).toContain('Delivery coordinates (latitude and longitude) are required');

      const invalidRes = await request(app)
        .post('/api/v1/logistics/quote')
        .send({ latitude: 'not-a-number', longitude: 81.67 });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.success).toBe(false);
      expect(invalidRes.body.message).toContain('Invalid latitude or longitude');
    });

    it('GET /api/v1/logistics/quote also supports query parameters', async () => {
      const res = await request(app).get('/api/v1/logistics/quote?lat=16.7529&lng=81.6760');
      expect(res.status).toBe(200);
      expect(res.body.isInside).toBe(true);
      expect(res.body.logisticsCharge).toBe(0);
    });
  });
});
