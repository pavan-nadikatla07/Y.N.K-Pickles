import { describe, it, expect } from 'vitest';
import {
  calculateItemSubtotal,
  formatCurrency,
  formatUnit,
  formatPriceBasisLabel
} from '../utils/pricing.js';
import {
  buildWhatsAppOrderMessage,
  createWhatsAppUrl
} from '../utils/whatsapp.js';

describe('Pricing & Currency Calculations', () => {
  it('calculates kg unit subtotal correctly', () => {
    // 2 kg of Avakaya at ₹320 per kg
    const product = { price: 320, priceBasis: 1, measurementUnit: 'kg' };
    const subtotal = calculateItemSubtotal(product, 2);
    expect(subtotal).toBe(640);
  });

  it('calculates grams unit subtotal with price basis accurately', () => {
    // 500 g of Gongura at ₹35 per 100 g
    const product = { price: 35, priceBasis: 100, measurementUnit: 'g' };
    const subtotal = calculateItemSubtotal(product, 500);
    expect(subtotal).toBe(175);
  });

  it('calculates piece unit subtotal accurately', () => {
    // 3 ceramic jars at ₹199 each
    const product = { price: 199, priceBasis: 1, measurementUnit: 'piece' };
    const subtotal = calculateItemSubtotal(product, 3);
    expect(subtotal).toBe(597);
  });

  it('handles decimal precision without floating point drift', () => {
    // 250 g at ₹33.50 per 100 g -> (250 / 100) * 33.50 = 83.75
    const product = { price: 33.5, priceBasis: 100, measurementUnit: 'g' };
    const subtotal = calculateItemSubtotal(product, 250);
    expect(subtotal).toBe(83.75);
  });

  it('formats units correctly for kg, g, and pieces', () => {
    expect(formatUnit(1, 'kg')).toBe('1 kg');
    expect(formatUnit(500, 'g')).toBe('500 g');
    expect(formatUnit(1, 'piece')).toBe('1 piece');
    expect(formatUnit(3, 'piece')).toBe('3 pieces');
  });

  it('formats price basis label clearly', () => {
    expect(formatPriceBasisLabel(300, 1, '1kg', 'kg')).toBe('₹300 per 1kg');
    expect(formatPriceBasisLabel(35, 100, '100g', 'g')).toBe('₹35 per 100g');
    expect(formatPriceBasisLabel(150, 1, 'piece', 'piece')).toBe('₹150 per piece');
  });
});

describe('WhatsApp Message Generation & URL Encoding', () => {
  const customer = {
    name: 'Suresh Kumar',
    phone: '919876543210'
  };

  const items = [
    {
      product: {
        name: 'Traditional Avakaya Mango Pickle',
        price: 300,
        priceBasis: 1,
        priceBasisUnit: '1kg',
        measurementUnit: 'kg'
      },
      quantity: 1,
      subtotal: 300
    },
    {
      product: {
        name: 'Spicy Gongura Pickle',
        price: 35,
        priceBasis: 100,
        priceBasisUnit: '100g',
        measurementUnit: 'g'
      },
      quantity: 500,
      subtotal: 175
    }
  ];

  it('builds standard WhatsApp message with all customer and item details', () => {
    const message = buildWhatsAppOrderMessage({
      customer,
      items,
      grandTotal: 475,
      locationLink: 'https://www.google.com/maps?q=17.385044,78.486671'
    });

    expect(message).toContain('Hello YNK Pickles! I would like to place an order.');
    expect(message).toContain('Name: Suresh Kumar');
    expect(message).toContain('Phone: 919876543210');
    expect(message).toContain('Traditional Avakaya Mango Pickle');
    expect(message).toContain('Quantity: 1 kg');
    expect(message).toContain('Spicy Gongura Pickle');
    expect(message).toContain('Quantity: 500 g');
    expect(message).toContain('TOTAL: ₹475');
    expect(message).toContain('CUSTOMER LOCATION:');
    expect(message).toContain('https://www.google.com/maps?q=17.385044,78.486671');
    expect(message).toContain('Please confirm the availability and delivery details for my order.');
  });

  it('omits location section if no GPS link provided', () => {
    const message = buildWhatsAppOrderMessage({
      customer,
      items,
      grandTotal: 475,
      locationLink: null
    });

    expect(message).not.toContain('CUSTOMER LOCATION:');
  });

  it('creates clean wa.me URL without plus signs or spaces', () => {
    const message = 'Hello YNK Pickles!';
    const rawPhone = '+91 98765-43210';
    const url = createWhatsAppUrl(rawPhone, message);

    expect(url).toBe('https://wa.me/919876543210?text=Hello%20YNK%20Pickles!');
    expect(url).not.toContain('+');
    expect(url).not.toContain(' ');
    expect(url).not.toContain('-');
  });
});
