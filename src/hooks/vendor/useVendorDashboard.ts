import { useState } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { vendorRegistry } from '@/lib/vendors/vendorRegistry';
import BigNumber from 'bignumber.js';

// Mock vendor info
const vendorInfo = {
  businessName: 'Mama Adunni\'s Kitchen',
  category: 'Food & Beverages',
  location: 'UNILAG Campus, Near Faculty of Arts',
  isVerified: true
};

// Mock sales data
const todaysSalesData = [
  {
    id: '1',
    description: 'Jollof Rice with Chicken',
    amount: new BigNumber(0.025),
    studentId: 'student_123',
    time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    signature: 'sig_xyz123'
  },
  {
    id: '2',
    description: 'Fried Rice + Plantain',
    amount: new BigNumber(0.03),
    studentId: 'student_456',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    signature: 'sig_abc456'
  }
];

export type VendorTab = 'overview' | 'analytics' | 'settings';

export interface Sale {
  id: string;
  description: string;
  amount: BigNumber;
  studentId: string;
  time: Date;
  signature: string;
}

export const useVendorDashboard = () => {
  const { balance, connected, publicKey } = useStudyPayWallet();
  const [activeTab, setActiveTab] = useState<VendorTab>('overview');
  const [activePayments, setActivePayments] = useState<number>(0);
  const [completedPayments, setCompletedPayments] = useState<Sale[]>(todaysSalesData);

  // Get vendor profile (mock for now - in real app would fetch by wallet address)
  const vendorProfile = vendorRegistry.getAllVendors().find(v => v.businessName === vendorInfo.businessName) || 
    vendorRegistry.getAllVendors()[0]; // Fallback to first vendor

  const handlePaymentComplete = (signature: string) => {
    console.log('Payment completed:', signature);
    setActivePayments(prev => prev - 1);
    
    // Add to completed payments
    const newPayment: Sale = {
      id: Date.now().toString(),
      description: 'New Sale',
      amount: new BigNumber(0.02),
      studentId: 'student_new',
      time: new Date(),
      signature
    };
    
    setCompletedPayments(prev => [newPayment, ...prev]);
  };

  // Calculate metrics
  const totalToday = completedPayments.reduce(
    (sum, payment) => sum.plus(payment.amount), 
    new BigNumber(0)
  );

  const salesCount = completedPayments.length;
  
  const averageSale = salesCount > 0 ? 
    totalToday.dividedBy(salesCount) : 
    new BigNumber(0);

  const recentSales = completedPayments.slice(0, 5);

  return {
    // Wallet state
    balance,
    connected,
    publicKey,
    
    // Vendor info
    vendorInfo,
    vendorProfile,
    
    // Tab management
    activeTab,
    setActiveTab,
    
    // Payment state
    activePayments,
    setActivePayments,
    completedPayments,
    setCompletedPayments,
    handlePaymentComplete,
    
    // Computed values
    totalToday,
    salesCount,
    averageSale,
    recentSales,
    hasCompletedPayments: completedPayments.length > 0,
    isActive: connected && publicKey
  };
};