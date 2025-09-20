import BigNumber from 'bignumber.js';

export interface OrderItem {
  productId: string;
  name: string;
  description: string;
  price: BigNumber;
  quantity: number;
  category: string;
  specialInstructions?: string;
  estimatedPrepTime?: number;
}

export interface Order {
  id: string;
  vendorId: string;
  vendorName: string;
  customerId: string; // wallet address
  customerName?: string;
  items: OrderItem[];
  subtotal: BigNumber;
  serviceFee?: BigNumber; // platform fee
  total: BigNumber;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentSignature?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  pickupLocation?: string;
  specialInstructions?: string;
  vendorNotes?: string;
}

export type OrderStatus =
  | 'placed'           // Order placed, payment pending
  | 'paid'            // Payment confirmed
  | 'confirmed'       // Vendor confirmed order
  | 'preparing'       // Vendor is preparing
  | 'ready'          // Order ready for pickup
  | 'picked_up'      // Order picked up by customer
  | 'cancelled'      // Order cancelled
  | 'refunded';      // Order refunded

export type PaymentStatus =
  | 'pending'         // Payment not yet initiated
  | 'processing'     // Payment in progress
  | 'completed'      // Payment successful
  | 'failed'         // Payment failed
  | 'refunded';      // Payment refunded

export interface OrderSummary {
  id: string;
  vendorName: string;
  total: BigNumber;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  itemCount: number;
  estimatedReadyTime?: Date;
}

export interface CartItem extends OrderItem {
  vendorId: string;
  vendorName: string;
}

export interface ShoppingCart {
  items: CartItem[];
  vendorId?: string; // Current vendor (for single-vendor checkout)
  subtotal: BigNumber;
  total: BigNumber;
  currency: string;
}

export interface OrderNotification {
  id: string;
  orderId: string;
  type: 'new_order' | 'order_update' | 'payment_received' | 'order_ready' | 'order_cancelled';
  message: string;
  timestamp: Date;
  read: boolean;
}