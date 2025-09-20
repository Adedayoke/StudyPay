/**
 * Order History Component
 * Displays user's past orders with status and details
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { orderService } from '@/lib/services/orderService';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { OrderSummary, OrderStatus, PaymentStatus } from '@/lib/types/order';

interface OrderHistoryProps {
  onViewOrder?: (orderId: string) => void;
}

export default function OrderHistory({ onViewOrder }: OrderHistoryProps) {
  const { connected, publicKey } = useStudyPayWallet();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && publicKey) {
      loadOrders();
    } else {
      // Load demo orders for development
      loadDemoOrders();
    }
  }, [connected, publicKey]);

  const loadOrders = () => {
    try {
      const customerOrders = orderService.getCustomerOrders(publicKey?.toBase58() || 'demo_wallet');
      setOrders(customerOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoOrders = () => {
    // Demo orders for development
    const demoOrders: OrderSummary[] = [
      {
        id: 'order_demo_001',
        vendorName: 'Campus Café & Grill',
        total: new BigNumber(0.0255),
        currency: 'SOL',
        status: 'ready',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        itemCount: 1,
        estimatedReadyTime: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 'order_demo_002',
        vendorName: 'Student Snacks Hub',
        total: new BigNumber(0.018),
        currency: 'SOL',
        status: 'preparing',
        paymentStatus: 'completed',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        itemCount: 2,
        estimatedReadyTime: new Date(Date.now() + 10 * 60 * 1000)
      }
    ];
    setOrders(demoOrders);
    setLoading(false);
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 'warning';
      case 'paid': return 'primary';
      case 'confirmed': return 'primary';
      case 'preparing': return 'warning';
      case 'ready': return 'success';
      case 'picked_up': return 'success';
      case 'cancelled': return 'danger';
      case 'refunded': return 'danger';
      default: return 'secondary';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'refunded': return 'primary';
      default: return 'secondary';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading your orders...</p>
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-center py-8">
          <StudyPayIcon name="receipt" size={48} className="mx-auto mb-4 text-dark-text-muted" />
          <h3 className="text-lg font-medium text-dark-text-primary mb-2">No orders yet</h3>
          <p className="text-dark-text-secondary">Your order history will appear here once you place your first order.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark-text-primary flex items-center gap-2">
          <StudyPayIcon name="receipt" size={20} />
          Order History
        </h2>
        <Badge variant="secondary">{orders.length} orders</Badge>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-4 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary hover:border-solana-purple-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-dark-text-primary">{order.vendorName}</h3>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)}>
                    {order.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-dark-text-secondary">
                  <span>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(order.createdAt)}</span>
                  {order.estimatedReadyTime && (
                    <>
                      <span>•</span>
                      <span className={order.estimatedReadyTime > new Date() ? 'text-green-600' : 'text-red-600'}>
                        {order.estimatedReadyTime > new Date() ? 'Ready' : 'Overdue'}: {order.estimatedReadyTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-dark-text-primary">
                  {formatCurrency(order.total, 'SOL')}
                </div>
                <div className="text-xs text-dark-text-secondary">
                  ≈ ₦{solToNaira(order.total).toFixed(0)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewOrder?.(order.id)}
                className="flex-1"
              >
                View Details
              </Button>
              {order.status === 'ready' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  Mark as Picked Up
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-dark-bg-tertiary rounded-lg">
        <h3 className="font-medium text-dark-text-primary mb-2">Order Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Badge variant="warning">PLACED</Badge>
            <span>Order submitted</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="warning">PREPARING</Badge>
            <span>Being prepared</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="success">READY</Badge>
            <span>Ready for pickup</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="success">PICKED UP</Badge>
            <span>Order completed</span>
          </div>
        </div>
      </div>
    </Card>
  );
}