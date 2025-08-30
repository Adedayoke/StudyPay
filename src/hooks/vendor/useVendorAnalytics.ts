import { useMemo } from 'react';
import { Sale } from './useVendorDashboard';
import BigNumber from 'bignumber.js';

export const useVendorAnalytics = (completedPayments: Sale[]) => {
  // Daily sales analytics
  const todaysSales = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return completedPayments.filter(sale => {
      const saleDate = new Date(sale.time);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
  }, [completedPayments]);

  // Weekly sales analytics
  const weeklySales = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return completedPayments.filter(sale => 
      new Date(sale.time) >= oneWeekAgo
    );
  }, [completedPayments]);

  // Monthly sales analytics
  const monthlySales = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return completedPayments.filter(sale => 
      new Date(sale.time) >= oneMonthAgo
    );
  }, [completedPayments]);

  // Revenue calculations
  const todaysRevenue = useMemo(() => {
    return todaysSales.reduce((total, sale) => total.plus(sale.amount), new BigNumber(0));
  }, [todaysSales]);

  const weeklyRevenue = useMemo(() => {
    return weeklySales.reduce((total, sale) => total.plus(sale.amount), new BigNumber(0));
  }, [weeklySales]);

  const monthlyRevenue = useMemo(() => {
    return monthlySales.reduce((total, sale) => total.plus(sale.amount), new BigNumber(0));
  }, [monthlySales]);

  // Average sale calculations
  const averageSaleToday = useMemo(() => {
    return todaysSales.length > 0 ? 
      todaysRevenue.dividedBy(todaysSales.length) : 
      new BigNumber(0);
  }, [todaysRevenue, todaysSales.length]);

  const averageSaleWeekly = useMemo(() => {
    return weeklySales.length > 0 ? 
      weeklyRevenue.dividedBy(weeklySales.length) : 
      new BigNumber(0);
  }, [weeklyRevenue, weeklySales.length]);

  // Popular items analysis
  const popularItems = useMemo(() => {
    const itemCounts = new Map<string, number>();
    
    completedPayments.forEach(sale => {
      const count = itemCounts.get(sale.description) || 0;
      itemCounts.set(sale.description, count + 1);
    });

    return Array.from(itemCounts.entries())
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [completedPayments]);

  // Peak hours analysis
  const peakHours = useMemo(() => {
    const hourCounts = new Map<number, number>();
    
    completedPayments.forEach(sale => {
      const hour = new Date(sale.time).getHours();
      const count = hourCounts.get(hour) || 0;
      hourCounts.set(hour, count + 1);
    });

    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ 
        hour, 
        count, 
        timeRange: `${hour}:00 - ${hour + 1}:00` 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [completedPayments]);

  // Growth metrics
  const salesGrowth = useMemo(() => {
    // Compare this week vs last week
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastWeekSales = completedPayments.filter(sale => {
      const saleDate = new Date(sale.time);
      return saleDate >= twoWeeksAgo && saleDate < oneWeekAgo;
    });

    const lastWeekRevenue = lastWeekSales.reduce(
      (total, sale) => total.plus(sale.amount), 
      new BigNumber(0)
    );

    if (lastWeekRevenue.isZero()) return 0;
    
    return weeklyRevenue
      .minus(lastWeekRevenue)
      .dividedBy(lastWeekRevenue)
      .multipliedBy(100)
      .toNumber();
  }, [weeklyRevenue, completedPayments]);

  return {
    // Sales data
    todaysSales,
    weeklySales,
    monthlySales,
    
    // Revenue data
    todaysRevenue,
    weeklyRevenue,
    monthlyRevenue,
    
    // Averages
    averageSaleToday,
    averageSaleWeekly,
    
    // Analytics
    popularItems,
    peakHours,
    salesGrowth,
    
    // Counts
    todaysSalesCount: todaysSales.length,
    weeklySalesCount: weeklySales.length,
    monthlySalesCount: monthlySales.length,
    
    // Performance indicators
    isGrowing: salesGrowth > 0,
    hasPopularItems: popularItems.length > 0,
    hasPeakHours: peakHours.length > 0
  };
};