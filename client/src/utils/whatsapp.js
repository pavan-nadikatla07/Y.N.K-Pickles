import { formatCurrency, formatUnit, formatPriceBasisLabel } from './pricing.js';

/**
 * Builds standard pre-filled order message according to YNK Pickles specifications
 */
export const buildWhatsAppOrderMessage = ({
  customer,
  items,
  grandTotal,
  subtotal,
  logistics = null,
  finalTotal,
  deliveryAddress = '',
  locationLink = '',
  deliveryNotes = ''
}) => {
  const customerName = customer?.name || 'Valued Customer';
  const customerPhone = customer?.phone || '';

  const header = `Hello YNK Pickles! I would like to place an order.\n\nCUSTOMER DETAILS\nName: ${customerName}\nPhone: ${customerPhone}\n`;

  let addressSection = '';
  if (deliveryAddress && deliveryAddress.trim()) {
    addressSection = `Delivery Address: ${deliveryAddress.trim()}\n`;
  }

  const itemsList = items
    .map((item, index) => {
      const p = item.product;
      const basisLabel = formatPriceBasisLabel(
        p.price,
        p.priceBasis,
        p.priceBasisUnit,
        p.measurementUnit
      );
      const qtyLabel = formatUnit(item.quantity, p.measurementUnit);
      const subtotalLabel = formatCurrency(item.subtotal);

      return `${index + 1}. ${p.name}\n   Quantity: ${qtyLabel}\n   Price: ${basisLabel}\n   Subtotal: ${subtotalLabel}\n`;
    })
    .join('\n');

  let totalSection = '';
  if (logistics) {
    const itemsSubtotalVal = subtotal !== undefined ? subtotal : grandTotal;
    const computedFinalTotal =
      finalTotal !== undefined
        ? finalTotal
        : itemsSubtotalVal + (logistics.logisticsCharge || 0);

    let logisticsLine = '';
    if (logistics.isInside) {
      logisticsLine = `Delivery / Logistics: FREE DELIVERY (Inside Tanuku Circle)`;
    } else {
      const dist = logistics.distanceKm ?? 0;
      const rate = logistics.ratePerKm ?? 10;
      const charge = logistics.logisticsCharge ?? Math.round(dist * rate);
      logisticsLine = `Delivery / Logistics: ${formatCurrency(charge)} (${dist} km road distance outside Tanuku Circle @ ₹${rate}/km)`;
    }

    totalSection = `\nPRICE BREAKDOWN\nItems Subtotal: ${formatCurrency(itemsSubtotalVal)}\n${logisticsLine}\nFINAL TOTAL: ${formatCurrency(computedFinalTotal)}\nTOTAL: ${formatCurrency(computedFinalTotal)}\n`;
  } else {
    totalSection = `\nTOTAL: ${formatCurrency(grandTotal)}\n`;
  }

  let locationSection = '';
  if (
    locationLink &&
    typeof locationLink === 'string' &&
    locationLink.startsWith('https://www.google.com/maps')
  ) {
    locationSection = `\nCUSTOMER LOCATION:\n${locationLink}\n`;
  }

  let notesSection = '';
  if (deliveryNotes && deliveryNotes.trim()) {
    notesSection = `\nDelivery Notes: ${deliveryNotes.trim()}\n`;
  }

  const footer = `\nPlease confirm the availability and delivery details for my order.\n\nThank you!`;

  return `${header}${addressSection}\nORDER ITEMS\n${itemsList}${totalSection}${locationSection}${notesSection}${footer}`;
};

/**
 * Normalizes destination number and creates official click-to-chat URL
 */
export const createWhatsAppUrl = (destinationNumber, message) => {
  if (!destinationNumber) return null;

  // Clean to digits only, no '+' or spaces or hyphens
  const cleanNumber = String(destinationNumber).replace(/\D/g, '');
  if (!cleanNumber) return null;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
};
