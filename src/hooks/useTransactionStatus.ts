/**
 * React hook for managing transaction status
 */

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { transactionStatusService, TransactionStatus } from '@/lib/services/transactionStatusService';
import BigNumber from 'bignumber.js';

export interface UseTransactionStatusReturn {
  // State
  transactionStatus: TransactionStatus | null;
  isLoading: boolean;
  
  // Actions
  createTransaction: (vendorAddress: string, amount: BigNumber, description: string) => string;
  updateStatus: (transactionId: string, status: 'completed' | 'failed', signature?: string) => void;
  
  // Computed
  isPending: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isExpired: boolean;
}

export function useTransactionStatus(transactionId?: string): UseTransactionStatusReturn {
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connection } = useConnection();

  // Subscribe to transaction updates
  useEffect(() => {
    if (!transactionId) return;

    setIsLoading(true);
    
    const unsubscribe = transactionStatusService.subscribeToTransaction(
      transactionId,
      (status) => {
        setTransactionStatus(status);
        setIsLoading(false);
      }
    );

    // Initial load
    const initialStatus = transactionStatusService.getTransaction(transactionId);
    if (initialStatus) {
      setTransactionStatus(initialStatus);
      setIsLoading(false);
    }

    return unsubscribe;
  }, [transactionId]);

  // Monitor blockchain for real confirmation
  useEffect(() => {
    if (!transactionStatus || !connection || transactionStatus.status !== 'pending') return;

    const monitorBlockchain = async () => {
      await transactionStatusService.monitorBlockchainTransaction(
        connection,
        transactionStatus.id,
        transactionStatus.vendorAddress,
        transactionStatus.amount
      );
    };

    // Start monitoring after a short delay
    const timeout = setTimeout(monitorBlockchain, 5000);
    
    // Then monitor every 30 seconds
    const interval = setInterval(monitorBlockchain, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [transactionStatus, connection]);

  const createTransaction = useCallback((
    vendorAddress: string,
    amount: BigNumber,
    description: string
  ): string => {
    return transactionStatusService.createTransaction(vendorAddress, amount, description);
  }, []);

  const updateStatus = useCallback((
    transactionId: string,
    status: 'completed' | 'failed',
    signature?: string
  ) => {
    transactionStatusService.updateTransactionStatus({
      transactionId,
      status,
      signature,
      timestamp: Date.now(),
    });
  }, []);

  return {
    // State
    transactionStatus,
    isLoading,
    
    // Actions
    createTransaction,
    updateStatus,
    
    // Computed
    isPending: transactionStatus?.status === 'pending',
    isCompleted: transactionStatus?.status === 'completed',
    isFailed: transactionStatus?.status === 'failed',
    isExpired: transactionStatus?.status === 'expired',
  };
}
