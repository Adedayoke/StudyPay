/**
 * Student Dashboard Page
 * Main interface for students to manage their wallet and payments
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { WalletGuard, useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { QRPaymentScanner, PaymentConfirmation } from '@/components/payments/QRPayment';
import TransactionHistory from '@/components/transactions/TransactionHistory';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import { getStoredTransactions, getTransactionsForAddress } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';
import BigNumber from 'bignumber.js';

// Mock data for demo
const mockTransactions = [
  {
    id: '1',
    description: 'Jollof Rice - Mama Adunni',
    amount: new BigNumber(0.025),
    category: 'food',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'confirmed' as const
  },
  {
    id: '2', 
    description: 'Campus Shuttle - Gate to Faculty',
    amount: new BigNumber(0.01),
    category: 'transport',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'confirmed' as const
  },
  {
    id: '3',
    description: 'Document Printing - 20 pages',
    amount: new BigNumber(0.008),
    category: 'printing',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: 'confirmed' as const
  }
];

export default function StudentDashboard() {
  const { balance, connected, publicKey, refreshBalance } = useStudyPayWallet();
  const [showScanner, setShowScanner] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');

  // Load transactions for current wallet
  useEffect(() => {
    if (publicKey) {
      setTransactionsLoading(true);
      try {
        const userTransactions = getTransactionsForAddress(publicKey.toString());
        setTransactions(userTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setTransactionsLoading(false);
      }
    }
  }, [publicKey]);

  // Refresh transactions after payment
  const refreshTransactions = () => {
    if (publicKey) {
      const userTransactions = getTransactionsForAddress(publicKey.toString());
      setTransactions(userTransactions);
    }
  };

  const handleQRScanned = (url: string) => {
    setPaymentUrl(url);
    setShowScanner(false);
    setShowConfirmation(true);
  };

  const handlePaymentConfirm = () => {
    // Payment completion is now handled by PaymentExecutor component
    // This will be called when payment is successful
    setShowConfirmation(false);
    setPaymentUrl('');
    // Refresh balance and transactions after payment
    refreshBalance();
    refreshTransactions();
  };

  const handlePaymentCancel = () => {
    setShowConfirmation(false);
    setPaymentUrl('');
  };

  return (
    <div className="min-h-screen bg-student-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-solana-purple-500">StudyPay</h1>
              <span className="ml-2 text-sm text-dark-text-secondary">Student Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success">Student</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-[#333]">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-[#9945FF] text-[#9945FF]'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'transactions'
                      ? 'border-[#9945FF] text-[#9945FF]'
                      : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                  }`}
                >
                  Transaction History
                  {transactions.length > 0 && (
                    <span className="ml-2 bg-[#9945FF] text-white text-xs rounded-full px-2 py-1">
                      {transactions.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Balance Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <h3 className="text-lg font-semibold mb-3">Current Balance</h3>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-solana-purple-500">
                      {formatCurrency(new BigNumber(balance), 'SOL')}
                    </div>
                    <div className="text-lg text-gray-600">
                      ≈ {formatCurrency(solToNaira(new BigNumber(balance)), 'NGN')}
                    </div>
                    <Button 
                      onClick={refreshBalance} 
                      size="sm" 
                      variant="secondary"
                      className="mt-2"
                    >
                      🔄 Refresh
                    </Button>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowScanner(true)}
                      className="w-full"
                    >
                      📱 Scan & Pay
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => setActiveTab('transactions')}
                    >
                      📊 View Transactions
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <TransactionHistory 
              transactions={transactions}
              isLoading={transactionsLoading}
            />
          )}

          {/* Recent Activity - only show on overview */}
          {activeTab === 'overview' && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Your payment history will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-[#2D2D2D] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">
                          {tx.status === 'confirmed' ? '✅' : 
                           tx.status === 'pending' ? '⏳' : '❌'}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {tx.purpose || 'Campus Payment'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">
                          {tx.amount.toString()} SOL
                        </div>
                        <div className="text-sm text-gray-400">
                          {tx.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length > 3 && (
                    <Button 
                      variant="secondary" 
                      className="w-full mt-3"
                      onClick={() => setActiveTab('transactions')}
                    >
                      View All Transactions ({transactions.length})
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Low Balance Alert */}
          {balance < 0.1 && (
            <Alert type="warning" className="mb-6" title="Low Balance">
              Your balance is running low. Consider requesting money from your parents 
              or guardian to continue making campus payments.
            </Alert>
          )}

          {/* Recent Transactions */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <Button size="sm" variant="secondary">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {tx.category === 'food' && '🍽️'}
                      {tx.category === 'transport' && '🚌'}
                      {tx.category === 'printing' && '🖨️'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tx.description}</div>
                      <div className="text-xs text-gray-500">
                        {tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      -{formatCurrency(tx.amount, 'SOL')}
                    </div>
                    <Badge variant="success" className="text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {mockTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions yet. Start by scanning a payment QR code!
                </div>
              )}
            </div>
          </Card>

          {/* Spending Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="text-center">
              <div className="text-2xl mb-2">🍽️</div>
              <div className="text-sm text-gray-600">Food & Drinks</div>
              <div className="font-semibold">0.025 SOL</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-2xl mb-2">🚌</div>
              <div className="text-sm text-gray-600">Transport</div>
              <div className="font-semibold">0.01 SOL</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm text-gray-600">Academic</div>
              <div className="font-semibold">0.008 SOL</div>
            </Card>
          </div>
        </WalletGuard>
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Payment QR</h3>
              <button 
                onClick={() => setShowScanner(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <QRPaymentScanner 
              onPaymentDetected={handleQRScanned}
              onError={(error) => console.error('Scanner error:', error)}
            />
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showConfirmation && paymentUrl && (
        <PaymentConfirmation
          paymentURL={paymentUrl}
          onConfirm={handlePaymentConfirm}
          onCancel={handlePaymentCancel}
          isVisible={showConfirmation}
        />
      )}
    </div>
  );
}
