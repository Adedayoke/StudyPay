/**
 * Hook for managing vendor transaction history
 */

import { useState, useEffect } from 'react';
import { vendorTransactionService, VendorTransaction } from '@/lib/services/vendorTransactionService';
import { useWallet } from '@solana/wallet-adapter-react';

export function useVendorTransactions() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [todaysTransactions, setTodaysTransactions] = useState<VendorTransaction[]>([]);
  const [stats, setStats] = useState({
    todaysSales: 0,
    todaysRevenue: 0,
    averageSale: 0,
    pendingCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(false);

  const vendorWallet = publicKey?.toString();

  // Load transactions when wallet changes
  useEffect(() => {
    if (vendorWallet) {
      loadTransactions();
    }
  }, [vendorWallet]);

  // Auto-refresh every 10 seconds to catch new payments
  useEffect(() => {
    if (!vendorWallet) return;

    const interval = setInterval(() => {
      loadTransactions();
    }, 10000);

    return () => clearInterval(interval);
  }, [vendorWallet]);

  const loadTransactions = async () => {
    if (!vendorWallet) return;

    setLoading(true);
    try {
      // Get all transactions for this vendor
      const allTransactions = vendorTransactionService.getTransactionsByVendor(vendorWallet);
      const todaysTransactions = vendorTransactionService.getTodaysTransactions(vendorWallet);
      const stats = vendorTransactionService.getVendorStats(vendorWallet);

      setTransactions(allTransactions);
      setTodaysTransactions(todaysTransactions);
      setStats({
        todaysSales: stats.todaysSales,
        todaysRevenue: stats.todaysRevenue.toNumber(),
        averageSale: stats.averageSale.toNumber(),
        pendingCount: stats.pendingCount,
        totalTransactions: stats.totalTransactions,
      });

      console.log('📊 Loaded vendor transactions:', {
        total: allTransactions.length,
        today: todaysTransactions.length,
        stats
      });
    } catch (error) {
      console.error('Error loading vendor transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = () => {
    loadTransactions();
  };

  return {
    transactions,
    todaysTransactions,
    stats,
    loading,
    refreshTransactions,
    hasTransactions: transactions.length > 0,
    hasTodaysTransactions: todaysTransactions.length > 0,
  };
}
