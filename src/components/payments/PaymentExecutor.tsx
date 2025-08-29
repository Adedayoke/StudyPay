/**
 * Payment Execution Component
 * Handles real SOL transfers when students confirm payments
 */

'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import BigNumber from 'bignumber.js';
import { Card, Button, Alert } from '@/components/ui';
import { 
  executePaymentFlow, 
  checkSufficientBalance, 
  formatPaymentAmount,
  SolanaPayRequest,
  PaymentStatus,
  PaymentResult 
} from '@/lib/solana/payment';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { addTransaction, updateTransaction } from '@/lib/utils/transactionStorage';
import { Transaction } from '@/lib/types/payment';

// =============================================================================
// Payment Executor Component
// =============================================================================

interface PaymentExecutorProps {
  paymentRequest: SolanaPayRequest;
  onSuccess: (signature: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function PaymentExecutor({ 
  paymentRequest, 
  onSuccess, 
  onError, 
  onCancel 
}: PaymentExecutorProps) {
  const wallet = useStudyPayWallet(); // Use our complete wallet hook
  const { connection } = useConnection();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('initiating');
  const [balanceCheck, setBalanceCheck] = useState<{
    sufficient: boolean;
    currentBalance: BigNumber;
    required: BigNumber;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string>('');

  // Check balance on component mount
  React.useEffect(() => {
    if (wallet.publicKey && connection) {
      checkSufficientBalance(connection, wallet.publicKey, paymentRequest.amount)
        .then(setBalanceCheck)
        .catch(err => setError('Failed to check wallet balance'));
    }
  }, [wallet.publicKey, connection, paymentRequest.amount]);

  const executePayment = async () => {
    // Debug logging
    console.log('PaymentExecutor Debug:', {
      wallet: wallet ? 'exists' : 'null',
      publicKey: wallet.publicKey ? wallet.publicKey.toString() : 'null',
      connected: wallet.connected,
      connection: connection ? 'exists' : 'null',
      signTransaction: wallet.signTransaction ? 'exists' : 'missing'
    });

    if (!wallet || !wallet.publicKey || !connection || !wallet.connected) {
      const errorDetails = {
        wallet: !wallet ? 'missing' : 'ok',
        publicKey: !wallet.publicKey ? 'missing' : 'ok', 
        connection: !connection ? 'missing' : 'ok',
        connected: !wallet.connected ? 'false' : 'true'
      };
      console.error('Wallet validation failed:', errorDetails);
      onError(`Wallet not connected properly. Missing: ${Object.entries(errorDetails).filter(([k,v]) => v !== 'ok' && v !== 'true').map(([k,v]) => k).join(', ')}`);
      return;
    }

    // Check if trying to send to self
    if (wallet.publicKey.toString() === paymentRequest.recipient.toString()) {
      onError('Cannot send payment to yourself. Please use a different recipient address.');
      return;
    }

    if (!balanceCheck?.sufficient) {
      onError('Insufficient balance for this payment');
      return;
    }

    setIsExecuting(true);
    setError('');

    // Create initial transaction record
    const newTransaction = addTransaction({
      fromAddress: wallet.publicKey.toString(),
      toAddress: paymentRequest.recipient.toString(),
      amount: paymentRequest.amount,
      status: 'pending',
      timestamp: new Date(),
      purpose: paymentRequest.memo || 'Campus Payment'
    });

    try {
      const result = await executePaymentFlow(
        connection,
        wallet, // Pass the complete wallet object
        paymentRequest,
        (status) => {
          setPaymentStatus(status);
          // Update transaction status
          updateTransaction(newTransaction.id, { 
            status: status === 'confirmed' ? 'confirmed' : 'pending'
          });
        }
      );

      if (result.status === 'confirmed') {
        // Update transaction with signature and final status
        updateTransaction(newTransaction.id, {
          status: 'confirmed',
          signature: result.signature
        });
        onSuccess(result.signature);
      } else {
        // Update transaction as failed
        updateTransaction(newTransaction.id, {
          status: 'failed'
        });
        onError(result.error || 'Payment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown payment error';
      // Update transaction as failed
      updateTransaction(newTransaction.id, {
        status: 'failed'
      });
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusMessage = (status: PaymentStatus): string => {
    switch (status) {
      case 'initiating': return 'Preparing payment...';
      case 'processing': return 'Processing transaction...';
      case 'confirmed': return 'Payment confirmed!';
      case 'failed': return 'Payment failed';
      case 'expired': return 'Payment expired';
      default: return 'Unknown status';
    }
  };

  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case 'confirmed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'expired': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
        Execute Payment
      </h3>
      
      {/* Payment Details */}
      <div className="space-y-3 mb-6">
        <div className="bg-dark-bg-tertiary p-3 rounded">
          <div className="text-sm text-dark-text-secondary">Amount:</div>
          <div className="text-lg font-semibold text-solana-purple-500">
            {formatPaymentAmount(paymentRequest.amount)}
          </div>
        </div>
        
        <div className="bg-dark-bg-tertiary p-3 rounded">
          <div className="text-sm text-dark-text-secondary">To:</div>
          <div className="font-mono text-sm break-all text-dark-text-primary">
            {paymentRequest.recipient.toString().slice(0, 8)}...
            {paymentRequest.recipient.toString().slice(-8)}
          </div>
        </div>
        
        <div className="bg-dark-bg-tertiary p-3 rounded">
          <div className="text-sm text-dark-text-secondary">Description:</div>
          <div className="text-dark-text-primary">
            {paymentRequest.message || paymentRequest.label}
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {!wallet.connected && (
        <Alert type="warning" className="mb-4">
          Wallet not connected. Please connect your wallet to proceed.
        </Alert>
      )}

      {wallet.connected && !wallet.publicKey && (
        <Alert type="warning" className="mb-4">
          Wallet connected but no public key found. Please try reconnecting.
        </Alert>
      )}

      {/* Balance Check */}
      {balanceCheck && (
        <div className="mb-4">
          <div className="text-sm text-dark-text-secondary mb-1">Wallet Balance:</div>
          <div className="flex justify-between items-center">
            <span className="text-dark-text-primary">
              {formatPaymentAmount(balanceCheck.currentBalance)}
            </span>
            <span className="text-sm text-dark-text-muted">
              Required: {formatPaymentAmount(balanceCheck.required)}
            </span>
          </div>
          
          {!balanceCheck.sufficient && (
            <Alert type="warning" className="mt-2">
              Insufficient balance. You need {formatPaymentAmount(
                balanceCheck.required.minus(balanceCheck.currentBalance)
              )} more SOL.
            </Alert>
          )}
        </div>
      )}

      {/* Payment Status */}
      {isExecuting && (
        <div className="mb-4">
          <div className={`text-center ${getStatusColor(paymentStatus)}`}>
            <div className="animate-pulse">
              {paymentStatus === 'processing' && (
                <div className="w-8 h-8 border-2 border-solana-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              )}
              {getStatusMessage(paymentStatus)}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button 
          onClick={onCancel}
          variant="secondary"
          className="flex-1"
          disabled={isExecuting}
        >
          Cancel
        </Button>
        
        <Button 
          onClick={executePayment}
          className="flex-1"
          disabled={isExecuting || !balanceCheck?.sufficient || !wallet.publicKey || !wallet.connected}
          loading={isExecuting}
        >
          {isExecuting ? 'Processing...' : 'Pay Now'}
        </Button>
      </div>
    </Card>
  );
}

// =============================================================================
// Payment Success Component
// =============================================================================

interface PaymentSuccessProps {
  signature: string;
  amount: BigNumber;
  description: string;
  onClose: () => void;
}

export function PaymentSuccess({ 
  signature, 
  amount, 
  description, 
  onClose 
}: PaymentSuccessProps) {
  const copySignature = async () => {
    try {
      await navigator.clipboard.writeText(signature);
    } catch (err) {
      console.error('Failed to copy signature:', err);
    }
  };

  const viewOnExplorer = () => {
    // Open Solana Explorer (devnet for development)
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card className="max-w-md mx-auto text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
          ✅
        </div>
        <h3 className="text-lg font-semibold text-dark-text-primary">
          Payment Successful!
        </h3>
      </div>
      
      <div className="space-y-3 mb-6">
        <div>
          <div className="text-sm text-dark-text-secondary">Amount Paid:</div>
          <div className="text-lg font-semibold text-green-500">
            {formatPaymentAmount(amount)}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-dark-text-secondary">For:</div>
          <div className="text-dark-text-primary">{description}</div>
        </div>
        
        <div>
          <div className="text-sm text-dark-text-secondary">Transaction:</div>
          <div className="font-mono text-xs break-all bg-dark-bg-tertiary p-2 rounded text-dark-text-primary">
            {signature}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Button 
            onClick={copySignature}
            variant="secondary"
            className="flex-1"
          >
            Copy TX
          </Button>
          <Button 
            onClick={viewOnExplorer}
            variant="secondary"
            className="flex-1"
          >
            View Explorer
          </Button>
        </div>
        
        <Button 
          onClick={onClose}
          className="w-full"
        >
          Done
        </Button>
      </div>
    </Card>
  );
}
