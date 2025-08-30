/**
 * Vendor Profile Component
 * Detailed view of a specific vendor with menu and payment options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from '@/components/ui';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';
import { QRPaymentGenerator } from '@/components/payments/QRPayment';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import BigNumber from 'bignumber.js';

interface VendorProfileViewProps {
  vendor: VendorProfile;
  onBack?: () => void;
  onPaymentRequest?: (amount: BigNumber, memo: string) => void;
}

interface QuickOrderItem {
  name: string;
  price: BigNumber;
  description: string;
  category: string;
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

  // Mock quick order items (would come from vendor menu in real implementation)
  const quickOrderItems: QuickOrderItem[] = [
    {
      name: 'Jollof Rice Special',
      price: new BigNumber(0.025),
      description: 'Rice with chicken and plantain',
      category: 'Main Dish'
    },
    {
      name: 'Chicken Suya',
      price: new BigNumber(0.02),
      description: 'Grilled spiced chicken',
      category: 'Snacks'
    },
    {
      name: 'Cold Drink',
      price: new BigNumber(0.008),
      description: 'Soft drinks and water',
      category: 'Beverages'
    },
    {
      name: 'Course Textbook',
      price: new BigNumber(0.15),
      description: 'New and used textbooks',
      category: 'Academic'
    }
  ];

  const isOpen = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return vendor.operatingHours.days.includes(currentDay) &&
           currentTime >= vendor.operatingHours.open &&
           currentTime <= vendor.operatingHours.close;
  };

  const handleQuickOrder = (item: QuickOrderItem) => {
    setSelectedAmount(item.price);
    setPaymentMemo(`${vendor.businessName}: ${item.name}`);
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
            <div className="flex items-center space-x-4 mb-4">
              {onBack && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onBack}
                  className="px-3"
                >
                  ← Back
                </Button>
              )}
              
              <div className="text-4xl">
                {vendor.category === 'food' && '🍽️'}
                {vendor.category === 'books' && '📚'}
                {vendor.category === 'electronics' && '💻'}
                {vendor.category === 'services' && '🔧'}
                {vendor.category === 'transport' && '🚌'}
                {vendor.category === 'printing' && '🖨️'}
                {vendor.category === 'other' && '🏪'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-dark-text-primary">
                    {vendor.businessName}
                  </h1>
                  
                  {vendor.verification.isVerified && (
                    <Badge variant="success">
                      ✅ Verified
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
                    <span>📍</span>
                    <span>{vendor.location.building}</span>
                    {vendor.location.floor && <span>• {vendor.location.floor}</span>}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span>⭐</span>
                    <span>{vendor.rating.average.toFixed(1)} ({vendor.rating.totalReviews} reviews)</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span>🕒</span>
                    <span>{vendor.operatingHours.open} - {vendor.operatingHours.close}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Orders */}
      {vendor.category === 'food' && (
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
            🍽️ Popular Items
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickOrderItems
              .filter(item => vendor.category === 'food' ? 
                ['Main Dish', 'Snacks', 'Beverages'].includes(item.category) :
                item.category === 'Academic'
              )
              .map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary hover:border-solana-purple-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-dark-text-primary">{item.name}</h3>
                      <p className="text-sm text-dark-text-secondary">{item.description}</p>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="font-semibold text-dark-text-primary">
                        {formatCurrency(item.price, 'SOL')}
                      </div>
                      <div className="text-xs text-dark-text-secondary">
                        ≈ ₦{solToNaira(item.price).toFixed(0)}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickOrder(item)}
                    disabled={!connected || !isOpen()}
                    className="w-full"
                  >
                    {!connected ? 'Connect Wallet' : !isOpen() ? 'Closed' : 'Order Now'}
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Custom Payment */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
          💰 Custom Payment
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
        <h2 className="text-lg font-semibold text-dark-text-primary mb-4">
          ℹ️ Vendor Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dark-text-primary mb-2">📍 Location</h3>
              <p className="text-sm text-dark-text-secondary">
                {vendor.location.building}
                {vendor.location.floor && <><br/>{vendor.location.floor}</>}
                {vendor.location.room && <><br/>{vendor.location.room}</>}
                <br/>
                <span className="text-dark-text-muted">{vendor.location.description}</span>
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-dark-text-primary mb-2">🕒 Operating Hours</h3>
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
              <h3 className="font-medium text-dark-text-primary mb-2">📊 Stats</h3>
              <div className="text-sm text-dark-text-secondary space-y-1">
                <div>Total Sales: {formatCurrency(vendor.stats.totalSales, 'SOL')}</div>
                <div>Total Orders: {vendor.stats.totalTransactions}</div>
                <div>Member Since: {vendor.stats.joinDate.toLocaleDateString()}</div>
                <div>Last Active: {vendor.stats.lastActiveDate.toLocaleDateString()}</div>
              </div>
            </div>
            
            {vendor.contactInfo.phone && (
              <div>
                <h3 className="font-medium text-dark-text-primary mb-2">📞 Contact</h3>
                <div className="text-sm text-dark-text-secondary">
                  {vendor.contactInfo.phone}
                  {vendor.contactInfo.whatsapp && (
                    <div className="mt-1">
                      <span className="text-green-500">📱 WhatsApp:</span> {vendor.contactInfo.whatsapp}
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
            <QRPaymentGenerator
              amount={selectedAmount}
              recipientAddress={vendor.walletAddress}
              memo={paymentMemo}
              vendorAddress={vendor.walletAddress}
              onPaymentComplete={handlePaymentComplete}
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
