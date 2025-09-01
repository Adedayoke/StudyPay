import { useState, useEffect } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';
import { useStudyPayNotifications } from '@/components/pwa/PWAProvider';

export type StudentTab = 'overview' | 'transactions' | 'vendors' | 'insights';

export const useStudentDashboard = () => {
  const { balance, connected, publicKey, refreshBalance } = useStudyPayWallet();
  const { sendPaymentNotification, sendLowBalanceNotification } = useStudyPayNotifications();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [refreshingBlockchain, setRefreshingBlockchain] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentTab>('overview');
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  // Load transactions (blockchain + local)
  useEffect(() => {
    if (connected && publicKey) {
      loadTransactions();
    }
  }, [connected, publicKey]);

  const loadTransactions = async () => {
    if (!publicKey) return;
    
    setTransactionsLoading(true);
    try {
      console.log('Loading transactions for wallet:', publicKey.toString());
      
      // Get both blockchain and local transactions
      const allTransactions = await transactionStorage.getAllTransactions(publicKey.toString());
      
      console.log(`Loaded ${allTransactions.length} total transactions`);
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to local transactions only
      const localTransactions = transactionStorage.getStoredTransactions();
      setTransactions(localTransactions);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Refresh blockchain transactions manually
  const refreshBlockchainTransactions = async () => {
    if (!publicKey) return;
    
    setRefreshingBlockchain(true);
    try {
      console.log('Refreshing blockchain transactions...');
      await transactionStorage.refreshBlockchainTransactions(publicKey.toString());
      await loadTransactions();
    } catch (error) {
      console.error('Error refreshing blockchain transactions:', error);
    } finally {
      setRefreshingBlockchain(false);
    }
  };

  const handleVendorSelect = (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    setActiveTab('vendors');
  };

  const handleVendorClose = () => {
    setSelectedVendor(null);
  };

  const refreshAfterPayment = async () => {
    const previousBalance = balance;
    await refreshBalance();
    await loadTransactions();
    
    // Check for low balance after payment
    const newBalance = balance; // This will be updated after refreshBalance
    if (newBalance < 0.1 && newBalance > 0) {
      sendLowBalanceNotification(`${newBalance.toFixed(3)} SOL`);
    }
  };

  // Enhanced transaction loading with notification support
  const loadTransactionsWithNotifications = async () => {
    const previousTransactionCount = transactions.length;
    await loadTransactions();
    
    // Check for new incoming transactions
    if (transactions.length > previousTransactionCount) {
      const newTransactions = transactions.slice(0, transactions.length - previousTransactionCount);
      
      for (const tx of newTransactions) {
        if (tx.type === 'incoming' && tx.status === 'confirmed') {
          sendPaymentNotification('received', `${tx.amount} SOL`);
        }
      }
    }
  };

  return {
    // Wallet state
    balance,
    connected,
    publicKey,
    refreshBalance,
    
    // Transaction state
    transactions,
    transactionsLoading,
    refreshingBlockchain,
    loadTransactions,
    refreshBlockchainTransactions,
    
    // Tab management
    activeTab,
    setActiveTab,
    
    // Vendor management
    selectedVendor,
    handleVendorSelect,
    handleVendorClose,
    
    // Payment handling
    refreshAfterPayment,
    
    // Computed values
    recentTransactions: transactions.slice(0, 3),
    hasTransactions: transactions.length > 0,
    isLowBalance: balance < 0.1
  };
};