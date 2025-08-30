/**
 * Vendor Analytics Dashboard
 * Real-time sales analytics and insights for vendors
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { analyticsEngine, VendorAnalytics } from '@/lib/analytics/analyticsEngine';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import BigNumber from 'bignumber.js';

interface VendorAnalyticsDashboardProps {
  vendor: VendorProfile;
  walletAddress: string;
}

export default function VendorAnalyticsDashboard({ 
  vendor, 
  walletAddress 
}: VendorAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [realTimeData, setRealTimeData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Subscribe to real-time updates
    const unsubscribe = analyticsEngine.subscribe(handleRealTimeUpdate);
    
    // Initialize real-time connection
    analyticsEngine.initializeRealTime();

    return unsubscribe;
  }, [vendor.id, timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get transactions for this vendor
      const allTransactions = await transactionStorage.getAllTransactions(walletAddress);
      
      // Generate analytics
      const vendorAnalytics = await analyticsEngine.generateVendorAnalytics(
        vendor.id,
        timeframe,
        allTransactions
      );
      
      setAnalytics(vendorAnalytics);
    } catch (error) {
      console.error('Error loading vendor analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (update: any) => {
    if (update.type === 'vendor_update' && update.data.vendorId === vendor.id) {
      setRealTimeData(update.data);
      
      // Update analytics with new data
      if (analytics) {
        const updatedAnalytics = {
          ...analytics,
          realTimeData: {
            ...analytics.realTimeData,
            currentHourSales: analytics.realTimeData.currentHourSales.plus(update.data.newTransaction.amount),
            currentHourTransactions: analytics.realTimeData.currentHourTransactions + 1,
            lastTransactionTime: update.data.newTransaction.timestamp,
            activeCustomers: update.data.currentActivity
          },
          lastUpdated: new Date()
        };
        setAnalytics(updatedAnalytics);
      }
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-500';
    if (growth < 0) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➡️';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '🚀';
      case 'down': return '📉';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto"></div>
        <p className="text-center mt-2 text-dark-text-secondary">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="font-semibold text-dark-text-primary mb-2">No Analytics Available</h3>
        <p className="text-dark-text-secondary">
          Analytics will appear once you have transaction data.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark-text-primary">
          📊 Analytics Dashboard
        </h2>
        
        <div className="flex space-x-2">
          {(['hour', 'day', 'week', 'month'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Real-time Status */}
      <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-dark-text-primary font-medium">Live Updates</span>
            <Badge variant="success" className="text-xs">
              Real-time
            </Badge>
          </div>
          
          <div className="text-sm text-dark-text-secondary">
            Last updated: {analytics.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        
        {realTimeData && (
          <div className="mt-3 p-3 bg-dark-bg-tertiary rounded-lg">
            <div className="text-sm text-green-400">
              🔔 New transaction: {formatCurrency(realTimeData.newTransaction.amount, 'SOL')} 
              for {realTimeData.newTransaction.item}
            </div>
            <div className="text-xs text-dark-text-muted mt-1">
              {realTimeData.currentActivity} customers currently active
            </div>
          </div>
        )}
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Total Sales</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {formatCurrency(analytics.metrics.totalSales, 'SOL')}
              </p>
              <p className="text-xs text-dark-text-muted">
                ≈ ₦{solToNaira(analytics.metrics.totalSales).toFixed(0)}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-sm ${getGrowthColor(analytics.metrics.performance.growthRate)}`}>
                {getGrowthIcon(analytics.metrics.performance.growthRate)} 
                {analytics.metrics.performance.growthRate > 0 ? '+' : ''}{analytics.metrics.performance.growthRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Transactions</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {analytics.metrics.totalTransactions}
              </p>
              <p className="text-xs text-dark-text-muted">
                {timeframe} total
              </p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Avg. Order</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {formatCurrency(analytics.metrics.averageOrderValue, 'SOL')}
              </p>
              <p className="text-xs text-dark-text-muted">
                per transaction
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Campus Rank</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                #{analytics.metrics.performance.rank}
              </p>
              <p className="text-xs text-dark-text-muted">
                #{analytics.metrics.performance.categoryRank} in {vendor.category}
              </p>
            </div>
            <div className="text-2xl">🏆</div>
          </div>
        </Card>
      </div>

      {/* Current Activity */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          ⚡ Current Activity
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-solana-purple-500">
              {formatCurrency(analytics.realTimeData.currentHourSales, 'SOL')}
            </div>
            <p className="text-sm text-dark-text-secondary">This Hour Sales</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {analytics.realTimeData.activeCustomers}
            </div>
            <p className="text-sm text-dark-text-secondary">Active Customers</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {analytics.realTimeData.estimatedWaitTime}m
            </div>
            <p className="text-sm text-dark-text-secondary">Est. Wait Time</p>
          </div>
        </div>
      </Card>

      {/* Trends & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
            {getTrendIcon(analytics.trends.salesTrend)} Sales Trend
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-text-secondary">Trend Direction</span>
              <Badge variant={analytics.trends.salesTrend === 'up' ? 'success' : 
                           analytics.trends.salesTrend === 'down' ? 'danger' : 'warning'}>
                {analytics.trends.salesTrend.toUpperCase()}
              </Badge>
            </div>
            
            <div>
              <span className="text-dark-text-secondary">Popular Times</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analytics.trends.popularTimes.map((time, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-dark-bg-tertiary text-xs rounded text-dark-text-muted"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-dark-text-secondary">Busy Days</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analytics.trends.busyDays.map((day, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-dark-bg-tertiary text-xs rounded text-dark-text-muted capitalize"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Top Selling Items */}
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
            🏆 Top Selling Items
          </h3>
          
          <div className="space-y-3">
            {analytics.metrics.topSellingItems.length > 0 ? (
              analytics.metrics.topSellingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-solana-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-dark-text-primary font-medium">{item.item}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-dark-text-primary">
                      {item.count} sold
                    </div>
                    <div className="text-xs text-dark-text-secondary">
                      {formatCurrency(item.revenue, 'SOL')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-dark-text-secondary">
                No sales data yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Customer Analytics */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          👥 Customer Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {analytics.metrics.customerSegments.newCustomers}
            </div>
            <p className="text-sm text-dark-text-secondary">New Customers</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {analytics.metrics.customerSegments.returningCustomers}
            </div>
            <p className="text-sm text-dark-text-secondary">Returning</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {analytics.metrics.customerSegments.totalUniqueCustomers}
            </div>
            <p className="text-sm text-dark-text-secondary">Total Unique</p>
          </div>
        </div>
      </Card>

      {/* Hourly Breakdown Chart */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          📈 Hourly Sales Pattern
        </h3>
        
        <div className="space-y-2">
          {analytics.metrics.hourlyBreakdown
            .filter(hour => hour.transactions > 0)
            .slice(0, 12)
            .map((hour) => (
              <div key={hour.hour} className="flex items-center space-x-3">
                <div className="w-12 text-sm text-dark-text-secondary">
                  {hour.hour.toString().padStart(2, '0')}:00
                </div>
                
                <div className="flex-1 bg-dark-bg-tertiary rounded-full h-6 relative">
                  <div 
                    className="bg-solana-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${Math.max((hour.transactions / Math.max(...analytics.metrics.hourlyBreakdown.map(h => h.transactions))) * 100, 5)}%` 
                    }}
                  >
                    <span className="text-xs text-white">
                      {hour.transactions}
                    </span>
                  </div>
                </div>
                
                <div className="w-16 text-sm text-dark-text-secondary text-right">
                  {formatCurrency(hour.sales, 'SOL')}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
