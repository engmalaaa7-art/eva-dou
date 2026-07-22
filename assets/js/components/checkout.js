/**
 * Eva Dou - Checkout Modal Component (Phase 4)
 * Streamlined delivery details form & instant WhatsApp order dispatch
 * NOTE: Strictly no emojis in form UI or output text.
 */

class CheckoutModalComponent {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.cartStore = window.cartInstance || null;

    this.init();
  }

  init() {
    this.createModalDOM();
    this.bindEvents();
  }

  createModalDOM() {
    const modalHTML = `
      <div id="checkout-modal-overlay" class="checkout-modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="checkout-modal" class="checkout-modal-container">
          
          <button id="checkout-modal-close" class="checkout-modal-close-btn" aria-label="Close checkout details">&times;</button>
          
          <div class="checkout-header">
            <span class="checkout-subtitle">EVA DOU DIRECT ORDER</span>
            <h2 class="checkout-title">Delivery & Contact Details</h2>
            <p class="checkout-description">
              Please complete your delivery details below. Clicking confirm will format your itemized receipt and open WhatsApp to send your order directly to our customer care team.
            </p>
          </div>

          <div id="checkout-body" class="checkout-body">
            <!-- Dynamic Form & Order Summary -->
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.overlay = document.getElementById('checkout-modal-overlay');
    this.modal = document.getElementById('checkout-modal');
  }

  bindEvents() {
    // Close button
    const closeBtn = document.getElementById('checkout-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Overlay backdrop click
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Custom event trigger from drawer or application
    window.addEventListener('eva_open_checkout', () => {
      this.open();
    });
  }

  open() {
    const store = this.cartStore || window.cartInstance;
    if (!store || store.getItemCount() === 0) {
      alert('Your cart is empty. Please select a product before proceeding to checkout.');
      return;
    }

    this.render();
    if (this.overlay) {
      this.overlay.classList.add('open');
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  isOpen() {
    return this.overlay && this.overlay.classList.contains('open');
  }

  render() {
    const store = this.cartStore || window.cartInstance;
    const items = store ? store.getCart() : [];
    const subtotal = store ? store.getSubtotal() : 0;
    const body = document.getElementById('checkout-body');

    if (!body) return;

    body.innerHTML = `
      <div class="checkout-grid">
        
        <!-- Left Column: Streamlined Delivery Form -->
        <div class="checkout-form-column">
          <form id="checkout-delivery-form" novalidate>
            
            <div id="checkout-error-banner" class="checkout-error-banner" style="display: none;"></div>

            <div class="form-group">
              <label for="cust-name" class="form-label">Full Name *</label>
              <input 
                type="text" 
                id="cust-name" 
                name="name" 
                class="form-input" 
                placeholder="e.g. Sarah Ahmed" 
                required
              >
            </div>

            <div class="form-group">
              <label for="cust-phone" class="form-label">Phone Number (WhatsApp Active) *</label>
              <input 
                type="tel" 
                id="cust-phone" 
                name="phone" 
                class="form-input" 
                placeholder="e.g. 01012345678" 
                required
              >
            </div>

            <div class="form-group">
              <label for="cust-city" class="form-label">City / Governorate *</label>
              <input 
                type="text" 
                id="cust-city" 
                name="city" 
                class="form-input" 
                placeholder="e.g. Cairo, Alexandria, Giza" 
                required
              >
            </div>

            <div class="form-group">
              <label for="cust-address" class="form-label">Detailed Address *</label>
              <textarea 
                id="cust-address" 
                name="address" 
                class="form-textarea" 
                rows="3" 
                placeholder="Street name, building number, apartment/floor number" 
                required
              ></textarea>
            </div>

            <button type="submit" id="checkout-submit-btn" class="btn btn-primary checkout-submit-btn">
              Confirm Order via WhatsApp
            </button>

          </form>
        </div>

        <!-- Right Column: Order Summary Card -->
        <div class="checkout-summary-column">
          <div class="summary-card">
            <h3 class="summary-card-title">Order Summary</h3>
            
            <ul class="summary-items-list">
              ${items.map(item => `
                <li class="summary-item-row">
                  <div class="summary-item-info">
                    <span class="summary-item-name">${item.name}</span>
                    <span class="summary-item-meta">${item.size} x ${item.quantity}</span>
                  </div>
                  <span class="summary-item-price">${(item.price * item.quantity).toLocaleString()} EGP</span>
                </li>
              `).join('')}
            </ul>

            <div class="summary-totals">
              <div class="summary-total-row">
                <span>Subtotal</span>
                <strong>${subtotal.toLocaleString()} EGP</strong>
              </div>
              <div class="summary-total-row shipping-row">
                <span>Shipping Fee</span>
                <small>Calculated upon order confirmation</small>
              </div>
            </div>

            <div class="summary-trust-notice">
              <p>Direct WhatsApp Order Confirmation</p>
              <small>No online payment required. Pay on delivery or via digital wallet after order confirmation.</small>
            </div>
          </div>
        </div>

      </div>
    `;

    this.bindFormEvents();
  }

  bindFormEvents() {
    const form = document.getElementById('checkout-delivery-form');
    const errorBanner = document.getElementById('checkout-error-banner');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('cust-name')?.value.trim() || '';
      const phone = document.getElementById('cust-phone')?.value.trim() || '';
      const city = document.getElementById('cust-city')?.value.trim() || '';
      const address = document.getElementById('cust-address')?.value.trim() || '';

      if (!name || !phone || !city || !address) {
        if (errorBanner) {
          errorBanner.style.display = 'block';
          errorBanner.textContent = 'Please fill out all required delivery fields (Name, Phone Number, City, and Address).';
        }
        return;
      }

      if (errorBanner) {
        errorBanner.style.display = 'none';
      }

      const store = this.cartStore || window.cartInstance;
      if (!store || store.getItemCount() === 0) return;

      const customerData = { name, phone, city, address };
      const cartItems = store.getCart();
      const subtotal = store.getSubtotal();
      const orderId = window.generateOrderId ? window.generateOrderId() : `#EVD-${Math.floor(1000 + Math.random() * 9000)}`;

      // Build WhatsApp URL via utility or fallback
      let whatsappUrl = '';
      if (typeof window.buildWhatsAppUrl === 'function') {
        whatsappUrl = window.buildWhatsAppUrl(customerData, cartItems, subtotal, orderId);
      } else {
        const phoneNum = (window.EVA_DOU_WHATSAPP_NUMBER || '201067568065').replace(/[^0-9]/g, '');
        const itemsText = cartItems.map(i => `- ${i.name} (${i.size}) x ${i.quantity} = ${i.price * i.quantity} EGP`).join('\n');
        const msg = [
          'NEW ORDER FROM EVA DOU WEBSITE',
          '====================================',
          `Order ID: ${orderId}`,
          `Customer Name: ${name}`,
          `Phone Number: ${phone}`,
          `City/Governorate: ${city}`,
          `Detailed Address: ${address}`,
          '',
          'ORDER DETAILS:',
          '------------------------------------',
          itemsText,
          '',
          `SUBTOTAL: ${subtotal.toLocaleString()} EGP`,
          'Shipping Fee: Calculated upon order confirmation.',
          '====================================',
          'Thank you for choosing Eva Dou.'
        ].join('\n');
        whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`;
      }

      // Clear cart
      store.clearCart();

      // Close modal and drawer
      this.close();
      if (window.cartDrawerInstance && window.cartDrawerInstance.close) {
        window.cartDrawerInstance.close();
      }

      // Redirect directly to WhatsApp
      window.location.href = whatsappUrl;
    });
  }
}

// Global Export Singleton
if (typeof window !== 'undefined') {
  window.CheckoutModalComponent = CheckoutModalComponent;
}
