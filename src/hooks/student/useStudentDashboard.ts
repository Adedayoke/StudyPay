import { useState, useEffect } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';
import { useStudyPayNotifications } from '@/components/pwa/PWAProvider';
import { useDashboard } from '../useDashboard';
import { useTransactionManager } from '../useTransactionManager';
import { useCurrencyFormatter } from '../useCurrencyFormatter';

export type StudentTab = 'overview' | 'transactions' | 'vendors' | 'insights' | 'cart';

export const useStudentDashboard = () => {
  // Use extracted hooks
  const dashboard = useDashboard<StudentTab>('overview');
  const transactionManager = useTransactionManager(dashboard.publicKey);
  const currencyFormatter = useCurrencyFormatter();

  const { sendPaymentNotification, sendLowBalanceNotification } = useStudyPayNotifications();
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);

  // Vendor management functions
  const handleVendorSelect = (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    dashboard.setActiveTab('vendors');
  };

  const handleVendorClose = () => {
    setSelectedVendor(null);
  };

  // Refresh after payment with notifications
  const refreshAfterPayment = async () => {
    const previousBalance = dashboard.balance;
    await dashboard.refreshBalance();
    await transactionManager.refreshTransactions();

    // Check for low balance after payment
    const newBalance = dashboard.balance;
    if (newBalance.lt(0.1) && newBalance.gt(0)) {
      sendLowBalanceNotification(`${newBalance.toFixed(3)} SOL`);
    }
  };

  // Enhanced transaction loading with notification support
  const loadTransactionsWithNotifications = async () => {
    const previousTransactionCount = transactionManager.transactions.length;
    await transactionManager.loadTransactions();

    // Check for new incoming transactions
    const newTransactions = transactionManager.transactions.slice(0, transactionManager.transactions.length - previousTransactionCount);

    for (const tx of newTransactions) {
      if (tx.type === 'incoming' && tx.status === 'confirmed') {
        sendPaymentNotification('received', `${tx.amount} SOL`);
      }
    }
  };

  return {
    // Dashboard state
    ...dashboard,

    // Transaction management
    transactions: transactionManager.transactions,
    transactionsLoading: transactionManager.isLoading,
    refreshingBlockchain: transactionManager.isRefreshing,
    loadTransactions: transactionManager.loadTransactions,
    refreshBlockchainTransactions: transactionManager.refreshTransactions,

    // Currency formatting
    ...currencyFormatter,

    // Vendor management
    selectedVendor,
    handleVendorSelect,
    handleVendorClose,

    // Payment handling
    refreshAfterPayment,
    loadTransactionsWithNotifications,

    // Computed values
    recentTransactions: transactionManager.transactions.slice(0, 3),
    hasTransactions: transactionManager.transactions.length > 0,
    isLowBalance: dashboard.balance.lt(0.1)
  };
};