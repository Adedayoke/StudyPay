/**
 * Shopping Cart Service
 * Manages shopping cart state and operations
 */

import { ShoppingCart, CartItem } from '@/lib/types/order';
import { VendorMenuItem } from '@/lib/vendors/vendorRegistry';
import BigNumber from 'bignumber.js';

export class CartService {
  private static instance: CartService;
  private cart: ShoppingCart;

  private constructor() {
    this.cart = {
      items: [],
      subtotal: new BigNumber(0),
      total: new BigNumber(0),
      currency: 'SOL'
    };
    this.loadCart();
  }

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  /**
   * Add item to cart
   */
  addItem(product: VendorMenuItem, vendorId: string, vendorName: string, quantity: number = 1): boolean {
    // Check if item is from same vendor (single-vendor checkout for simplicity)
    if (this.cart.vendorId && this.cart.vendorId !== vendorId) {
      // Clear cart if switching vendors
      this.clearCart();
    }

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity,
      category: product.category,
      vendorId,
      vendorName,
      estimatedPrepTime: product.estimatedPrepTime
    };

    // Check if item already exists in cart
    const existingItemIndex = this.cart.items.findIndex(
      item => item.productId === product.id && item.vendorId === vendorId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      this.cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      this.cart.items.push(cartItem);
      this.cart.vendorId = vendorId;
    }

    this.updateTotals();
    this.saveCart();
    return true;
  }

  /**
   * Remove item from cart
   */
  removeItem(productId: string): boolean {
    const itemIndex = this.cart.items.findIndex(item => item.productId === productId);
    if (itemIndex >= 0) {
      this.cart.items.splice(itemIndex, 1);

      // Clear vendor if cart is empty
      if (this.cart.items.length === 0) {
        this.cart.vendorId = undefined;
      }

      this.updateTotals();
      this.saveCart();
      return true;
    }
    return false;
  }

  /**
   * Update item quantity
   */
  updateQuantity(productId: string, quantity: number): boolean {
    if (quantity <= 0) {
      return this.removeItem(productId);
    }

    const item = this.cart.items.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      this.updateTotals();
      this.saveCart();
      return true;
    }
    return false;
  }

  /**
   * Get current cart
   */
  getCart(): ShoppingCart {
    return { ...this.cart };
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Check if cart has items
   */
  hasItems(): boolean {
    return this.cart.items.length > 0;
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    this.cart = {
      items: [],
      subtotal: new BigNumber(0),
      total: new BigNumber(0),
      currency: 'SOL'
    };
    this.saveCart();
  }

  /**
   * Update cart totals
   */
  private updateTotals(): void {
    this.cart.subtotal = this.cart.items.reduce(
      (sum, item) => sum.plus(item.price.multipliedBy(item.quantity)),
      new BigNumber(0)
    );

    // Add service fee (2%)
    const serviceFee = this.cart.subtotal.multipliedBy(0.02);
    this.cart.total = this.cart.subtotal.plus(serviceFee);
  }

  /**
   * Save cart to localStorage
   */
  private saveCart(): void {
    try {
      // Check if we're in a browser environment before accessing localStorage
      if (typeof window === 'undefined' || !window.localStorage) {
        return; // Silently skip saving during SSR
      }

      localStorage.setItem('studypay_cart', JSON.stringify({
        ...this.cart,
        subtotal: this.cart.subtotal.toString(),
        total: this.cart.total.toString(),
        items: this.cart.items.map(item => ({
          ...item,
          price: item.price.toString()
        }))
      }));
    } catch (error) {
      console.warn('Failed to save cart to localStorage:', error);
    }
  }

  /**
   * Load cart from localStorage
   */
  private loadCart(): void {
    try {
      // Check if we're in a browser environment before accessing localStorage
      if (typeof window === 'undefined' || !window.localStorage) {
        return; // Skip loading during SSR
      }

      const savedCart = localStorage.getItem('studypay_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        this.cart = {
          ...parsed,
          subtotal: new BigNumber(parsed.subtotal),
          total: new BigNumber(parsed.total),
          items: parsed.items.map((item: any) => ({
            ...item,
            price: new BigNumber(item.price)
          }))
        };
      }
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error);
      // Reset to empty cart
      this.cart = {
        items: [],
        subtotal: new BigNumber(0),
        total: new BigNumber(0),
        currency: 'SOL'
      };
    }
  }
}

// Export singleton instance
export const cartService = CartService.getInstance();