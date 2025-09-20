/**
 * Shopping Cart Component
 * Displays cart items and handles checkout process
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { cartService } from '@/lib/services/cartService';
import { orderService } from '@/lib/services/orderService';
import { vendorRegistry } from '@/lib/vendors/vendorRegistry';
import { FoodPaymentQR } from '@/components/payments/SolanaPayQR';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { ShoppingCart as CartType, CartItem } from '@/lib/types/order';
import BigNumber from 'bignumber.js';

interface ShoppingCartProps {
  onClose?: () => void;
  onOrderPlaced?: (orderId: string) => void;
}

export default function ShoppingCart({ onClose, onOrderPlaced }: ShoppingCartProps) {
  const { connected, publicKey } = useStudyPayWallet();
  const [cart, setCart] = useState<CartType>(cartService.getCart());
  const [showCheckout, setShowCheckout] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null);

  useEffect(() => {
    const updateCart = () => {
      setCart(cartService.getCart());
    };

    updateCart();
    const interval = setInterval(updateCart, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    cartService.updateQuantity(productId, quantity);
    setCart(cartService.getCart());
  };

  const handleRemoveItem = (productId: string) => {
    cartService.removeItem(productId);
    setCart(cartService.getCart());
  };

  const handleCheckout = () => {
    if (!cart.vendorId || cart.items.length === 0) return;

    const vendor = vendorRegistry.getVendorById(cart.vendorId);
    if (!vendor) return;

    // Calculate total for payment
    const total = cart.total;

    // For demo purposes, we'll simulate payment completion
    // In a real app, this would integrate with the payment system
    setPaymentSignature(`demo_payment_${Date.now()}`);
    setShowCheckout(true);
  };

  const handlePaymentComplete = () => {
    if (!cart.vendorId || !paymentSignature) return;

    const vendor = vendorRegistry.getVendorById(cart.vendorId);
    if (!vendor) return;

    // Create order
    const order = orderService.createOrder(
      publicKey?.toBase58() || 'demo_wallet',
      'Demo Customer', // In real app, get from user profile
      vendor,
      cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        specialInstructions: item.specialInstructions,
        estimatedPrepTime: item.estimatedPrepTime
      })),
      paymentSignature
    );

    // Clear cart
    cartService.clearCart();
    setCart(cartService.getCart());

    // Notify parent component
    if (onOrderPlaced) {
      onOrderPlaced(order.id);
    }

    setShowCheckout(false);
    setPaymentSignature(null);
  };

  if (cart.items.length === 0) {
    return (
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-center py-8">
          <StudyPayIcon name="cart" size={48} className="mx-auto mb-4 text-dark-text-muted" />
          <h3 className="text-lg font-medium text-dark-text-primary mb-2">Your cart is empty</h3>
          <p className="text-dark-text-secondary">Add some items from vendors to get started!</p>
          {onClose && (
            <Button variant="secondary" onClick={onClose} className="mt-4">
              Continue Shopping
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (showCheckout) {
    return (
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-dark-text-primary">Checkout</h2>
          <Button variant="secondary" size="sm" onClick={() => setShowCheckout(false)}>
            ← Back to Cart
          </Button>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-dark-bg-tertiary rounded-lg p-4">
            <h3 className="font-medium text-dark-text-primary mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price.multipliedBy(item.quantity), 'SOL')}</span>
                </div>
              ))}
              <hr className="border-dark-border-secondary" />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal, 'SOL')}</span>
              </div>
              <div className="flex justify-between text-sm text-dark-text-secondary">
                <span>Service Fee (2%)</span>
                <span>{formatCurrency(cart.subtotal.multipliedBy(0.02), 'SOL')}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(cart.total, 'SOL')}</span>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary placeholder-dark-text-muted focus:ring-2 focus:ring-solana-purple-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Payment */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <StudyPayIcon name="alert" size={16} className="text-yellow-600" />
              <span className="font-medium text-yellow-800">Demo Payment</span>
            </div>
            <p className="text-sm text-yellow-700">
              This is a demo. In the real app, you would scan the QR code to complete payment.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handlePaymentComplete}
            className="w-full"
            size="lg"
          >
            Complete Order (Demo)
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-dark-text-primary flex items-center gap-2">
          <StudyPayIcon name="cart" size={20} />
          Shopping Cart
        </h2>
        {onClose && (
          <Button variant="secondary" size="sm" onClick={onClose}>
            × Close
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Cart Items */}
        {cart.items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 p-4 bg-dark-bg-tertiary rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-dark-text-primary">{item.name}</h3>
              <p className="text-sm text-dark-text-secondary">{item.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleRemoveItem(item.productId)}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </Button>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-dark-text-primary">
                {formatCurrency(item.price.multipliedBy(item.quantity), 'SOL')}
              </div>
              <div className="text-xs text-dark-text-secondary">
                {formatCurrency(item.price, 'SOL')} each
              </div>
            </div>
          </div>
        ))}

        {/* Order Summary */}
        <div className="bg-dark-bg-tertiary rounded-lg p-4">
          <h3 className="font-medium text-dark-text-primary mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>{formatCurrency(cart.subtotal, 'SOL')}</span>
            </div>
            <div className="flex justify-between text-sm text-dark-text-secondary">
              <span>Service Fee (2%)</span>
              <span>{formatCurrency(cart.subtotal.multipliedBy(0.02), 'SOL')}</span>
            </div>
            <hr className="border-dark-border-secondary" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(cart.total, 'SOL')}</span>
            </div>
            <div className="text-xs text-dark-text-secondary text-center">
              ≈ ₦{solToNaira(cart.total).toFixed(0)} NGN
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          variant="primary"
          onClick={handleCheckout}
          className="w-full"
          size="lg"
          disabled={!connected || cart.items.length === 0}
        >
          {!connected ? 'Connect Wallet to Checkout' : `Checkout (${cart.items.length} items)`}
        </Button>

        {cart.vendorId && (
          <div className="text-center text-sm text-dark-text-secondary">
            Ordering from: {cart.items[0]?.vendorName}
          </div>
        )}
      </div>
    </Card>
  );
}