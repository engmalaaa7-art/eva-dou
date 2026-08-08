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
      apiKey: "AIzaSyCyf83A9--HvGtLWKyAzvbTg0CK8UCH34Y",
      authDomain: "evadou-official.firebaseapp.com",
      projectId: "evadou-official",
      storageBucket: "evadou-official.firebasestorage.app",
      messagingSenderId: "355650601461",
      appId: "1:355650601461:web:24a0a729f7660f4102e0bc"
    };

    this.firestore = null;
    this.auth = null;
    this.currentUser = null;
    this.isAdmin = false;
    this.products = [];
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

        // Listen for Firebase Auth state changes
        this.auth.onAuthStateChanged(async (user) => {
          if (user) {
            this.currentUser = user;
            await this.verifyAdminRole(user.uid);
          } else {
            this.currentUser = null;
            this.isAdmin = false;
          }
          window.dispatchEvent(new CustomEvent('eva_auth_state_changed', {
            detail: { user: this.currentUser, isAdmin: this.isAdmin }
          }));
        });
      } catch (e) {
        console.warn('Firebase initialization note:', e);
      }
    }
  }

  /**
   * Verifies if authenticated UID exists in admins/{uid} collection with role == 'admin'
   */
  async verifyAdminRole(uid) {
    if (!this.firestore || !uid) {
      this.isAdmin = false;
      return { success: false, reason: 'missing_params', error: 'Firebase Firestore or UID missing.' };
    }
    try {
      const adminDoc = await this.firestore.collection('admins').doc(uid).get();
      if (!adminDoc.exists) {
        console.warn('⛔ Admin document missing in admins collection for UID:', uid);
        this.isAdmin = false;
        return {
          success: false,
          reason: 'admin-not-found',
          error: 'Access Denied: No admin authorization document found for this user ID in admins collection.'
        };
      }
      const data = adminDoc.data();
      if (!data || data.role !== 'admin') {
        console.warn('⛔ User role is not admin for UID:', uid, 'Data:', data);
        this.isAdmin = false;
        return {
          success: false,
          reason: 'admin-role-mismatch',
          error: 'Access Denied: Account is not assigned administrator privileges.'
        };
      }
      this.isAdmin = true;
      return { success: true };
    } catch (e) {
      console.error('⛔ Firestore Admin Verification Error:', e.code || e.name, e.message);
      this.isAdmin = false;
      return {
        success: false,
        reason: e.code || 'permission-denied',
        error: 'Access Denied: Could not verify authorization (' + (e.message || 'Permission denied') + ').'
      };
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
            this.products = cloudProducts;
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
            inStock: product.inStock !== undefined ? product.inStock : true,
            stockCount: product.stockCount !== undefined ? product.stockCount : 50,
            ordersCount: product.ordersCount || 0,
            revenueGenerated: product.revenueGenerated || 0,
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
   * Firebase Email & Password Authentication & Admin Authorization
   */
  async loginAdmin(email, password) {
    if (!this.auth || !this.firestore) {
      console.error('Firebase Auth/Firestore not initialized');
      return { success: false, code: 'not-initialized', error: 'Firebase engine is not initialized.' };
    }

    try {
      console.log('Attempting Firebase Auth login for:', email);
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('🔐 Firebase Auth Login Succeeded. Email:', user.email, 'UID:', user.uid);

      const verification = await this.verifyAdminRole(user.uid);
      if (verification.success) {
        console.log('✅ Admin role authorization confirmed for UID:', user.uid);
        this.currentUser = user;
        return { success: true, user };
      } else {
        console.warn('⛔ Auth succeeded but Admin authorization failed for UID:', user.uid, 'Reason:', verification.reason);
        await this.auth.signOut();
        this.currentUser = null;
        return {
          success: false,
          code: verification.reason,
          error: verification.error || 'Access Denied: Account is not registered in admins collection.'
        };
      }
    } catch (e) {
      console.error('⛔ Firebase Auth Error:', e.code, e.message);

      let friendlyMessage = 'Login failed. Please check your email and password.';
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        friendlyMessage = 'Login failed. Invalid email or password.';
      } else if (e.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (e.code === 'auth/too-many-requests') {
        friendlyMessage = 'Access temporarily disabled due to many failed attempts. Try again later.';
      } else if (e.code === 'auth/network-request-failed') {
        friendlyMessage = 'Network error. Please check your internet connection.';
      } else if (e.message) {
        friendlyMessage = e.message;
      }

      return {
        success: false,
        code: e.code || 'auth-error',
        error: friendlyMessage
      };
    }
  }

  /**
   * Firebase Sign Out
   */
  async logoutAdmin() {
    if (this.auth) {
      try {
        await this.auth.signOut();
        this.currentUser = null;
        this.isAdmin = false;
        console.log('🔓 Firebase Auth Sign Out Successful');
      } catch (e) {}
    }
  }

  getProducts() {
    if (this.products && this.products.length > 0) {
      return this.products;
    }
    try {
      const dbProducts = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PRODUCTS) || '[]');
      if (dbProducts.length > 0) {
        return dbProducts;
      }
    } catch (e) {}
    return window.EVA_DOU_PRODUCTS || [];
  }

  getProduct(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  /**
   * Cloud-First Product Update in Firestore with instant Realtime Synchronization.
   * CLOUD UPDATE MUST SUCCEED BEFORE UPDATING LOCAL STATE.
   */
  async updateProduct(id, updates) {
    if (!this.firestore) {
      console.error('⛔ Firestore is not initialized.');
      return false;
    }

    try {
      const payload = {
        ...updates,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

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
        const existing = this.getProduct(id);
        const variantSize = (existing && existing.variants && existing.variants[0]) ? existing.variants[0].size : '250 Ml';
        payload.variants = [{ size: variantSize, price: Math.max(1, Number(updates.price) || 150), isDefault: true }];
        delete payload.price;
      }

      // 1. MUST SUCCEED ON FIRESTORE CLOUD FIRST
      await this.firestore.collection('products').doc(id).update(payload);
      console.log('🔥 Cloud Firestore Document Update Succeeded:', id);

      // 2. Update Local Cache AFTER Cloud Confirmation
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
        this.products = products;
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
