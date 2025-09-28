/**
 * Real Solana Pay QR Components - Competition Ready
 * Implements official Solana Pay protocol for campus payments
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
// Using native browser APIs for better mobile compatibility
import { Card, Button, Input, Alert } from '@/components/ui';
import MobileQRScanner from './MobileQRScanner';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { Check, Clock, RefreshCw } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
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
  
  // Real-time status tracking
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [paymentSignature, setPaymentSignature] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [expectedAmount, setExpectedAmount] = useState<BigNumber | null>(null);
  const [vendorPublicKey, setVendorPublicKey] = useState<PublicKey | null>(null);
  
  // Solana connection for blockchain monitoring
  const { connection } = useConnection();

  // Blockchain monitoring for real payments
  useEffect(() => {
    if (!vendorPublicKey || !expectedAmount || !connection || paymentStatus !== 'pending') {
      return;
    }

    const monitorBlockchain = async () => {
      try {
        // Get recent transactions for the vendor address
        const signatures = await connection.getSignaturesForAddress(vendorPublicKey, {
          limit: 10,
        });

        // Check transactions from the last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        for (const sigInfo of signatures) {
          if (!sigInfo.blockTime) continue;
          
          const txTime = sigInfo.blockTime * 1000;
          if (txTime < fiveMinutesAgo) continue;

          try {
            const txDetails = await connection.getTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (txDetails && isMatchingPayment(txDetails, expectedAmount)) {
              // Found matching payment!
              setPaymentStatus('completed');
              setPaymentSignature(sigInfo.signature);
              
              // Update localStorage for consistency
              if (transactionId) {
                const stored = localStorage.getItem(`studypay_qr_${transactionId}`);
                if (stored) {
                  const transactionInfo = JSON.parse(stored);
                  transactionInfo.status = 'completed';
                  transactionInfo.signature = sigInfo.signature;
                  localStorage.setItem(`studypay_qr_${transactionId}`, JSON.stringify(transactionInfo));
                }
              }
              
              console.log('✅ Real blockchain payment detected:', sigInfo.signature);
              return;
            }
          } catch (error) {
            console.warn('Error fetching transaction details:', error);
          }
        }
      } catch (error) {
        console.error('Error monitoring blockchain:', error);
      }
    };

    // Start monitoring after 10 seconds (give time for payment to be made)
    const timeout = setTimeout(monitorBlockchain, 10000);
    
    // Then monitor every 15 seconds
    const interval = setInterval(monitorBlockchain, 15000);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [vendorPublicKey, expectedAmount, connection, paymentStatus, transactionId]);

  // Helper function to check if transaction matches expected payment
  const isMatchingPayment = (txDetails: any, expectedAmount: BigNumber): boolean => {
    try {
      const postBalances = txDetails.meta?.postBalances || [];
      const preBalances = txDetails.meta?.preBalances || [];
      
      // Look for balance changes that match our expected amount (within 5% tolerance)
      for (let i = 0; i < postBalances.length; i++) {
        const balanceChange = postBalances[i] - preBalances[i];
        if (balanceChange > 0) {
          const changeInSol = new BigNumber(balanceChange).dividedBy(1e9);
          const tolerance = expectedAmount.multipliedBy(0.05); // 5% tolerance
          
          if (changeInSol.minus(expectedAmount).abs().lte(tolerance)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking transaction match:', error);
      return false;
    }
  };

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
      
      // Create transaction ID for status tracking
      const txId = `qr_${recipientWallet}_${Date.now()}`;
      setTransactionId(txId);
      setPaymentStatus('pending');
      
      // Set blockchain monitoring parameters
      setExpectedAmount(solAmount);
      setVendorPublicKey(new PublicKey(recipientWallet));
      
      // Store transaction info in localStorage for status tracking
      const transactionInfo = {
        id: txId,
        vendorAddress: recipientWallet,
        amount: solAmount.toString(),
        description,
        status: 'pending',
        timestamp: Date.now(),
        paymentURL: solanaPayURL.toString()
      };
      localStorage.setItem(`studypay_qr_${txId}`, JSON.stringify(transactionInfo));
      
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
    
    // Reset status tracking
    setPaymentStatus('pending');
    setPaymentSignature(null);
    setTransactionId(null);
    setExpectedAmount(null);
    setVendorPublicKey(null);
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
          {/* Status Header */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {paymentStatus === 'pending' && (
              <>
                <Clock size={16} className="text-yellow-400 animate-pulse" />
                <span className="text-sm text-yellow-400">Waiting for Payment...</span>
              </>
            )}
            {paymentStatus === 'completed' && (
              <>
                <Check size={16} className="text-green-400" />
                <span className="text-sm text-green-400">Payment Completed!</span>
              </>
            )}
            {paymentStatus === 'failed' && (
              <>
                <span className="text-sm text-red-400">Payment Failed</span>
              </>
            )}
          </div>

          {/* QR Code or Success Animation */}
          <div className="relative">
            {paymentStatus === 'pending' ? (
              <div className="bg-white p-4 rounded-lg border-2 border-solana-purple-500 inline-block transition-all duration-500">
                <img 
                  src={qrCodeDataURL} 
                  alt="Official Solana Pay QR Code" 
                  className="block mx-auto"
                  width={256}
                  height={256}
                />
              </div>
            ) : paymentStatus === 'completed' ? (
              <div className="bg-green-500/20 border-2 border-green-400 rounded-lg w-72 h-72 mx-auto flex items-center justify-center transition-all duration-500 transform scale-105">
                <div className="text-center">
                  <Check size={80} className="text-green-400 mx-auto animate-bounce mb-4" />
                  <div className="text-green-400 font-semibold text-xl">
                    Payment Received!
                  </div>
                  {paymentSignature && (
                    <div className="text-xs text-gray-400 mt-2 font-mono break-all max-w-48">
                      {paymentSignature.slice(0, 8)}...{paymentSignature.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-red-500/20 border-2 border-red-400 rounded-lg w-72 h-72 mx-auto flex items-center justify-center transition-all duration-500">
                <div className="text-center">
                  <div className="text-red-400 font-semibold text-xl">
                    Payment Failed
                  </div>
                </div>
              </div>
            )}
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
            {transactionId && (
              <p className="text-xs text-gray-500 mt-1">
                ID: {transactionId.slice(-8)}
              </p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={resetQR}
              variant="secondary"
              className="flex-1"
            >
              {paymentStatus === 'completed' ? 'New Payment' : 'Reset'}
            </Button>
            <Button 
              onClick={copyToClipboard}
              variant="secondary"
              className="flex-1"
            >
              Copy Link
            </Button>
          </div>

          {/* Blockchain Monitoring Status */}
          {paymentStatus === 'pending' && (
            <div className="mt-4 p-3 bg-dark-bg-tertiary rounded-lg border border-dark-border-secondary">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-400 font-medium">Monitoring Blockchain</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>• Checking Solana network every 15 seconds</div>
                <div>• Looking for payments to: {vendorPublicKey?.toString().slice(0, 8)}...{vendorPublicKey?.toString().slice(-8)}</div>
                <div>• Expected amount: {expectedAmount?.toFixed(4)} SOL</div>
                <div>• Auto-detects real payments within 5% tolerance</div>
              </div>
            </div>
          )}
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
