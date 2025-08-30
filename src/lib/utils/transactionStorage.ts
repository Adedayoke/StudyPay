import { Transaction } from '@/lib/types/payment';
import { getSolanaTransactionService } from '@/lib/solana/transactionService';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

const STORAGE_KEY = 'studypay_transactions';
const CACHE_KEY = 'studypay_blockchain_cache';
const CACHE_DURATION = 60 * 1000; // 1 minute cache

interface TransactionCache {
  transactions: Transaction[];
  timestamp: number;
  walletAddress: string;
}

/**
 * Enhanced transaction storage with blockchain integration
 */
export class TransactionStorage {
  private static instance: TransactionStorage;
  
  public static getInstance(): TransactionStorage {
    if (!TransactionStorage.instance) {
      TransactionStorage.instance = new TransactionStorage();
    }
    return TransactionStorage.instance;
  }

  /**
   * Get all transactions - combines blockchain and local storage
   */
  async getAllTransactions(walletAddress?: string): Promise<Transaction[]> {
    try {
      // Get local transactions first
      const localTransactions = this.getStoredTransactions();
      
      // If no wallet connected, return only local transactions
      if (!walletAddress) {
        console.log('No wallet connected, returning local transactions only');
        return localTransactions;
      }

      // Try to get blockchain transactions
      const blockchainTransactions = await this.getBlockchainTransactions(walletAddress);
      
      // Combine and deduplicate
      const allTransactions = this.mergeTransactions(localTransactions, blockchainTransactions);
      
      return allTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Fallback to local transactions only
      return this.getStoredTransactions();
    }
  }

  /**
   * Get blockchain transactions with caching
   */
  private async getBlockchainTransactions(walletAddress: string): Promise<Transaction[]> {
    try {
      // Check cache first
      const cached = this.getCachedTransactions(walletAddress);
      if (cached) {
        console.log('Returning cached blockchain transactions');
        return cached;
      }

      console.log('Fetching fresh blockchain transactions...');
      const publicKey = new PublicKey(walletAddress);
      const transactionService = getSolanaTransactionService();
      
      const blockchainTransactions = await transactionService.fetchTransactions(publicKey, 100);
      
      // Cache the results
      this.cacheTransactions(blockchainTransactions, walletAddress);
      
      return blockchainTransactions;
      
    } catch (error) {
      console.error('Error fetching blockchain transactions:', error);
      return [];
    }
  }

  /**
   * Get cached transactions if still valid
   */
  private getCachedTransactions(walletAddress: string): Transaction[] | null {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${walletAddress}`);
      if (!cached) return null;
      
      const cacheData: TransactionCache = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - cacheData.timestamp > CACHE_DURATION) {
        return null;
      }
      
      // Deserialize transactions
      return cacheData.transactions.map(tx => ({
        ...tx,
        amount: new BigNumber(tx.amount),
        fees: tx.fees ? new BigNumber(tx.fees) : undefined,
        timestamp: new Date(tx.timestamp)
      }));
      
    } catch (error) {
      console.error('Error reading transaction cache:', error);
      return null;
    }
  }

  /**
   * Cache blockchain transactions
   */
  private cacheTransactions(transactions: Transaction[], walletAddress: string): void {
    try {
      const cacheData: TransactionCache = {
        transactions: transactions.map(tx => ({
          ...tx,
          amount: tx.amount.toString(),
          fees: tx.fees?.toString(),
          timestamp: tx.timestamp.toISOString()
        })) as any,
        timestamp: Date.now(),
        walletAddress
      };
      
      localStorage.setItem(`${CACHE_KEY}_${walletAddress}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching transactions:', error);
    }
  }

  /**
   * Merge local and blockchain transactions, avoiding duplicates
   */
  private mergeTransactions(local: Transaction[], blockchain: Transaction[]): Transaction[] {
    const allTransactions: Transaction[] = [...blockchain]; // Start with blockchain transactions
    
    // Add local transactions that aren't already in blockchain
    for (const localTx of local) {
      const isDuplicate = blockchain.some(blockchainTx => 
        blockchainTx.signature === localTx.signature || 
        blockchainTx.id === localTx.id
      );
      
      if (!isDuplicate) {
        allTransactions.push(localTx);
      }
    }
    
    return allTransactions;
  }

  /**
   * Refresh blockchain transactions (bypass cache)
   */
  async refreshBlockchainTransactions(walletAddress: string): Promise<Transaction[]> {
    try {
      // Clear cache
      localStorage.removeItem(`${CACHE_KEY}_${walletAddress}`);
      
      // Fetch fresh data
      return await this.getBlockchainTransactions(walletAddress);
    } catch (error) {
      console.error('Error refreshing blockchain transactions:', error);
      return [];
    }
  }

  /**
   * Legacy method - get all transactions from localStorage only
   */
  getStoredTransactions(): Transaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((tx: any) => ({
        ...tx,
        amount: new BigNumber(tx.amount),
        fees: tx.fees ? new BigNumber(tx.fees) : undefined,
        timestamp: new Date(tx.timestamp)
      }));
    } catch (error) {
      console.error('Error loading stored transactions:', error);
      return [];
    }
  }
}

/**
 * Legacy utility functions for backward compatibility
 */

/**
 * Save transactions to localStorage
 */
export function saveTransactions(transactions: Transaction[]): void {
  try {
    const serializable = transactions.map(tx => ({
      ...tx,
      amount: tx.amount.toString(),
      fees: tx.fees?.toString(),
      timestamp: tx.timestamp.toISOString()
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
}

/**
 * Add a new transaction
 */
export function addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  
  const newTransaction: Transaction = {
    ...transaction,
    id: generateTransactionId()
  };
  
  transactions.unshift(newTransaction); // Add to beginning
  saveTransactions(transactions);
  
  return newTransaction;
}

/**
 * Update an existing transaction
 */
export function updateTransaction(id: string, updates: Partial<Transaction>): void {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  const index = transactions.findIndex((tx: Transaction) => tx.id === id);
  
  if (index >= 0) {
    transactions[index] = { ...transactions[index], ...updates };
    saveTransactions(transactions);
  }
}

/**
 * Get transaction by ID
 */
export function getTransaction(id: string): Transaction | null {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  return transactions.find((tx: Transaction) => tx.id === id) || null;
}

/**
 * Get transaction by signature
 */
export function getTransactionBySignature(signature: string): Transaction | null {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  return transactions.find((tx: Transaction) => tx.signature === signature) || null;
}

/**
 * Delete a transaction
 */
export function deleteTransaction(id: string): void {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  const filtered = transactions.filter((tx: Transaction) => tx.id !== id);
  saveTransactions(filtered);
}

/**
 * Clear all transactions
 */
export function clearAllTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get transactions for a specific address (legacy method)
 */
export function getTransactionsForAddress(address: string): Transaction[] {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  return transactions.filter((tx: Transaction) => 
    tx.fromAddress === address || tx.toAddress === address ||
    tx.otherParty === address
  );
}

/**
 * Get pending transactions
 */
export function getPendingTransactions(): Transaction[] {
  const storage = TransactionStorage.getInstance();
  const transactions = storage.getStoredTransactions();
  return transactions.filter((tx: Transaction) => tx.status === 'pending');
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'ID',
    'Date',
    'Description',
    'Amount (SOL)',
    'Category',
    'Status',
    'Type',
    'Other Party',
    'Signature',
    'Fees (SOL)'
  ];
  
  const rows = transactions.map(tx => [
    tx.id,
    tx.timestamp.toISOString(),
    tx.description,
    tx.amount.toString(),
    tx.category,
    tx.status,
    tx.type,
    tx.otherPartyName || tx.otherParty || '',
    tx.signature || '',
    tx.fees?.toString() || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
}

/**
 * Import transactions from CSV (updated for new format)
 */
export function importTransactionsFromCSV(csvContent: string): Transaction[] {
  const lines = csvContent.split('\n');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(val => val.replace(/"/g, ''));
      
      return {
        id: values[0],
        timestamp: new Date(values[1]),
        description: values[2] || 'Imported transaction',
        amount: new BigNumber(values[3]),
        category: values[4] || 'other',
        status: values[5] as Transaction['status'] || 'confirmed',
        type: values[6] as Transaction['type'] || 'outgoing',
        otherPartyName: values[7] || undefined,
        signature: values[8] || undefined,
        fees: values[9] ? new BigNumber(values[9]) : undefined,
        // Backward compatibility
        fromAddress: '',
        toAddress: values[7] || ''
      } as Transaction;
    });
}

// Export the main storage instance and legacy functions
export const transactionStorage = TransactionStorage.getInstance();

// Legacy function for compatibility
export function getStoredTransactions(): Transaction[] {
  return transactionStorage.getStoredTransactions();
}
