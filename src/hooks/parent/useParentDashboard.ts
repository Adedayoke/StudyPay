import { useState, useEffect } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { getTransactionsForAddress } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';
import { getMockStudentAddress } from '@/lib/solana/payment';
import BigNumber from 'bignumber.js';
import { useDashboard } from '../useDashboard';
import { useTransactionManager } from '../useTransactionManager';
import { useCurrencyFormatter } from '../useCurrencyFormatter';

interface Student {
  id: string;
  name: string;
  university: string;
  walletAddress: string;
  currentBalance: BigNumber;
  lastSeen: Date;
  totalReceived?: BigNumber;
  monthlyLimit?: BigNumber;
  isActive: boolean;
}

// Initial mock students data
const initialStudents: Student[] = [
  {
    id: "student_1",
    name: "Funmi Adebayo",
    university: "University of Lagos",
    currentBalance: new BigNumber(0.15),
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    walletAddress: getMockStudentAddress(), // Using proper base58 address
    totalReceived: new BigNumber(2.4),
    monthlyLimit: new BigNumber(5.0),
    isActive: true,
  },
];

export type ParentTab = "overview" | "transfer" | "students" | "history";

export const useParentDashboard = () => {
  // Use extracted hooks
  const dashboard = useDashboard<ParentTab>("overview");
  const transactionManager = useTransactionManager(dashboard.publicKey);
  const currencyFormatter = useCurrencyFormatter();

  const [students, setStudents] = useState<Student[]>(initialStudents);

  // Student management functions
  const handleStudentAdded = (newStudent: Omit<Student, "id" | "isActive">) => {
    const student: Student = {
      ...newStudent,
      id: `student_${Date.now()}`,
      isActive: true,
    };
    setStudents((prev) => [...prev, student]);
  };

  const handleStudentUpdated = (
    studentId: string,
    updates: Partial<Student>
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, ...updates } : student
      )
    );
  };

  // Transfer completion handler
  const handleTransferComplete = () => {
    // Refresh balance and transactions after transfer
    dashboard.refreshBalance();
    transactionManager.refreshTransactions();
  };

  // Calculate metrics
  const totalSentThisMonth = transactionManager.transactions
    .filter(tx => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() &&
             txDate.getFullYear() === now.getFullYear() &&
             tx.type === 'outgoing' &&
             tx.status === 'confirmed'; // Only count confirmed transactions
    })
    .reduce((total, tx) => total.plus(tx.amount), new BigNumber(0));

  const recentTransfers = transactionManager.transactions
    .filter(tx => tx.type === 'outgoing')
    .slice(0, 5);

  const connectedStudents = students.filter(s => s.isActive);

  return {
    // Dashboard state
    ...dashboard,

    // Transaction management
    transactions: transactionManager.transactions,
    transactionsLoading: transactionManager.isLoading,
    loadTransactions: transactionManager.loadTransactions,
    refreshBlockchainTransactions: transactionManager.refreshTransactions,

    // Currency formatting
    ...currencyFormatter,

    // Students state
    students,
    connectedStudents,
    handleStudentAdded,
    handleStudentUpdated,

    // Transactions state
    recentTransfers,
    handleTransferComplete,

    // Computed values
    totalSentThisMonth,
    hasStudents: students.length > 0,
    hasTransactions: transactionManager.transactions.length > 0
  };
};

export type { Student };