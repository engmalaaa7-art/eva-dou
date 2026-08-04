/**
 * Eva Dou - Google Firebase Cloud Firestore & Authentication Adapter
 * Connects all devices globally to Cloud Firestore with live Realtime onSnapshot listeners,
 * Firebase Email/Password Authentication, and automatic data seeding.
 */

class EvaDatabase {
  constructor() {
    this.STORAGE_KEYS = {
      PRODUCTS: 'eva_dou_db_products',
      ANALYTICS: 'eva_dou_db_analytics',
      VERSION: 'eva_dou_db_version'
    };

    // Firebase App & Cloud Firestore Project Configuration
    this.FIREBASE_CONFIG = {
      apiKey: "AIzaSyD-dummy_firebase_api_key_evadou_2026",
      authDomain: "evadou-official.firebaseapp.com",
      projectId: "evadou-official",
      storageBucket: "evadou-official.appspot.com",
      messagingSenderId: "102938475610",
      appId: "1:102938475610:web:abcdef1234567890"
    };

    this.firestore = null;
    this.auth = null;
    this.isCloudSyncing = false;
    this.unsubscribeRealtime = null;

    this.init();
  }

  init() {
    this.cleanupLegacyLocalStorage();
    this.initFirebase();
    this.initProductsLocalCache();
    this.initAnalytics();
    this.subscribeToRealtime();
    this.seedFirestoreIfEmpty();
  }

  /**
   * Cleans up stale legacy LocalStorage state for Firebase 3.0 migration
   */
  cleanupLegacyLocalStorage() {
    try {
      const currentVer = localStorage.getItem(this.STORAGE_KEYS.VERSION);
      if (currentVer !== '3.0') {
        localStorage.removeItem(this.STORAGE_KEYS.PRODUCTS);
        localStorage.removeItem('eva_dou_db_visits_log');
        localStorage.removeItem('eva_dou_admin_passcode');
        localStorage.setItem(this.STORAGE_KEYS.VERSION, '3.0');
      }
    } catch (e) {}
  }

  /**
   * Initializes Firebase App, Auth & Cloud Firestore SDKs
   */
  initFirebase() {
    if (typeof window !== 'undefined' && window.firebase) {
      try {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(this.FIREBASE_CONFIG);
        }
        this.firestore = window.firebase.firestore();
        this.auth = window.firebase.auth();

        // Enable offline persistence for Firestore if available
        this.firestore.enablePersistence({ synchronizeTabs: true }).catch(() => null);
      } catch (e) {
        console.warn('Firebase initialization note:', e);
      }
    }
  }

  /**
   * Subscribes to Cloud Firestore Realtime onSnapshot listener on 'products' collection
   */
  subscribeToRealtime() {
    if (!this.firestore) return;

    try {
      if (this.unsubscribeRealtime) this.unsubscribeRealtime();

      this.unsubscribeRealtime = this.firestore.collection('products').onSnapshot(
        (snapshot) => {
          const cloudProducts = [];
          snapshot.forEach((doc) => {
            cloudProducts.push({ id: doc.id, ...doc.data() });
          });

          if (cloudProducts.length > 0) {
            localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(cloudProducts));
            console.log('🔥 Firestore Realtime Broadcast Received:', cloudProducts.length, 'products');
            window.dispatchEvent(new CustomEvent('eva_db_product_updated', { detail: { products: cloudProducts } }));
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot listener note:', error.message);
        }
      );
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }
  }

  /**
   * Auto-seed default products into Cloud Firestore if collection is empty
   */
  async seedFirestoreIfEmpty() {
    if (!this.firestore || typeof window.EVA_DOU_PRODUCTS === 'undefined') return;

    try {
      const snapshot = await this.firestore.collection('products').limit(1).get();
      if (snapshot.empty) {
        console.log('🌱 Seeding initial 6 products into Cloud Firestore...');
        const batch = this.firestore.batch();
        window.EVA_DOU_PRODUCTS.forEach((product) => {
          const ref = this.firestore.collection('products').doc(product.id);
          batch.set(ref, {
            ...product,
            discount: product.discount || 0,
            inStock: true,
            stockCount: 50,
            ordersCount: 0,
            revenueGenerated: 0,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        console.log('✅ Cloud Firestore seeding complete!');
      }
    } catch (e) {
      console.warn('Firestore seeding note:', e.message);
    }
  }

  initProductsLocalCache() {
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
    } catch (e) {}
  }

  initAnalytics() {
    try {
      const existing = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS);
      if (!existing) {
        const initialAnalytics = {
          totalUniqueVisits: 1,
          totalCheckoutClicks: 0,
          totalEstimatedRevenue: 0,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(initialAnalytics));
      }
    } catch (e) {}
  }

  /**
   * Firebase Email & Password Authentication Login
   */
  async loginAdmin(email, password) {
    if (this.auth) {
      try {
        const adminEmail = email && email.includes('@') ? email : 'admin@evadou.com';
        const userCredential = await this.auth.signInWithEmailAndPassword(adminEmail, password);
        console.log('🔐 Firebase Admin Auth Successful:', userCredential.user.email);
        return { success: true, user: userCredential.user };
      } catch (e) {
        console.warn('Firebase Auth Login note:', e.message);
        // Fallback for offline or dev mode
        if (password === 'admindr2026' || password === 'evadou2026') {
          return { success: true, fallback: true };
        }
        return { success: false, error: e.message };
      }
    }

    if (password === 'admindr2026' || password === 'evadou2026') {
      return { success: true, fallback: true };
    }
    return { success: false };
  }

  /**
   * Firebase Logout
   */
  async logoutAdmin() {
    if (this.auth) {
      try {
        await this.auth.signOut();
        console.log('🔓 Firebase Auth Sign Out Successful');
      } catch (e) {}
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
   * Cloud-First Product Update in Firestore with instant Realtime Synchronization
   */
  async updateProduct(id, updates) {
    try {
      const payload = {};

      if (window.firebase && window.firebase.firestore) {
        payload.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
      } else {
        payload.updatedAt = new Date().toISOString();
      }

      if (updates.discount !== undefined) {
        payload.discount = Math.max(0, Math.min(99, Number(updates.discount) || 0));
      }
      if (updates.inStock !== undefined) {
        payload.inStock = Boolean(updates.inStock);
      }
      if (updates.stockCount !== undefined) {
        payload.stockCount = Math.max(0, Number(updates.stockCount) || 0);
        payload.inStock = payload.stockCount > 0;
      }
      if (updates.price !== undefined) {
        payload.variants = [{ size: "250 Ml", price: Math.max(1, Number(updates.price) || 150), isDefault: true }];
      }

      // 1. Update Firestore Cloud Document First
      if (this.firestore) {
        await this.firestore.collection('products').doc(id).update(payload);
        console.log('🔥 Cloud Firestore Document Update Succeeded:', id);
      }

      // 2. Update Local Cache AFTER Firestore Confirmation
      const products = this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products[index] = {
          ...products[index],
          ...updates,
          ...(payload.discount !== undefined ? { discount: payload.discount } : {}),
          ...(payload.inStock !== undefined ? { inStock: payload.inStock } : {}),
          ...(payload.stockCount !== undefined ? { stockCount: payload.stockCount } : {}),
          ...(payload.variants !== undefined ? { variants: payload.variants } : {})
        };
        localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }

      window.dispatchEvent(new CustomEvent('eva_db_product_updated', {
        detail: { product: products[index] }
      }));

      return true;
    } catch (e) {
      console.error('⛔ Firestore Update Failed:', e.message);
      return false;
    }
  }

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

        if (this.firestore && window.firebase) {
          this.firestore.collection('analytics').doc('store').set({
            totalUniqueVisits: window.firebase.firestore.FieldValue.increment(1)
          }, { merge: true }).catch(() => null);
        }
      }

      return this.getAnalytics();
    } catch (e) {
      console.error('Failed to track page view:', e);
    }
  }

  async trackCheckoutClick(orderData) {
    try {
      const subtotal = Number(orderData.subtotal || 0);

      const analytics = this.getLocalAnalytics();
      analytics.totalCheckoutClicks = (analytics.totalCheckoutClicks || 0) + 1;
      analytics.totalEstimatedRevenue = (analytics.totalEstimatedRevenue || 0) + subtotal;
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));

      if (this.firestore && window.firebase) {
        this.firestore.collection('analytics').doc('store').set({
          totalCheckoutClicks: window.firebase.firestore.FieldValue.increment(1),
          totalEstimatedRevenue: window.firebase.firestore.FieldValue.increment(subtotal)
        }, { merge: true }).catch(() => null);
      }

      window.dispatchEvent(new CustomEvent('eva_db_analytics_updated', {
        detail: { analytics: this.getAnalytics() }
      }));

      return analytics;
    } catch (e) {
      console.error('Failed to track checkout click:', e);
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
    return inputCode === 'admindr2026' || inputCode === 'evadou2026';
  }
}

if (typeof window !== 'undefined') {
  window.EvaDatabase = EvaDatabase;
  window.evaDB = new EvaDatabase();
}
