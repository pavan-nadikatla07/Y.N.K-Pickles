import { formatCurrency, formatUnit, formatPriceBasisLabel } from './pricing.js';

/**
 * Builds standard pre-filled order message according to YNK Pickles specifications
 */
export const buildWhatsAppOrderMessage = ({ customer, items, grandTotal, locationLink }) => {
  const customerName = customer?.name || 'Valued Customer';
  const customerPhone = customer?.phone || '';

  const header = `Hello YNK Pickles! I would like to place an order.\n\nCUSTOMER DETAILS\nName: ${customerName}\nPhone: ${customerPhone}\n\nORDER ITEMS\n`;

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

  const totalSection = `\nTOTAL: ${formatCurrency(grandTotal)}\n`;

  let locationSection = '';
  if (locationLink && typeof locationLink === 'string' && locationLink.startsWith('https://www.google.com/maps')) {
    locationSection = `\nCUSTOMER LOCATION:\n${locationLink}\n`;
  }

  const footer = `\nPlease confirm the availability and delivery details for my order.\n\nThank you!`;

  return `${header}${itemsList}${totalSection}${locationSection}${footer}`;
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
