/**
 * Currency and pricing utilities for YNK Pickles
 */

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  }).format(num);
};

export const formatUnit = (quantity, unit) => {
  const qty = Number(quantity) || 0;
  if (unit === 'piece') {
    return qty === 1 ? '1 piece' : `${qty} pieces`;
  }
  return `${qty} ${unit}`;
};

export const formatPriceBasisLabel = (price, priceBasis, priceBasisUnit, measurementUnit) => {
  const formattedPrice = formatCurrency(price);
  if (priceBasisUnit) {
    return `${formattedPrice} per ${priceBasisUnit}`;
  }
  if (priceBasis && priceBasis > 1) {
    return `${formattedPrice} per ${priceBasis} ${measurementUnit}`;
  }
  return `${formattedPrice} per ${measurementUnit}`;
};

export const calculateItemSubtotal = (product, quantity) => {
  if (!product || !quantity || quantity <= 0) return 0;
  const basis = Number(product.priceBasis) || 1;
  const price = Number(product.price) || 0;
  const qty = Number(quantity);

  const subtotal = (qty / basis) * price;
  return Math.round(subtotal * 100) / 100;
};
