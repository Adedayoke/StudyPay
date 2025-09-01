/**
 * Real Solana Pay QR Components - Competition Ready
 * Implements official Solana Pay protocol for campus payments
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Card, Button, Alert, Input } from '@/components/ui';
import { 
  generateSolanaPayQR,
  createSolanaPayTransactionRequest,
  createSolanaPayURL,
  parseSolanaPayURL,
  formatPaymentAmount,
  isValidPaymentAmount,
  SolanaPayRequest,
  CampusPaymentType,
  CAMPUS_MERCHANTS
} from '@/lib/solana/payment';

// =============================================================================
// Official Solana Pay QR Generator
// =============================================================================

interface SolanaPayQRGeneratorProps {
  paymentType: CampusPaymentType;
  onPaymentGenerated?: (paymentURL: string) => void;
  defaultParams?: Record<string, string>;
}

export function SolanaPayQRGenerator({ 
  paymentType, 
  onPaymentGenerated,
  defaultParams = {}
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
    if (!isValidPaymentAmount(amountBN)) {
      setError('Invalid amount. Must be between 0 and 1000 SOL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a real Solana Pay URL instead of transaction request
      const vendorWallet = CAMPUS_MERCHANTS.food['mama-adunni']?.wallet || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      console.log('Using vendor wallet:', vendorWallet);
      
      const solanaPayRequest: SolanaPayRequest = {
        recipient: new PublicKey(vendorWallet),
        amount: amountBN,
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
            <p className="text-solana-purple-500 font-semibold">
              {formatPaymentAmount(new BigNumber(amount))}
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

export function FoodPaymentQR({ onPaymentGenerated }: { onPaymentGenerated?: (url: string) => void }) {
  return (
    <SolanaPayQRGenerator 
      paymentType="food" 
      onPaymentGenerated={onPaymentGenerated}
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
  const [isScanning, setIsScanning] = useState(false);
  const [manualURL, setManualURL] = useState('');

  const startScanning = () => {
    setIsScanning(true);
    // In a real implementation, would use camera scanning
    setTimeout(() => {
      setIsScanning(false);
      onError?.('Camera scanning available in mobile app. Please use manual entry for now.');
    }, 2000);
  };

  const handleManualEntry = () => {
    if (!manualURL) {
      onError?.('Please enter a Solana Pay URL or transaction request');
      return;
    }

    try {
      // Check if it's a transaction request URL (our API endpoint)
      if (manualURL.includes('/api/pay/')) {
        onPaymentDetected?.(manualURL);
        setManualURL('');
        return;
      }

      // Check if it's a standard Solana Pay URL
      const url = new URL(manualURL);
      if (url.protocol !== 'solana:') {
        onError?.('Invalid Solana Pay URL format');
        return;
      }
      
      // Validate the URL can be parsed
      const parsed = parseSolanaPayURL(manualURL);
      if (!parsed) {
        onError?.('Unable to parse Solana Pay URL');
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
        Scan Solana Pay QR
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
            label="Solana Pay URL or Transaction Request"
            value={manualURL}
            onChange={(e) => setManualURL(e.target.value)}
            placeholder="solana:... or https://studypay.app/api/pay/..."
          />
          
          <Button 
            onClick={handleManualEntry}
            variant="secondary"
            className="w-full"
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
