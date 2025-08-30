/**
 * Real-time Analytics Engine
 * Provides live insights for vendors, students, and campus administrators
 */

import { Transaction } from '@/lib/types/payment';
import { VendorProfile, vendorRegistry } from '@/lib/vendors/vendorRegistry';
import BigNumber from 'bignumber.js';

export interface VendorAnalytics {
  vendorId: string;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  metrics: {
    totalSales: BigNumber;
    totalTransactions: number;
    averageOrderValue: BigNumber;
    topSellingItems: Array<{
      item: string;
      count: number;
      revenue: BigNumber;
    }>;
    hourlyBreakdown: Array<{
      hour: number;
      sales: BigNumber;
      transactions: number;
    }>;
    customerSegments: {
      newCustomers: number;
      returningCustomers: number;
      totalUniqueCustomers: number;
    };
    paymentMethods: {
      sol: BigNumber;
      crypto: BigNumber;
      cash: BigNumber;
    };
    performance: {
      growthRate: number; // % change from previous period
      rank: number; // Campus ranking
      categoryRank: number; // Rank within category
    };
  };
  trends: {
    salesTrend: 'up' | 'down' | 'stable';
    popularTimes: string[]; // ["09:00", "12:00", "15:00"]
    busyDays: string[]; // ["monday", "friday"]
    seasonalFactors: number; // Multiplier for seasonal adjustments
  };
  realTimeData: {
    currentHourSales: BigNumber;
    currentHourTransactions: number;
    lastTransactionTime: Date;
    activeCustomers: number; // Currently browsing/ordering
    estimatedWaitTime: number; // Minutes
  };
  lastUpdated: Date;
}

export interface CampusAnalytics {
  overview: {
    totalVendors: number;
    activeVendors: number;
    totalStudents: number;
    activeStudents: number;
    systemHealth: {
      overall: number;
      networkPerformance: number;
      blockchainSync: number;
      appStability: number;
    };
  };
  financial: {
    totalVolume: BigNumber;
    dailyVolume: BigNumber;
    totalTransactions: number;
    averageTransactionValue: BigNumber;
    averageTransactionSize: BigNumber;
    cryptoAdoption: number; // Percentage
  };
  trends: {
    topCategories: Array<{
      category: string;
      volume: BigNumber;
      growth: number;
    }>;
    topVendors: Array<{
      id: string;
      name: string;
      category: string;
      revenue: BigNumber;
      transactions: number;
      vendor: VendorProfile;
      sales: BigNumber;
      growth: number;
    }>;
    busyHours: Array<{
      hour: number;
      activity: number;
    }>;
    peakHours: Array<{
      hour: number;
      activity: number;
    }>;
    popularCategories: Array<{
      name: string;
      emoji: string;
      revenue: BigNumber;
      transactions: number;
    }>;
    popularLocations: Array<{
      building: string;
      activity: number;
    }>;
    studentGrowth: number;
    transactionGrowth: number;
    revenueGrowth: number;
  };
  realTime: {
    currentTransactions: number;
    activeTransactions: number;
    currentStudentsActive: number;
    totalTodayTransactions: number;
    totalTodayVolume: BigNumber;
    averageWaitTime: number;
    systemLoad: number; // 0-100%
    activeConnections: number;
    lastTransactionTime?: Date;
  };
  lastUpdated: Date;
}

export interface StudentInsights {
  studentId: string;
  spendingAnalytics: {
    totalSpent: BigNumber;
    averageDaily: BigNumber;
    averagePerDay: BigNumber;
    totalTransactions: number;
    frequencyPerWeek: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    peakSpendingTimes: string[];
    categoryBreakdown: Array<{
      category: string;
      emoji: string;
      amount: BigNumber;
      percentage: number;
      transactions: number;
    }>;
    topCategories: Array<{
      category: string;
      amount: BigNumber;
      percentage: number;
    }>;
    favoriteVendors: Array<{
      vendorId: string;
      visitCount: number;
      totalSpent: BigNumber;
      vendor: VendorProfile;
      visits: number;
    }>;
    spendingPattern: 'conservative' | 'moderate' | 'high';
    budgetStatus: 'under' | 'near' | 'over';
  };
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings?: BigNumber;
    vendorId?: string;
  }>;
  insights: {
    budgetStatus: 'under' | 'near' | 'over';
    budgetUtilization: number;
    spendingHabits: string[];
    savingsOpportunities: string[];
  };
  lastUpdated: Date;
}

/**
 * Real-time Analytics Service
 */
export class AnalyticsEngine {
  private static instance: AnalyticsEngine;
  private updateCallbacks: Set<(data: any) => void> = new Set();
  private webSocket: WebSocket | null = null;
  
  public static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine();
    }
    return AnalyticsEngine.instance;
  }

  /**
   * Initialize real-time connection
   */
  async initializeRealTime(): Promise<void> {
    try {
      // In production, this would connect to a WebSocket server
      // For now, we'll simulate with periodic updates
      this.simulateRealTimeUpdates();
      console.log('Real-time analytics initialized');
    } catch (error) {
      console.error('Failed to initialize real-time analytics:', error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: any) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Generate vendor analytics
   */
  async generateVendorAnalytics(
    vendorId: string, 
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day',
    transactions: Transaction[] = []
  ): Promise<VendorAnalytics> {
    const now = new Date();
    const startTime = this.getTimeframeStart(timeframe);
    
    // Filter transactions for this vendor and timeframe
    const vendorTransactions = transactions.filter(tx => 
      tx.otherParty === vendorId && 
      tx.timestamp >= startTime &&
      tx.type === 'outgoing' &&
      tx.status === 'confirmed'
    );

    const totalSales = vendorTransactions.reduce(
      (sum, tx) => sum.plus(tx.amount), 
      new BigNumber(0)
    );

    const analytics: VendorAnalytics = {
      vendorId,
      timeframe,
      metrics: {
        totalSales,
        totalTransactions: vendorTransactions.length,
        averageOrderValue: vendorTransactions.length > 0 
          ? totalSales.dividedBy(vendorTransactions.length)
          : new BigNumber(0),
        topSellingItems: this.extractTopItems(vendorTransactions),
        hourlyBreakdown: this.generateHourlyBreakdown(vendorTransactions),
        customerSegments: this.analyzeCustomerSegments(vendorTransactions),
        paymentMethods: {
          sol: totalSales,
          crypto: totalSales,
          cash: new BigNumber(0)
        },
        performance: {
          growthRate: this.calculateGrowthRate(vendorId, timeframe),
          rank: this.calculateVendorRank(vendorId),
          categoryRank: this.calculateCategoryRank(vendorId)
        }
      },
      trends: {
        salesTrend: this.determineSalesTrend(vendorTransactions),
        popularTimes: this.findPopularTimes(vendorTransactions),
        busyDays: this.findBusyDays(vendorTransactions),
        seasonalFactors: 1.0
      },
      realTimeData: {
        currentHourSales: this.getCurrentHourSales(vendorTransactions),
        currentHourTransactions: this.getCurrentHourTransactions(vendorTransactions),
        lastTransactionTime: this.getLastTransactionTime(vendorTransactions),
        activeCustomers: Math.floor(Math.random() * 10), // Simulated
        estimatedWaitTime: Math.floor(Math.random() * 15) + 2 // 2-17 minutes
      },
      lastUpdated: now
    };

    return analytics;
  }

  /**
   * Generate campus-wide analytics
   */
  async generateCampusAnalytics(
    vendors: VendorProfile[],
    transactions: Transaction[]
  ): Promise<CampusAnalytics> {
    const now = new Date();
    const activeVendors = vendors.filter(v => v.isActive);
    
    const totalVolume = transactions.reduce(
      (sum, tx) => sum.plus(tx.amount),
      new BigNumber(0)
    );

    return {
      overview: {
        totalVendors: vendors.length,
        activeVendors: activeVendors.length,
        totalStudents: 1500, // Simulated
        activeStudents: 450, // Simulated
        systemHealth: {
          overall: Math.floor(Math.random() * 20) + 80, // 80-100%
          networkPerformance: Math.floor(Math.random() * 15) + 85, // 85-100%
          blockchainSync: Math.floor(Math.random() * 10) + 90, // 90-100%
          appStability: Math.floor(Math.random() * 25) + 75 // 75-100%
        }
      },
      financial: {
        totalVolume,
        dailyVolume: totalVolume.dividedBy(30), // Simulate daily average
        totalTransactions: transactions.length,
        averageTransactionValue: transactions.length > 0 
          ? totalVolume.dividedBy(transactions.length)
          : new BigNumber(0),
        averageTransactionSize: transactions.length > 0 
          ? totalVolume.dividedBy(transactions.length)
          : new BigNumber(0),
        cryptoAdoption: 85 // 85% crypto adoption
      },
      trends: {
        topCategories: this.analyzeTopCategories(transactions),
        topVendors: this.analyzeTopVendorsExtended(vendors, transactions),
        busyHours: this.analyzeBusyHours(transactions),
        peakHours: this.analyzeBusyHours(transactions),
        popularCategories: this.analyzePopularCategoriesExtended(transactions),
        popularLocations: this.analyzePopularLocations(vendors, transactions),
        studentGrowth: Math.random() * 20 - 5, // -5% to +15%
        transactionGrowth: Math.random() * 25 + 5, // +5% to +30%
        revenueGrowth: Math.random() * 30 + 10 // +10% to +40%
      },
      realTime: {
        currentTransactions: Math.floor(Math.random() * 25) + 5,
        activeTransactions: Math.floor(Math.random() * 15) + 3,
        currentStudentsActive: Math.floor(Math.random() * 50) + 20,
        totalTodayTransactions: Math.floor(Math.random() * 200) + 50,
        totalTodayVolume: totalVolume.dividedBy(30).multipliedBy(Math.random() + 0.5),
        averageWaitTime: Math.floor(Math.random() * 10) + 3,
        systemLoad: Math.floor(Math.random() * 30) + 40, // 40-70%
        activeConnections: Math.floor(Math.random() * 200) + 150,
        lastTransactionTime: transactions.length > 0 ? transactions[0].timestamp : undefined
      },
      lastUpdated: now
    };
  }

  /**
   * Generate student insights
   */
  async generateStudentInsights(
    studentWallet: string,
    period: string,
    transactions: Transaction[]
  ): Promise<StudentInsights> {
    const studentTransactions = transactions.filter(tx => 
      tx.fromAddress === studentWallet || tx.otherParty === studentWallet
    );

    const totalSpent = studentTransactions
      .filter(tx => tx.type === 'outgoing')
      .reduce((sum, tx) => sum.plus(tx.amount), new BigNumber(0));

    return {
      studentId: studentWallet,
      spendingAnalytics: {
        totalSpent,
        averageDaily: totalSpent.dividedBy(30), // Last 30 days
        averagePerDay: totalSpent.dividedBy(30),
        totalTransactions: studentTransactions.length,
        frequencyPerWeek: studentTransactions.length / 4.3, // Approximate weeks in month
        spendingTrend: this.determineSpendingTrend(studentTransactions),
        peakSpendingTimes: this.findPeakSpendingTimes(studentTransactions),
        categoryBreakdown: this.analyzeStudentCategoriesExtended(studentTransactions),
        topCategories: this.analyzeStudentCategories(studentTransactions),
        favoriteVendors: this.analyzeStudentVendorsExtended(studentTransactions),
        spendingPattern: this.determineSpendingPattern(totalSpent),
        budgetStatus: this.determineBudgetStatus(totalSpent)
      },
      recommendations: this.generateRecommendations(studentTransactions, totalSpent),
      insights: this.generateInsights(studentTransactions, totalSpent),
      lastUpdated: new Date()
    };
  }

  /**
   * Simulate real-time updates (in production, this would be WebSocket-based)
   */
  private simulateRealTimeUpdates(): void {
    setInterval(() => {
      const update = {
        type: 'vendor_update',
        data: {
          vendorId: 'vendor_campus_cafe',
          newTransaction: {
            amount: new BigNumber(Math.random() * 0.05 + 0.01),
            timestamp: new Date(),
            item: 'Jollof Rice Special'
          },
          currentActivity: Math.floor(Math.random() * 15) + 5
        }
      };

      this.notifySubscribers(update);
    }, 30000); // Update every 30 seconds

    // Campus-wide updates
    setInterval(() => {
      const campusUpdate = {
        type: 'campus_update',
        data: {
          activeStudents: Math.floor(Math.random() * 100) + 400,
          currentTransactions: Math.floor(Math.random() * 20) + 10,
          systemLoad: Math.floor(Math.random() * 20) + 50
        }
      };

      this.notifySubscribers(campusUpdate);
    }, 60000); // Update every minute
  }

  /**
   * Notify all subscribers of updates
   */
  private notifySubscribers(data: any): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in analytics callback:', error);
      }
    });
  }

  // Helper methods for analytics calculations
  private getTimeframeStart(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour': return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private extractTopItems(transactions: Transaction[]): Array<{item: string, count: number, revenue: BigNumber}> {
    const items: Record<string, {count: number, revenue: BigNumber}> = {};
    
    transactions.forEach(tx => {
      const item = tx.description.split(' - ')[0] || tx.description;
      if (!items[item]) {
        items[item] = { count: 0, revenue: new BigNumber(0) };
      }
      items[item].count++;
      items[item].revenue = items[item].revenue.plus(tx.amount);
    });

    return Object.entries(items)
      .map(([item, data]) => ({ item, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private generateHourlyBreakdown(transactions: Transaction[]): Array<{hour: number, sales: BigNumber, transactions: number}> {
    const hours: Record<number, {sales: BigNumber, transactions: number}> = {};
    
    for (let i = 0; i < 24; i++) {
      hours[i] = { sales: new BigNumber(0), transactions: 0 };
    }

    transactions.forEach(tx => {
      const hour = tx.timestamp.getHours();
      hours[hour].sales = hours[hour].sales.plus(tx.amount);
      hours[hour].transactions++;
    });

    return Object.entries(hours).map(([hour, data]) => ({
      hour: parseInt(hour),
      ...data
    }));
  }

  private analyzeCustomerSegments(transactions: Transaction[]): {newCustomers: number, returningCustomers: number, totalUniqueCustomers: number} {
    const customers = new Set(transactions.map(tx => tx.fromAddress || tx.otherParty));
    return {
      newCustomers: Math.floor(customers.size * 0.3),
      returningCustomers: Math.floor(customers.size * 0.7),
      totalUniqueCustomers: customers.size
    };
  }

  private calculateGrowthRate(vendorId: string, timeframe: string): number {
    // Simulated growth rate
    return Math.random() * 20 - 5; // -5% to +15%
  }

  private calculateVendorRank(vendorId: string): number {
    return Math.floor(Math.random() * 10) + 1; // 1-10
  }

  private calculateCategoryRank(vendorId: string): number {
    return Math.floor(Math.random() * 5) + 1; // 1-5
  }

  private determineSalesTrend(transactions: Transaction[]): 'up' | 'down' | 'stable' {
    const trends = ['up', 'down', 'stable'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private findPopularTimes(transactions: Transaction[]): string[] {
    return ['09:00', '12:00', '15:00', '18:00'];
  }

  private findBusyDays(transactions: Transaction[]): string[] {
    return ['monday', 'wednesday', 'friday'];
  }

  private getCurrentHourSales(transactions: Transaction[]): BigNumber {
    const currentHour = new Date().getHours();
    return transactions
      .filter(tx => tx.timestamp.getHours() === currentHour)
      .reduce((sum, tx) => sum.plus(tx.amount), new BigNumber(0));
  }

  private getCurrentHourTransactions(transactions: Transaction[]): number {
    const currentHour = new Date().getHours();
    return transactions.filter(tx => tx.timestamp.getHours() === currentHour).length;
  }

  private getLastTransactionTime(transactions: Transaction[]): Date {
    return transactions.length > 0 
      ? transactions[transactions.length - 1].timestamp 
      : new Date();
  }

  // Additional helper methods would be implemented here...
  private analyzeTopCategories(transactions: Transaction[]): Array<{category: string, volume: BigNumber, growth: number}> {
    const categories: Record<string, BigNumber> = {};
    
    transactions.forEach(tx => {
      const category = tx.category || 'other';
      categories[category] = (categories[category] || new BigNumber(0)).plus(tx.amount);
    });

    return Object.entries(categories)
      .map(([category, volume]) => ({ 
        category, 
        volume, 
        growth: Math.random() * 30 - 10 // -10% to +20%
      }))
      .sort((a, b) => b.volume.minus(a.volume).toNumber())
      .slice(0, 5);
  }

  private analyzeTopVendors(vendors: VendorProfile[], transactions: Transaction[]): Array<{vendor: VendorProfile, sales: BigNumber, growth: number}> {
    return vendors.slice(0, 5).map(vendor => ({
      vendor,
      sales: vendor.stats.totalSales,
      growth: Math.random() * 25 - 5 // -5% to +20%
    }));
  }

  private analyzeBusyHours(transactions: Transaction[]): Array<{hour: number, activity: number}> {
    const hours: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      hours[i] = 0;
    }

    transactions.forEach(tx => {
      hours[tx.timestamp.getHours()]++;
    });

    return Object.entries(hours).map(([hour, activity]) => ({
      hour: parseInt(hour),
      activity
    }));
  }

  private analyzePopularLocations(vendors: VendorProfile[], transactions: Transaction[]): Array<{building: string, activity: number}> {
    const locations: Record<string, number> = {};
    
    vendors.forEach(vendor => {
      const building = vendor.location.building;
      locations[building] = (locations[building] || 0) + vendor.stats.totalTransactions;
    });

    return Object.entries(locations)
      .map(([building, activity]) => ({ building, activity }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5);
  }

  private analyzeStudentCategories(transactions: Transaction[]): Array<{category: string, amount: BigNumber, percentage: number}> {
    const categories: Record<string, BigNumber> = {};
    let total = new BigNumber(0);
    
    transactions.filter(tx => tx.type === 'outgoing').forEach(tx => {
      const category = tx.category || 'other';
      categories[category] = (categories[category] || new BigNumber(0)).plus(tx.amount);
      total = total.plus(tx.amount);
    });

    return Object.entries(categories)
      .map(([category, amount]) => ({ 
        category, 
        amount, 
        percentage: total.gt(0) ? amount.dividedBy(total).multipliedBy(100).toNumber() : 0
      }))
      .sort((a, b) => b.amount.minus(a.amount).toNumber())
      .slice(0, 5);
  }

  private analyzeStudentVendors(transactions: Transaction[], vendors: VendorProfile[]): Array<{vendor: VendorProfile, visits: number, totalSpent: BigNumber}> {
    const vendorStats: Record<string, {visits: number, totalSpent: BigNumber}> = {};
    
    transactions.filter(tx => tx.type === 'outgoing').forEach(tx => {
      const vendorId = tx.otherParty;
      if (vendorId) {
        if (!vendorStats[vendorId]) {
          vendorStats[vendorId] = { visits: 0, totalSpent: new BigNumber(0) };
        }
        vendorStats[vendorId].visits++;
        vendorStats[vendorId].totalSpent = vendorStats[vendorId].totalSpent.plus(tx.amount);
      }
    });

    return Object.entries(vendorStats)
      .map(([vendorId, stats]) => {
        const vendor = vendors.find(v => v.id === vendorId || v.walletAddress === vendorId);
        return vendor ? { vendor, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.visits - a!.visits)
      .slice(0, 3) as Array<{vendor: VendorProfile, visits: number, totalSpent: BigNumber}>;
  }

  private determineSpendingPattern(totalSpent: BigNumber): 'conservative' | 'moderate' | 'high' {
    if (totalSpent.lt(0.5)) return 'conservative';
    if (totalSpent.lt(2.0)) return 'moderate';
    return 'high';
  }

  private determineBudgetStatus(totalSpent: BigNumber): 'under' | 'near' | 'over' {
    const budgetLimit = new BigNumber(1.5); // Example monthly budget
    if (totalSpent.lt(budgetLimit.multipliedBy(0.8))) return 'under';
    if (totalSpent.lt(budgetLimit)) return 'near';
    return 'over';
  }

  private generateVendorRecommendations(transactions: Transaction[], vendors: VendorProfile[]): VendorProfile[] {
    // Simple recommendation: suggest vendors from categories the student hasn't tried
    const usedCategories = new Set(transactions.map(tx => tx.category));
    return vendors
      .filter(vendor => !usedCategories.has(vendor.category) && vendor.rating.average >= 4.0)
      .slice(0, 3);
  }

  private generateBudgetAlerts(totalSpent: BigNumber): string[] {
    const alerts = [];
    if (totalSpent.gt(1.0)) {
      alerts.push('You\'ve spent more than 1 SOL this month');
    }
    if (totalSpent.gt(0.5)) {
      alerts.push('Consider setting a weekly spending limit');
    }
    return alerts;
  }

  private generateSavingTips(transactions: Transaction[]): string[] {
    return [
      'Look for vendors with student discounts',
      'Try cooking more meals to reduce food expenses',
      'Use the vendor rating system to find better value options'
    ];
  }

  private findPeakSpendingTime(transactions: Transaction[]): string {
    const hours: Record<number, number> = {};
    
    transactions.forEach(tx => {
      const hour = tx.timestamp.getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hours)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '12';
    
    return `${peakHour}:00`;
  }

  private determineSpendingTrend(transactions: Transaction[]): 'increasing' | 'decreasing' | 'stable' {
    if (transactions.length < 2) return 'stable';
    
    const recentAmount = transactions.slice(0, Math.floor(transactions.length / 2))
      .reduce((sum, tx) => sum.plus(tx.amount), new BigNumber(0));
    const olderAmount = transactions.slice(Math.floor(transactions.length / 2))
      .reduce((sum, tx) => sum.plus(tx.amount), new BigNumber(0));
    
    const diff = recentAmount.minus(olderAmount).toNumber();
    if (diff > 0.1) return 'increasing';
    if (diff < -0.1) return 'decreasing';
    return 'stable';
  }

  private findPeakSpendingTimes(transactions: Transaction[]): string[] {
    const hours: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const hour = tx.timestamp.getHours();
      const timeRange = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      hours[timeRange] = (hours[timeRange] || 0) + 1;
    });

    return Object.entries(hours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);
  }

  private analyzeStudentCategoriesExtended(transactions: Transaction[]) {
    const categoryMap: Record<string, { amount: BigNumber; transactions: number }> = {};
    const totalAmount = transactions.reduce((sum, tx) => sum.plus(tx.amount), new BigNumber(0));
    
    const categoryEmojis: Record<string, string> = {
      'Food & Beverages': '🍽️',
      'Books & Supplies': '📚',
      'Transportation': '🚌',
      'Entertainment': '🎭',
      'Health & Wellness': '🏥',
      'Technology': '💻',
      'Clothing': '👕',
      'Other': '📦'
    };

    transactions.forEach(tx => {
      const category = tx.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = { amount: new BigNumber(0), transactions: 0 };
      }
      categoryMap[category].amount = categoryMap[category].amount.plus(tx.amount);
      categoryMap[category].transactions += 1;
    });

    return Object.entries(categoryMap).map(([category, data]) => ({
      category,
      emoji: categoryEmojis[category] || '📦',
      amount: data.amount,
      percentage: totalAmount.gt(0) ? data.amount.dividedBy(totalAmount).multipliedBy(100).toNumber() : 0,
      transactions: data.transactions
    })).sort((a, b) => b.amount.minus(a.amount).toNumber());
  }

  private analyzeStudentVendorsExtended(transactions: Transaction[]) {
    const vendorMap: Record<string, { totalSpent: BigNumber; visits: number }> = {};
    
    transactions.forEach(tx => {
      const vendorId = tx.toAddress || 'unknown';
      if (!vendorMap[vendorId]) {
        vendorMap[vendorId] = { totalSpent: new BigNumber(0), visits: 0 };
      }
      vendorMap[vendorId].totalSpent = vendorMap[vendorId].totalSpent.plus(tx.amount);
      vendorMap[vendorId].visits += 1;
    });

    return Object.entries(vendorMap).map(([vendorId, data]) => ({
      vendorId,
      visitCount: data.visits,
      totalSpent: data.totalSpent,
      vendor: vendorRegistry.getVendorById(vendorId) || {} as VendorProfile,
      visits: data.visits
    })).sort((a, b) => b.totalSpent.minus(a.totalSpent).toNumber()).slice(0, 5);
  }

  private generateRecommendations(transactions: Transaction[], totalSpent: BigNumber) {
    const recommendations = [];
    
    if (totalSpent.gt(1.0)) {
      recommendations.push({
        type: 'budget',
        priority: 'high' as const,
        title: 'Budget Alert',
        description: 'You\'ve exceeded your recommended monthly spending limit',
        potentialSavings: totalSpent.multipliedBy(0.2)
      });
    }

    recommendations.push({
      type: 'savings',
      priority: 'medium' as const,
      title: 'Savings Opportunity',
      description: 'Try cooking more meals to reduce food expenses',
      potentialSavings: totalSpent.multipliedBy(0.15)
    });

    return recommendations;
  }

  private generateInsights(transactions: Transaction[], totalSpent: BigNumber) {
    return {
      budgetStatus: this.determineBudgetStatus(totalSpent),
      budgetUtilization: totalSpent.dividedBy(1.5).multipliedBy(100).toNumber(), // Assuming 1.5 SOL budget
      spendingHabits: [
        'Prefers food vendors during lunch hours',
        'Regular spending pattern',
        'Budget-conscious shopper'
      ],
      savingsOpportunities: [
        'Switch to vendors with student discounts',
        'Reduce impulse purchases',
        'Cook more meals at home'
      ]
    };
  }

  /**
   * Extended vendor analysis for campus dashboard
   */
  private analyzeTopVendorsExtended(vendors: VendorProfile[], transactions: Transaction[]) {
    const vendorStats = new Map();
    
    transactions.forEach(tx => {
      const vendor = vendors.find(v => v.walletAddress === tx.toAddress);
      if (vendor) {
        const existing = vendorStats.get(vendor.id) || {
          id: vendor.id,
          name: vendor.businessName,
          category: vendor.category,
          revenue: new BigNumber(0),
          transactions: 0,
          vendor,
          sales: new BigNumber(0),
          growth: 0
        };
        
        existing.revenue = existing.revenue.plus(tx.amount);
        existing.sales = existing.sales.plus(tx.amount);
        existing.transactions += 1;
        vendorStats.set(vendor.id, existing);
      }
    });

    return Array.from(vendorStats.values())
      .sort((a, b) => b.revenue.comparedTo(a.revenue))
      .slice(0, 10);
  }

  /**
   * Extended category analysis with emojis
   */
  private analyzePopularCategoriesExtended(transactions: Transaction[]) {
    const categoryMap: Record<string, { emoji: string; revenue: BigNumber; transactions: number }> = {};
    
    const categoryEmojis: Record<string, string> = {
      'Food & Beverages': '🍽️',
      'Books & Supplies': '📚',
      'Transportation': '🚌',
      'Entertainment': '🎭',
      'Health & Wellness': '🏥',
      'Technology': '💻',
      'Clothing': '👕',
      'Other': '📦'
    };

    transactions.forEach(tx => {
      const category = tx.category || 'Other';
      if (!categoryMap[category]) {
        categoryMap[category] = {
          emoji: categoryEmojis[category] || '📦',
          revenue: new BigNumber(0),
          transactions: 0
        };
      }
      
      categoryMap[category].revenue = categoryMap[category].revenue.plus(tx.amount);
      categoryMap[category].transactions += 1;
    });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue.minus(a.revenue).toNumber())
      .slice(0, 8);
  }

  private findFrequentLocations(transactions: Transaction[], vendors: VendorProfile[]): string[] {
    const locations: Record<string, number> = {};
    
    transactions.forEach(tx => {
      const vendor = vendors.find(v => v.id === tx.otherParty || v.walletAddress === tx.otherParty);
      if (vendor) {
        const building = vendor.location.building;
        locations[building] = (locations[building] || 0) + 1;
      }
    });

    return Object.entries(locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([building]) => building);
  }
}

// Export singleton instance
export const analyticsEngine = AnalyticsEngine.getInstance();
