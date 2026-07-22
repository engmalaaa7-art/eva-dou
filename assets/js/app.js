/**
 * Eva Dou - Main Application Orchestration Script (Phase 2)
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Eva Dou Application initialized.');
  console.log('Brand Slogan: "Not just a fragrance… it’s a story of femininity called Eva Dou"');

  // Initialize UI components
  initHeaderScrollEffect();
  initMobileMenu();
  initSmoothScroll();

  // Instantiate Reactive Cart Store Engine
  if (typeof window.CartStore !== 'undefined' && !window.cartInstance) {
    window.cartInstance = new window.CartStore();
  }

  // Instantiate Cart Drawer Component
  if (typeof window.CartDrawerComponent !== 'undefined') {
    window.cartDrawerInstance = new window.CartDrawerComponent();
  }

  // Instantiate Product Detail Modal
  if (typeof window.ProductModalComponent !== 'undefined') {
    window.productModalInstance = new window.ProductModalComponent();
  }

  // Instantiate Catalog Grid & Category Filters
  if (typeof window.CatalogComponent !== 'undefined') {
    window.catalogInstance = new window.CatalogComponent('product-grid', 'catalog-filters');
  }

  // Instantiate Checkout Modal Component
  if (typeof window.CheckoutModalComponent !== 'undefined') {
    window.checkoutModalInstance = new window.CheckoutModalComponent();
  }

  // Instantiate Voiceover Intro Component
  if (typeof window.EvaIntroComponent !== 'undefined') {
    window.evaIntroInstance = new window.EvaIntroComponent();
  }
});

/**
 * Header scroll shadow effect
 */
function initHeaderScrollEffect() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/**
 * Mobile Navigation Drawer toggle controls
 */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('mobile-menu-close');
  const overlay = document.getElementById('mobile-menu-overlay');
  const links = document.querySelectorAll('.mobile-nav-link');

  if (!toggleBtn || !overlay) return;

  const openMenu = () => overlay.classList.add('open');
  const closeMenu = () => overlay.classList.remove('open');

  toggleBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/**
 * Smooth scrolling for navigation anchor links
 */
function initSmoothScroll() {
  const anchors = document.querySelectorAll('a[href^="#"]');
  
  anchors.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerHeight = document.getElementById('site-header')?.offsetHeight || 80;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}
