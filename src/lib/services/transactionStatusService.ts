/**
 * Real-time Transaction Status Service
 * Handles transaction status updates between vendor and student interfaces
 */

import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export interface TransactionStatus {
  id: string;
  vendorAddress: string;
  amount: BigNumber;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  signature?: string;
  timestamp: number;
  studentAddress?: string;
}

export interface TransactionStatusUpdate {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  signature?: string;
  studentAddress?: string;
  timestamp: number;
}

class TransactionStatusService {
  private readonly STORAGE_KEY = 'studypay_transaction_status';
  private readonly EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes
  private listeners: Map<string, (status: TransactionStatus) => void> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Create a new transaction status entry
   */
  createTransaction(
    vendorAddress: string,
    amount: BigNumber,
    description: string
  ): string {
    const transactionId = this.generateTransactionId();
    const transaction: TransactionStatus = {
      id: transactionId,
      vendorAddress,
      amount,
      description,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.saveTransaction(transaction);
    console.log('📝 Created transaction status:', transactionId);
    return transactionId;
  }

  /**
   * Update transaction status (called by student after payment)
   */
  updateTransactionStatus(update: TransactionStatusUpdate): void {
    const transaction = this.getTransaction(update.transactionId);
    if (!transaction) {
      console.warn('Transaction not found:', update.transactionId);
      return;
    }

    const updatedTransaction: TransactionStatus = {
      ...transaction,
      status: update.status,
      signature: update.signature,
      studentAddress: update.studentAddress,
      timestamp: update.timestamp,
    };

    this.saveTransaction(updatedTransaction);
    
    // Notify listeners
    const listener = this.listeners.get(update.transactionId);
    if (listener) {
      listener(updatedTransaction);
    }

    console.log('🔄 Updated transaction status:', update.transactionId, update.status);
  }

  /**
   * Get transaction status
   */
  getTransaction(transactionId: string): TransactionStatus | null {
    const transactions = this.getAllTransactions();
    return transactions.find(t => t.id === transactionId) || null;
  }

  /**
   * Subscribe to transaction status changes
   */
  subscribeToTransaction(
    transactionId: string,
    callback: (status: TransactionStatus) => void
  ): () => void {
    this.listeners.set(transactionId, callback);

    // Start polling for updates
    const interval = setInterval(() => {
      const transaction = this.getTransaction(transactionId);
      if (transaction) {
        callback(transaction);
        
        // Stop polling if transaction is completed or expired
        if (transaction.status === 'completed' || transaction.status === 'failed') {
          this.stopPolling(transactionId);
        }
      }
    }, 2000); // Poll every 2 seconds

    this.pollingIntervals.set(transactionId, interval);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(transactionId);
      this.stopPolling(transactionId);
    };
  }

  /**
   * Monitor Solana blockchain for actual transaction confirmation
   */
  async monitorBlockchainTransaction(
    connection: Connection,
    transactionId: string,
    expectedRecipient: string,
    expectedAmount: BigNumber
  ): Promise<void> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'pending') return;

    try {
      // Get recent transactions for the vendor address
      const publicKey = new PublicKey(expectedRecipient);
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 10,
      });

      // Check for matching transactions in the last 5 minutes
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      
      for (const sigInfo of signatures) {
        if (!sigInfo.blockTime) continue;
        
        const txTime = sigInfo.blockTime * 1000;
        if (txTime < fiveMinutesAgo) continue;

        try {
          const txDetails = await connection.getTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (txDetails && this.isMatchingTransaction(txDetails, expectedRecipient, expectedAmount)) {
            // Found matching transaction!
            this.updateTransactionStatus({
              transactionId,
              status: 'completed',
              signature: sigInfo.signature,
              timestamp: txTime,
            });
            
            console.log('✅ Blockchain transaction confirmed:', sigInfo.signature);
            return;
          }
        } catch (error) {
          console.warn('Error fetching transaction details:', error);
        }
      }
    } catch (error) {
      console.error('Error monitoring blockchain:', error);
    }
  }

  /**
   * Clean up expired transactions
   */
  cleanupExpiredTransactions(): void {
    const transactions = this.getAllTransactions();
    const now = Date.now();
    
    const activeTransactions = transactions.filter(t => {
      const isExpired = (now - t.timestamp) > this.EXPIRY_TIME;
      if (isExpired && t.status === 'pending') {
        // Mark as expired
        this.updateTransactionStatus({
          transactionId: t.id,
          status: 'expired',
          timestamp: now,
        });
        return false;
      }
      return true;
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeTransactions));
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveTransaction(transaction: TransactionStatus): void {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === transaction.id);
    
    if (index >= 0) {
      transactions[index] = transaction;
    } else {
      transactions.push(transaction);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
  }

  private getAllTransactions(): TransactionStatus[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const transactions = JSON.parse(stored);
      return transactions.map((t: any) => ({
        ...t,
        amount: new BigNumber(t.amount),
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  private stopPolling(transactionId: string): void {
    const interval = this.pollingIntervals.get(transactionId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(transactionId);
    }
  }

  private isMatchingTransaction(
    txDetails: any,
    expectedRecipient: string,
    expectedAmount: BigNumber
  ): boolean {
    // This is a simplified check - in a real app you'd want more sophisticated matching
    // Check if the transaction involves the expected recipient and approximate amount
    try {
      const postBalances = txDetails.meta?.postBalances || [];
      const preBalances = txDetails.meta?.preBalances || [];
      
      // Look for balance changes that match our expected amount (within 1% tolerance)
      for (let i = 0; i < postBalances.length; i++) {
        const balanceChange = postBalances[i] - preBalances[i];
        if (balanceChange > 0) {
          const changeInSol = new BigNumber(balanceChange).dividedBy(1e9);
          const tolerance = expectedAmount.multipliedBy(0.01); // 1% tolerance
          
          if (changeInSol.minus(expectedAmount).abs().lte(tolerance)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking transaction match:', error);
      return false;
    }
  }
}

// Export singleton instance
export const transactionStatusService = new TransactionStatusService();

// Auto cleanup expired transactions every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    transactionStatusService.cleanupExpiredTransactions();
  }, 60000);
}
