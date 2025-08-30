'use client';

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types/payment';
import { formatSOL } from '@/lib/utils/formatting';
import TransactionReceipt from './TransactionReceipt';

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function TransactionHistory({ 
  transactions, 
  isLoading = false 
}: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'finalized':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '📝';
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

  const getTransactionType = (transaction: Transaction, userAddress?: string) => {
    if (!userAddress) return 'unknown';
    return transaction.fromAddress === userAddress ? 'sent' : 'received';
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'pending') return tx.status === 'pending';
    // For sent/received, we'd need user's current address
    // For now, we'll use a simple heuristic
    return true;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    const comparison = b.amount.comparedTo(a.amount);
    return comparison || 0;
  });

  const openSolanaExplorer = (signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#2D2D2D] rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-[#2D2D2D] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-[#2D2D2D] border border-[#444] text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Transactions</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#2D2D2D] border border-[#444] text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {/* Transaction List */}
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
            <p className="text-gray-400">
              Your payment history will appear here once you start making transactions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="bg-[#2D2D2D] border border-[#444] rounded-lg p-4 cursor-pointer hover:bg-[#3D3D3D] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getStatusIcon(transaction.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {formatSOL(transaction.amount)} SOL
                        </span>
                        <span className={`text-sm ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {transaction.purpose || 'Campus Payment'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-mono text-sm">
                      To: {transaction.toAddress ? transaction.toAddress.slice(0, 8) + '...' : transaction.otherPartyName || 'Unknown'}
                    </div>
                    {transaction.signature && (
                      <div className="text-xs text-gray-400 font-mono">
                        {transaction.signature.slice(0, 12)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {sortedTransactions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#333]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2D2D2D] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {sortedTransactions.length}
                </div>
                <div className="text-sm text-gray-400">Total Transactions</div>
              </div>
              
              <div className="bg-[#2D2D2D] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#14F195]">
                  {sortedTransactions.filter(tx => tx.status === 'confirmed' || tx.status === 'finalized').length}
                </div>
                <div className="text-sm text-gray-400">Successful</div>
              </div>
              
              <div className="bg-[#2D2D2D] rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-[#9945FF]">
                  {formatSOL(
                    sortedTransactions
                      .filter(tx => tx.status === 'confirmed' || tx.status === 'finalized')
                      .reduce((sum, tx) => sum.plus(tx.amount), new (require('bignumber.js'))(0))
                  )}
                </div>
                <div className="text-sm text-gray-400">Total SOL</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTransaction && (
        <TransactionReceipt
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onViewOnExplorer={openSolanaExplorer}
        />
      )}
    </>
  );
}
