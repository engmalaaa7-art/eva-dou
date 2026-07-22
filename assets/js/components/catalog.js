/**
 * Eva Dou - Product Catalog Component
 * Renders product grid, badges, filter controls, and connects detail modal
 */

class CatalogComponent {
  constructor(productsContainerId, filterBarId) {
    this.container = document.getElementById(productsContainerId);
    this.filterBar = document.getElementById(filterBarId);
    this.products = window.EVA_DOU_PRODUCTS || [];
    this.activeCategory = 'all';

    this.init();
  }

  init() {
    if (!this.container) return;
    this.renderFilterBar();
    this.renderCatalog(this.products);
    this.bindEvents();
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

        // Filter products
        if (cat === 'all') {
          this.renderCatalog(this.products);
        } else if (cat === 'body-splash') {
          this.renderCatalog(this.products.filter(p => p.category === 'body-splash'));
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
        const product = this.products.find(p => p.id === productId);

        if (!product) return;

        if (quickViewBtn || cardImageClick || cardTitleClick) {
          e.preventDefault();
          if (window.productModalInstance) {
            window.productModalInstance.open(product);
          }
        } else if (addToCartBtn) {
          e.preventDefault();
          e.stopPropagation();
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
      const defaultVariant = product.variants[0];
      return `
        <article class="product-card" data-product-id="${product.id}">
          <div class="product-card-img-wrapper">
            <span class="product-badge">${product.badge}</span>
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
              <button class="btn-card-action btn-add-cart" aria-label="Add ${product.name} to Cart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
                </svg>
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
        <div class="empty-icon">✨</div>
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
