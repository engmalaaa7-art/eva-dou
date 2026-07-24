/**
 * Eva Dou - Unified Database & Analytics Storage Engine
 * Features zero-config LocalStorage persistence fallback + optional Supabase JS client integration.
 */

class EvaDatabase {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'eva_dou_db_products',
      ANALYTICS: 'eva_dou_db_analytics',
      VISITS_LOG: 'eva_dou_db_visits_log',
      PASSCODE: 'eva_dou_admin_passcode',
      SUPABASE_CONFIG: 'eva_dou_supabase_config'
    };

    this.defaultPasscode = 'evadou2026';
    this.supabase = null;

    this.init();
  }

  init() {
    this.initProducts();
    this.initAnalytics();
    this.initSupabaseIfAvailable();
  }

  /**
   * Initializes product database with default products and stock configuration
   */
  initProducts() {
    try {
      const existing = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
      if (!existing && typeof window.EVA_DOU_PRODUCTS !== 'undefined') {
        const initialProducts = window.EVA_DOU_PRODUCTS.map(p => ({
          ...p,
          inStock: true,
          stockCount: 50,
          ordersCount: 0,
          revenueGenerated: 0
        }));
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
      }
    } catch (e) {
      console.warn('LocalStorage error during product DB initialization:', e);
    }
  }

  /**
   * Initializes analytics state structure
   */
  initAnalytics() {
    try {
      const existing = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS);
      if (!existing) {
        const initialAnalytics = {
          totalUniqueVisits: 0,
          totalCheckoutClicks: 0,
          totalEstimatedRevenue: 0,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(initialAnalytics));
      }
    } catch (e) {
      console.warn('LocalStorage error during analytics DB initialization:', e);
    }
  }

  /**
   * Optional Supabase Client initialization wrapper
   */
  initSupabaseIfAvailable() {
    try {
      const configStr = localStorage.getItem(this.STORAGE_KEYS.SUPABASE_CONFIG);
      if (configStr && window.supabase && typeof window.supabase.createClient === 'function') {
        const config = JSON.parse(configStr);
        if (config.url && config.key) {
          this.supabase = window.supabase.createClient(config.url, config.key);
          console.log('Supabase client successfully initialized.');
        }
      }
    } catch (e) {
      console.warn('Supabase initialization fallback to LocalStorage:', e);
    }
  }

  /**
   * Fetch all products with live stock and pricing data
   */
  getProducts() {
    try {
      const dbProducts = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PRODUCTS) || '[]');
      if (dbProducts.length === 0 && typeof window.EVA_DOU_PRODUCTS !== 'undefined') {
        return window.EVA_DOU_PRODUCTS.map(p => ({
          ...p,
          inStock: true,
          stockCount: 50,
          ordersCount: 0,
          revenueGenerated: 0
        }));
      }
      return dbProducts;
    } catch (e) {
      return window.EVA_DOU_PRODUCTS || [];
    }
  }

  /**
   * Fetch a single product by ID
   */
  getProduct(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  /**
   * Update product stock, price, or availability
   * @param {string} id - Product ID
   * @param {Object} updates - { inStock, stockCount, price, badge, name }
   */
  updateProduct(id, updates) {
    try {
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return false;

      products[index] = {
        ...products[index],
        ...updates
      };

      if (updates.price !== undefined && products[index].variants && products[index].variants[0]) {
        products[index].variants[0].price = Number(updates.price);
      }

      if (updates.stockCount !== undefined) {
        const count = Number(updates.stockCount);
        products[index].stockCount = count;
        if (updates.inStock === undefined) {
          products[index].inStock = count > 0;
        }
      }

      localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

      // Trigger custom event for real-time UI updates
      window.dispatchEvent(new CustomEvent('eva_db_product_updated', {
        detail: { product: products[index] }
      }));

      return true;
    } catch (e) {
      console.error('Failed to update product in DB:', e);
      return false;
    }
  }

  /**
   * Tracks a page visit automatically (filters unique visitor by session key)
   */
  trackPageView() {
    try {
      let visitorId = sessionStorage.getItem('eva_visitor_session');
      const isNewVisitor = !visitorId;

      if (isNewVisitor) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        sessionStorage.setItem('eva_visitor_session', visitorId);
      }

      const analytics = this.getAnalytics();
      if (isNewVisitor) {
        analytics.totalUniqueVisits = (analytics.totalUniqueVisits || 0) + 1;
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

        // Log visit entry
        const visitsLog = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.VISITS_LOG) || '[]');
        visitsLog.push({ visitorId, timestamp: new Date().toISOString() });
        localStorage.setItem(this.STORAGE_KEYS.VISITS_LOG, JSON.stringify(visitsLog.slice(-500)));
      }

      return analytics;
    } catch (e) {
      console.error('Failed to track page view:', e);
    }
  }

  /**
   * Tracks a confirmed WhatsApp checkout order click & updates revenue + top seller stats
   */
  trackCheckoutClick(orderData) {
    try {
      const analytics = this.getAnalytics();
      const subtotal = Number(orderData.subtotal || 0);

      analytics.totalCheckoutClicks = (analytics.totalCheckoutClicks || 0) + 1;
      analytics.totalEstimatedRevenue = (analytics.totalEstimatedRevenue || 0) + subtotal;
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

      // Update individual product stats for top seller analytics
      const products = this.getProducts();
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
          const product = products.find(p => p.id === item.id || p.name === item.name);
          if (product) {
            product.ordersCount = (product.ordersCount || 0) + (item.quantity || 1);
            product.revenueGenerated = (product.revenueGenerated || 0) + ((item.price || 0) * (item.quantity || 1));
            // Automatically decrease stock count if tracked
            if (typeof product.stockCount === 'number' && product.stockCount > 0) {
              product.stockCount = Math.max(0, product.stockCount - (item.quantity || 1));
              if (product.stockCount === 0) {
                product.inStock = false;
              }
            }
          }
        });
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }

      window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', {
        detail: { analytics }
      }));

      return analytics;
    } catch (e) {
      console.error('Failed to track checkout click:', e);
    }
  }

  /**
   * Get analytics dashboard payload including Top Seller & stock summary
   */
  getAnalytics() {
    try {
      const defaultObj = {
        totalUniqueVisits: 1,
        totalCheckoutClicks: 0,
        totalEstimatedRevenue: 0
      };
      const analytics = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ANALYTICS) || JSON.stringify(defaultObj));

      // Calculate Top Seller & Inventory Stats dynamically
      const products = this.getProducts();
      let topSeller = null;
      let maxOrders = -1;
      let outOfStockCount = 0;

      products.forEach(p => {
        const orders = p.ordersCount || 0;
        if (orders > maxOrders) {
          maxOrders = orders;
          topSeller = p;
        }
        if (!p.inStock || p.stockCount === 0) {
          outOfStockCount++;
        }
      });

      return {
        ...analytics,
        topSeller: topSeller || products[0] || null,
        totalProducts: products.length,
        outOfStockCount
      };
    } catch (e) {
      return {
        totalUniqueVisits: 0,
        totalCheckoutClicks: 0,
        totalEstimatedRevenue: 0,
        topSeller: null,
        totalProducts: 0,
        outOfStockCount: 0
      };
    }
  }

  /**
   * Verify admin passcode
   */
  verifyPasscode(inputCode) {
    const savedCode = localStorage.getItem(this.STORAGE_KEYS.PASSCODE) || this.defaultPasscode;
    return inputCode === savedCode;
  }

  /**
   * Change admin passcode
   */
  setPasscode(newCode) {
    if (!newCode || newCode.trim().length < 4) return false;
    localStorage.setItem(this.STORAGE_KEYS.PASSCODE, newCode.trim());
    return true;
  }
}

// Global Singleton Export
if (typeof window !== 'undefined') {
  window.EvaDatabase = EvaDatabase;
  window.evaDB = new EvaDatabase();
}
