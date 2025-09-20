import { useMemo } from 'react';
import { Transaction } from '@/lib/types/payment';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import BigNumber from 'bignumber.js';

export const useTransactionHistory = (transactions: Transaction[]) => {
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
  // Filter and sort transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [transactions]);

  // Get recent transactions (last 3)
  const recentTransactions = useMemo(() => {
    return sortedTransactions.slice(0, 3);
  }, [sortedTransactions]);

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const categories = {
      food: new BigNumber(0),
      transport: new BigNumber(0),
      academic: new BigNumber(0),
      other: new BigNumber(0)
    };

    transactions.forEach(tx => {
      if (tx.type === 'outgoing') {
        const category = tx.category || 'other';
        if (category in categories) {
          categories[category as keyof typeof categories] = 
            categories[category as keyof typeof categories].plus(tx.amount);
        } else {
          categories.other = categories.other.plus(tx.amount);
        }
      }
    });

    return categories;
  }, [transactions]);

  // Calculate total spending
  const totalSpending = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'outgoing')
      .reduce((total, tx) => total.plus(tx.amount), new BigNumber(0));
  }, [transactions]);

  // Calculate total received
  const totalReceived = useMemo(() => {
    return transactions
      .filter(tx => tx.type === 'incoming')
      .reduce((total, tx) => total.plus(tx.amount), new BigNumber(0));
  }, [transactions]);

  // Get confirmed transactions
  const confirmedTransactions = useMemo(() => {
    return transactions.filter(tx => tx.status === 'confirmed');
  }, [transactions]);

  // Get pending transactions
  const pendingTransactions = useMemo(() => {
    return transactions.filter(tx => tx.status === 'pending');
  }, [transactions]);

  // Format currency helper
  const formatSOL = (amount: BigNumber) => formatCurrency(amount, 'SOL');
  const formatNGN = (amount: BigNumber) => formatCurrency(solToNaira(amount), 'NGN');

  return {
    // Raw data
    transactions,
    sortedTransactions,
    recentTransactions,
    
    // Categorized data
    confirmedTransactions,
    pendingTransactions,
    
    // Analytics
    spendingByCategory,
    totalSpending,
    totalReceived,
    
    // Computed values
    hasTransactions: transactions.length > 0,
    confirmedCount: confirmedTransactions.length,
    pendingCount: pendingTransactions.length,
    
    // Utilities
    formatSOL,
    formatNGN
  };
};