import { useState } from 'react';
import { formatCurrency, solToNaira, nairaToSol } from '@/lib/solana/utils';
import BigNumber from 'bignumber.js';

export const useParentTransfers = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'SOL' | 'NGN'>('NGN');
  const [purpose, setPurpose] = useState<'allowance' | 'emergency' | 'tuition' | 'other'>('allowance');
  const [customPurpose, setCustomPurpose] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Currency conversion helpers
  const getAmountInSOL = () => {
    if (!amount) return new BigNumber(0);
    
    const amountBN = new BigNumber(amount);
    return currency === 'SOL' ? amountBN : nairaToSol(amountBN);
  };

  const getAmountInNGN = () => {
    if (!amount) return new BigNumber(0);
    
    const amountBN = new BigNumber(amount);
    return currency === 'NGN' ? amountBN : solToNaira(amountBN);
  };

  const getEstimatedSOL = () => {
    return getAmountInSOL();
  };

  const getEstimatedNGN = () => {
    return getAmountInNGN();
  };

  // Validation
  const isValidAmount = () => {
    if (!amount) return false;
    const amountBN = new BigNumber(amount);
    return amountBN.isGreaterThan(0) && amountBN.isFinite();
  };

  const canSubmitTransfer = () => {
    return selectedStudent && isValidAmount() && !isTransferring;
  };

  // Reset form
  const resetForm = () => {
    setSelectedStudent('');
    setAmount('');
    setCurrency('NGN');
    setPurpose('allowance');
    setCustomPurpose('');
    setIsTransferring(false);
  };

  // Get final purpose string
  const getFinalPurpose = () => {
    return purpose === 'other' ? customPurpose : purpose;
  };

  // Format display values
  const formatSOL = (amount: BigNumber) => formatCurrency(amount, 'SOL');
  const formatNGN = (amount: BigNumber) => formatCurrency(amount, 'NGN');

  return {
    // Form state
    selectedStudent,
    setSelectedStudent,
    amount,
    setAmount,
    currency,
    setCurrency,
    purpose,
    setPurpose,
    customPurpose,
    setCustomPurpose,
    isTransferring,
    setIsTransferring,
    
    // Computed values
    getAmountInSOL,
    getAmountInNGN,
    getEstimatedSOL,
    getEstimatedNGN,
    getFinalPurpose,
    
    // Validation
    isValidAmount,
    canSubmitTransfer,
    
    // Actions
    resetForm,
    
    // Utilities
    formatSOL,
    formatNGN
  };
};