/**
 * Campus Analytics Dashboard
 * University-wide payment analytics and insights
 */  
'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { analyticsEngine, CampusAnalytics } from '@/lib/analytics/analyticsEngine';
import { vendorRegistry } from '@/lib/vendors/vendorRegistry';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import BigNumber from 'bignumber.js';

interface CampusAnalyticsDashboardProps {
  walletAddress: string;
}

export default function CampusAnalyticsDashboard({ walletAddress }: CampusAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<CampusAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'semester'>('week');
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<'transactions' | 'sales' | 'vendors' | 'students'>('transactions');

  const { convertSolToNaira, isLoading: priceLoading, error: priceError } = usePriceConversion();

  // Wrapper functions to maintain compatibility
  const solToNaira = (amount: BigNumber) => convertSolToNaira(amount).amount;
  const formatCurrency = (amount: BigNumber, currency: string) => {
    if (currency === 'SOL') {
      return `${amount.toFixed(4)} SOL`;
    } else if (currency === 'NGN') {
      return `₦${amount.toFormat(2)}`;
    }
    return amount.toString();
  };

  useEffect(() => {
    loadAnalytics();
    
    // Subscribe to real-time updates
    const unsubscribe = analyticsEngine.subscribe(handleRealTimeUpdate);
    
    // Initialize real-time connection
    analyticsEngine.initializeRealTime();

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const allTransactions = await transactionStorage.getAllTransactions(walletAddress);
      const allVendors = vendorRegistry.getAllVendors();
      const campusAnalytics = await analyticsEngine.generateCampusAnalytics(allVendors, allTransactions);
      
      setAnalytics(campusAnalytics);
    } catch (error) {
      console.error('Error loading campus analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (update: any) => {
    if (update.type === 'campus_update') {
      setRealTimeData(update.data);
      
      // Update analytics with new data
      if (analytics) {
        const updatedAnalytics = {
          ...analytics,
          realTime: {
            ...analytics.realTime,
            activeTransactions: update.data.activeTransactions,
            currentStudentsActive: update.data.currentStudentsActive,
            totalTodayTransactions: analytics.realTime.totalTodayTransactions + (update.data.newTransactions || 0),
            totalTodayVolume: analytics.realTime.totalTodayVolume.plus(update.data.newVolume || 0),
            lastTransactionTime: update.data.lastTransactionTime
          },
          lastUpdated: new Date()
        };
        setAnalytics(updatedAnalytics);
      }
    }
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthIcon = (percentage: number) => {
  if (percentage >= 90) return <StudyPayIcon name="success" className="h-4 w-4 text-green-500 inline" />;
  if (percentage >= 70) return <StudyPayIcon name="warning" className="h-4 w-4 text-yellow-500 inline" />;
  return <StudyPayIcon name="error" className="h-4 w-4 text-red-500 inline" />;
  };

  const getTrendEmoji = (growth: number) => {
  if (growth > 10) return <StudyPayIcon name="trending" className="h-4 w-4 text-green-500 inline" />;
  if (growth > 0) return <StudyPayIcon name="trending" className="h-4 w-4 text-blue-500 inline" />;
  if (growth < -10) return <StudyPayIcon name="trendingDown" className="h-4 w-4 text-red-500 inline" />;
  return <StudyPayIcon name="next" className="h-4 w-4 text-gray-500 inline" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto"></div>
        <p className="text-center mt-2 text-dark-text-secondary">Loading campus analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center bg-dark-bg-secondary border-dark-border-primary">
        <StudyPayIcon name="analytics" className="h-16 w-16 mx-auto mb-4 text-solana-purple-500" />
        <h3 className="font-semibold text-dark-text-primary mb-2">Campus Analytics Unavailable</h3>
        <p className="text-dark-text-secondary">
          Analytics will appear once campus has transaction data.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary flex items-center gap-2">
            <StudyPayIcon name="analytics" className="h-8 w-8" />
            Campus Analytics
          </h1>
          <p className="text-dark-text-secondary">
            Real-time insights into campus payment ecosystem
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['day', 'week', 'month', 'semester'] as const).map((period) => (
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

      {/* System Health Status */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-dark-text-primary flex items-center gap-2">
            <StudyPayIcon name="settings" className="h-5 w-5" />
            System Health
          </h2>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-dark-text-secondary">Live Monitoring</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-1">
              {getHealthIcon(analytics.overview.systemHealth.overall)}
            </div>
            <div className={`text-lg font-bold ${getHealthColor(analytics.overview.systemHealth.overall)}`}>
              {analytics.overview.systemHealth.overall}%
            </div>
            <p className="text-sm text-dark-text-secondary">Overall Health</p>
          </div>
          
          <div className="text-center">
            <StudyPayIcon name="speed" className="h-6 w-6 mx-auto mb-2 text-solana-purple-500" />
            <div className={`text-lg font-bold ${getHealthColor(analytics.overview.systemHealth.networkPerformance)}`}>
              {analytics.overview.systemHealth.networkPerformance}%
            </div>
            <p className="text-sm text-dark-text-secondary">Network</p>
          </div>
          
          <div className="text-center">
            <StudyPayIcon name="analytics" className="h-6 w-6 mx-auto mb-2 text-solana-purple-500" />
            <div className={`text-lg font-bold ${getHealthColor(analytics.overview.systemHealth.blockchainSync)}`}>
              {analytics.overview.systemHealth.blockchainSync}%
            </div>
            <p className="text-sm text-dark-text-secondary">Blockchain</p>
          </div>
          
          <div className="text-center">
            <StudyPayIcon name="mobile" className="h-6 w-6 mx-auto mb-2 text-solana-purple-500" />
            <div className={`text-lg font-bold ${getHealthColor(analytics.overview.systemHealth.appStability)}`}>
              {analytics.overview.systemHealth.appStability}%
            </div>
            <p className="text-sm text-dark-text-secondary">App Stability</p>
          </div>
        </div>
      </Card>

      {/* Real-time Activity */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
          <StudyPayIcon name="speed" className="h-5 w-5" />
          Real-time Activity
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-solana-purple-500">
              {analytics.realTime.activeTransactions}
            </div>
            <p className="text-sm text-dark-text-secondary">Active Transactions</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {analytics.realTime.currentStudentsActive}
            </div>
            <p className="text-sm text-dark-text-secondary">Students Online</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {analytics.realTime.totalTodayTransactions}
            </div>
            <p className="text-sm text-dark-text-secondary">Today's Transactions</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">
              ₦{solToNaira(analytics.realTime.totalTodayVolume).toFixed(0)}
            </div>
            <p className="text-sm text-dark-text-secondary">Today's Volume</p>
          </div>
        </div>
        
        {realTimeData && (
          <div className="mt-4 p-3 bg-dark-bg-tertiary rounded-lg">
            <div className="text-sm text-green-400 flex items-center gap-1">
              <StudyPayIcon name="info" className="inline h-4 w-4 text-green-400" />
              Latest: {realTimeData.newTransactions} new transactions in the last minute
            </div>
          </div>
        )}
      </Card>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Total Students</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {analytics.overview.totalStudents.toLocaleString()}
              </p>
              <p className="text-xs text-dark-text-muted">Registered users</p>
            </div>
            <StudyPayIcon name="student" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Active Vendors</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {analytics.overview.totalVendors}
              </p>
              <p className="text-xs text-dark-text-muted">Campus partners</p>
            </div>
            <StudyPayIcon name="vendor" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Daily Volume</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                ₦{solToNaira(analytics.financial.dailyVolume).toFixed(0)}
              </p>
              <p className="text-xs text-dark-text-muted">
                ≈ {formatCurrency(analytics.financial.dailyVolume, 'SOL')}
              </p>
            </div>
            <StudyPayIcon name="coins" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Avg. Transaction</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                ₦{solToNaira(analytics.financial.averageTransactionSize).toFixed(0)}
              </p>
              <p className="text-xs text-dark-text-muted">Per purchase</p>
            </div>
            <StudyPayIcon name="analytics" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>
      </div>

      {/* Popular Vendors */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
          <StudyPayIcon name="trophy" className="h-5 w-5" />
          Top Performing Vendors
        </h2>
        
        <div className="space-y-4">
          {analytics.trends.topVendors.slice(0, 5).map((vendor, index) => (
            <div key={vendor.id} className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-solana-purple-500 text-white text-sm rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                
                <div>
                  <h3 className="font-medium text-dark-text-primary">{vendor.name}</h3>
                  <p className="text-sm text-dark-text-secondary">{vendor.category}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-dark-text-primary">
                  ₦{solToNaira(vendor.revenue).toFixed(0)}
                </div>
                <div className="text-sm text-dark-text-secondary">
                  {vendor.transactions} transactions
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trends and Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <h2 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
            <StudyPayIcon name="trending" className="h-5 w-5" />
            Growth Trends
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-dark-text-secondary">Student Growth</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTrendEmoji(analytics.trends.studentGrowth)}</span>
                <span className="font-semibold text-dark-text-primary">
                  {analytics.trends.studentGrowth > 0 ? '+' : ''}{analytics.trends.studentGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-dark-text-secondary">Transaction Growth</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTrendEmoji(analytics.trends.transactionGrowth)}</span>
                <span className="font-semibold text-dark-text-primary">
                  {analytics.trends.transactionGrowth > 0 ? '+' : ''}{analytics.trends.transactionGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-dark-text-secondary">Revenue Growth</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getTrendEmoji(analytics.trends.revenueGrowth)}</span>
                <span className="font-semibold text-dark-text-primary">
                  {analytics.trends.revenueGrowth > 0 ? '+' : ''}{analytics.trends.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <h2 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
            <StudyPayIcon name="clock" className="h-5 w-5" />
            Peak Hours
          </h2>
          
          <div className="space-y-3">
            {analytics.trends.peakHours.map((hour, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 text-sm text-dark-text-secondary">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </div>
                  
                  <div className="flex-1 bg-dark-bg-tertiary rounded-full h-4 relative">
                    <div 
                      className="bg-solana-purple-500 h-4 rounded-full"
                      style={{ 
                        width: `${(hour.activity / Math.max(...analytics.trends.peakHours.map(h => h.activity))) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-dark-text-primary font-medium">
                  {hour.activity}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Campus Categories */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h2 className="text-xl font-semibold text-dark-text-primary mb-4 flex items-center gap-2">
          <StudyPayIcon name="analytics" className="h-5 w-5" />
          Popular Categories
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.trends.popularCategories.map((category, index) => (
            <div key={index} className="text-center p-3 bg-dark-bg-tertiary rounded-lg">
              <div className="text-2xl mb-2">{category.emoji}</div>
              <h3 className="font-medium text-dark-text-primary">{category.name}</h3>
              <p className="text-sm text-dark-text-secondary">
                ₦{solToNaira(category.revenue).toFixed(0)} revenue
              </p>
              <p className="text-xs text-dark-text-muted">
                {category.transactions} transactions
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-dark-text-muted">
        Last updated: {analytics.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
