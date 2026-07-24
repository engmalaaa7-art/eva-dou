/**
 * Eva Dou - Sequential Order Counter & Receipt Engine (Phase 4)
 * Generates sequential order numbers (#EVD-0001, #EVD-0002...), logs orders, and builds WhatsApp links.
 * NOTE: Strictly no emojis, minimal & luxury-focused format.
 */

// BUSINESS PHONE NUMBER & VODAFONE CASH CONFIGURATION
const EVA_DOU_WHATSAPP_NUMBER = '201002980954';

/**
 * Gets next sequential order ID starting from 1 (#EVD-0001, #EVD-0002...)
 */
function getNextOrderId() {
  try {
    let currentCounter = parseInt(localStorage.getItem('eva_dou_order_counter'), 10);
    if (isNaN(currentCounter) || currentCounter < 1) {
      currentCounter = 1;
    }
    const formattedId = `#EVD-${String(currentCounter).padStart(4, '0')}`;
    
    // Save next counter for future orders
    localStorage.setItem('eva_dou_order_counter', (currentCounter + 1).toString());
    return formattedId;
  } catch (e) {
    // Fallback if LocalStorage is disabled
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `#EVD-${randomDigits}`;
  }
}

/**
 * Saves order details to background order log in LocalStorage
 */
function logOrder(orderId, customerData, cartItems, subtotal) {
  try {
    const existingLog = JSON.parse(localStorage.getItem('eva_dou_orders_log') || '[]');
    const newOrderRecord = {
      orderId: orderId,
      timestamp: new Date().toISOString(),
      customer: customerData,
      items: cartItems,
      subtotal: subtotal
    };
    existingLog.push(newOrderRecord);
    localStorage.setItem('eva_dou_orders_log', JSON.stringify(existingLog));
    console.log(`Order ${orderId} logged successfully.`);
  } catch (e) {
    console.error('Failed to save order to local log:', e);
  }
}

/**
 * Helper to retrieve all logged orders history
 */
function getOrdersLog() {
  try {
    return JSON.parse(localStorage.getItem('eva_dou_orders_log') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Helper to set or reset the order counter
 */
function setOrderCounter(startValue = 1) {
  try {
    localStorage.setItem('eva_dou_order_counter', Math.max(1, startValue).toString());
    console.log(`Order counter set to start at ${startValue}`);
  } catch (e) {}
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
  const finalOrderId = orderId || getNextOrderId();

  // Log order in background storage
  logOrder(finalOrderId, customerData, cartItems, subtotal);

  // Track checkout analytics in EvaDatabase
  if (window.evaDB && typeof window.evaDB.trackCheckoutClick === 'function') {
    window.evaDB.trackCheckoutClick({
      orderId: finalOrderId,
      customer: customerData,
      items: cartItems,
      subtotal: subtotal
    });
  }

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
  window.generateOrderId = getNextOrderId;
  window.getNextOrderId = getNextOrderId;
  window.logOrder = logOrder;
  window.getOrdersLog = getOrdersLog;
  window.setOrderCounter = setOrderCounter;
  window.buildWhatsAppUrl = buildWhatsAppUrl;
}
