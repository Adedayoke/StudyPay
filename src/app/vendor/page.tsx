/**
 * Vendor Dashboard Page
 * Interface for campus vendors to accept payments from students
 */

'use client';

import React, { useState } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { WalletGuard, useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { QRPaymentGenerator } from '@/components/payments/QRPayment';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
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
  const [activePayments, setActivePayments] = useState<number>(0);
  const [completedPayments, setCompletedPayments] = useState(todaysSales);

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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Vendor Info */}
          <div className="mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{vendorInfo.businessName}</h2>
                  <p className="text-gray-600">{vendorInfo.category}</p>
                  <p className="text-sm text-gray-500">{vendorInfo.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Wallet Balance</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(new BigNumber(balance), 'SOL')}
                  </div>
                  <div className="text-sm text-gray-500">
                    ≈ {formatCurrency(solToNaira(new BigNumber(balance)), 'NGN')}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Generator */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Create Payment Request</h3>
              <QRPaymentGenerator
                vendorAddress={publicKey?.toBase58() || ''}
                onPaymentComplete={handlePaymentComplete}
              />
            </div>

            {/* Sales Summary */}
            <div className="space-y-6">
              {/* Today's Stats */}
              <Card>
                <h3 className="text-lg font-semibold mb-4">Today's Sales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedPayments.length}</div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalToday, 'SOL')}
                    </div>
                    <div className="text-sm text-gray-600">Total Earned</div>
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
              <Card>
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="secondary" size="sm" className="w-full">
                    📊 View Analytics
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    💼 Manage Menu
                  </Button>
                  <Button variant="secondary" size="sm" className="w-full">
                    ⚙️ Settings
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-8">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Transactions</h3>
                <Button size="sm" variant="secondary">
                  Export Data
                </Button>
              </div>
              
              <div className="space-y-3">
                {completedPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🍽️</div>
                      <div>
                        <div className="font-medium text-sm">{payment.description}</div>
                        <div className="text-xs text-gray-500">
                          {payment.time.toLocaleTimeString()} • Student: {payment.studentId}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        +{formatCurrency(payment.amount, 'SOL')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatCurrency(solToNaira(payment.amount), 'NGN')}
                      </div>
                    </div>
                  </div>
                ))}
                
                {completedPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transactions today. Create a payment request to get started!
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Popular Items */}
          <div className="mt-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Popular Items Today</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🍛</div>
                  <div className="font-medium">Jollof Rice</div>
                  <div className="text-sm text-gray-600">5 orders</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🍗</div>
                  <div className="font-medium">Fried Chicken</div>
                  <div className="text-sm text-gray-600">3 orders</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🥤</div>
                  <div className="font-medium">Soft Drinks</div>
                  <div className="text-sm text-gray-600">8 orders</div>
                </div>
              </div>
            </Card>
          </div>
        </WalletGuard>
      </main>
    </div>
  );
}
