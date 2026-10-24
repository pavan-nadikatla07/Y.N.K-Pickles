import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';

const initialProducts = [
  {
    name: 'Traditional Avakaya Mango Pickle',
    slug: 'traditional-avakaya-mango-pickle',
    description:
      'Authentic Andhra style cut-mango pickle prepared with cold-pressed gingelly oil, mustard powder, and fiery Guntur red chillies.',
    imageUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'kg',
    price: 320,
    priceBasis: 1,
    priceBasisUnit: '1kg',
    stockQuantity: 30,
    minPurchaseQty: 1,
    purchaseIncrement: 1,
    isActive: true,
    isStockAvailable: true
  },
  {
    name: 'Spicy Andhra Gongura Pickle',
    slug: 'spicy-andhra-gongura-pickle',
    description:
      'Tangy sorrel leaves cooked down with garlic, fenugreek, and spices. A beloved staple of South Indian cuisine.',
    imageUrl:
      'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'g',
    price: 35,
    priceBasis: 100,
    priceBasisUnit: '100g',
    stockQuantity: 6000,
    minPurchaseQty: 100,
    purchaseIncrement: 100,
    isActive: true,
    isStockAvailable: true
  },
  {
    name: 'Sun-Cured Nimbu Lemon Pickle',
    slug: 'sun-cured-nimbu-lemon-pickle',
    description:
      'Juicy country lemons slowly aged under sunlight with sea salt, turmeric, and roasted cumin. Mildly spiced and digestion friendly.',
    imageUrl:
      'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'kg',
    price: 260,
    priceBasis: 1,
    priceBasisUnit: '1kg',
    stockQuantity: 20,
    minPurchaseQty: 1,
    purchaseIncrement: 1,
    isActive: true,
    isStockAvailable: true
  },
  {
    name: 'Pandu Mirapakaya (Ripe Red Chilli) Pickle',
    slug: 'pandu-mirapakaya-pickle',
    description:
      'Fresh red chillies ground with tangy tamarind pulp, mustard, and garlic. Rich red hue and intense aroma.',
    imageUrl:
      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'g',
    price: 40,
    priceBasis: 100,
    priceBasisUnit: '100g',
    stockQuantity: 4500,
    minPurchaseQty: 100,
    purchaseIncrement: 100,
    isActive: true,
    isStockAvailable: true
  },
  {
    name: 'Vellulli (Golden Garlic) Pickle',
    slug: 'vellulli-golden-garlic-pickle',
    description:
      'Whole peeled garlic cloves marinated in spicy tamarind gravy and roasted spice blend. Perfect with hot rice and ghee.',
    imageUrl:
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'g',
    price: 45,
    priceBasis: 100,
    priceBasisUnit: '100g',
    stockQuantity: 3500,
    minPurchaseQty: 100,
    purchaseIncrement: 100,
    isActive: true,
    isStockAvailable: true
  },
  {
    name: 'Traditional Ceramic Pickle Jar (Jaadi)',
    slug: 'traditional-ceramic-pickle-jar',
    description:
      'Handcrafted airtight glazed ceramic jar (Bharani) that preserves pickle freshness and authentic aroma for months.',
    imageUrl:
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    measurementUnit: 'piece',
    price: 199,
    priceBasis: 1,
    priceBasisUnit: 'piece',
    stockQuantity: 15,
    minPurchaseQty: 1,
    purchaseIncrement: 1,
    isActive: true,
    isStockAvailable: true
  }
];

const seedProducts = async () => {
  await connectDB();

  for (const item of initialProducts) {
    const existing = await Product.findOne({ slug: item.slug });
    if (!existing) {
      await Product.create(item);
      console.log(`[Seed] Created product: ${item.name}`);
    } else {
      console.log(`[Seed] Product already exists: ${item.name}`);
    }
  }

  console.log('[Seed] Products seeding completed successfully.');
  await disconnectDB();
  process.exit(0);
};

seedProducts().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
