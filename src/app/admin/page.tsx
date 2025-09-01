/**
 * Campus Admin Dashboard
 * Administrative interface for campus-wide payment system monitoring
 */

'use client';

import React, { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { WalletGuard, useStudyPayWallet, WalletButton } from '@/components/wallet/WalletProvider';
import CampusAnalyticsDashboard from '@/components/analytics/CampusAnalyticsDashboard';

export default function CampusAdminDashboard() {
  const { publicKey } = useStudyPayWallet();
  const [activeTab, setActiveTab] = useState<'analytics' | 'vendors' | 'students' | 'system'>('analytics');

  return (
    <div className="min-h-screen bg-campus-gradient">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-solana-purple-500">StudyPay</h1>
              <span className="ml-2 text-sm text-dark-text-secondary">Campus Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                🏫 Admin Access
              </Badge>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WalletGuard>
          {/* Welcome Section */}
          <div className="mb-8">
            <Card className="bg-dark-bg-secondary border-dark-border-primary">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text-primary">Campus Payment Analytics</h2>
                  <p className="text-dark-text-secondary mt-1">
                    Monitor and analyze the campus payment ecosystem
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-dark-text-secondary">System Status</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-500 font-medium">Operational</span>
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
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  📊 Analytics Dashboard
                </button>
                
                <button
                  onClick={() => setActiveTab('vendors')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'vendors'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  🏪 Vendor Management
                </button>
                
                <button
                  onClick={() => setActiveTab('students')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'students'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  👨‍🎓 Student Analytics
                </button>
                
                <button
                  onClick={() => setActiveTab('system')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'system'
                      ? 'border-solana-purple-500 text-solana-purple-500'
                      : 'border-transparent text-dark-text-secondary hover:text-dark-text-primary hover:border-dark-border-secondary'
                  }`}
                >
                  ⚙️ System Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'analytics' && (
            <CampusAnalyticsDashboard 
              walletAddress={publicKey?.toBase58() || ''}
            />
          )}
          
          {activeTab === 'vendors' && (
            <div className="space-y-6">{renderVendorManagement()}</div>
          )}
          
          {activeTab === 'students' && (
            <div className="space-y-6">{renderStudentAnalytics()}</div>
          )}
          
          {activeTab === 'system' && (
            <div className="space-y-6">{renderSystemSettings()}</div>
          )}
        </WalletGuard>
      </main>
    </div>
  );

  function renderVendorManagement() {
    return (
      <>
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Vendor Directory</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-green-500">42</div>
                <p className="text-sm text-dark-text-secondary">Active Vendors</p>
              </div>
              
              <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">5</div>
                <p className="text-sm text-dark-text-secondary">Pending Approval</p>
              </div>
              
              <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
                <div className="text-2xl font-bold text-blue-500">8</div>
                <p className="text-sm text-dark-text-secondary">Categories</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Recent Vendor Applications</h3>
          <div className="space-y-3">
            {[
              { name: 'Fresh Juice Corner', category: 'Beverages', status: 'pending' },
              { name: 'Quick Bites Cafeteria', category: 'Food', status: 'approved' },
              { name: 'Campus Bookstore', category: 'Books & Supplies', status: 'pending' }
            ].map((vendor, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg">
                <div>
                  <h4 className="font-medium text-dark-text-primary">{vendor.name}</h4>
                  <p className="text-sm text-dark-text-secondary">{vendor.category}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={vendor.status === 'approved' ? 'success' : 'warning'}>
                    {vendor.status.toUpperCase()}
                  </Badge>
                  
                  {vendor.status === 'pending' && (
                    <div className="flex space-x-1">
                      <Button size="sm" variant="primary">Approve</Button>
                      <Button size="sm" variant="secondary">Review</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  function renderStudentAnalytics() {
    return (
      <>
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Student Engagement</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-blue-500">2,847</div>
              <p className="text-sm text-dark-text-secondary">Registered Students</p>
            </div>
            
            <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-green-500">1,923</div>
              <p className="text-sm text-dark-text-secondary">Active This Month</p>
            </div>
            
            <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-purple-500">67.5%</div>
              <p className="text-sm text-dark-text-secondary">Engagement Rate</p>
            </div>
            
            <div className="text-center p-4 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl font-bold text-yellow-500">4.2</div>
              <p className="text-sm text-dark-text-secondary">Avg. Transactions/Week</p>
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Spending Patterns</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-dark-text-primary mb-3">Top Spending Categories</h4>
                <div className="space-y-2">
                  {[
                    { category: 'Food & Beverages', percentage: 65, amount: '12.8 SOL' },
                    { category: 'Books & Supplies', percentage: 20, amount: '3.9 SOL' },
                    { category: 'Transportation', percentage: 10, amount: '2.1 SOL' },
                    { category: 'Other', percentage: 5, amount: '1.2 SOL' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-dark-text-secondary">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-dark-bg-tertiary rounded-full">
                          <div 
                            className="h-2 bg-solana-purple-500 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-dark-text-primary font-medium">{item.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-dark-text-primary mb-3">Peak Usage Hours</h4>
                <div className="space-y-2">
                  {[
                    { hour: '12:00 PM', activity: 'Lunch Rush', level: 95 },
                    { hour: '06:00 PM', activity: 'Dinner Time', level: 80 },
                    { hour: '09:00 AM', activity: 'Morning Coffee', level: 60 },
                    { hour: '03:00 PM', activity: 'Afternoon Snacks', level: 45 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-dark-text-primary font-medium">{item.hour}</span>
                        <p className="text-xs text-dark-text-muted">{item.activity}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-dark-bg-tertiary rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${item.level}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-text-secondary">{item.level}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function renderSystemSettings() {
    return (
      <>
        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">System Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Auto-approve verified vendors</h4>
                <p className="text-sm text-dark-text-secondary">Automatically approve vendors with valid documentation</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Real-time analytics</h4>
                <p className="text-sm text-dark-text-secondary">Enable live data updates and monitoring</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-dark-text-primary">Transaction notifications</h4>
                <p className="text-sm text-dark-text-secondary">Send alerts for unusual transaction patterns</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Payment Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Daily Transaction Limit (SOL)
              </label>
              <input
                type="number"
                defaultValue="5.0"
                step="0.1"
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-text-secondary mb-1">
                Single Transaction Limit (SOL)
              </label>
              <input
                type="number"
                defaultValue="1.0"
                step="0.01"
                className="w-full px-3 py-2 bg-dark-bg-tertiary border border-dark-border-secondary rounded-md text-dark-text-primary"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">Data & Privacy</h3>
          <div className="space-y-4">
            <Button variant="secondary" className="mr-2">Export Analytics Data</Button>
            <Button variant="secondary" className="mr-2">Clear Old Transaction Logs</Button>
            <Button variant="danger">Reset System (Admin Only)</Button>
          </div>
        </Card>
      </>
    );
  }
}
