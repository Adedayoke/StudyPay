'use client';

import React, { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Card, Button, Input, Alert } from '@/components/ui';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { executePaymentFlow } from '@/lib/solana/payment';
import { addTransaction, updateTransaction } from '@/lib/utils/transactionStorage';
import { formatSOL } from '@/lib/utils/formatting';
import TransactionStatus from '@/components/transactions/TransactionStatus';

interface Student {
  id: string;
  name: string;
  university: string;
  walletAddress: string;
  currentBalance: BigNumber;
  lastSeen: Date;
}

interface ParentTransferProps {
  students: Student[];
  onTransferComplete: () => void;
}

export default function ParentTransfer({ students, onTransferComplete }: ParentTransferProps) {
  const wallet = useStudyPayWallet();
  const { connection } = useConnection();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentTransaction, setCurrentTransaction] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Common transfer purposes for parents
  const commonPurposes = [
    'Monthly Allowance',
    'Emergency Fund',
    'Exam/Project Money',
    'Food & Living Expenses',
    'Transport Money',
    'Academic Materials',
    'Healthcare Expenses'
  ];

  // Quick amount presets (in SOL)
  const quickAmounts = [
    { label: '₦10,000', sol: '0.2', usd: '$20' },
    { label: '₦25,000', sol: '0.5', usd: '$50' },
    { label: '₦50,000', sol: '1.0', usd: '$100' },
    { label: '₦100,000', sol: '2.0', usd: '$200' }
  ];

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setError('');
    setSuccess('');
  };

  const handleAmountPreset = (solAmount: string) => {
    setAmount(solAmount);
  };

  const validateTransfer = (): boolean => {
    if (!selectedStudent) {
      setError('Please select a student to send money to');
      return false;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    if (parseFloat(amount) > parseFloat(wallet.balance.toString())) {
      setError('Insufficient balance for this transfer');
      return false;
    }

    if (!purpose.trim()) {
      setError('Please specify the purpose of this transfer');
      return false;
    }

    return true;
  };

  const handleTransferConfirm = () => {
    if (!validateTransfer()) return;
    setShowConfirmation(true);
  };

  const executeTransfer = async () => {
    if (!selectedStudent || !wallet.publicKey || !connection) return;

    setIsTransferring(true);
    setError('');
    setShowConfirmation(false);

    try {
      // Create payment request
      const paymentRequest = {
        recipient: new PublicKey(selectedStudent.walletAddress),
        amount: new BigNumber(amount),
        label: `StudyPay Transfer to ${selectedStudent.name}`,
        message: purpose,
        memo: `Parent transfer: ${purpose}`
      };

      // Create transaction record
      const newTransaction = addTransaction({
        fromAddress: wallet.publicKey.toString(),
        toAddress: selectedStudent.walletAddress,
        amount: new BigNumber(amount),
        status: 'pending',
        timestamp: new Date(),
        purpose: `Transfer to ${selectedStudent.name}: ${purpose}`
      });

      setCurrentTransaction(newTransaction.id);

      // Execute the transfer
      const result = await executePaymentFlow(
        connection,
        wallet,
        paymentRequest,
        (status) => {
          updateTransaction(newTransaction.id, { 
            status: status === 'confirmed' ? 'confirmed' : 'pending'
          });
        }
      );

      if (result.status === 'confirmed') {
        // Update transaction with signature
        updateTransaction(newTransaction.id, {
          status: 'confirmed',
          signature: result.signature
        });

        setSuccess(`Successfully sent ${formatSOL(new BigNumber(amount))} SOL to ${selectedStudent.name}!`);
        setAmount('');
        setPurpose('');
        setSelectedStudent(null);
        onTransferComplete();
      } else {
        updateTransaction(newTransaction.id, { status: 'failed' });
        setError(result.error || 'Transfer failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      if (currentTransaction) {
        updateTransaction(currentTransaction, { status: 'failed' });
      }
      setError(errorMessage);
    } finally {
      setIsTransferring(false);
      setCurrentTransaction('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Send Money To</h3>
        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentSelect(student)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedStudent?.id === student.id
                  ? 'border-[#9945FF] bg-[#9945FF]/10'
                  : 'border-[#333] hover:border-[#555] bg-[#2D2D2D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{student.name}</div>
                  <div className="text-sm text-gray-400">{student.university}</div>
                  <div className="text-xs text-gray-500">
                    Balance: {formatSOL(student.currentBalance)} SOL
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Last seen: {student.lastSeen.toLocaleDateString()}
                  </div>
                  {selectedStudent?.id === student.id && (
                    <div className="text-[#9945FF] text-sm mt-1">✓ Selected</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transfer Form */}
      {selectedStudent && (
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">
            Transfer to {selectedStudent.name}
          </h3>
          
          {/* Quick Amount Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Amounts
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((preset) => (
                <button
                  key={preset.sol}
                  onClick={() => handleAmountPreset(preset.sol)}
                  className="p-3 border border-[#333] rounded-lg hover:border-[#9945FF] transition-colors text-left"
                >
                  <div className="text-white font-medium">{preset.label}</div>
                  <div className="text-sm text-gray-400">{preset.sol} SOL ({preset.usd})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (SOL)
            </label>
            <Input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter SOL amount"
              className="w-full"
            />
            {amount && (
              <div className="text-sm text-gray-400 mt-1">
                ≈ ₦{(parseFloat(amount) * 50000).toLocaleString()} (approx)
              </div>
            )}
          </div>

          {/* Purpose Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purpose
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {commonPurposes.map((commonPurpose) => (
                <button
                  key={commonPurpose}
                  onClick={() => setPurpose(commonPurpose)}
                  className={`p-2 text-sm border rounded-lg transition-colors ${
                    purpose === commonPurpose
                      ? 'border-[#9945FF] bg-[#9945FF]/10 text-[#9945FF]'
                      : 'border-[#333] text-gray-300 hover:border-[#555]'
                  }`}
                >
                  {commonPurpose}
                </button>
              ))}
            </div>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Or enter custom purpose"
              className="w-full"
            />
          </div>

          {/* Transfer Button */}
          <Button
            onClick={handleTransferConfirm}
            disabled={!selectedStudent || !amount || !purpose || isTransferring}
            className="w-full"
            size="lg"
          >
            {isTransferring ? 'Processing Transfer...' : `Send ${amount || '0'} SOL`}
          </Button>
        </Card>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Transfer</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">To:</span>
                <span className="text-white">{selectedStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-mono">{formatSOL(new BigNumber(amount))} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Purpose:</span>
                <span className="text-white">{purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network Fee:</span>
                <span className="text-white">~0.0005 SOL</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeTransfer}
                disabled={isTransferring}
                className="flex-1"
              >
                {isTransferring ? 'Sending...' : 'Confirm Transfer'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Transaction Status */}
      {currentTransaction && (
        <TransactionStatus
          signature={currentTransaction}
          onStatusUpdate={(status: string) => {
            if (status === 'confirmed' || status === 'failed') {
              setCurrentTransaction('');
            }
          }}
        />
      )}

      {/* Alerts */}
      {error && (
        <Alert type="error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success">
          {success}
        </Alert>
      )}
    </div>
  );
}
