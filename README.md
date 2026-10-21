# YNK Pickles — MERN Stack Progressive Web Application (PWA)

**YNK Pickles** is a production-ready, full-stack online marketplace for authentic handcrafted South Indian pickles. Built on the MERN stack with modern Progressive Web App (PWA) capabilities, it enables customers to browse pickles by weight (kg, g) or pieces, manage a real-time cart, acquire device GPS location, and dispatch pre-filled order messages directly to the kitchen via WhatsApp click-to-chat.

---

## Architecture & Technology Stack

- **Frontend:** React 18 with Vite, Tailwind CSS (warm mustard, mango amber, olive green, cream palette), Lucide icons.
- **Backend:** Node.js, Express.js (REST API prefixed at `/api/v1`).
- **Database:** MongoDB with Mongoose ODM (Data models: `User`, `Product`, `Cart`, `Settings`).
- **Authentication:** Customer & Admin authentication via Phone Number and Password (hashed with `bcryptjs`), secured with HttpOnly cookies and JWT. Strict security: No Google login, no OTP/SMS dependencies.
- **PWA:** `vite-plugin-pwa` with Web App Manifest, Service Worker caching app shell and assets, offline fallback (`offline.html`), and installation prompt.
- **Geolocation:** Browser Geolocation API (`navigator.geolocation`) with high-accuracy GPS coordinates generating Google Maps links (`https://www.google.com/maps?q=LAT,LNG`). Never uses fake or guessed coordinates.
- **WhatsApp Ordering:** Official `https://wa.me/PHONE_NUMBER?text=ENCODED_MESSAGE` click-to-chat integration. Destination number is dynamically managed by the administrator in MongoDB.
- **Separate Admin Portal:** Strictly guarded at `/admin/login` and `/admin/*` via backend session verification and role authorization middleware.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Installation](#2-project-installation)
3. [Environment Configuration](#3-environment-configuration)
4. [Initial Database Seeding & Admin Setup](#4-initial-database-seeding--admin-setup)
5. [Running the Application Locally](#5-running-the-application-locally)
6. [Testing Suite](#6-testing-suite)
7. [Customer Journey Walkthrough](#7-customer-journey-walkthrough)
8. [Admin Portal & WhatsApp Settings](#8-admin-portal--whatsapp-settings)
9. [PWA Features & Installation](#9-pwa-features--installation)
10. [Production Build & Deployment Guide](#10-production-build--deployment-guide)
11. [Troubleshooting & FAQs](#11-troubleshooting--faqs)

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ / v24+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB:** Local MongoDB instance running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection URI.

---

## 2. Project Installation

Clone the repository and install all dependencies:

```bash
# Clone the repository
git clone https://github.com/your-username/ynk-pickles.git
cd ynk-pickles

# Install root, server, and client dependencies in one command:
npm run install:all
```

Alternatively, install each sub-project manually:

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 3. Environment Configuration

Copy `.env.example` to create your local `server/.env`:

```bash
cp .env.example server/.env
```

Review and adjust variables in `server/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ynk_pickles
SESSION_SECRET=replace_with_a_secure_long_random_secret_at_least_32_characters

# CORS Settings (Client URL)
CLIENT_URL=http://localhost:5173

# Initial Administrator Seed Credentials
INITIAL_ADMIN_NAME=Admin YNK
INITIAL_ADMIN_PHONE=919876543210
INITIAL_ADMIN_PASSWORD=AdminSecurePassword123!

# Default WhatsApp Business Number (Digits only, including country code)
DEFAULT_WHATSAPP_NUMBER=919876543210
```

> **Security Note:** Never commit `.env` or secrets to version control. `.env` is already configured in `.gitignore`.

---

## 4. Initial Database Seeding & Admin Setup

Run the provisioning scripts from the root directory:

```bash
# 1. Provision Administrator account and initialize WhatsApp settings
npm run seed:admin

# 2. Seed authentic South Indian pickle catalog (Avakaya, Gongura, Nimbu, Pandu Mirapakaya, Garlic, Ceramic Jars)
npm run seed:products
```

**Default Admin Credentials:**
- **URL:** `http://localhost:5173/admin/login`
- **Phone:** `919876543210` (or `9876543210`)
- **Password:** `AdminSecurePassword123!`

---

## 5. Running the Application Locally

To start both the Node.js Express backend and Vite React frontend concurrently:

```bash
npm run dev
```

- **Customer Marketplace:** [http://localhost:5173](http://localhost:5173)
- **Admin Portal:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Backend API Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

---

## 6. Testing Suite

Automated integration tests are provided for backend security, authorization, products, stock calculations, WhatsApp settings, and frontend utilities.

Run all tests across the workspace:

```bash
npm test
```

Or run tests individually:

```bash
# Run server integration tests
npm run test:server

# Run client calculation & WhatsApp formatting unit tests
npm run test:client
```

---

## 7. Customer Journey Walkthrough

The application implements the exact required customer ordering flow:

1. **QR Code Entry:** Customer scans the permanent QR code (available via the navbar QR Code modal) or navigates to the website.
2. **Authentication:** Customer logs in or signs up using **Full Name**, **Phone Number**, and **Password**. No third-party OAuth, SMS, or OTP fields.
3. **Marketplace:** Customer browses handcrafted pickles filtered by category or measurement unit (`kg`, `g`, `piece`). Real-time stock status is shown.
4. **Shopping Cart:** Customer adjusts quantities adhering to purchase increments (e.g. 100g, 1kg). Totals are calculated dynamically based on authoritative DB prices.
5. **GPS Location Selection:** On the Order Review page, the customer clicks **Select Current Location (GPS)**. Browser requests location permission; upon approval, coordinates are mapped to a Google Maps URL (`https://www.google.com/maps?q=LAT,LNG`). If permission is denied, customer can proceed without location.
6. **WhatsApp Ordering:** Clicking **Place Order via WhatsApp** generates the pre-filled message and opens the official WhatsApp chat (`https://wa.me/{number}?text={encoded}`).
7. **Manual Send:** Customer presses **Send** in WhatsApp. The site displays a completion modal reminding the customer to send the message.

---

## 8. Admin Portal & WhatsApp Settings

The Admin Portal is strictly separated from the customer experience:

- **Route:** `/admin/login` & `/admin/dashboard`
- **Protection:** Backend middleware (`authenticateToken` and `requireAdmin`) rejects non-admin accounts with HTTP 403 Forbidden.
- **Dashboard:** Displays database-derived statistics: Total Active Products, In-Stock, Out-of-Stock, and Inactive items. No fake revenue or sales numbers.
- **Product Management:** Full CRUD capabilities with image uploads (stored persistently in `server/uploads/`), configurable measurement units (`kg`, `g`, `piece`), price bases, stock counts, and activation toggles.
- **Stock Management:** Dedicated view to increment or decrement stock quantities.
- **WhatsApp Settings:** Admin can update the destination phone number at any time. The updated number is stored in MongoDB and used for all subsequent customer orders without redeployment.

---

## 9. PWA Features & Installation

- **Web App Manifest:** Configured in `client/public/manifest.webmanifest` with theme color `#F59E0B`, standalone display, and real icons.
- **Icon Assets:** 192×192, 512×512, maskable 512×512, and apple-touch-icon located in `client/public/icons/`.
- **Service Worker:** Powered by Workbox via `vite-plugin-pwa` for precaching the application shell. NetworkOnly strategy for `/api/` guarantees data freshness.
- **Offline Fallback:** `offline.html` displays if a user attempts to load the app without an internet connection.
- **Install Banner:** Tasteful install prompt appears on compatible mobile and desktop browsers.

---

## 10. Production Build & Deployment Guide

### Build Frontend

```bash
npm run build
```

The compiled assets will be output to `client/dist/`.

### Deployment Options

#### Option A: Independent Frontend & Backend (Recommended)

1. **Database:** Deploy a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Whitelist your server IP and obtain the connection string.
2. **Backend (Render / Railway / Heroku):**
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node server.js`
   - Set environment variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `MONGODB_URI=<your-atlas-uri>`
     - `SESSION_SECRET=<random-32-character-secret>`
     - `CLIENT_URL=https://your-frontend-domain.com`
     - `INITIAL_ADMIN_PHONE=919876543210`
     - `INITIAL_ADMIN_PASSWORD=<secure-password>`
     - `DEFAULT_WHATSAPP_NUMBER=919876543210`
3. **Frontend (Vercel / Netlify / Cloudflare Pages):**
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Configure reverse proxy or rewrite rules if serving API through a custom domain.

#### Option B: Unified Production Serving via Express

The Express server can serve `client/dist` statically in production. To enable this, add:
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('../client/dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve('../client/dist/index.html')));
}
```

---

## 11. Troubleshooting & FAQs

- **GPS Permission Denied:**
  - Browsers only permit Geolocation API on `https://` origins or `localhost`. Ensure production is served over HTTPS.
- **WhatsApp Web vs Mobile:**
  - The standard `https://wa.me/` protocol automatically directs mobile devices to the native WhatsApp app and desktop browsers to WhatsApp Web.
- **Cookies not persisting across domains:**
  - In production with separate domains (e.g. `api.domain.com` and `domain.com`), set `sameSite: 'none'` and `secure: true` on the authentication cookie.
- **Uploaded Images in Ephemeral Hosting:**
  - If deploying to serverless platforms with read-only filesystems (e.g. AWS Lambda or Vercel backend), configure Cloudinary or AWS S3 by pointing `imageUrl` in the product controller. On persistent VPS or container hosts (Docker, Railway volumes, DigitalOcean), the included Multer disk storage persists in `./uploads`.

---

## License

Crafted for **YNK Pickles**. All rights reserved.
