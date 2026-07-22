/**
 * Eva Dou - WhatsApp Utility & Receipt Engine (Phase 4)
 * Formats clean, itemized digital receipts and generates WhatsApp redirect URLs.
 * NOTE: Strictly no emojis, minimal & luxury-focused format.
 */

// BUSINESS PHONE NUMBER CONFIGURATION
// Business WhatsApp phone number: +201067568065
const EVA_DOU_WHATSAPP_NUMBER = '201067568065';

/**
 * Generates a unique order ID string e.g. #EVD-7391
 */
function generateOrderId() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `#EVD-${randomDigits}`;
}

/**
 * Formats digital receipt text and generates WhatsApp URL
 * @param {Object} customerData - { name, phone, city, address }
 * @param {Array} cartItems - List of line items from cart
 * @param {number} subtotal - Calculated subtotal amount in EGP
 * @param {string} orderId - Optional pre-generated order ID
 * @returns {string} WhatsApp URL with pre-filled message
 */
function buildWhatsAppUrl(customerData, cartItems, subtotal, orderId) {
  const finalOrderId = orderId || generateOrderId();
  const phoneNum = EVA_DOU_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');

  const itemsListText = cartItems.map(item => {
    return `- ${item.name} (${item.size}) x ${item.quantity} = ${item.price * item.quantity} EGP`;
  }).join('\n');

  const message = [
    'NEW ORDER FROM EVA DOU WEBSITE',
    '====================================',
    `Order ID: ${finalOrderId}`,
    `Customer Name: ${customerData.name.trim()}`,
    `Phone Number: ${customerData.phone.trim()}`,
    `City/Governorate: ${customerData.city.trim()}`,
    `Detailed Address: ${customerData.address.trim()}`,
    '',
    'ORDER DETAILS:',
    '------------------------------------',
    itemsListText,
    '',
    `SUBTOTAL: ${subtotal.toLocaleString()} EGP`,
    'Shipping Fee: Calculated upon order confirmation.',
    '====================================',
    'Thank you for choosing Eva Dou.'
  ].join('\n');

  return `https://wa.me/${phoneNum}?text=${encodeURIComponent(message)}`;
}

// Global Export Singleton / Utilities
if (typeof window !== 'undefined') {
  window.EVA_DOU_WHATSAPP_NUMBER = EVA_DOU_WHATSAPP_NUMBER;
  window.generateOrderId = generateOrderId;
  window.buildWhatsAppUrl = buildWhatsAppUrl;
}
