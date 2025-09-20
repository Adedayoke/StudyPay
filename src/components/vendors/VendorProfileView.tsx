/**
 * Vendor Profile Component
 * Detailed view of a specific vendor with menu and payment options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { VendorProfile, VendorMenuItem } from '@/lib/vendors/vendorRegistry';
import { FoodPaymentQR } from '@/components/payments/SolanaPayQR';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import { StudyPayIcon, CategoryIcon, StatusIcon } from '@/lib/utils/iconMap';
import { cartService } from '@/lib/services/cartService';
import BigNumber from 'bignumber.js';

interface VendorProfileViewProps {
  vendor: VendorProfile;
  onBack?: () => void;
  onPaymentRequest?: (amount: BigNumber, memo: string) => void;
}

export default function VendorProfileView({ 
  vendor, 
  onBack, 
  onPaymentRequest 
}: VendorProfileViewProps) {
  const { connected, publicKey } = useStudyPayWallet();
  const [selectedAmount, setSelectedAmount] = useState<BigNumber | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Update cart count when component mounts
  useEffect(() => {
    const updateCartCount = () => {
      setCartItemCount(cartService.getItemCount());
    };

    updateCartCount();
    // In a real app, you'd subscribe to cart changes
    const interval = setInterval(updateCartCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const isOpen = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return vendor.operatingHours.days.includes(currentDay) &&
           currentTime >= vendor.operatingHours.open &&
           currentTime <= vendor.operatingHours.close;
  };

  const handleAddToCart = (product: VendorMenuItem) => {
    cartService.addItem(product, vendor.id, vendor.businessName, 1);
    setCartItemCount(cartService.getItemCount());
    // Could show a toast notification here
  };

  const handleQuickOrder = (product: VendorMenuItem) => {
    // For quick orders, add to cart and immediately proceed to payment
    cartService.addItem(product, vendor.id, vendor.businessName, 1);
    setSelectedAmount(product.price);
    setPaymentMemo(`${vendor.businessName}: ${product.name}`);
    setShowQRGenerator(true);
  };

  const handleCustomPayment = () => {
    const amount = new BigNumber(customAmount);
    if (amount.isNaN() || amount.lte(0)) {
      alert('Please enter a valid amount');
      return;
    }

    setSelectedAmount(amount);
    setPaymentMemo(paymentMemo || `Payment to ${vendor.businessName}`);
    setShowQRGenerator(true);
  };

  const handlePaymentComplete = () => {
    setShowQRGenerator(false);
    setSelectedAmount(null);
    setCustomAmount('');
    setPaymentMemo('');
    
    if (onPaymentRequest && selectedAmount) {
      onPaymentRequest(selectedAmount, paymentMemo);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex gap-3 md:items-center flex-col md:flex-row md:space-x-4 mb-4">
              {onBack && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBack}
                  className="px-3 w-fit"
                >
                  ← Back
                </Button>
              )}
              
              <div className="text-4xl">
                <CategoryIcon 
                  category={vendor.category as any} 
                  size={48} 
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center flex-wrap space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-dark-text-primary">
                    {vendor.businessName}
                  </h1>
                  
                  {vendor.verification.isVerified && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <StudyPayIcon name="verified" size={14} />
                      Verified
                    </Badge>
                  )}
                  
                  <Badge variant={isOpen() ? 'success' : 'warning'}>
                    {isOpen() ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                
                <p className="text-dark-text-secondary mb-3">
                  {vendor.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-dark-text-secondary">
                  <div className="flex items-center space-x-1">
                    <StudyPayIcon name="location" size={14} />
                    <span>{vendor.location.building}</span>
                    {vendor.location.floor && <span>• {vendor.location.floor}</span>}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <StudyPayIcon name="star" size={14} />
                    <span>{vendor.rating.average.toFixed(1)} ({vendor.rating.totalReviews} reviews)</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <StudyPayIcon name="clock" className="inline h-4 w-4" />
                    <span>{vendor.operatingHours.open} - {vendor.operatingHours.close}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      {vendor.category === 'food' && vendor.products && vendor.products.length > 0 && (
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-text-primary flex items-center gap-2">
              <StudyPayIcon name="food" size={20} />
              Menu Items
            </h2>
            {cartItemCount > 0 && (
              <Badge variant="primary" className="flex items-center gap-1">
                <StudyPayIcon name="cart" size={14} />
                {cartItemCount} in cart
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendor.products
              .filter(product => product.isAvailable)
              .map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary hover:border-solana-purple-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-dark-text-primary">{product.name}</h3>
                      <p className="text-sm text-dark-text-secondary">{product.description}</p>
                      {product.estimatedPrepTime && (
                        <p className="text-xs text-dark-text-muted mt-1">
                          Ready in ~{product.estimatedPrepTime} min
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="font-semibold text-dark-text-primary">
                        {formatCurrency(product.price, 'SOL')}
                      </div>
                      <div className="text-xs text-dark-text-secondary">
                        ≈ ₦{solToNaira(product.price).toFixed(0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="flex-1"
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleQuickOrder(product)}
                      disabled={!connected || !isOpen()}
                      className="flex-1"
                    >
                      {!connected ? 'Connect Wallet' : !isOpen() ? 'Closed' : 'Order Now'}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Custom Payment */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
          <StudyPayIcon name="coins" className="inline h-5 w-5 mr-1" /> Custom Payment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary placeholder-dark-text-muted focus:ring-2 focus:ring-solana-purple-500 focus:border-transparent"
              placeholder="0.025"
            />
            {customAmount && !isNaN(Number(customAmount)) && Number(customAmount) > 0 && (
              <div className="text-xs text-dark-text-secondary mt-1">
                ≈ ₦{solToNaira(new BigNumber(customAmount)).toFixed(0)}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={paymentMemo}
              onChange={(e) => setPaymentMemo(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary placeholder-dark-text-muted focus:ring-2 focus:ring-solana-purple-500 focus:border-transparent"
              placeholder="What are you paying for?"
            />
          </div>
        </div>
        
        <Button
          variant="primary"
          onClick={handleCustomPayment}
          disabled={!connected || !customAmount || isNaN(Number(customAmount)) || Number(customAmount) <= 0 || !isOpen()}
          className="w-full mt-4"
        >
          {!connected ? 'Connect Wallet to Pay' : 
           !isOpen() ? 'Vendor Closed' :
           'Generate Payment QR'}
        </Button>
      </Card>

      {/* Vendor Info */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-lg font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
          <StudyPayIcon name="info" size={20} />
          Vendor Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dark-text-primary mb-2 flex items-center gap-2">
                <StudyPayIcon name="location" size={16} />
                Location
              </h3>
              <p className="text-sm text-dark-text-secondary">
                {vendor.location.building}
                {vendor.location.floor && <><br/>{vendor.location.floor}</>}
                {vendor.location.room && <><br/>{vendor.location.room}</>}
                <br/>
                <span className="text-dark-text-muted">{vendor.location.description}</span>
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-dark-text-primary mb-2 flex items-center gap-2">
                <StudyPayIcon name="clock" className="inline h-4 w-4" /> Operating Hours
              </h3>
              <p className="text-sm text-dark-text-secondary">
                {vendor.operatingHours.open} - {vendor.operatingHours.close}
                <br/>
                <span className="text-dark-text-muted">
                  {vendor.operatingHours.days.map(day => 
                    day.charAt(0).toUpperCase() + day.slice(1)
                  ).join(', ')}
                </span>
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dark-text-primary mb-2 flex items-center gap-2">
                <StudyPayIcon name="stats" size={16} />
                Stats
              </h3>
              <div className="text-sm text-dark-text-secondary space-y-1">
                <div>Total Sales: {formatCurrency(vendor.stats.totalSales, 'SOL')}</div>
                <div>Total Orders: {vendor.stats.totalTransactions}</div>
                <div>Member Since: {vendor.stats.joinDate.toLocaleDateString()}</div>
                <div>Last Active: {vendor.stats.lastActiveDate.toLocaleDateString()}</div>
              </div>
            </div>
            
            {vendor.contactInfo.phone && (
              <div>
                <h3 className="font-medium text-dark-text-primary mb-2 flex items-center gap-2">
                  <StudyPayIcon name="phone" className="inline h-4 w-4" /> Contact
                </h3>
                <div className="text-sm text-dark-text-secondary">
                  {vendor.contactInfo.phone}
                  {vendor.contactInfo.whatsapp && (
                    <div className="mt-1">
                      <span className="text-green-500 flex items-center gap-1">
                        <StudyPayIcon name="phone" size={14} />
                        WhatsApp:
                      </span> {vendor.contactInfo.whatsapp}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* QR Payment Generator Modal */}
      {showQRGenerator && selectedAmount && connected && publicKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-bg-primary rounded-lg p-6 max-w-md w-full border border-dark-border-primary">
            <FoodPaymentQR
              onPaymentGenerated={(url) => {
                console.log('Payment URL generated:', url);
                // Handle payment completion
                handlePaymentComplete?.();
              }}
            />
            
            <Button
              variant="secondary"
              onClick={() => setShowQRGenerator(false)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!connected && (
        <Alert>
          Connect your wallet to make payments to this vendor.
        </Alert>
      )}
    </div>
  );
}
