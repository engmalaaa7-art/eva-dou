/**
 * Eva Dou - Reactive Cart State Engine (Phase 3)
 * Persistent cart state backed by LocalStorage ('eva_dou_cart')
 */

class CartStore {
  constructor() {
    this.storageKey = 'eva_dou_cart';
    this.items = this.loadCart();
    this.listeners = [];
  }

  /**
   * Load cart array from LocalStorage
   */
  loadCart() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load cart from LocalStorage:', e);
      return [];
    }
  }

  /**
   * Persist current cart array to LocalStorage and notify subscribers
   */
  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save cart to LocalStorage:', e);
    }
    this.notify();
  }

  /**
   * Register a subscriber callback for cart state changes
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  /**
   * Notify all registered subscribers and dispatch window event
   */
  notify(eventDetails = {}) {
    const state = {
      items: this.getCart(),
      count: this.getItemCount(),
      subtotal: this.getSubtotal(),
      ...eventDetails
    };

    this.listeners.forEach(fn => {
      try {
        fn(state);
      } catch (err) {
        console.error('Cart subscriber error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eva_cart_updated', { detail: state }));
    }
  }

  /**
   * Returns current cart items array
   */
  getCart() {
    return [...this.items];
  }

  /**
   * Adds item or increments quantity if item already exists
   * Supports both addItem(product, quantity) and addItem(product, variant, quantity)
   */
  addItem(product, arg2 = 1, arg3 = null) {
    if (!product) return;

    let quantity = 1;
    let variant = null;

    if (typeof arg2 === 'object' && arg2 !== null) {
      variant = arg2;
      quantity = parseInt(arg3, 10) || 1;
    } else {
      quantity = parseInt(arg2, 10) || 1;
      if (typeof arg3 === 'object' && arg3 !== null) {
        variant = arg3;
      }
    }

    const defaultVariant = (product.variants && product.variants.length > 0) ? product.variants[0] : { size: '250 Ml', price: 150 };
    const selectedVariant = variant || defaultVariant;
    const size = selectedVariant.size || '250 Ml';
    const price = Number(selectedVariant.price) || 150;
    const productId = product.id || product.productId;

    const existingIndex = this.items.findIndex(item => (item.productId === productId || item.id === productId) && item.size === size);

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: `${productId}_${size.replace(/\s+/g, '_')}`,
        productId: productId,
        name: product.name,
        size: size,
        price: price,
        cardImage: product.cardImage || 'assets/images/hero.jpg',
        badge: product.badge || '',
        quantity: quantity
      });
    }

    this.saveCart();
    this.notify({ action: 'add', productId, quantity });
  }

  /**
   * Updates item count (if qty <= 0, remove item)
   */
  updateQuantity(productId, newQty) {
    const qty = parseInt(newQty, 10);
    const index = this.items.findIndex(item => item.productId === productId || item.id === productId);

    if (index === -1) return;

    if (isNaN(qty) || qty <= 0) {
      this.items.splice(index, 1);
    } else {
      this.items[index].quantity = qty;
    }

    this.saveCart();
    this.notify({ action: 'update', productId });
  }

  /**
   * Deletes product from cart
   */
  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId && item.id !== productId);
    this.saveCart();
    this.notify({ action: 'remove', productId });
  }

  /**
   * Calculates total price across all line items (e.g. Qty * 150 EGP)
   */
  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Calculates total number of units in cart for header badge updates
   */
  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Empties state and LocalStorage
   */
  clearCart() {
    this.items = [];
    this.saveCart();
    this.notify({ action: 'clear' });
  }
}

// Global Export Singleton
if (typeof window !== 'undefined') {
  window.CartStore = CartStore;
  if (!window.cartInstance) {
    window.cartInstance = new CartStore();
  }
}
