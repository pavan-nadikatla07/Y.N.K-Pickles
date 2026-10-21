/**
 * Robust currency and pricing calculations
 * Avoids floating point inaccuracies.
 */

export const calculateItemSubtotal = (product, quantity) => {
  if (!product || !quantity || quantity <= 0) return 0;
  const basis = product.priceBasis || 1;
  const price = product.price || 0;

  // subtotal = (quantity / basis) * price
  const subtotal = (Number(quantity) / Number(basis)) * Number(price);
  return Math.round(subtotal * 100) / 100;
};

export const calculateCartDetails = (items) => {
  let grandTotal = 0;
  const validatedItems = [];
  const issues = [];

  for (const item of items) {
    const product = item.product;
    if (!product) {
      issues.push('An item in your cart is no longer available.');
      continue;
    }

    if (!product.isActive) {
      issues.push(`"${product.name}" is currently unavailable and has been marked inactive.`);
    }

    const isAvailable = product.isActive && product.stockQuantity > 0;
    const requestedQty = Number(item.quantity);
    const exceedsStock = requestedQty > product.stockQuantity;

    if (exceedsStock && isAvailable) {
      issues.push(
        `"${product.name}" stock is limited to ${product.stockQuantity} ${product.measurementUnit} (requested: ${requestedQty} ${product.measurementUnit}).`
      );
    }

    const subtotal = calculateItemSubtotal(product, requestedQty);
    if (isAvailable && !exceedsStock) {
      grandTotal += subtotal;
    }

    validatedItems.push({
      product: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        measurementUnit: product.measurementUnit,
        price: product.price,
        priceBasis: product.priceBasis,
        priceBasisUnit: product.priceBasisUnit,
        stockQuantity: product.stockQuantity,
        isActive: product.isActive,
        isStockAvailable: product.stockQuantity > 0
      },
      quantity: requestedQty,
      subtotal,
      hasStockIssue: exceedsStock || !isAvailable,
      stockIssueReason: !product.isActive
        ? 'Product inactive'
        : product.stockQuantity <= 0
        ? 'Out of stock'
        : exceedsStock
        ? `Exceeds stock of ${product.stockQuantity}`
        : null
    });
  }

  grandTotal = Math.round(grandTotal * 100) / 100;

  return {
    items: validatedItems,
    grandTotal,
    hasIssues: issues.length > 0,
    issues
  };
};
