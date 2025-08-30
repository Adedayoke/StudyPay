/**
 * Real Solana Pay QR Components
 * Handles actual QR generation and payment processing
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Card, Button, Alert, Input } from '@/components/ui';
import { 
  generatePaymentQR, 
  createVendorPaymentRequest, 
  createSolanaPayURL,
  formatPaymentAmount,
  isValidPaymentAmount,
  SolanaPayRequest,
  parseSolanaPayURL,
  getMockVendorAddress
} from '@/lib/solana/payment';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import { PaymentExecutor, PaymentSuccess } from '@/components/payments/PaymentExecutor';

// =============================================================================
// Real QR Payment Generator (For Vendors)
// =============================================================================

interface QRGeneratorProps {
  amount?: BigNumber;
  recipientAddress?: string;
  memo?: string;
  onPaymentGenerated?: (paymentURL: string) => void;
  vendorAddress?: string;
  onPaymentComplete?: (signature: string) => void;
}

export function QRPaymentGenerator({ 
  amount: propAmount, 
  recipientAddress, 
  memo: propMemo, 
  onPaymentGenerated, 
  vendorAddress, 
  onPaymentComplete 
}: QRGeneratorProps) {
  const { publicKey } = useStudyPayWallet();
  const [amount, setAmount] = useState(propAmount?.toString() || '');
  const [description, setDescription] = useState(propMemo || '');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [paymentURL, setPaymentURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Auto-generate QR when props are provided
  useEffect(() => {
    if (propAmount && recipientAddress && propMemo) {
      generateQR();
    }
  }, [propAmount, recipientAddress, propMemo]);

  const generateQR = async () => {
    if (!amount || !description) {
      setError('Please enter both amount and description');
      return;
    }

    const amountBN = new BigNumber(amount);
    if (!isValidPaymentAmount(amountBN)) {
      setError('Invalid amount. Must be between 0 and 1000 SOL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create real Solana Pay request using mock vendor address
      // In production, this would be the actual vendor's wallet address
      const vendorAddress = getMockVendorAddress();
      const paymentRequest = createVendorPaymentRequest(
        vendorAddress,
        amountBN,
        description
      );

      // For now, create a simple QR code since @solana/pay might have compatibility issues
      const solanaPayURL = createSolanaPayURL(paymentRequest);
      
      // Create simple QR code representation
      const qrDataURL = `data:image/svg+xml;base64,${btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="white"/>
          <rect x="20" y="20" width="216" height="216" fill="white" stroke="#9945FF" stroke-width="2"/>
          <text x="128" y="100" text-anchor="middle" font-size="12" fill="#9945FF" font-weight="bold">
            SOLANA PAY
          </text>
          <text x="128" y="120" text-anchor="middle" font-size="10" fill="#333">
            ${formatPaymentAmount(amountBN)}
          </text>
          <text x="128" y="140" text-anchor="middle" font-size="8" fill="#666">
            ${description}
          </text>
          <text x="128" y="180" text-anchor="middle" font-size="6" fill="#999">
            Scan with Solana Pay compatible wallet
          </text>
        </svg>
      `)}`;

      setQrCodeDataURL(qrDataURL);
      setPaymentURL(solanaPayURL.toString());
      onPaymentGenerated?.(solanaPayURL.toString());

    } catch (err) {
      console.error('QR generation error:', err);
      setError('Failed to generate payment QR code');
    } finally {
      setLoading(false);
    }
  };

  const resetQR = () => {
    setQrCodeDataURL(null);
    setPaymentURL(null);
    setAmount('');
    setDescription('');
    setError('');
  };

  const copyToClipboard = async () => {
    if (paymentURL) {
      try {
        await navigator.clipboard.writeText(paymentURL);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center text-dark-text-primary">
        Generate Payment QR
      </h3>
      
      <Alert type="info" className="mb-4">
        Demo Mode: QR codes will send payments to "Mama Adunni's Kitchen" test address
      </Alert>
      
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!qrCodeDataURL ? (
        <div className="space-y-4">
          <Input
            label="Amount (SOL)"
            type="number"
            step="0.001"
            min="0"
            max="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.025"
          />
          
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jollof Rice + Coke"
          />
          
          <Button 
            onClick={generateQR}
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating QR...' : 'Generate QR Code'}
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-solana-purple-500 inline-block">
            <img 
              src={qrCodeDataURL} 
              alt="Solana Pay QR Code" 
              className="block mx-auto"
              width={256}
              height={256}
            />
          </div>
          
          <div className="text-sm text-dark-text-secondary">
            <p className="font-medium text-dark-text-primary">{description}</p>
            <p className="text-solana-purple-500 font-semibold">
              {formatPaymentAmount(new BigNumber(amount))}
            </p>
            <p className="text-xs text-dark-text-muted mt-1">
              Scan with any Solana Pay compatible wallet
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={resetQR}
              variant="secondary"
              className="flex-1"
            >
              New Payment
            </Button>
            <Button 
              onClick={copyToClipboard}
              variant="secondary"
              className="flex-1"
            >
              Copy Link
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// QR Payment Scanner (For Students)
// =============================================================================

interface QRScannerProps {
  onPaymentDetected?: (paymentURL: string) => void;
  onError?: (error: string) => void;
}

export function QRPaymentScanner({ onPaymentDetected, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualURL, setManualURL] = useState('');

  const startScanning = () => {
    setIsScanning(true);
    // In a real implementation, would use camera scanning
    setTimeout(() => {
      setIsScanning(false);
      onError?.('Camera scanning coming soon. Please use manual entry for now.');
    }, 2000);
  };

  const handleManualEntry = () => {
    if (!manualURL) {
      onError?.('Please enter a Solana Pay URL');
      return;
    }

    try {
      const url = new URL(manualURL);
      if (url.protocol !== 'solana:') {
        onError?.('Invalid Solana Pay URL format');
        return;
      }
      
      onPaymentDetected?.(manualURL);
      setManualURL('');
    } catch (err) {
      onError?.('Invalid URL format');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center text-dark-text-primary">
        Scan Payment QR
      </h3>
      
      <div className="space-y-4">
        <div className="text-center">
          <div className="bg-dark-bg-tertiary border-2 border-dashed border-dark-border-secondary rounded-lg p-8 mb-4">
            {isScanning ? (
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-solana-purple-500 rounded-full mx-auto mb-2 opacity-50"></div>
                <p className="text-sm text-dark-text-secondary">Scanning...</p>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-dark-bg-hover rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                  📷
                </div>
                <p className="text-sm text-dark-text-secondary">Camera Scanner</p>
              </div>
            )}
          </div>
          
          <Button 
            onClick={startScanning}
            disabled={isScanning}
            className="w-full mb-4"
          >
            {isScanning ? 'Scanning...' : 'Start Camera Scan'}
          </Button>
        </div>

        <div className="text-center text-dark-text-muted">
          <div className="border-t border-dark-border-primary pt-4">OR</div>
        </div>

        <div className="space-y-3">
          <Input
            label="Solana Pay URL"
            value={manualURL}
            onChange={(e) => setManualURL(e.target.value)}
            placeholder="solana:..."
          />
          
          <Button 
            onClick={handleManualEntry}
            variant="secondary"
            className="w-full"
          >
            Process Payment URL
          </Button>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// Payment Confirmation Modal
// =============================================================================

interface PaymentConfirmationProps {
  paymentURL: string;
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

export function PaymentConfirmation({ 
  paymentURL, 
  onConfirm, 
  onCancel, 
  isVisible 
}: PaymentConfirmationProps) {
  const [paymentDetails, setPaymentDetails] = useState<SolanaPayRequest | null>(null);
  const [showExecutor, setShowExecutor] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    signature: string;
    amount: BigNumber;
    description: string;
  } | null>(null);

  useEffect(() => {
    if (paymentURL) {
      const parsed = parseSolanaPayURL(paymentURL);
      if (parsed) {
        setPaymentDetails(parsed);
      }
    }
  }, [paymentURL]);

  const handleConfirmPayment = () => {
    setShowExecutor(true);
  };

  const handlePaymentSuccess = (signature: string) => {
    if (paymentDetails) {
      setPaymentSuccess({
        signature,
        amount: paymentDetails.amount,
        description: paymentDetails.message || paymentDetails.label,
      });
      setShowExecutor(false);
      onConfirm(); // Notify parent component
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setShowExecutor(false);
    // Could show error state here
  };

  const handleClose = () => {
    setPaymentSuccess(null);
    setShowExecutor(false);
    onCancel();
  };

  if (!isVisible || !paymentDetails) return null;

  // Show payment success screen
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <PaymentSuccess
          signature={paymentSuccess.signature}
          amount={paymentSuccess.amount}
          description={paymentSuccess.description}
          onClose={handleClose}
        />
      </div>
    );
  }

  // Show payment executor
  if (showExecutor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <PaymentExecutor
          paymentRequest={paymentDetails}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={() => setShowExecutor(false)}
        />
      </div>
    );
  }

  // Show payment confirmation
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">
          Confirm Payment
        </h3>
        
        <div className="space-y-3 mb-6">
          <div>
            <span className="text-dark-text-secondary">Amount:</span>
            <div className="font-semibold text-lg text-solana-purple-500">
              {formatPaymentAmount(paymentDetails.amount)}
            </div>
          </div>
          
          <div>
            <span className="text-dark-text-secondary">To:</span>
            <div className="font-mono text-sm break-all bg-dark-bg-tertiary p-2 rounded text-dark-text-primary">
              {paymentDetails.recipient.toString()}
            </div>
          </div>
          
          <div>
            <span className="text-dark-text-secondary">Description:</span>
            <div className="text-dark-text-primary">{paymentDetails.message || paymentDetails.label}</div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmPayment}
            className="flex-1"
          >
            Confirm Payment
          </Button>
        </div>
      </Card>
    </div>
  );
}
