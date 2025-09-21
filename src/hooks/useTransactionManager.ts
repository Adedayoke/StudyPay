/**
 * Transaction Manager Hook
 * Handles transaction loading, filtering, sorting, and management
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '@/lib/types/payment';
import { transactionStorage } from '@/lib/utils/transactionStorage';

export type TransactionFilter = 'all' | 'sent' | 'received' | 'pending';
export type TransactionSort = 'date' | 'amount';

export interface TransactionState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  filter: TransactionFilter;
  sortBy: TransactionSort;
}

export interface TransactionActions {
  loadTransactions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  setFilter: (filter: TransactionFilter) => void;
  setSortBy: (sort: TransactionSort) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
}

export function useTransactionManager(walletAddress?: string | null): TransactionState & TransactionActions {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [sortBy, setSortBy] = useState<TransactionSort>('date');

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply filter
    switch (filter) {
      case 'sent':
        filtered = filtered.filter(tx => tx.type === 'outgoing');
        break;
      case 'received':
        filtered = filtered.filter(tx => tx.type === 'incoming');
        break;
      case 'pending':
        filtered = filtered.filter(tx => tx.status === 'pending');
        break;
      default:
        // 'all' - no filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return b.amount.minus(a.amount).toNumber();
      }
    });

    return filtered;
  }, [transactions, filter, sortBy]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!walletAddress) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading transactions for wallet:', walletAddress);

      // Get both blockchain and local transactions
      const allTransactions = await transactionStorage.getAllTransactions(walletAddress);

      console.log(`Loaded ${allTransactions.length} total transactions`);
      setTransactions(allTransactions);

    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transactions');

      // Fallback to local transactions only
      const localTransactions = transactionStorage.getStoredTransactions();
      setTransactions(localTransactions);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    if (!walletAddress) return;

    setIsRefreshing(true);
    setError(null);

    try {
      console.log('Refreshing transactions for wallet:', walletAddress);

      // Force refresh from blockchain
      const refreshedTransactions = await transactionStorage.getAllTransactions(walletAddress);

      console.log(`Refreshed ${refreshedTransactions.length} transactions`);
      setTransactions(refreshedTransactions);

    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh transactions');
    } finally {
      setIsRefreshing(false);
    }
  }, [walletAddress]);

  // Add new transaction
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  }, []);

  // Update existing transaction
  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    );
  }, []);

  // Load transactions when wallet address changes
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    // State
    transactions,
    filteredTransactions,
    isLoading,
    isRefreshing,
    error,
    filter,
    sortBy,

    // Actions
    loadTransactions,
    refreshTransactions,
    setFilter,
    setSortBy,
    addTransaction,
    updateTransaction,
  };
}