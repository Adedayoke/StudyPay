/**
 * Vendor Dashboard Page
 * Interface for campus vendors to accept payments from students
 */

'use client';

import React, { useState } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { WalletGuard, useStudyPayWallet, WalletButton } from '@/components/wallet/WalletProvider';
import { QRPaymentGenerator } from '@/components/payments/QRPayment';
import VendorAnalyticsDashboard from '@/components/analytics/VendorAnalyticsDashboard';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import { vendorRegistry } from '@/lib/vendors/vendorRegistry';
import BigNumber from 'bignumber.js';

// Mock vendor data
const vendorInfo = {
  businessName: 'Mama Adunni\'s Kitchen',
  category: 'Food & Beverages',
  location: 'UNILAG Campus, Near Faculty of Arts',
  isVerified: true
};

// Mock sales data
const todaysSales = [
  {
    id: '1',
    description: 'Jollof Rice with Chicken',
    amount: new BigNumber(0.025),
    studentId: 'student_123',
    time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    signature: 'sig_xyz123'
  },
  {
    id: '2',
    description: 'Fried Rice + Plantain',
    amount: new BigNumber(0.03),
    studentId: 'student_456',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    signature: 'sig_abc456'
  }
];

export default function VendorDashboard() {
  const { balance, connected, publicKey } = useStudyPayWallet();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'settings'>('overview');
  const [activePayments, setActivePayments] = useState<number>(0);
  const [completedPayments, setCompletedPayments] = useState(todaysSales);

  // Get vendor profile (mock for now - in real app would fetch by wallet address)
  const vendorProfile = vendorRegistry.getAllVendors().find(v => v.businessName === vendorInfo.businessName) || 
    vendorRegistry.getAllVendors()[0]; // Fallback to first vendor

  const handlePaymentComplete = (signature: string) => {
    console.log('Payment completed:', signature);
    setActivePayments(prev => prev - 1);
    
    // Add to completed payments
    const newPayment = {
      id: Date.now().toString(),
      description: 'New Sale',
      amount: new BigNumber(0.02),
      studentId: 'student_new',
      time: new Date(),
      signature
    };
    
    setCompletedPayments(prev => [newPayment, ...prev]);
  };

  const totalToday = completedPayments.reduce(
    (sum, payment) => sum.plus(payment.amount), 
    new BigNumber(0)
  );

  return (
    <div className="min-h-screen bg-vendor-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-solana-purple-500">StudyPay</h1>
              <span className="ml-2 text-sm text-dark-text-secondary">Vendor Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success">
                {vendorInfo.isVerified ? '✅ Verified' : '⏳ Pending'}
              </Badge>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Vendor Info */}
          <div className="mb-8">
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-dark-text-primary">{vendorInfo.businessName}</h2>
                  <p className="text-dark-text-secondary">{vendorInfo.category}</p>
                  <p className="text-sm text-dark-text-muted">{vendorInfo.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-dark-text-secondary">Wallet Balance</div>
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(new BigNumber(balance), 'SOL')}
                  </div>
                  <div className="text-sm text-dark-text-muted">
                    ≈ {formatCurrency(solToNaira(new BigNumber(balance)), 'NGN')}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="border-b border-dark-border-primary">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  📊 Overview
                </button>
                
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  📈 Analytics
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  ⚙️ Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">{renderOverviewTab()}</div>
          )}
          
          {activeTab === 'analytics' && vendorProfile && (
            <VendorAnalyticsDashboard 
              vendor={vendorProfile}
              walletAddress={publicKey?.toBase58() || ''}
            />
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">{renderSettingsTab()}</div>
          )}
        </WalletGuard>
      </main>
    </div>
  );

  function renderOverviewTab() {
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Generator */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Create Payment Request</h3>
            <QRPaymentGenerator
              vendorAddress={publicKey?.toBase58() || ''}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>

          {/* Sales Summary */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Today's Sales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{completedPayments.length}</div>
                  <div className="text-sm text-dark-text-secondary">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {formatCurrency(totalToday, 'SOL')}
                  </div>
                  <div className="text-sm text-dark-text-secondary">Total Earned</div>
                </div>
              </div>
            </Card>

            {/* Active Payments */}
            {activePayments > 0 && (
              <Alert type="info" title="Active Payment Requests">
                You have {activePayments} pending payment request(s). 
                Students can scan the QR code to pay.
              </Alert>
            )}

            {/* Quick Actions */}
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <h4 className="font-semibold mb-3 text-dark-text-primary">Quick Actions</h4>
              <div className="space-y-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setActiveTab('analytics')}
                >
                  📊 View Analytics
                </Button>
                <Button variant="secondary" size="sm" className="w-full">
                  💼 Manage Menu
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setActiveTab('settings')}
                >
                  ⚙️ Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-dark-text-primary">Recent Transactions</h3>
            <Button size="sm" variant="secondary">
              Export Data
            </Button>
          </div>
          
          <div className="space-y-3">
            {completedPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🍽️</div>
                  <div>
                    <div className="font-medium text-sm text-dark-text-primary">{payment.description}</div>
                    <div className="text-xs text-dark-text-muted">
                      {payment.time.toLocaleTimeString()} • Student: {payment.studentId}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-500">
                    +{formatCurrency(payment.amount, 'SOL')}
                  </div>
                  <div className="text-xs text-dark-text-muted">
                    {formatCurrency(solToNaira(payment.amount), 'NGN')}
                  </div>
                </div>
              </div>
            ))}
            
            {completedPayments.length === 0 && (
              <div className="text-center py-8 text-dark-text-secondary">
                No transactions today. Create a payment request to get started!
              </div>
            )}
          </div>
        </Card>

        {/* Popular Items */}
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Popular Items Today</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🍛</div>
              <div className="font-medium text-dark-text-primary">Jollof Rice</div>
              <div className="text-sm text-dark-text-secondary">5 orders</div>
            </div>
            
            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🍗</div>
              <div className="font-medium text-dark-text-primary">Fried Chicken</div>
              <div className="text-sm text-dark-text-secondary">3 orders</div>
            </div>
            
            <div className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">🥤</div>
              <div className="font-medium text-dark-text-primary">Soft Drinks</div>
              <div className="text-sm text-dark-text-secondary">8 orders</div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function renderSettingsTab() {
    return (
      <>
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={vendorInfo.businessName}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Category
              </label>
              <input
                type="text"
                value={vendorInfo.category}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Location
              </label>
              <input
                type="text"
                value={vendorInfo.location}
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
                readOnly
              />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Payment Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Auto-accept payments</h4>
                <p className="text-sm text-dark-text-secondary">Automatically accept valid payments</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Send notifications</h4>
                <p className="text-sm text-dark-text-secondary">Get notified of new payments</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Analytics Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Real-time updates</h4>
                <p className="text-sm text-dark-text-secondary">Show live analytics updates</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Share anonymous data</h4>
                <p className="text-sm text-dark-text-secondary">Help improve campus analytics</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </Card>
      </>
    );
  }
}
