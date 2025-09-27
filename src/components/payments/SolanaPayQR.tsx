/**
 * Real Solana Pay QR Components - Competition Ready
 * Implements official Solana Pay protocol for campus payments
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
// Using native browser APIs for better mobile compatibility
import { Card, Button, Input, Alert } from '@/components/ui';
import MobileQRScanner from './MobileQRScanner';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { 
  generateSolanaPayQR,
  createSolanaPayTransactionRequest,
  createSolanaPayURL,
  parseSolanaPayURL,
  formatPaymentAmount,
  formatNairaAmount,
  isValidPaymentAmount,
  isValidNairaAmount,
  SolanaPayRequest,
  CampusPaymentType,
  CAMPUS_MERCHANTS
} from '@/lib/solana/payment';
import { nairaToSolSync } from '@/lib/solana/utils';

// =============================================================================
// Official Solana Pay QR Generator
// =============================================================================

interface SolanaPayQRGeneratorProps {
  paymentType: CampusPaymentType;
  onPaymentGenerated?: (paymentURL: string) => void;
  defaultParams?: Record<string, string>;
  vendorWallet?: string; // Connected vendor's wallet address
}

export function SolanaPayQRGenerator({ 
  paymentType, 
  onPaymentGenerated,
  defaultParams = {},
  vendorWallet
}: SolanaPayQRGeneratorProps) {
  const [amount, setAmount] = useState(defaultParams.amount || '');
  const [description, setDescription] = useState(defaultParams.description || '');
  const [vendor, setVendor] = useState(defaultParams.vendor || '');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [paymentURL, setPaymentURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateQR = async () => {
    if (!amount || !description) {
      setError('Please enter both amount and description');
      return;
    }

    const amountBN = new BigNumber(amount);
    if (!isValidNairaAmount(amountBN)) {
      setError('Invalid amount. Must be between ₦0 and ₦50,000,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use connected vendor wallet if available, otherwise fallback to merchant registry
      const recipientWallet = vendorWallet || 
        CAMPUS_MERCHANTS.food['mama-adunni']?.wallet || 
        '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      
      console.log('Using vendor wallet:', recipientWallet);
      console.log('Vendor connected wallet:', vendorWallet || 'None - using fallback');
      
      const solAmount = nairaToSolSync(amountBN); // Convert Naira to SOL
      
      const solanaPayRequest: SolanaPayRequest = {
        recipient: new PublicKey(recipientWallet),
        amount: solAmount,
        label: `StudyPay - ${description}`,
        message: `Payment for ${description}`,
        memo: `StudyPay: ${description}`,
      };

      // Generate real Solana Pay URL
      const solanaPayURL = createSolanaPayURL(solanaPayRequest);
      console.log('Generated Solana Pay URL:', solanaPayURL.toString());
      
      // Generate QR code from the Solana Pay URL
      const qrDataURL = await generateSolanaPayQR(solanaPayURL, 400);
      console.log('Generated QR data URL length:', qrDataURL.length);
      
      setQrCodeDataURL(qrDataURL);
      setPaymentURL(solanaPayURL.toString());
      onPaymentGenerated?.(solanaPayURL.toString());

    } catch (err) {
      console.error('QR generation error:', err);
      setError(`Failed to generate payment QR code: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'food': return 'Food Payment';
      case 'transport': return 'Transport Payment';
      case 'transfer': return 'Parent Transfer';
      case 'tuition': return 'Tuition Payment';
      case 'books': return 'Textbook Payment';
      case 'events': return 'Event Ticket';
      default: return 'Campus Payment';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center text-dark-text-primary">
        Generate {getPaymentTypeLabel()} QR
      </h3>
      
      <Alert type="info" className="mb-4">
        Official Solana Pay - Real blockchain payments for campus services
      </Alert>
      
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!qrCodeDataURL ? (
        <div className="space-y-4">
          <Input
            label="Amount (₦ Naira)"
            type="number"
            step="100"
            min="0"
            max="50000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="2500"
          />
          
          <Input
            label={paymentType === 'food' ? 'Food Item' : paymentType === 'transport' ? 'Route/Service' : 'Description'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={paymentType === 'food' ? 'Jollof Rice + Coke' : paymentType === 'transport' ? 'Main Gate → Library' : 'Payment description'}
          />

          {(paymentType === 'food' || paymentType === 'transport') && (
            <Input
              label={paymentType === 'food' ? 'Vendor' : 'Service'}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder={paymentType === 'food' ? 'mama-adunni' : 'campus-shuttle'}
            />
          )}
          
          <Button 
            onClick={generateQR}
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating QR...' : 'Generate Official Solana Pay QR'}
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-solana-purple-500 inline-block">
            <img 
              src={qrCodeDataURL} 
              alt="Official Solana Pay QR Code" 
              className="block mx-auto"
              width={256}
              height={256}
            />
          </div>
          
          <div className="text-sm text-dark-text-secondary">
            <p className="font-medium text-dark-text-primary">{description}</p>
            <p className="text-solana-purple-500 font-semibold text-lg">
              ₦{new BigNumber(amount).toFormat(0)}
            </p>
            <p className="text-xs text-dark-text-muted">
              ≈ {nairaToSolSync(new BigNumber(amount)).toFixed(4)} SOL
            </p>
            <p className="text-xs text-dark-text-muted mt-1">
              🔒 Official Solana Pay Protocol
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
// Campus-Specific QR Generators
// =============================================================================

export function FoodPaymentQR({ 
  onPaymentGenerated, 
  vendorWallet 
}: { 
  onPaymentGenerated?: (url: string) => void;
  vendorWallet?: string;
}) {
  return (
    <SolanaPayQRGenerator 
      paymentType="food" 
      onPaymentGenerated={onPaymentGenerated}
      vendorWallet={vendorWallet}
      defaultParams={{
        vendor: 'mama-adunni'
      }}
    />
  );
}

export function TransportPaymentQR({ onPaymentGenerated }: { onPaymentGenerated?: (url: string) => void }) {
  return (
    <SolanaPayQRGenerator 
      paymentType="transport" 
      onPaymentGenerated={onPaymentGenerated}
      defaultParams={{
        service: 'campus-shuttle'
      }}
    />
  );
}

export function TuitionPaymentQR({ onPaymentGenerated }: { onPaymentGenerated?: (url: string) => void }) {
  return (
    <SolanaPayQRGenerator 
      paymentType="tuition" 
      onPaymentGenerated={onPaymentGenerated}
      defaultParams={{
        description: 'Semester tuition payment'
      }}
    />
  );
}

// =============================================================================
// Enhanced QR Scanner with Solana Pay Validation
// =============================================================================

interface SolanaPayScannerProps {
  onPaymentDetected?: (paymentURL: string) => void;
  onError?: (error: string) => void;
}

export function SolanaPayScanner({ onPaymentDetected, onError }: SolanaPayScannerProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [manualURL, setManualURL] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleQRDetected = (qrData: string) => {
    setShowScanner(false);
    handleQRResult(qrData);
  };

  const handleScannerError = (errorMsg: string) => {
    setError(errorMsg);
    onError?.(errorMsg);
  };

  const handleQRResult = (qrData: string) => {
    setError(null);

    try {
      // Check if it's a transaction request URL (our API endpoint)
      if (qrData.includes('/api/pay/')) {
        setSuccessMessage('Payment request detected! Processing...');
        onPaymentDetected?.(qrData);
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      // Check if it's a standard Solana Pay URL
      const url = new URL(qrData);
      if (url.protocol !== 'solana:') {
        setError('Invalid Solana Pay URL format. Expected solana: protocol.');
        return;
      }

      // Validate the URL can be parsed
      const parsed = parseSolanaPayURL(qrData);
      if (!parsed) {
        setError('Unable to parse Solana Pay URL. Please check the QR code.');
        return;
      }

      setSuccessMessage('Solana Pay QR code scanned successfully!');
      onPaymentDetected?.(qrData);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error processing QR result:', err);
      setError('Invalid QR code format. Please scan a valid Solana Pay QR code.');
    }
  };

  const handleManualEntry = () => {
    if (!manualURL.trim()) {
      onError?.('Please enter a Solana Pay URL or transaction request');
      return;
    }

    handleQRResult(manualURL.trim());
    setManualURL('');
  };

  return (
    <Card className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-center text-dark-text-primary">
        Scan Solana Pay QR
      </h3>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      <div className="space-y-4">
        {/* Mobile-Optimized QR Scanner */}
        <MobileQRScanner
          isOpen={showScanner}
          onQRDetected={handleQRDetected}
          onError={handleScannerError}
          onClose={() => setShowScanner(false)}
        />

        {/* Scanner Controls */}
        <div className="text-center">
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full bg-solana-purple-500 hover:bg-solana-purple-600 mb-4"
          >
            📷 Open QR Scanner
          </Button>
        </div>

        <div className="text-center text-dark-text-muted">
          <div className="border-t border-dark-border-primary pt-4 mb-4">OR</div>
        </div>

        <div className="space-y-3">
          <Input
            label="Solana Pay URL or Transaction Request"
            value={manualURL}
            onChange={(e) => setManualURL(e.target.value)}
            placeholder="solana:... or https://studypay.app/api/pay/..."
          />

          <Button
            onClick={handleManualEntry}
            variant="secondary"
            className="w-full"
            disabled={!manualURL.trim()}
          >
            Process Payment
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Re-export PaymentConfirmation for compatibility
export { PaymentConfirmation } from './QRPayment';
