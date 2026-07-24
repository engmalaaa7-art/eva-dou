/**
 * Eva Dou - Product Detail Modal Component
 * Renders high-res modal view with fragrance stories, size selectors & quantity controls
 */

class ProductModalComponent {
  constructor() {
    this.modalOverlay = null;
    this.currentProduct = null;
    this.selectedQuantity = 1;
    this.selectedVariant = null;

    this.init();
  }

  init() {
    this.createModalDOM();
    this.bindGlobalEvents();
  }

  createModalDOM() {
    const modalHTML = `
      <div id="product-modal-overlay" class="modal-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div class="modal-container">
          <button id="modal-close-btn" class="modal-close-btn" aria-label="Close product details">&times;</button>
          <div id="modal-content-body" class="modal-body">
            <!-- Dynamic Content Injected Here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modalOverlay = document.getElementById('product-modal-overlay');
  }

  bindGlobalEvents() {
    const closeBtn = document.getElementById('modal-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.close();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open(product) {
    if (!product) return;
    this.currentProduct = product;
    this.selectedQuantity = 1;
    this.selectedVariant = product.variants[0];

    this.renderModalContent();
    this.modalOverlay.classList.add('open');
    this.modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.modalOverlay) return;
    this.modalOverlay.classList.remove('open');
    this.modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  isOpen() {
    return this.modalOverlay && this.modalOverlay.classList.contains('open');
  }

  renderModalContent() {
    const liveProduct = (window.evaDB && typeof window.evaDB.getProduct === 'function') 
      ? (window.evaDB.getProduct(this.currentProduct.id) || this.currentProduct)
      : this.currentProduct;

    this.currentProduct = liveProduct;
    const p = this.currentProduct;
    const v = this.selectedVariant || p.variants[0];
    const body = document.getElementById('modal-content-body');
    const isSoldOut = !p.inStock || p.stockCount === 0;

    body.innerHTML = `
      <div class="modal-grid">
        <!-- Modal Left Image -->
        <div class="modal-visual">
          ${isSoldOut 
            ? `<span class="modal-badge sold-out-badge">Sold Out</span>` 
            : `<span class="modal-badge">${p.badge}</span>`
          }
          <img src="${p.modalImage}" alt="Eva Dou ${p.name}" class="modal-image ${isSoldOut ? 'sold-out' : ''}" onerror="this.src='${p.cardImage}'">
        </div>

        <!-- Modal Right Product Info -->
        <div class="modal-details">
          <div class="modal-header-info">
            <span class="modal-category">${p.categoryLabel}</span>
            <h2 class="modal-title">${p.name}</h2>
            <p class="modal-slogan">"${p.slogan || 'Not just a fragrance… it’s a story of femininity called Eva Dou'}"</p>
          </div>

          <div class="modal-price-box">
            <span class="modal-price">${v.price} <small>EGP</small></span>
            <span class="modal-size-tag">${v.size} Bottle</span>
          </div>

          <div class="modal-description-box">
            <h4 class="modal-subheading">Fragrance Story</h4>
            <p class="modal-description-text">${p.fullDescription}</p>
          </div>

          ${p.fragranceNotes ? `
            <div class="modal-notes-box">
              <h4 class="modal-subheading">Scent Profile & Notes</h4>
              <ul class="modal-notes-list">
                <li><strong>Top Notes:</strong> ${p.fragranceNotes.top}</li>
                <li><strong>Heart Notes:</strong> ${p.fragranceNotes.heart}</li>
                <li><strong>Base Notes:</strong> ${p.fragranceNotes.base}</li>
              </ul>
            </div>
          ` : ''}

          <!-- Size Selection -->
          <div class="modal-size-selector">
            <h4 class="modal-subheading">Select Size:</h4>
            <div class="size-options">
              ${p.variants.map(varItem => `
                <button class="size-btn ${varItem.size === v.size ? 'active' : ''}" data-size="${varItem.size}">
                  ${varItem.size} - ${varItem.price} EGP
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Quantity & Add to Cart Controls -->
          <div class="modal-action-row">
            <div class="quantity-control">
              <button class="qty-btn" id="modal-qty-minus" aria-label="Decrease quantity" ${isSoldOut ? 'disabled' : ''}>-</button>
              <span class="qty-value" id="modal-qty-val">${this.selectedQuantity}</span>
              <button class="qty-btn" id="modal-qty-plus" aria-label="Increase quantity" ${isSoldOut ? 'disabled' : ''}>+</button>
            </div>

            <button 
              class="btn btn-primary modal-add-cart-btn ${isSoldOut ? 'disabled' : ''}" 
              id="modal-add-cart-cta"
              ${isSoldOut ? 'disabled' : ''}
            >
              ${isSoldOut 
                ? 'Item Currently Sold Out' 
                : `
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart — ${(v.price * this.selectedQuantity).toFixed(0)} EGP
                `
              }
            </button>
          </div>

          <div class="modal-trust-footer">
            <span>Express Delivery Across Egypt</span>
            <span>Direct WhatsApp Checkout</span>
          </div>

        </div>
      </div>
    `;

    this.bindModalEvents();
  }

  bindModalEvents() {
    const minusBtn = document.getElementById('modal-qty-minus');
    const plusBtn = document.getElementById('modal-qty-plus');
    const qtyVal = document.getElementById('modal-qty-val');
    const ctaBtn = document.getElementById('modal-add-cart-cta');

    if (minusBtn && plusBtn && qtyVal) {
      minusBtn.addEventListener('click', () => {
        if (this.selectedQuantity > 1) {
          this.selectedQuantity--;
          qtyVal.textContent = this.selectedQuantity;
          this.updateCTAButtonText(ctaBtn);
        }
      });

      plusBtn.addEventListener('click', () => {
        if (this.selectedQuantity < 10) {
          this.selectedQuantity++;
          qtyVal.textContent = this.selectedQuantity;
          this.updateCTAButtonText(ctaBtn);
        }
      });
    }

    // Size option selector click handlers
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.size-btn');
        if (!targetBtn || !this.currentProduct) return;
        const size = targetBtn.dataset.size;
        const variant = this.currentProduct.variants.find(v => v.size === size);
        if (variant) {
          this.selectedVariant = variant;
          sizeBtns.forEach(b => b.classList.remove('active'));
          targetBtn.classList.add('active');
          this.updateCTAButtonText(ctaBtn);
        }
      });
    });

    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        if (window.cartInstance) {
          window.cartInstance.addItem(this.currentProduct, this.selectedVariant, this.selectedQuantity);
        }
        
        // Visual feedback
        ctaBtn.innerHTML = `Added ${this.selectedQuantity} to Cart!`;
        ctaBtn.style.backgroundColor = 'var(--accent-gold)';
        
        setTimeout(() => {
          this.close();
        }, 500);
      });
    }
  }

  updateCTAButtonText(btn) {
    if (!btn || !this.selectedVariant) return;
    const totalPrice = this.selectedVariant.price * this.selectedQuantity;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      Add to Cart — ${totalPrice} EGP
    `;
  }
}

if (typeof window !== 'undefined') {
  window.ProductModalComponent = ProductModalComponent;
}
