/**
 * Parent Dashboard Page
 * Interface for diaspora parents to send money to their children
 */

'use client';

import React, { useState } from 'react';
import { Card, Button, Alert, Badge, Input } from '@/components/ui';
import { WalletGuard, useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { formatCurrency, solToNaira, nairaToSol } from '@/lib/solana/utils';
import BigNumber from 'bignumber.js';

// Mock data for connected students
const connectedStudents = [
  {
    id: 'student_1',
    name: 'Funmi Adebayo',
    university: 'University of Lagos',
    currentBalance: new BigNumber(0.15),
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    walletAddress: 'FunmiWallet123...xyz789'
  }
];

// Mock recent transfers
const recentTransfers = [
  {
    id: '1',
    studentName: 'Funmi Adebayo',
    amount: new BigNumber(0.4), // 0.4 SOL = ~₦20,000
    purpose: 'Monthly Allowance',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'completed' as const
  },
  {
    id: '2',
    studentName: 'Funmi Adebayo', 
    amount: new BigNumber(0.1), // Emergency fund
    purpose: 'Emergency Fund',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    status: 'completed' as const
  }
];

// Mock spending data
const spendingData = [
  { category: 'Food & Drinks', amount: new BigNumber(0.085), percentage: 65 },
  { category: 'Transport', amount: new BigNumber(0.025), percentage: 20 },
  { category: 'Academic', amount: new BigNumber(0.02), percentage: 15 }
];

export default function ParentDashboard() {
  const { balance, connected, publicKey } = useStudyPayWallet();
  const [showSendMoney, setShowSendMoney] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendPurpose, setSendPurpose] = useState('allowance');
  const [loading, setLoading] = useState(false);

  const handleSendMoney = async () => {
    if (!sendAmount) return;
    
    setLoading(true);
    try {
      // In a real app, this would create and send the transaction
      console.log('Sending', sendAmount, 'for', sendPurpose);
      
      // Simulate successful transfer
      setTimeout(() => {
        setLoading(false);
        setShowSendMoney(false);
        setSendAmount('');
        alert('Money sent successfully!');
      }, 2000);
      
    } catch (error) {
      setLoading(false);
      console.error('Transfer failed:', error);
    }
  };

  const totalSentThisMonth = recentTransfers
    .filter(t => t.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum.plus(t.amount), new BigNumber(0));

  return (
    <div className="min-h-screen bg-parent-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-solana-purple-500">StudyPay</h1>
              <span className="ml-2 text-sm text-dark-text-secondary">Parent Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="primary">Parent Account</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Parent Info & Balance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Account Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(new BigNumber(balance), 'SOL')}
                  </div>
                  <div className="text-sm text-gray-600">Wallet Balance</div>
                  <div className="text-xs text-gray-500">
                    ≈ {formatCurrency(solToNaira(new BigNumber(balance)), 'NGN')}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalSentThisMonth, 'SOL')}
                  </div>
                  <div className="text-sm text-gray-600">Sent This Month</div>
                  <div className="text-xs text-gray-500">
                    ≈ {formatCurrency(solToNaira(totalSentThisMonth), 'NGN')}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{connectedStudents.length}</div>
                  <div className="text-sm text-gray-600">Connected Students</div>
                </div>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold mb-3">Quick Actions</h4>
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowSendMoney(true)}
                  className="w-full"
                >
                  💸 Send Money
                </Button>
                <Button variant="secondary" className="w-full">
                  📊 View Reports
                </Button>
                <Button variant="secondary" className="w-full">
                  ⚙️ Settings
                </Button>
              </div>
            </Card>
          </div>

          {/* Connected Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Connected Students</h3>
              <div className="space-y-4">
                {connectedStudents.map((student) => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.university}</p>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Balance:</span>
                        <div className="font-semibold">{formatCurrency(student.currentBalance, 'SOL')}</div>
                        <div className="text-xs text-gray-500">
                          ≈ {formatCurrency(solToNaira(student.currentBalance), 'NGN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Seen:</span>
                        <div className="text-xs">{student.lastSeen.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => setShowSendMoney(true)}
                    >
                      Send Money to {student.name.split(' ')[0]}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Spending Summary */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Student Spending This Week</h3>
              <div className="space-y-3">
                {spendingData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">
                        {item.category.includes('Food') && '🍽️'}
                        {item.category.includes('Transport') && '🚌'}
                        {item.category.includes('Academic') && '📚'}
                      </div>
                      <span className="text-sm">{item.category}</span>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {formatCurrency(item.amount, 'SOL')}
                      </div>
                      <div className="text-xs text-gray-500">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total Spent:</span>
                  <span>{formatCurrency(
                    spendingData.reduce((sum, item) => sum.plus(item.amount), new BigNumber(0)), 
                    'SOL'
                  )}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Transfers */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transfers</h3>
              <Button size="sm" variant="secondary">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentTransfers.map((transfer) => (
                <div key={transfer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💰</div>
                    <div>
                      <div className="font-medium text-sm">
                        {transfer.purpose} → {transfer.studentName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transfer.date.toLocaleDateString()} {transfer.date.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-blue-600">
                      {formatCurrency(transfer.amount, 'SOL')}
                    </div>
                    <div className="text-xs text-gray-500">
                      ≈ {formatCurrency(solToNaira(transfer.amount), 'NGN')}
                    </div>
                    <Badge variant="success" className="text-xs mt-1">
                      {transfer.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </WalletGuard>
      </main>

      {/* Send Money Modal */}
      {showSendMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Send Money</h3>
              <button 
                onClick={() => setShowSendMoney(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Send to:
                </label>
                <select className="w-full p-2 border rounded-lg">
                  {connectedStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.university}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Amount (Naira)"
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="20000"
                helpText={`≈ ${sendAmount ? formatCurrency(nairaToSol(new BigNumber(sendAmount || 0)), 'SOL') : '0 SOL'}`}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose:
                </label>
                <select 
                  value={sendPurpose}
                  onChange={(e) => setSendPurpose(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="allowance">Monthly Allowance</option>
                  <option value="emergency">Emergency Fund</option>
                  <option value="tuition">Tuition Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <Alert type="info">
                <strong>Transaction Fee:</strong> ~$2 (vs $45 Western Union fee)
                <br />
                <strong>Speed:</strong> ~30 seconds (vs 3-7 days traditional)
              </Alert>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowSendMoney(false)}
                  variant="secondary" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMoney}
                  loading={loading}
                  disabled={!sendAmount}
                  className="flex-1"
                >
                  Send Money
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
