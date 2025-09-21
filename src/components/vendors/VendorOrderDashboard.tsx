/**
 * Vendor Order Dashboard
 * Allows vendors to view and manage their orders
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { orderService } from '@/lib/services/orderService';
import { vendorRegistry } from '@/lib/vendors/vendorRegistry';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { Order, OrderStatus, OrderNotification } from '@/lib/types/order';
import BigNumber from 'bignumber.js';

interface VendorOrderDashboardProps {
  vendorId: string;
}

export default function VendorOrderDashboard({ vendorId }: VendorOrderDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  const { convertSolToNaira, isLoading: priceLoading, error: priceError } = usePriceConversion();
  const currencyFormatter = useCurrencyFormatter();

  useEffect(() => {
    loadOrders();
    loadNotifications();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadOrders();
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [vendorId]);

  const loadOrders = () => {
    try {
      const vendorOrders = orderService.getVendorOrders(vendorId);
      setOrders(vendorOrders);
    } catch (error) {
      console.error('Failed to load vendor orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = () => {
    try {
      const vendorNotifications = orderService.getVendorNotifications(vendorId);
      setNotifications(vendorNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const success = orderService.updateOrderStatus(orderId, newStatus);
    if (success) {
      loadOrders(); // Refresh orders
    }
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    orderService.markNotificationRead(vendorId, notificationId);
    loadNotifications(); // Refresh notifications
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

  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => order.status === selectedStatus);

  const unreadNotifications = notifications.filter(n => !n.read);

  if (loading) {
    return (
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading orders...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {unreadNotifications.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <StudyPayIcon name="bell" size={20} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">New Notifications</h3>
              <div className="space-y-2">
                {unreadNotifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm text-blue-800">{notification.message}</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleMarkNotificationRead(notification.id)}
                    >
                      Mark Read
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Order Management */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-text-primary flex items-center gap-2">
            <StudyPayIcon name="receipt" size={20} />
            Order Management
          </h2>
          <Badge variant="secondary">{filteredOrders.length} orders</Badge>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'All Orders' },
            { value: 'placed', label: 'New Orders' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'preparing', label: 'Preparing' },
            { value: 'ready', label: 'Ready' },
            { value: 'picked_up', label: 'Completed' }
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={selectedStatus === filter.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedStatus(filter.value as OrderStatus | 'all')}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <StudyPayIcon name="receipt" size={48} className="mx-auto mb-4 text-dark-text-muted" />
              <h3 className="text-lg font-medium text-dark-text-primary mb-2">No orders found</h3>
              <p className="text-dark-text-secondary">
                {selectedStatus === 'all' ? 'No orders yet.' : `No orders with status "${selectedStatus}".`}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-dark-text-primary">Order #{order.id.slice(-8)}</h3>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'completed' ? 'success' : 'warning'}>
                        {order.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-dark-text-secondary mb-2">
                      Customer: {order.customerName} • {order.createdAt.toLocaleString()}
                    </div>
                    <div className="text-sm text-dark-text-secondary">
                      Items: {order.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}
                    </div>
                    {order.specialInstructions && (
                      <div className="text-sm text-yellow-600 mt-1">
                        <strong>Special Instructions:</strong> {order.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-dark-text-primary">
                      ₦{currencyFormatter.solToNaira(order.total).toFixed(0)}
                    </div>
                    <div className="text-xs text-dark-text-secondary">
                      ≈ {currencyFormatter.formatCurrency(order.total, 'SOL')}
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex gap-2">
                  {order.status === 'placed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                    >
                      Confirm Order
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                    >
                      Mark as Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'picked_up')}
                    >
                      Mark as Picked Up
                    </Button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'picked_up' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                      className="text-red-500 hover:text-red-600"
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>

                {/* Estimated Ready Time */}
                {order.estimatedReadyTime && (
                  <div className="mt-3 text-sm text-dark-text-secondary">
                    <strong>Estimated Ready:</strong> {order.estimatedReadyTime.toLocaleString()}
                    {order.actualReadyTime && (
                      <span className="ml-2 text-green-600">
                        (Actually ready: {order.actualReadyTime.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-text-primary">
              {orders.filter(o => o.status === 'placed').length}
            </div>
            <div className="text-sm text-dark-text-secondary">New Orders</div>
          </div>
        </Card>
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-text-primary">
              {orders.filter(o => o.status === 'preparing').length}
            </div>
            <div className="text-sm text-dark-text-secondary">Preparing</div>
          </div>
        </Card>
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-text-primary">
              {orders.filter(o => o.status === 'ready').length}
            </div>
            <div className="text-sm text-dark-text-secondary">Ready for Pickup</div>
          </div>
        </Card>
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-text-primary">
              {orders.filter(o => o.status === 'picked_up').length}
            </div>
            <div className="text-sm text-dark-text-secondary">Completed Today</div>
          </div>
        </Card>
      </div>
    </div>
  );
}