'use client';

import React from 'react';
import { Transaction } from '@/lib/types/payment';
import { formatSOL } from '@/lib/utils/formatting';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import BigNumber from 'bignumber.js';

interface TransactionReceiptProps {
  transaction: Transaction;
  onClose: () => void;
  onViewOnExplorer: (signature: string) => void;
}

export default function TransactionReceipt({ 
  transaction, 
  onClose, 
  onViewOnExplorer 
}: TransactionReceiptProps) {
  const { convertSolToNaira, isLoading: priceLoading, error: priceError } = usePriceConversion();

  // Wrapper functions to maintain compatibility
  const solToNaira = (amount: BigNumber) => convertSolToNaira(amount).amount;
  const getStatusIcon = (status: string, size: number = 16) => {
    switch (status) {
      case 'confirmed':
        return <StudyPayIcon name="success" size={size} />;
      case 'finalized':
        return <StudyPayIcon name="celebrate" size={size} />;
      case 'failed':
        return <StudyPayIcon name="error" size={size} />;
      case 'pending':
        return <StudyPayIcon name="clock" size={size} />;
      default:
        return <StudyPayIcon name="document" size={size} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Transaction Confirmed';
      case 'finalized':
        return 'Transaction Finalized';
      case 'failed':
        return 'Transaction Failed';
      case 'pending':
        return 'Transaction Pending';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finalized':
        return 'text-[#14F195]';
      case 'failed':
        return 'text-red-400';
      case 'pending':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Payment Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">
            {getStatusIcon(transaction.status)}
          </div>
          <div className={`text-lg font-semibold ${getStatusColor(transaction.status)}`}>
            {getStatusText(transaction.status)}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-mono">
              ₦{solToNaira(new BigNumber(transaction.amount)).toFixed(0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">From</span>
            <span className="text-white font-mono text-sm">
              {transaction.fromAddress ? 
                `${transaction.fromAddress.slice(0, 8)}...${transaction.fromAddress.slice(-8)}` :
                'N/A'
              }
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">To</span>
            <span className="text-white font-mono text-sm">
              {transaction.toAddress ? 
                `${transaction.toAddress.slice(0, 8)}...${transaction.toAddress.slice(-8)}` :
                transaction.otherPartyName || 'N/A'
              }
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Date</span>
            <span className="text-white">
              {new Date(transaction.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Time</span>
            <span className="text-white">
              {new Date(transaction.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {transaction.purpose && (
            <div className="flex flex-wrap justify-between">
              <span className="text-gray-400">Purpose</span>
              <span className="text-white">{transaction.purpose}</span>
            </div>
          )}

          {transaction.signature && (
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID</span>
              <span className="text-white font-mono text-xs">
                {transaction.signature.slice(0, 12)}...
              </span>
            </div>
          )}

          {transaction.fees && (
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white font-mono">
                ₦{solToNaira(new BigNumber(transaction.fees)).toFixed(0)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {transaction.signature && (
            <button
              onClick={() => onViewOnExplorer(transaction.signature!)}
              className="w-full bg-[#9945FF] hover:bg-[#8A3FE8] text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <StudyPayIcon name="search" className="h-5 w-5" />
              View on Solana Explorer
            </button>
          )}

          <button
            onClick={() => {
              const receiptData = `
StudyPay Payment Receipt
========================
Amount: ₦${solToNaira(new BigNumber(transaction.amount)).toFixed(0)}
From: ${transaction.fromAddress}
To: ${transaction.toAddress}
Status: ${getStatusText(transaction.status)}
Date: ${new Date(transaction.timestamp).toLocaleString()}
${transaction.signature ? `Transaction: ${transaction.signature}` : ''}
${transaction.purpose ? `Purpose: ${transaction.purpose}` : ''}

Powered by Solana Blockchain
              `.trim();
              
              navigator.clipboard.writeText(receiptData);
              // You could add a toast notification here
            }}
            className="w-full bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <StudyPayIcon name="document" className="h-5 w-5" />
            Copy Receipt Details
          </button>

          <button
            onClick={onClose}
            className="w-full bg-[#1A1A1A] border border-[#333] hover:bg-[#2D2D2D] text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
