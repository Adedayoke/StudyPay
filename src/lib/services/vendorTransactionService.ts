/**
 * Vendor Transaction Service
 * Manages persistent transaction history for vendors
 */

import { BigNumber } from 'bignumber.js';

export interface VendorTransaction {
  id: string;
  vendorWallet: string;
  studentWallet?: string;
  amount: BigNumber;
  description: string;
  signature: string;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  category: string;
  paymentMethod: 'mobile' | 'desktop';
}

class VendorTransactionService {
  private storageKey = 'studypay_vendor_transactions';

  // Add a new vendor transaction
  addTransaction(transaction: Omit<VendorTransaction, 'id' | 'timestamp'>): VendorTransaction {
    const newTransaction: VendorTransaction = {
      ...transaction,
      id: `vendor_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    const transactions = this.getAllTransactions();
    transactions.push(newTransaction);
    this.saveTransactions(transactions);

    console.log('✅ Added vendor transaction:', newTransaction);
    return newTransaction;
  }

  // Get all transactions for a vendor
  getTransactionsByVendor(vendorWallet: string): VendorTransaction[] {
    const allTransactions = this.getAllTransactions();
    return allTransactions
      .filter(tx => tx.vendorWallet === vendorWallet)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get today's transactions for a vendor
  getTodaysTransactions(vendorWallet: string): VendorTransaction[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getTransactionsByVendor(vendorWallet)
      .filter(tx => tx.timestamp >= today);
  }

  // Get transaction statistics for a vendor
  getVendorStats(vendorWallet: string) {
    const todaysTransactions = this.getTodaysTransactions(vendorWallet);
    const confirmedTransactions = todaysTransactions.filter(tx => tx.status === 'confirmed');
    
    const totalRevenue = confirmedTransactions.reduce(
      (sum, tx) => sum.plus(tx.amount), 
      new BigNumber(0)
    );

    const averageSale = confirmedTransactions.length > 0 
      ? totalRevenue.dividedBy(confirmedTransactions.length)
      : new BigNumber(0);

    return {
      todaysSales: confirmedTransactions.length,
      todaysRevenue: totalRevenue,
      averageSale,
      pendingCount: todaysTransactions.filter(tx => tx.status === 'pending').length,
      totalTransactions: todaysTransactions.length,
    };
  }

  // Get all transactions (for admin/debugging)
  private getAllTransactions(): VendorTransaction[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((tx: any) => ({
        ...tx,
        amount: new BigNumber(tx.amount),
        timestamp: new Date(tx.timestamp),
      }));
    } catch (error) {
      console.error('Error loading vendor transactions:', error);
      return [];
    }
  }

  // Save transactions to localStorage
  private saveTransactions(transactions: VendorTransaction[]) {
    try {
      const serializable = transactions.map(tx => ({
        ...tx,
        amount: tx.amount.toString(),
        timestamp: tx.timestamp.toISOString(),
      }));
      
      localStorage.setItem(this.storageKey, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving vendor transactions:', error);
    }
  }

  // Clear all transactions (for testing)
  clearAllTransactions() {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared all vendor transactions');
  }
}

export const vendorTransactionService = new VendorTransactionService();
