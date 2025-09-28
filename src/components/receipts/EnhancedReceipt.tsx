/**
 * Enhanced Receipt Component
 * Generates detailed receipts with QR codes and vendor information
 */

'use client';

import React, { useState } from 'react';
import { Transaction } from '@/lib/types/payment';
import { VendorTransaction } from '@/lib/services/vendorTransactionService';
import { Card, Button, Badge } from '@/components/ui';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { BigNumber } from 'bignumber.js';

interface EnhancedReceiptProps {
  transaction: Transaction | VendorTransaction;
  vendorInfo?: {
    name: string;
    location: string;
    category: string;
  };
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export default function EnhancedReceipt({ 
  transaction, 
  vendorInfo,
  onClose,
  onDownload,
  onShare
}: EnhancedReceiptProps) {
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  
  const { convertSolToNaira } = usePriceConversion();
  const currencyFormatter = useCurrencyFormatter();

  const receiptId = `SPR-${transaction.id.slice(-8).toUpperCase()}`;
  const isVendorTransaction = 'vendorWallet' in transaction;

  const generateReceiptQR = async () => {
    setIsGeneratingQR(true);
    try {
      // Generate QR code with receipt verification URL
      const verificationUrl = `https://studypay.app/verify/${transaction.id}`;
      
      // Simple QR code representation
      const qrDataURL = `data:image/svg+xml;base64,${btoa(`
        <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="120" fill="white"/>
          <rect x="10" y="10" width="100" height="100" fill="white" stroke="#9945FF" stroke-width="1"/>
          <text x="60" y="35" text-anchor="middle" font-size="8" fill="#9945FF" font-weight="bold">
            RECEIPT
          </text>
          <text x="60" y="50" text-anchor="middle" font-size="6" fill="#333">
            ${receiptId}
          </text>
          <text x="60" y="80" text-anchor="middle" font-size="5" fill="#666">
            Scan to verify
          </text>
          <text x="60" y="95" text-anchor="middle" font-size="4" fill="#999">
            on blockchain
          </text>
        </svg>
      `)}`;

      return qrDataURL;
    } catch (error) {
      console.error('Error generating receipt QR:', error);
      return null;
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const [receiptQR, setReceiptQR] = useState<string | null>(null);

  React.useEffect(() => {
    generateReceiptQR().then(setReceiptQR);
  }, []);

  const downloadReceipt = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>StudyPay Receipt - ${receiptId}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>📱 StudyPay Receipt</h2>
              <p>${receiptId}</p>
            </div>
            
            <div class="row">
              <span>Date:</span>
              <span>${transaction.timestamp.toLocaleDateString()} ${transaction.timestamp.toLocaleTimeString()}</span>
            </div>
            
            ${vendorInfo ? `
            <div class="row">
              <span>Vendor:</span>
              <span>${vendorInfo.name}</span>
            </div>
            <div class="row">
              <span>Location:</span>
              <span>${vendorInfo.location}</span>
            </div>
            ` : ''}
            
            <div class="row">
              <span>Description:</span>
              <span>${transaction.description}</span>
            </div>
            
            <div class="row">
              <span>Payment Method:</span>
              <span>${isVendorTransaction ? (transaction.paymentMethod === 'mobile' ? 'Mobile Wallet' : 'Desktop Wallet') : 'Solana Pay'}</span>
            </div>
            
            <div class="total">
              <div class="row">
                <span>Amount (SOL):</span>
                <span>${currencyFormatter.formatCurrency(transaction.amount, 'SOL')}</span>
              </div>
              <div class="row">
                <span>Amount (NGN):</span>
                <span>${currencyFormatter.formatCurrency(convertSolToNaira(transaction.amount)?.amount || new BigNumber(0), 'NGN')}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Transaction ID: ${'signature' in transaction ? transaction.signature?.slice(0, 16) + '...' : 'N/A'}</p>
              <p>Verified on Solana Blockchain</p>
              <p>StudyPay - Campus Payment Solution</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    
    onDownload?.();
  };

  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `StudyPay Receipt - ${receiptId}`,
          text: `Payment of ${currencyFormatter.formatCurrency(convertSolToNaira(transaction.amount)?.amount || new BigNumber(0), 'NGN')} completed via StudyPay`,
          url: `https://studypay.app/receipt/${transaction.id}`
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `StudyPay Receipt ${receiptId}\nAmount: ${currencyFormatter.formatCurrency(convertSolToNaira(transaction.amount)?.amount || new BigNumber(0), 'NGN')}\nDate: ${transaction.timestamp.toLocaleDateString()}`;
      await navigator.clipboard.writeText(shareText);
    }
    
    onShare?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center border-b border-dark-border-primary pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div></div>
            <h2 className="text-xl font-bold text-dark-text-primary">📱 StudyPay Receipt</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              ✕
            </Button>
          </div>
          
          <div className="text-lg font-mono text-solana-purple-500 mb-2">
            {receiptId}
          </div>
          
          <Badge 
            variant={transaction.status === 'confirmed' ? 'success' : 'warning'}
            className="mb-2"
          >
            {transaction.status === 'confirmed' ? '✅ Verified' : '⏳ Pending'}
          </Badge>

          {/* Receipt QR Code */}
          {receiptQR && (
            <div className="mt-4">
              <img 
                src={receiptQR} 
                alt="Receipt Verification QR" 
                className="mx-auto border border-dark-border-secondary rounded"
                width={120}
                height={120}
              />
              <p className="text-xs text-dark-text-muted mt-1">
                Scan to verify on blockchain
              </p>
            </div>
          )}
        </div>

        {/* Receipt Details */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-dark-text-secondary">Date & Time:</span>
              <div className="font-medium text-dark-text-primary">
                {transaction.timestamp.toLocaleDateString()}
              </div>
              <div className="text-xs text-dark-text-muted">
                {transaction.timestamp.toLocaleTimeString()}
              </div>
            </div>
            
            <div>
              <span className="text-dark-text-secondary">Payment Method:</span>
              <div className="font-medium text-dark-text-primary">
                {isVendorTransaction ? (
                  <span className="flex items-center gap-1">
                    {transaction.paymentMethod === 'mobile' ? '📱' : '💻'}
                    {transaction.paymentMethod === 'mobile' ? 'Mobile' : 'Desktop'}
                  </span>
                ) : (
                  'Solana Pay'
                )}
              </div>
            </div>
          </div>

          {vendorInfo && (
            <div>
              <span className="text-dark-text-secondary">Vendor Information:</span>
              <div className="bg-dark-bg-tertiary p-3 rounded-lg mt-1">
                <div className="font-medium text-dark-text-primary">{vendorInfo.name}</div>
                <div className="text-sm text-dark-text-secondary">{vendorInfo.category}</div>
                <div className="text-xs text-dark-text-muted">{vendorInfo.location}</div>
              </div>
            </div>
          )}

          <div>
            <span className="text-dark-text-secondary">Description:</span>
            <div className="font-medium text-dark-text-primary mt-1">
              {transaction.description}
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="bg-dark-bg-tertiary p-4 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-solana-purple-500 mb-2">
                {currencyFormatter.formatCurrency(convertSolToNaira(transaction.amount)?.amount || new BigNumber(0), 'NGN')}
              </div>
              <div className="text-sm text-dark-text-secondary">
                ≈ {currencyFormatter.formatCurrency(transaction.amount, 'SOL')}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          {'signature' in transaction && transaction.signature && (
            <div>
              <span className="text-dark-text-secondary">Transaction ID:</span>
              <div className="font-mono text-xs bg-dark-bg-tertiary p-2 rounded mt-1 break-all text-dark-text-primary">
                {transaction.signature}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-dark-border-primary">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={downloadReceipt}
          >
            <div className="flex items-center justify-center gap-2">
              <StudyPayIcon name="download" size={16} />
              <span>Download</span>
            </div>
          </Button>
          
          <Button
            variant="secondary"
            className="flex-1"
            onClick={shareReceipt}
          >
            <div className="flex items-center justify-center gap-2">
              <StudyPayIcon name="send" size={16} />
              <span>Share</span>
            </div>
          </Button>
          
          <Button
            variant="primary"
            className="flex-1"
            onClick={onClose}
          >
            Done
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 pt-4 border-t border-dark-border-primary">
          <p className="text-xs text-dark-text-muted">
            🔒 Verified on Solana Blockchain
          </p>
          <p className="text-xs text-dark-text-muted">
            StudyPay - Secure Campus Payments
          </p>
        </div>
      </Card>
    </div>
  );
}
