/**
 * QR Code Payment Component
 * Handles payment QR generation and scanning for vendors and students
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Card, Button, Alert, Input, LoadingSpinner } from '@/components/ui';
import { createPaymentRequest, monitorPayment } from '@/lib/solana/pay';
import { formatCurrency } from '@/lib/solana/utils';
import { PaymentRequest, TransactionStatus } from '@/lib/types';

// =============================================================================
// QR Code Generator Component (For Vendors)
// =============================================================================

interface QRGeneratorProps {
  vendorAddress: string;
  onPaymentComplete?: (signature: string) => void;
}

export function QRPaymentGenerator({ vendorAddress, onPaymentComplete }: QRGeneratorProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [status, setStatus] = useState<TransactionStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateQR = async () => {
    if (!amount || !description) {
      setError('Please enter amount and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const amountBN = new BigNumber(amount);
      const { paymentRequest: pr, qrCode } = await createPaymentRequest(
        vendorAddress,
        amountBN,
        'StudyPay Campus Payment',
        description
      );

      setPaymentRequest(pr);
      setQrCodeUrl(qrCode.url);
      
      // Start monitoring for payment
      monitorPayment(pr, (newStatus) => {
        setStatus(newStatus);
      }).then((signature) => {
        if (signature && onPaymentComplete) {
          onPaymentComplete(signature);
        }
      });

    } catch (err) {
      setError('Failed to generate payment QR code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentRequest(null);
    setQrCodeUrl('');
    setStatus('pending');
    setAmount('');
    setDescription('');
    setError('');
  };

  if (paymentRequest && qrCodeUrl) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <h3 className="text-lg font-semibold mb-4">Payment Request</h3>
        
        {/* QR Code Display */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Scan with StudyPay App</div>
          {/* In a real app, we'd render the actual QR code here */}
          <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 mx-auto flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <div className="text-xs text-gray-500">QR Code</div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-semibold">{formatCurrency(paymentRequest.amount, 'SOL')}</span>
          </div>
          <div className="flex justify-between">
            <span>Description:</span>
            <span>{paymentRequest.message}</span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4">
          {status === 'pending' && (
            <Alert type="info">
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Waiting for payment...
              </div>
            </Alert>
          )}
          
          {status === 'confirmed' && (
            <Alert type="success">
              Payment confirmed! ✅
            </Alert>
          )}
          
          {status === 'failed' && (
            <Alert type="error">
              Payment failed. Please try again.
            </Alert>
          )}
          
          {status === 'expired' && (
            <Alert type="warning">
              Payment request expired.
            </Alert>
          )}
        </div>

        {(status === 'failed' || status === 'expired') && (
          <Button onClick={resetPayment} className="mt-4 w-full">
            Create New Payment
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Create Payment Request</h3>
      
      <div className="space-y-4">
        <Input
          label="Amount (SOL)"
          type="number"
          step="0.001"
          min="0.001"
          max="10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.001"
          helpText="Minimum: 0.001 SOL, Maximum: 10 SOL"
        />
        
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Jollof Rice with Chicken"
          maxLength={50}
        />
        
        {error && (
          <Alert type="error">{error}</Alert>
        )}
        
        <Button
          onClick={generateQR}
          loading={loading}
          disabled={!amount || !description}
          className="w-full"
        >
          Generate Payment QR
        </Button>
      </div>
    </Card>
  );
}

// =============================================================================
// QR Code Scanner Component (For Students)
// =============================================================================

interface QRScannerProps {
  onPaymentScanned?: (paymentUrl: string) => void;
}

export function QRPaymentScanner({ onPaymentScanned }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const startScanning = () => {
    setScanning(true);
    // In a real app, this would open camera for QR scanning
    // For demo purposes, we'll simulate it
    setTimeout(() => {
      setScanning(false);
      // Simulate successful scan
      const mockPaymentUrl = 'solana:pay?recipient=DEMO&amount=0.1&label=Test';
      if (onPaymentScanned) {
        onPaymentScanned(mockPaymentUrl);
      }
    }, 3000);
  };

  const handleManualUrl = () => {
    if (manualUrl && onPaymentScanned) {
      onPaymentScanned(manualUrl);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Scan Payment QR</h3>
      
      {scanning ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <LoadingSpinner size="lg" className="mx-auto" />
          </div>
          <p className="text-gray-600">Scanning QR code...</p>
          <p className="text-sm text-gray-500 mt-2">Point your camera at the QR code</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Button onClick={startScanning} className="w-full">
            📷 Scan QR Code
          </Button>
          
          <div className="text-center text-gray-500">
            <span>or</span>
          </div>
          
          <div className="space-y-2">
            <Input
              label="Manual URL Entry"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="solana:pay?recipient=..."
              helpText="Paste payment URL if QR scan doesn't work"
            />
            <Button
              onClick={handleManualUrl}
              variant="secondary"
              disabled={!manualUrl}
              className="w-full"
            >
              Process Payment URL
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// Payment Confirmation Component
// =============================================================================

interface PaymentConfirmationProps {
  paymentUrl: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function PaymentConfirmation({ paymentUrl, onConfirm, onCancel }: PaymentConfirmationProps) {
  // Parse payment URL to extract details
  const urlParams = new URLSearchParams(paymentUrl.split('?')[1]);
  const recipient = urlParams.get('recipient') || 'Unknown';
  const amount = urlParams.get('amount') || '0';
  const label = urlParams.get('label') || 'Payment';

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>
      
      <div className="space-y-3">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">To:</div>
          <div className="font-mono text-sm">{recipient.slice(0, 8)}...{recipient.slice(-8)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Amount:</div>
          <div className="text-lg font-semibold">{amount} SOL</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Description:</div>
          <div>{label}</div>
        </div>
      </div>
      
      <div className="flex space-x-3 mt-6">
        <Button onClick={onCancel} variant="secondary" className="flex-1">
          Cancel
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          Pay Now
        </Button>
      </div>
    </Card>
  );
}
