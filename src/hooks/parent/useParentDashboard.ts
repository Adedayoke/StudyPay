import { useState, useEffect } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { getTransactionsForAddress } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';
import { getMockStudentAddress } from '@/lib/solana/payment';
import BigNumber from 'bignumber.js';

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
  const { balance, connected, publicKey, refreshBalance } = useStudyPayWallet();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ParentTab>("overview");

  // Load transactions for current wallet
  useEffect(() => {
    if (publicKey) {
      setTransactionsLoading(true);
      try {
        const parentTransactions = getTransactionsForAddress(
          publicKey.toString()
        );
        setTransactions(parentTransactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setTransactionsLoading(false);
      }
    }
  }, [publicKey]);

  // Refresh data after transfers
  const handleTransferComplete = () => {
    refreshBalance();
    if (publicKey) {
      const parentTransactions = getTransactionsForAddress(
        publicKey.toString()
      );
      setTransactions(parentTransactions);
    }
  };

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

  // Calculate metrics
  const totalSentThisMonth = transactions
    .filter(tx => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && 
             txDate.getFullYear() === now.getFullYear() &&
             tx.type === 'outgoing' &&
             tx.status === 'confirmed'; // Only count confirmed transactions
    })
    .reduce((total, tx) => total.plus(tx.amount), new BigNumber(0));

  const recentTransfers = transactions
    .filter(tx => tx.type === 'outgoing')
    .slice(0, 5);

  const connectedStudents = students.filter(s => s.isActive);

  return {
    // Wallet state
    balance,
    connected,
    publicKey,
    refreshBalance,
    
    // Students state
    students,
    connectedStudents,
    handleStudentAdded,
    handleStudentUpdated,
    
    // Transactions state
    transactions,
    transactionsLoading,
    recentTransfers,
    handleTransferComplete,
    
    // Tab management
    activeTab,
    setActiveTab,
    
    // Computed values
    totalSentThisMonth,
    hasStudents: students.length > 0,
    hasTransactions: transactions.length > 0
  };
};

export type { Student };