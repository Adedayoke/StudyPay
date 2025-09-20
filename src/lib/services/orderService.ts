/**
 * Order Management Service
 * Handles order creation, tracking, cart management, and vendor notifications
 */

import { Order, OrderItem, OrderStatus, PaymentStatus, ShoppingCart, CartItem, OrderSummary, OrderNotification } from '@/lib/types/order';
import { VendorProfile, VendorMenuItem } from '@/lib/vendors/vendorRegistry';
import { Transaction } from '@/lib/types/payment';
import BigNumber from 'bignumber.js';

export class OrderService {
  private static instance: OrderService;
  private orders: Map<string, Order> = new Map();
  private notifications: Map<string, OrderNotification[]> = new Map(); // vendorId -> notifications

  private constructor() {
    // Initialize with some mock data for demo purposes
    this.initializeMockData();
  }

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Create a new order from cart items
   */
  createOrder(
    customerId: string,
    customerName: string,
    vendor: VendorProfile,
    items: OrderItem[],
    paymentSignature?: string
  ): Order {
    const subtotal = items.reduce((sum, item) =>
      sum.plus(item.price.multipliedBy(item.quantity)), new BigNumber(0)
    );

    const serviceFee = subtotal.multipliedBy(0.02); // 2% platform fee
    const total = subtotal.plus(serviceFee);

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      customerId,
      customerName,
      items,
      subtotal,
      serviceFee,
      total,
      currency: 'SOL',
      status: paymentSignature ? 'paid' : 'placed',
      paymentStatus: paymentSignature ? 'completed' : 'pending',
      paymentSignature,
      createdAt: new Date(),
      updatedAt: new Date(),
      pickupLocation: vendor.location.description,
      estimatedReadyTime: this.calculateEstimatedReadyTime(items)
    };

    this.orders.set(order.id, order);

    // Create notification for vendor
    this.createVendorNotification(vendor.id, {
      id: `notif_${Date.now()}`,
      orderId: order.id,
      type: 'new_order',
      message: `New order from ${customerName} - ${items.length} items, total: ${total.toFixed(3)} SOL`,
      timestamp: new Date(),
      read: false
    });

    return order;
  }

  /**
   * Update order status
   */
  updateOrderStatus(orderId: string, status: OrderStatus, vendorNotes?: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;

    order.status = status;
    order.updatedAt = new Date();

    if (status === 'ready') {
      order.actualReadyTime = new Date();
    }

    if (vendorNotes) {
      order.vendorNotes = vendorNotes;
    }

    // Create notification for customer (in a real app, this would be sent via push notification)
    this.createVendorNotification(order.vendorId, {
      id: `notif_${Date.now()}`,
      orderId: order.id,
      type: 'order_update',
      message: `Order status updated to: ${status}`,
      timestamp: new Date(),
      read: false
    });

    return true;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Get orders for a customer
   */
  getCustomerOrders(customerId: string): OrderSummary[] {
    const customerOrders = Array.from(this.orders.values())
      .filter(order => order.customerId === customerId)
      .map(order => ({
        id: order.id,
        vendorName: order.vendorName,
        total: order.total,
        currency: order.currency,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        estimatedReadyTime: order.estimatedReadyTime
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return customerOrders;
  }

  /**
   * Get orders for a vendor
   */
  getVendorOrders(vendorId: string): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.vendorId === vendorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get vendor notifications
   */
  getVendorNotifications(vendorId: string): OrderNotification[] {
    return this.notifications.get(vendorId) || [];
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(vendorId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(vendorId);
    if (!notifications) return false;

    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Calculate estimated ready time based on items
   */
  private calculateEstimatedReadyTime(items: OrderItem[]): Date {
    const maxPrepTime = Math.max(...items.map(item => item.estimatedPrepTime || 0));
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + maxPrepTime + 5); // Add 5 min buffer
    return estimatedTime;
  }

  /**
   * Create notification for vendor
   */
  private createVendorNotification(vendorId: string, notification: OrderNotification): void {
    const vendorNotifications = this.notifications.get(vendorId) || [];
    vendorNotifications.unshift(notification); // Add to beginning
    this.notifications.set(vendorId, vendorNotifications);
  }

  /**
   * Initialize with mock data for demo
   */
  private initializeMockData(): void {
    // Mock orders for demo purposes
    const mockOrder: Order = {
      id: 'order_demo_001',
      vendorId: 'vendor_campus_cafe',
      vendorName: 'Campus Café & Grill',
      customerId: 'demo_wallet_address',
      customerName: 'Demo Student',
      items: [
        {
          productId: 'jollof_rice_special',
          name: 'Jollof Rice Special',
          description: 'Rice with chicken and plantain',
          price: new BigNumber(0.025),
          quantity: 1,
          category: 'Main Dish',
          estimatedPrepTime: 15
        }
      ],
      subtotal: new BigNumber(0.025),
      serviceFee: new BigNumber(0.0005),
      total: new BigNumber(0.0255),
      currency: 'SOL',
      status: 'ready',
      paymentStatus: 'completed',
      paymentSignature: 'demo_signature_123',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      estimatedReadyTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      actualReadyTime: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
      pickupLocation: 'Student Union Building, Food Court A'
    };

    this.orders.set(mockOrder.id, mockOrder);
  }
}

// Export singleton instance
export const orderService = OrderService.getInstance();