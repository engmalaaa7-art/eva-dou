/**
 * Eva Dou - Slide-Over Cart Drawer Component (Phase 3)
 * Dynamic side drawer showing line items, quantity controls, empty state, and checkout CTA
 */

class CartDrawerComponent {
  constructor() {
    this.overlay = null;
    this.drawer = null;
    this.headerBadge = document.getElementById('cart-count-badge');
    this.cartTrigger = document.getElementById('cart-trigger');
    this.cartStore = window.cartInstance || null;

    this.init();
  }

  init() {
    this.createDrawerDOM();
    this.bindEvents();
    this.subscribeToStore();

    // Initial render based on existing store state
    if (this.cartStore) {
      this.updateBadge(this.cartStore.getItemCount());
      this.render();
    }
  }

  createDrawerDOM() {
    const drawerHTML = `
      <div id="cart-drawer-overlay" class="cart-drawer-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="cart-drawer" class="cart-drawer-container">
          
          <!-- Drawer Header -->
          <div class="cart-drawer-header">
            <div class="cart-drawer-title-group">
              <h3 class="cart-drawer-title">Your Cart</h3>
              <span id="cart-drawer-count-tag" class="cart-drawer-count-tag">(0)</span>
            </div>
            <button id="cart-drawer-close" class="cart-drawer-close-btn" aria-label="Close cart drawer">&times;</button>
          </div>

          <!-- Drawer Scrollable Content -->
          <div id="cart-drawer-body" class="cart-drawer-body">
            <!-- Dynamically Rendered -->
          </div>

          <!-- Drawer Footer -->
          <div id="cart-drawer-footer" class="cart-drawer-footer">
            <div class="cart-drawer-subtotal-row">
              <span class="subtotal-label">Subtotal</span>
              <span id="cart-drawer-subtotal-val" class="subtotal-val">0 EGP</span>
            </div>
            <p class="cart-drawer-shipping-note">
              Shipping fee will be calculated upon order confirmation
            </p>
            <button id="cart-checkout-btn" class="btn btn-primary cart-checkout-btn">
              Proceed to Checkout
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);
    this.overlay = document.getElementById('cart-drawer-overlay');
    this.drawer = document.getElementById('cart-drawer');
  }

  bindEvents() {
    // Header cart trigger icon click
    if (this.cartTrigger) {
      this.cartTrigger.addEventListener('click', () => this.open());
    }

    // Close button click
    const closeBtn = document.getElementById('cart-drawer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Backdrop click
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

    // Delegated actions inside drawer body (qty increase/decrease, remove, continue shopping)
    const body = document.getElementById('cart-drawer-body');
    if (body) {
      body.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-action="remove"]');
        const decBtn = e.target.closest('[data-action="decrease"]');
        const incBtn = e.target.closest('[data-action="increase"]');
        const continueBtn = e.target.closest('#cart-continue-shopping-btn');

        const itemRow = e.target.closest('.cart-item-row');
        const productId = itemRow ? itemRow.dataset.productId : null;

        if (removeBtn && productId && this.cartStore) {
          this.cartStore.removeItem(productId);
        } else if (decBtn && itemRow && this.cartStore) {
          const qtyVal = itemRow.querySelector('.cart-qty-val');
          const currentQty = parseInt(qtyVal.textContent, 10) || 1;
          this.cartStore.updateQuantity(productId, currentQty - 1);
        } else if (incBtn && itemRow && this.cartStore) {
          const qtyVal = itemRow.querySelector('.cart-qty-val');
          const currentQty = parseInt(qtyVal.textContent, 10) || 1;
          this.cartStore.updateQuantity(productId, currentQty + 1);
        } else if (continueBtn) {
          this.close();
          const catalogSection = document.getElementById('product-catalog');
          if (catalogSection) {
            const headerHeight = document.getElementById('site-header')?.offsetHeight || 80;
            const targetPos = catalogSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
          }
        }
      });
    }

    // Checkout CTA button binding (for Phase 4 integration)
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (!this.cartStore || this.cartStore.getItemCount() === 0) return;
        
        // Dispatch checkout trigger event or invoke checkout component if available
        if (typeof window.checkoutModalInstance !== 'undefined' && window.checkoutModalInstance.open) {
          this.close();
          window.checkoutModalInstance.open();
        } else {
          window.dispatchEvent(new CustomEvent('eva_open_checkout'));
        }
      });
    }
  }

  subscribeToStore() {
    if (!this.cartStore && window.cartInstance) {
      this.cartStore = window.cartInstance;
    }

    if (this.cartStore) {
      this.cartStore.subscribe((state) => {
        this.updateBadge(state.count, state.action);
        this.render(state);
        
        // Automatically slide open drawer on item addition
        if (state.action === 'add') {
          this.open();
        }
      });
    }

    // Also listen to window custom event as fallback
    window.addEventListener('eva_cart_updated', (e) => {
      const state = e.detail;
      if (state) {
        this.updateBadge(state.count, state.action);
        this.render(state);
        if (state.action === 'add') {
          this.open();
        }
      }
    });
  }

  open() {
    if (!this.overlay) return;
    this.render(); // Ensure content is up to date
    this.overlay.classList.add('open');
    this.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
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

  updateBadge(count, action) {
    if (!this.headerBadge) {
      this.headerBadge = document.getElementById('cart-count-badge');
    }
    if (this.headerBadge) {
      this.headerBadge.textContent = count;

      // Pulse bump animation effect when items are updated/added
      if (action === 'add' || action === 'update') {
        this.headerBadge.classList.remove('bump');
        // Force reflow
        void this.headerBadge.offsetWidth;
        this.headerBadge.classList.add('bump');
      }
    }
  }

  render(state) {
    const store = this.cartStore || window.cartInstance;
    const items = state ? state.items : (store ? store.getCart() : []);
    const count = state ? state.count : (store ? store.getItemCount() : 0);
    const subtotal = state ? state.subtotal : (store ? store.getSubtotal() : 0);

    // Update count tag in drawer header
    const countTag = document.getElementById('cart-drawer-count-tag');
    if (countTag) {
      countTag.textContent = `(${count})`;
    }

    // Update subtotal display in drawer footer
    const subtotalVal = document.getElementById('cart-drawer-subtotal-val');
    if (subtotalVal) {
      subtotalVal.textContent = `${subtotal.toLocaleString()} EGP`;
    }

    // Toggle footer visibility / checkout button state
    const footer = document.getElementById('cart-drawer-footer');
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.disabled = items.length === 0;
    }

    const body = document.getElementById('cart-drawer-body');
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🌸</div>
          <h4 class="cart-empty-title">Your cart is currently empty</h4>
          <p class="cart-empty-text">
            Explore our Body Splash & Mist collection to discover your signature scent!
          </p>
          <button id="cart-continue-shopping-btn" class="btn btn-outline cart-empty-btn">
            Continue Shopping
          </button>
        </div>
      `;
    } else {
      body.innerHTML = `
        <ul class="cart-items-list">
          ${items.map(item => `
            <li class="cart-item-row" data-product-id="${item.productId}" data-item-id="${item.id}">
              <div class="cart-item-img-wrapper">
                <img 
                  src="${item.cardImage}" 
                  alt="${item.name}" 
                  class="cart-item-thumb" 
                  onerror="this.src='assets/images/hero.jpg'"
                >
              </div>
              <div class="cart-item-info">
                <div class="cart-item-header">
                  <h4 class="cart-item-name">${item.name}</h4>
                  <button class="cart-item-remove-btn" data-action="remove" aria-label="Remove ${item.name} from cart">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                <div class="cart-item-meta">
                  <span class="cart-item-size">${item.size}</span>
                  <span class="cart-item-unit-price">${item.price} EGP</span>
                </div>

                <div class="cart-item-actions">
                  <div class="cart-qty-controls">
                    <button class="cart-qty-btn" data-action="decrease" aria-label="Decrease quantity">-</button>
                    <span class="cart-qty-val">${item.quantity}</span>
                    <button class="cart-qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
                  </div>
                  <div class="cart-item-total">${(item.price * item.quantity).toLocaleString()} EGP</div>
                </div>
              </div>
            </li>
          `).join('')}
        </ul>
      `;
    }
  }
}

// Global Export Singleton
if (typeof window !== 'undefined') {
  window.CartDrawerComponent = CartDrawerComponent;
}
