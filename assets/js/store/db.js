/**
 * Eva Dou - Global Shared Cloud Database & Analytics Storage Engine
 * Connects all devices globally to aggregate unique site visits, WhatsApp checkout clicks,
 * total estimated revenue, and live product inventory state across all customers worldwide.
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

    // Public central REST backend namespace for Eva Dou global shared storage
    this.GLOBAL_API_ENDPOINT = 'https://api.counterapi.dev/v1/evadou_official_store_2026';
    
    // Updated default admin passcode
    this.defaultPasscode = 'admindr2026';
    this.isCloudSyncing = false;

    this.init();
  }

  init() {
    this.initPasscode();
    this.initProducts();
    this.initAnalytics();
    this.syncGlobalStateFromCloud();
  }

  /**
   * Initializes / updates admin passcode
   */
  initPasscode() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.PASSCODE, this.defaultPasscode);
    } catch (e) {}
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
   * Synchronizes global analytics and product stock/pricing from cloud REST backend
   */
  async syncGlobalStateFromCloud() {
    if (this.isCloudSyncing) return;
    this.isCloudSyncing = true;

    try {
      // 1. Sync global unique visit counter
      const visitRes = await fetch(`${this.GLOBAL_API_ENDPOINT}/unique_visits/`).catch(() => null);
      if (visitRes && visitRes.ok) {
        const visitData = await visitRes.json();
        if (typeof visitData.count === 'number' && visitData.count > 0) {
          const analytics = this.getLocalAnalytics();
          analytics.totalUniqueVisits = Math.max(analytics.totalUniqueVisits || 0, visitData.count);
          localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
        }
      }

      // 2. Sync global checkout clicks
      const checkoutRes = await fetch(`${this.GLOBAL_API_ENDPOINT}/checkout_clicks/`).catch(() => null);
      if (checkoutRes && checkoutRes.ok) {
        const checkoutData = await checkoutRes.json();
        if (typeof checkoutData.count === 'number') {
          const analytics = this.getLocalAnalytics();
          analytics.totalCheckoutClicks = Math.max(analytics.totalCheckoutClicks || 0, checkoutData.count);
          localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
        }
      }

      // 3. Sync global estimated revenue
      const revenueRes = await fetch(`${this.GLOBAL_API_ENDPOINT}/estimated_revenue/`).catch(() => null);
      if (revenueRes && revenueRes.ok) {
        const revenueData = await revenueRes.json();
        if (typeof revenueData.count === 'number') {
          const analytics = this.getLocalAnalytics();
          analytics.totalEstimatedRevenue = Math.max(analytics.totalEstimatedRevenue || 0, revenueData.count);
          localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
        }
      }

      // 4. Sync product inventory & stock availability globally for all products
      const products = this.getProducts();
      let hasProductChanges = false;

      for (let p of products) {
        const cleanId = p.id.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Query cloud out-of-stock counter
        const stockRes = await fetch(`${this.GLOBAL_API_ENDPOINT}/stock_${cleanId}_out/`).catch(() => null);
        if (stockRes && stockRes.ok) {
          const stockData = await stockRes.json();
          if (typeof stockData.count === 'number') {
            const isCloudSoldOut = stockData.count > 0;
            if (p.inStock === isCloudSoldOut) {
              p.inStock = !isCloudSoldOut;
              p.stockCount = isCloudSoldOut ? 0 : (p.stockCount || 50);
              hasProductChanges = true;
            }
          }
        }
      }

      if (hasProductChanges) {
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        window.dispatchEvent(new CustomEvent('eva_db_product_updated', {
          detail: { products }
        }));
      }

      // Broadcast analytics update event
      window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', {
        detail: { analytics: this.getAnalytics() }
      }));

    } catch (e) {
      console.warn('Cloud state sync note:', e.message);
    } finally {
      this.isCloudSyncing = false;
    }
  }

  /**
   * Tracks a page visit globally across all devices
   */
  async trackPageView() {
    try {
      let visitorId = sessionStorage.getItem('eva_visitor_session');
      const isNewVisitor = !visitorId;

      if (isNewVisitor) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        sessionStorage.setItem('eva_visitor_session', visitorId);

        // Increment local state immediately
        const analytics = this.getLocalAnalytics();
        analytics.totalUniqueVisits = (analytics.totalUniqueVisits || 0) + 1;
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

        // Increment global cloud counter
        fetch(`${this.GLOBAL_API_ENDPOINT}/unique_visits/up`)
          .then(res => res.json())
          .then(data => {
            if (data && typeof data.count === 'number') {
              analytics.totalUniqueVisits = Math.max(analytics.totalUniqueVisits, data.count);
              localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
              window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', { detail: { analytics } }));
            }
          })
          .catch(err => console.warn('Global visit track offline fallback:', err));
      } else {
        this.syncGlobalStateFromCloud();
      }

      return this.getAnalytics();
    } catch (e) {
      console.error('Failed to track page view:', e);
    }
  }

  /**
   * Tracks a confirmed WhatsApp checkout order click & updates global revenue + top seller stats
   */
  async trackCheckoutClick(orderData) {
    try {
      const subtotal = Number(orderData.subtotal || 0);

      // Update local analytics state immediately
      const analytics = this.getLocalAnalytics();
      analytics.totalCheckoutClicks = (analytics.totalCheckoutClicks || 0) + 1;
      analytics.totalEstimatedRevenue = (analytics.totalEstimatedRevenue || 0) + subtotal;
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

      // Update individual product stats locally
      const products = this.getProducts();
      if (Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
          const product = products.find(p => p.id === item.id || p.name === item.name);
          if (product) {
            product.ordersCount = (product.ordersCount || 0) + (item.quantity || 1);
            product.revenueGenerated = (product.revenueGenerated || 0) + ((item.price || 0) * (item.quantity || 1));
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

      // Increment global cloud checkout counter
      fetch(`${this.GLOBAL_API_ENDPOINT}/checkout_clicks/up`).catch(() => null);

      // Increment global cloud revenue counter
      if (subtotal > 0) {
        fetch(`${this.GLOBAL_API_ENDPOINT}/estimated_revenue/up`).catch(() => null);
        for (let i = 1; i < subtotal; i += 100) {
          fetch(`${this.GLOBAL_API_ENDPOINT}/estimated_revenue/up`).catch(() => null);
        }
      }

      window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', {
        detail: { analytics: this.getAnalytics() }
      }));

      return analytics;
    } catch (e) {
      console.error('Failed to track checkout click globally:', e);
    }
  }

  /**
   * Fetch local analytics object
   */
  getLocalAnalytics() {
    try {
      const defaultObj = {
        totalUniqueVisits: 1,
        totalCheckoutClicks: 0,
        totalEstimatedRevenue: 0
      };
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ANALYTICS) || JSON.stringify(defaultObj));
    } catch (e) {
      return { totalUniqueVisits: 1, totalCheckoutClicks: 0, totalEstimatedRevenue: 0 };
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
   * Update product stock, price, or availability and sync globally across all users/devices
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

      // Broadcast update to global cloud REST API so all customers on any device see changes instantly
      const cleanId = id.replace(/[^a-zA-Z0-9_]/g, '_');
      if (products[index].inStock === false || products[index].stockCount === 0) {
        fetch(`${this.GLOBAL_API_ENDPOINT}/stock_${cleanId}_out/up`).catch(() => null);
      } else {
        // Reset cloud out-of-stock counter when restocked
        fetch(`${this.GLOBAL_API_ENDPOINT}/stock_${cleanId}_out/down`).catch(() => null);
      }

      // Broadcast event for real-time local UI updates across storefront
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
   * Get analytics dashboard payload including Top Seller & stock summary
   */
  getAnalytics() {
    const analytics = this.getLocalAnalytics();
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
  }

  /**
   * Verify admin passcode against admindr2026
   */
  verifyPasscode(inputCode) {
    const savedCode = localStorage.getItem(this.STORAGE_KEYS.PASSCODE) || this.defaultPasscode;
    return inputCode === savedCode || inputCode === 'admindr2026';
  }

  /**
   * Change admin passcode
   */
  setPasscode(newCode) {
    if (!newCode || newCode.trim().length < 4) return false;
    this.defaultPasscode = newCode.trim();
    localStorage.setItem(this.STORAGE_KEYS.PASSCODE, this.defaultPasscode);
    return true;
  }
}

// Global Singleton Export
if (typeof window !== 'undefined') {
  window.EvaDatabase = EvaDatabase;
  window.evaDB = new EvaDatabase();
}
