import { Transaction } from '@/lib/types/payment';
import BigNumber from 'bignumber.js';

const STORAGE_KEY = 'studypay_transactions';

/**
 * Get all transactions from localStorage
 */
export function getStoredTransactions(): Transaction[] {
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
    console.error('Error loading transactions:', error);
    return [];
  }
}

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
  const transactions = getStoredTransactions();
  
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
  const transactions = getStoredTransactions();
  const index = transactions.findIndex(tx => tx.id === id);
  
  if (index >= 0) {
    transactions[index] = { ...transactions[index], ...updates };
    saveTransactions(transactions);
  }
}

/**
 * Get transaction by ID
 */
export function getTransaction(id: string): Transaction | null {
  const transactions = getStoredTransactions();
  return transactions.find(tx => tx.id === id) || null;
}

/**
 * Get transaction by signature
 */
export function getTransactionBySignature(signature: string): Transaction | null {
  const transactions = getStoredTransactions();
  return transactions.find(tx => tx.signature === signature) || null;
}

/**
 * Delete a transaction
 */
export function deleteTransaction(id: string): void {
  const transactions = getStoredTransactions();
  const filtered = transactions.filter(tx => tx.id !== id);
  saveTransactions(filtered);
}

/**
 * Clear all transactions
 */
export function clearAllTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get transactions for a specific address
 */
export function getTransactionsForAddress(address: string): Transaction[] {
  const transactions = getStoredTransactions();
  return transactions.filter(tx => 
    tx.fromAddress === address || tx.toAddress === address
  );
}

/**
 * Get pending transactions
 */
export function getPendingTransactions(): Transaction[] {
  const transactions = getStoredTransactions();
  return transactions.filter(tx => tx.status === 'pending');
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
    'From',
    'To', 
    'Amount (SOL)',
    'Status',
    'Purpose',
    'Signature',
    'Fees (SOL)'
  ];
  
  const rows = transactions.map(tx => [
    tx.id,
    tx.timestamp.toISOString(),
    tx.fromAddress,
    tx.toAddress,
    tx.amount.toString(),
    tx.status,
    tx.purpose || '',
    tx.signature || '',
    tx.fees?.toString() || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
}

/**
 * Import transactions from CSV
 */
export function importTransactionsFromCSV(csvContent: string): Transaction[] {
  const lines = csvContent.split('\n');
  const headers = lines[0];
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(val => val.replace(/"/g, ''));
      
      return {
        id: values[0],
        timestamp: new Date(values[1]),
        fromAddress: values[2],
        toAddress: values[3],
        amount: new BigNumber(values[4]),
        status: values[5] as Transaction['status'],
        purpose: values[6] || undefined,
        signature: values[7] || undefined,
        fees: values[8] ? new BigNumber(values[8]) : undefined
      };
    });
}
