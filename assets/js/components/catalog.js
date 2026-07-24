/**
 * Eva Dou - Product Catalog Component
 * Renders product grid, badges, filter controls, and connects detail modal
 */

class CatalogComponent {
  constructor(productsContainerId, filterBarId) {
    this.container = document.getElementById(productsContainerId);
    this.filterBar = document.getElementById(filterBarId);
    this.activeCategory = 'all';

    this.init();
  }

  getProducts() {
    if (window.evaDB && typeof window.evaDB.getProducts === 'function') {
      return window.evaDB.getProducts();
    }
    return window.EVA_DOU_PRODUCTS || [];
  }

  init() {
    if (!this.container) return;
    this.renderFilterBar();
    this.renderCatalog(this.getProducts());
    this.bindEvents();
    this.listenToDBUpdates();
  }

  listenToDBUpdates() {
    window.addEventListener('eva_db_product_updated', () => {
      this.refresh();
    });
    window.addEventListener('eva_db_analytics_updated', () => {
      this.refresh();
    });
  }

  refresh() {
    const products = this.getProducts();
    if (this.activeCategory === 'all') {
      this.renderCatalog(products);
    } else if (this.activeCategory === 'body-splash') {
      this.renderCatalog(products.filter(p => p.category === 'body-splash'));
    }
  }

  renderFilterBar() {
    if (!this.filterBar) return;

    const categories = [
      { id: 'all', label: 'All Products' },
      { id: 'body-splash', label: 'Body Splash & Mist' },
      { id: 'perfumes', label: 'Perfumes (Coming Soon)' },
      { id: 'deodorants', label: 'Deodorants (Coming Soon)' }
    ];

    this.filterBar.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === this.activeCategory ? 'active' : ''}" data-category="${cat.id}">
        ${cat.label}
      </button>
    `).join('');
  }

  bindEvents() {
    // Filter click events
    if (this.filterBar) {
      this.filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        const cat = btn.dataset.category;
        this.activeCategory = cat;

        // Update active class
        this.filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const products = this.getProducts();
        // Filter products
        if (cat === 'all') {
          this.renderCatalog(products);
        } else if (cat === 'body-splash') {
          this.renderCatalog(products.filter(p => p.category === 'body-splash'));
        } else {
          // Empty state for upcoming categories
          this.renderEmptyCategory(btn.textContent.trim());
        }
      });
    }

    // Grid card click events (Quick view & Add to Cart)
    if (this.container) {
      this.container.addEventListener('click', (e) => {
        const quickViewBtn = e.target.closest('.btn-quick-view');
        const cardImageClick = e.target.closest('.product-card-img-wrapper');
        const cardTitleClick = e.target.closest('.product-card-title');
        const addToCartBtn = e.target.closest('.btn-add-cart');

        const card = e.target.closest('.product-card');
        if (!card) return;

        const productId = card.dataset.productId;
        const products = this.getProducts();
        const product = products.find(p => p.id === productId);

        if (!product) return;

        const isSoldOut = !product.inStock || product.stockCount === 0;

        if (quickViewBtn || cardImageClick || cardTitleClick) {
          e.preventDefault();
          if (window.productModalInstance) {
            window.productModalInstance.open(product);
          }
        } else if (addToCartBtn) {
          e.preventDefault();
          e.stopPropagation();

          if (isSoldOut) return; // Block additions if out of stock

          const defaultVariant = product.variants ? product.variants[0] : null;
          if (window.cartInstance) {
            window.cartInstance.addItem(product, defaultVariant, 1);

            // Visual checkmark feedback on button
            addToCartBtn.classList.add('added');
            addToCartBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `;
            setTimeout(() => {
              addToCartBtn.classList.remove('added');
              addToCartBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
                </svg>
              `;
            }, 1000);
          } else if (window.productModalInstance) {
            window.productModalInstance.open(product);
          }
        }
      });
    }
  }

  renderCatalog(productList) {
    if (!productList || productList.length === 0) {
      this.renderEmptyCategory('Selected Category');
      return;
    }

    this.container.innerHTML = productList.map(product => {
      const defaultVariant = product.variants ? product.variants[0] : { price: 150, size: '250 Ml' };
      const isSoldOut = !product.inStock || product.stockCount === 0;

      return `
        <article class="product-card ${isSoldOut ? 'sold-out' : ''}" data-product-id="${product.id}">
          <div class="product-card-img-wrapper">
            ${isSoldOut 
              ? `<span class="product-badge sold-out-badge">Sold Out</span>` 
              : `<span class="product-badge">${product.badge}</span>`
            }
            <img 
              src="${product.cardImage}" 
              alt="Eva Dou ${product.name} Body Splash" 
              class="product-card-img" 
              loading="lazy"
              onerror="this.src='assets/images/hero.jpg'"
            >
            <div class="product-card-overlay">
              <button class="btn btn-quick-view" aria-label="Quick view ${product.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Quick View
              </button>
            </div>
          </div>

          <div class="product-card-content">
            <span class="product-card-category">${product.categoryLabel}</span>
            <h3 class="product-card-title">${product.name}</h3>
            <p class="product-card-short">${product.shortDescription}</p>

            <div class="product-card-footer">
              <div class="product-pricing">
                <span class="product-size">${defaultVariant.size}</span>
                <span class="product-price">${defaultVariant.price} <small>EGP</small></span>
              </div>
              <button 
                class="btn-card-action btn-add-cart ${isSoldOut ? 'disabled' : ''}" 
                ${isSoldOut ? 'disabled' : ''} 
                aria-label="${isSoldOut ? `${product.name} is Sold Out` : `Add ${product.name} to Cart`}"
              >
                ${isSoldOut 
                  ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                  : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>`
                }
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  renderEmptyCategory(categoryName) {
    this.container.innerHTML = `
      <div class="category-empty-state">
        <div class="empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3>${categoryName} Line Arriving Soon</h3>
        <p>We are meticulously crafting new luxury fragrances for this line. Explore our signature <strong>Body Splash & Mist</strong> collection above!</p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-category=body-splash]').click()">
          View Body Splash Collection
        </button>
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.CatalogComponent = CatalogComponent;
}
