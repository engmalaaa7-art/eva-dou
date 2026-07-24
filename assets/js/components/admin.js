/**
 * Eva Dou - Admin Dashboard & Authentication Component
 * Provides owner passcode authentication, real-time analytics monitoring,
 * top sellers spotlight, and non-technical inventory restock controls.
 */

class AdminComponent {
  constructor() {
    this.overlay = null;
    this.isAuthenticated = false;
    this.db = window.evaDB || (window.EvaDatabase ? new window.EvaDatabase() : null);

    this.init();
  }

  init() {
    this.createAdminOverlayDOM();
    this.bindGlobalEvents();
    this.checkSessionAuth();
  }

  checkSessionAuth() {
    try {
      const auth = sessionStorage.getItem('eva_admin_authenticated');
      if (auth === 'true') {
        this.isAuthenticated = true;
      }
    } catch (e) {}
  }

  createAdminOverlayDOM() {
    const overlayHTML = `
      <div id="admin-overlay" class="admin-overlay" role="dialog" aria-modal="true" aria-hidden="true">
        <div id="admin-container" style="width: 100%; display: flex; justify-content: center;">
          <!-- Dynamically populated Login or Dashboard view -->
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    this.overlay = document.getElementById('admin-overlay');
  }

  bindGlobalEvents() {
    // Listen for hash navigation e.g. #admin
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#admin') {
        this.open();
      }
    });

    // Listen for custom trigger event
    window.addEventListener('eva_open_admin', () => {
      this.open();
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Backdrop click
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
  }

  open() {
    if (this.overlay) {
      this.overlay.classList.add('open');
      this.overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (this.isAuthenticated) {
        this.renderDashboard();
      } else {
        this.renderLoginView();
      }
    }
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('open');
    this.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Clear #admin hash cleanly if present
    if (window.location.hash === '#admin') {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  isOpen() {
    return this.overlay && this.overlay.classList.contains('open');
  }

  /* --------------------------------------------------------------------------
     PASSCODE AUTHENTICATION VIEW
     -------------------------------------------------------------------------- */
  renderLoginView() {
    const container = document.getElementById('admin-container');
    if (!container) return;

    container.innerHTML = `
      <div class="admin-login-card">
        <button class="admin-login-close" id="admin-login-close" aria-label="Close admin login">&times;</button>
        
        <div class="admin-brand-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 class="admin-login-title">Owner Administration</h2>
        <p class="admin-login-subtitle">Enter your store passcode to manage stock, pricing, and view analytics.</p>

        <form id="admin-passcode-form" class="admin-passcode-form">
          <div class="admin-passcode-field">
            <input 
              type="password" 
              id="admin-passcode-input" 
              class="admin-passcode-input" 
              placeholder="••••••••" 
              autocomplete="current-password"
              required 
            />
          </div>

          <div id="admin-error-msg" class="admin-error-msg">
            Invalid passcode. Default is evadou2026
          </div>

          <button type="submit" class="btn-admin-login">
            Authenticate & Access Dashboard
          </button>
        </form>
      </div>
    `;

    const closeBtn = document.getElementById('admin-login-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const form = document.getElementById('admin-passcode-form');
    const input = document.getElementById('admin-passcode-input');
    const errorMsg = document.getElementById('admin-error-msg');

    if (input) setTimeout(() => input.focus(), 150);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = input ? input.value.trim() : '';
        const isValid = this.db ? this.db.verifyPasscode(code) : code === 'evadou2026';

        if (isValid) {
          this.isAuthenticated = true;
          try {
            sessionStorage.setItem('eva_admin_authenticated', 'true');
          } catch (err) {}
          this.renderDashboard();
        } else {
          if (errorMsg) {
            errorMsg.style.display = 'block';
            input.value = '';
            input.focus();
          }
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     NON-TECHNICAL OWNER DASHBOARD VIEW
     -------------------------------------------------------------------------- */
  renderDashboard() {
    const container = document.getElementById('admin-container');
    if (!container) return;

    const analytics = this.db ? this.db.getAnalytics() : {
      totalUniqueVisits: 1,
      totalCheckoutClicks: 0,
      totalEstimatedRevenue: 0,
      topSeller: null,
      outOfStockCount: 0
    };

    const products = this.db ? this.db.getProducts() : (window.EVA_DOU_PRODUCTS || []);
    const topSeller = analytics.topSeller || products[0];

    container.innerHTML = `
      <div class="admin-dashboard-container">
        
        <!-- Dashboard Header Bar -->
        <div class="admin-dash-header">
          <div class="admin-dash-title-group">
            <span class="admin-badge">Owner Mode</span>
            <h2 class="admin-dash-title">Eva Dou Control Center</h2>
          </div>
          <div class="admin-dash-actions">
            <button id="admin-refresh-btn" class="btn-admin-outline" title="Refresh data">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
            <button id="admin-logout-btn" class="btn-admin-close">
              Exit Admin
            </button>
          </div>
        </div>

        <!-- Dashboard Body Content -->
        <div class="admin-dash-body">
          
          <!-- Analytics Metric Cards Grid -->
          <div class="admin-metrics-grid">
            
            <!-- Unique Visitors Card -->
            <div class="metric-card">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="metric-info">
                <span class="metric-label">Unique Site Visitors</span>
                <span class="metric-value">${(analytics.totalUniqueVisits || 0).toLocaleString()}</span>
              </div>
            </div>

            <!-- Total WhatsApp Checkout Clicks Card -->
            <div class="metric-card">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <div class="metric-info">
                <span class="metric-label">WhatsApp Order Clicks</span>
                <span class="metric-value">${(analytics.totalCheckoutClicks || 0).toLocaleString()}</span>
              </div>
            </div>

            <!-- Total Estimated Revenue Card -->
            <div class="metric-card">
              <div class="metric-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="metric-info">
                <span class="metric-label">Estimated Revenue</span>
                <span class="metric-value">
                  ${(analytics.totalEstimatedRevenue || 0).toLocaleString()}
                  <span class="metric-unit">EGP</span>
                </span>
              </div>
            </div>

          </div>

          <!-- Top Seller Spotlight Banner -->
          <div class="admin-top-seller-banner">
            <div class="top-seller-content">
              <img 
                src="${topSeller ? topSeller.cardImage : 'assets/images/hero.jpg'}" 
                alt="${topSeller ? topSeller.name : 'Best Seller'}"
                class="top-seller-thumb"
                onerror="this.src='assets/images/hero.jpg'"
              >
              <div class="top-seller-details">
                <h4>🏆 Store Best Seller: ${topSeller ? topSeller.name : 'Burberry Hai'}</h4>
                <p>${topSeller ? topSeller.slogan : 'Elegance that accompanies your every step.'}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="stock-status-pill ${analytics.outOfStockCount > 0 ? 'out-of-stock' : 'in-stock'}">
                ${analytics.outOfStockCount === 0 ? 'All 6 Items In Stock' : `${analytics.outOfStockCount} Items Sold Out`}
              </span>
            </div>
          </div>

          <!-- Inventory & Restock Controls Table Section -->
          <div>
            <div class="admin-section-header">
              <h3 class="admin-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                Inventory Restock Controls & Pricing
              </h3>
            </div>

            <div class="admin-table-wrapper">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Stock Count</th>
                    <th>Price (EGP)</th>
                    <th>One-Click Availability</th>
                  </tr>
                </thead>
                <tbody>
                  ${products.map(p => {
                    const variant = p.variants ? p.variants[0] : { price: 150 };
                    const price = variant.price || 150;
                    const isAvailable = p.inStock && (p.stockCount === undefined || p.stockCount > 0);

                    return `
                      <tr data-product-id="${p.id}">
                        <td>
                          <div class="product-row-info">
                            <img 
                              src="${p.cardImage}" 
                              alt="${p.name}" 
                              class="product-row-img"
                              onerror="this.src='assets/images/hero.jpg'"
                            >
                            <div>
                              <div class="product-row-title">${p.name}</div>
                              <small style="color: #A8A29E;">250 Ml Mist</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="stock-status-pill ${isAvailable ? 'in-stock' : 'out-of-stock'}">
                            ${isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td>
                          <div class="stock-ctrl-group">
                            <button class="btn-stock-qty btn-qty-minus" data-action="minus">-</button>
                            <input 
                              type="number" 
                              class="stock-input-num" 
                              value="${p.stockCount !== undefined ? p.stockCount : 50}"
                              min="0"
                              max="999"
                            />
                            <button class="btn-stock-qty btn-qty-plus" data-action="plus">+</button>
                          </div>
                        </td>
                        <td>
                          <div class="stock-ctrl-group">
                            <input 
                              type="number" 
                              class="price-input-num" 
                              value="${price}"
                              min="1"
                              step="5"
                            />
                            <small style="color: #C59B6A;">EGP</small>
                          </div>
                        </td>
                        <td>
                          <button class="btn-toggle-status ${isAvailable ? 'mark-soldout' : 'mark-available'}" data-product-id="${p.id}">
                            ${isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;

    this.bindDashboardEvents();
  }

  bindDashboardEvents() {
    const refreshBtn = document.getElementById('admin-refresh-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.renderDashboard());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.isAuthenticated = false;
        try {
          sessionStorage.removeItem('eva_admin_authenticated');
        } catch (e) {}
        this.close();
      });
    }

    // Bind Table Interactions (Stock +/- buttons, Price changes, Status Toggles)
    const tableBody = document.querySelector('.admin-table tbody');
    if (tableBody) {
      tableBody.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.btn-toggle-status');
        const qtyBtn = e.target.closest('.btn-stock-qty');

        if (toggleBtn) {
          const row = toggleBtn.closest('tr');
          const productId = row.dataset.productId;
          const currentProduct = this.db ? this.db.getProduct(productId) : null;
          if (currentProduct) {
            const nextStatus = !currentProduct.inStock;
            const newStockCount = nextStatus ? (currentProduct.stockCount > 0 ? currentProduct.stockCount : 50) : 0;
            this.db.updateProduct(productId, { inStock: nextStatus, stockCount: newStockCount });
            this.renderDashboard();
          }
        } else if (qtyBtn) {
          const row = qtyBtn.closest('tr');
          const productId = row.dataset.productId;
          const action = qtyBtn.dataset.action;
          const input = row.querySelector('.stock-input-num');
          if (input && productId) {
            let currentVal = parseInt(input.value, 10) || 0;
            if (action === 'plus') currentVal++;
            if (action === 'minus') currentVal = Math.max(0, currentVal - 1);
            
            input.value = currentVal;
            const inStock = currentVal > 0;
            this.db.updateProduct(productId, { stockCount: currentVal, inStock });
            this.renderDashboard();
          }
        }
      });

      // Handle direct manual input change for stock & price
      tableBody.addEventListener('change', (e) => {
        const stockInput = e.target.closest('.stock-input-num');
        const priceInput = e.target.closest('.price-input-num');
        const row = e.target.closest('tr');

        if (!row) return;
        const productId = row.dataset.productId;

        if (stockInput && productId) {
          const count = Math.max(0, parseInt(stockInput.value, 10) || 0);
          this.db.updateProduct(productId, { stockCount: count, inStock: count > 0 });
          this.renderDashboard();
        } else if (priceInput && productId) {
          const newPrice = Math.max(1, parseFloat(priceInput.value) || 150);
          this.db.updateProduct(productId, { price: newPrice });
          this.renderDashboard();
        }
      });
    }
  }
}

// Export Global Instance
if (typeof window !== 'undefined') {
  window.AdminComponent = AdminComponent;
}
