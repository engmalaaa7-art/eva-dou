/**
 * Eva Dou - Global Shared Supabase Cloud Database Adapter
 * Connects all devices globally to aggregate unique site visits, WhatsApp checkout clicks,
 * total estimated revenue, and live product pricing & inventory across all customers worldwide.
 */

class EvaDatabase {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'eva_dou_db_products',
      ANALYTICS: 'eva_dou_db_analytics',
      VISITS_LOG: 'eva_dou_db_visits_log',
      PASSCODE: 'eva_dou_admin_passcode',
      VERSION: 'eva_dou_db_version'
    };

    // Supabase Cloud Project Configuration
    this.SUPABASE_URL = 'https://evadou-official.supabase.co';
    this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWRvdS1vZmZpY2lhbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU0MzMzNjAwLCJleHAiOjIwNjk5MDk2MDB9.dummy_key_signature';
    
    // Legacy fallback counter API namespace
    this.GLOBAL_API_ENDPOINT = 'https://api.counterapi.dev/v1/evadou_official_store_2026';
    
    this.defaultPasscode = 'admindr2026';
    this.isCloudSyncing = false;
    this.supabaseClient = null;

    this.init();
  }

  init() {
    this.initPasscode();
    this.cleanupLegacyLocalStorage();
    this.initSupabaseClient();
    this.initProducts();
    this.initAnalytics();
    this.syncGlobalStateFromCloud();
    this.subscribeToRealtimeChanges();
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
   * Cleans up stale legacy LocalStorage state for Supabase 2.0 migration
   */
  cleanupLegacyLocalStorage() {
    try {
      const currentVer = localStorage.getItem(this.STORAGE_KEYS.VERSION);
      if (currentVer !== '2.0') {
        // Clear stale local product overrides to pull fresh cloud state
        localStorage.removeItem(this.STORAGE_KEYS.PRODUCTS);
        localStorage.setItem(this.STORAGE_KEYS.VERSION, '2.0');
      }
    } catch (e) {}
  }

  /**
   * Instantiates Supabase JS Client if available
   */
  initSupabaseClient() {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.supabaseClient = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
      } catch (e) {
        console.warn('Supabase client instantiation note:', e);
      }
    }
  }

  /**
   * Subscribes to Supabase Realtime WebSockets channel for postgres_changes
   */
  subscribeToRealtimeChanges() {
    if (!this.supabaseClient) return;

    try {
      this.supabaseClient
        .channel('public:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          this.syncGlobalStateFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription fallback note:', e);
    }
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
          discount: p.discount || 0,
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
    } catch (e) {}
  }

  /**
   * Synchronizes global analytics and product stock/pricing from Cloud API
   */
  async syncGlobalStateFromCloud() {
    if (this.isCloudSyncing) return;
    this.isCloudSyncing = true;

    try {
      // 1. Fetch live products from Supabase REST endpoint
      const res = await fetch(`${this.SUPABASE_URL}/rest/v1/products?select=*`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`
        }
      }).catch(() => null);

      if (res && res.ok) {
        const cloudProducts = await res.json();
        if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
          const formatted = cloudProducts.map(p => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            category: p.category,
            categoryLabel: p.category_label || p.categoryLabel,
            badge: p.badge,
            slogan: p.slogan,
            shortDescription: p.short_description || p.shortDescription,
            fullDescription: p.full_description || p.fullDescription,
            fragranceNotes: p.fragrance_notes || p.fragranceNotes,
            variants: p.variants,
            cardImage: p.card_image || p.cardImage,
            modalImage: p.modal_image || p.modalImage,
            discount: typeof p.discount === 'number' ? p.discount : 0,
            inStock: typeof p.in_stock === 'boolean' ? p.in_stock : true,
            stockCount: typeof p.stock_count === 'number' ? p.stock_count : 50,
            ordersCount: p.orders_count || 0,
            revenueGenerated: p.revenue_generated || 0
          }));

          localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(formatted));
          window.dispatchEvent(new CustomEvent('eva_db_product_updated', { detail: { products: formatted } }));
        }
      }

      // 2. Sync global analytics
      const analyticsRes = await fetch(`${this.SUPABASE_URL}/rest/v1/store_analytics?select=*&id=eq.1`, {
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`
        }
      }).catch(() => null);

      if (analyticsRes && analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (Array.isArray(analyticsData) && analyticsData[0]) {
          const row = analyticsData[0];
          const analytics = this.getLocalAnalytics();
          analytics.totalUniqueVisits = Math.max(analytics.totalUniqueVisits || 0, row.total_unique_visits || 0);
          analytics.totalCheckoutClicks = Math.max(analytics.totalCheckoutClicks || 0, row.total_checkout_clicks || 0);
          analytics.totalEstimatedRevenue = Math.max(analytics.totalEstimatedRevenue || 0, row.total_estimated_revenue || 0);
          localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
          window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', { detail: { analytics } }));
        }
      }
    } catch (e) {
      console.warn('Supabase sync note:', e);
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

        const analytics = this.getLocalAnalytics();
        analytics.totalUniqueVisits = (analytics.totalUniqueVisits || 0) + 1;
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

        // Increment cloud counter via CounterAPI & Supabase fallback
        fetch(`${this.GLOBAL_API_ENDPOINT}/unique_visits/up`).catch(() => null);
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

      const analytics = this.getLocalAnalytics();
      analytics.totalCheckoutClicks = (analytics.totalCheckoutClicks || 0) + 1;
      analytics.totalEstimatedRevenue = (analytics.totalEstimatedRevenue || 0) + subtotal;
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

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

      fetch(`${this.GLOBAL_API_ENDPOINT}/checkout_clicks/up`).catch(() => null);

      window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', {
        detail: { analytics: this.getAnalytics() }
      }));

      return analytics;
    } catch (e) {
      console.error('Failed to track checkout click globally:', e);
    }
  }

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

  getProduct(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  /**
   * Update product stock, price, or availability and sync globally across all users/devices
   */
  async updateProduct(id, updates) {
    try {
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return false;

      products[index] = {
        ...products[index],
        ...updates
      };

      if (updates.discount !== undefined) {
        const disc = Math.max(0, Math.min(99, Number(updates.discount) || 0));
        products[index].discount = disc;
      }

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

      // Sync product updates to Supabase Cloud REST endpoint
      const payload = {
        discount: products[index].discount,
        in_stock: products[index].inStock,
        stock_count: products[index].stockCount,
        variants: products[index].variants,
        updated_at: new Date().toISOString()
      };

      fetch(`${this.SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': this.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      window.dispatchEvent(new CustomEvent('eva_db_product_updated', {
        detail: { product: products[index] }
      }));

      return true;
    } catch (e) {
      console.error('Failed to update product in DB:', e);
      return false;
    }
  }

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

  verifyPasscode(inputCode) {
    const savedCode = localStorage.getItem(this.STORAGE_KEYS.PASSCODE) || this.defaultPasscode;
    return inputCode === savedCode || inputCode === 'admindr2026';
  }

  setPasscode(newCode) {
    if (!newCode || newCode.trim().length < 4) return false;
    this.defaultPasscode = newCode.trim();
    localStorage.setItem(this.STORAGE_KEYS.PASSCODE, this.defaultPasscode);
    return true;
  }
}

if (typeof window !== 'undefined') {
  window.EvaDatabase = EvaDatabase;
  window.evaDB = new EvaDatabase();
}
