/**
 * Solana Pay Integration
 * Handles payment URL creation and validation
 */

import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { PaymentRequest } from '@/lib/types';

/**
 * Simple payment request for URL generation (without all required fields)
 */
interface SimplePaymentRequest {
  recipient: string;
  amount: BigNumber;
  label: string;
  message?: string;
  memo?: string;
}

/**
 * Create a Solana Pay URL from payment request
 */
export function createPaymentURL(request: SimplePaymentRequest): string {
  const { recipient, amount, label, message } = request;
  
  const params = new URLSearchParams({
    amount: amount.toString(),
    label: label || 'StudyPay Payment',
    message: message || 'Campus payment via StudyPay'
  });
  
  return `solana:${recipient}?${params.toString()}`;
}

/**
 * Validate a Solana Pay URL format
 */
export function validatePaymentURL(url: string): boolean {
  try {
    if (!url.startsWith('solana:')) {
      return false;
    }
    
    const [addressPart, queryPart] = url.split('?');
    const address = addressPart.replace('solana:', '');
    
    // Validate address format
    new PublicKey(address);
    
    // Validate required parameters
    const params = new URLSearchParams(queryPart || '');
    const amount = params.get('amount');
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse payment details from Solana Pay URL
 */
export function parsePaymentURL(url: string): SimplePaymentRequest | null {
  try {
    if (!validatePaymentURL(url)) {
      return null;
    }
    
    const [addressPart, queryPart] = url.split('?');
    const recipient = addressPart.replace('solana:', '');
    const params = new URLSearchParams(queryPart || '');
    
    return {
      recipient,
      amount: new BigNumber(params.get('amount') || '0'),
      label: params.get('label') || 'StudyPay Payment',
      message: params.get('message') || 'Campus payment via StudyPay',
      memo: params.get('memo') || undefined
    };
  } catch {
    return null;
  }
}

/**
 * Create payment request with QR code (simulated for demo)
 */
export async function createPaymentRequest(
  vendorAddress: string,
  amount: BigNumber,
  label: string,
  description: string
): Promise<{ paymentRequest: SimplePaymentRequest; qrCode: string }> {
  const paymentRequest: SimplePaymentRequest = {
    recipient: vendorAddress,
    amount,
    label,
    message: description
  };
  
  const paymentURL = createPaymentURL(paymentRequest);
  
  // In a real implementation, this would generate the actual QR code
  const qrCode = `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="#9945FF">
        QR Code: ${amount} SOL
      </text>
      <text x="100" y="130" text-anchor="middle" font-size="8" fill="#666">
        ${description}
      </text>
    </svg>
  `)}`;
  
  return { paymentRequest, qrCode };
}

/**
 * Monitor payment status (simulated for demo)
 */
export async function monitorPayment(
  paymentRequest: SimplePaymentRequest,
  onStatusUpdate: (status: 'pending' | 'processing' | 'confirmed' | 'failed') => void
): Promise<string | null> {
  // Simulate payment monitoring
  onStatusUpdate('processing');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random success/failure for demo
  const success = Math.random() > 0.2; // 80% success rate
  
  if (success) {
    onStatusUpdate('confirmed');
    return 'mock_transaction_signature_' + Date.now();
  } else {
    onStatusUpdate('failed');
    return null;
  }
}

/**
 * Estimate transaction fee
 */
export function estimateTransactionFee(): BigNumber {
  // Solana transactions typically cost ~0.000005 SOL
  return new BigNumber(0.000005);
}

/**
 * Get payment status from transaction signature
 */
export async function getPaymentStatus(signature: string): Promise<'confirmed' | 'failed' | 'pending'> {
  // In a real implementation, this would check the blockchain
  // For demo, simulate status based on signature format
  if (signature.startsWith('mock_')) {
    return 'confirmed';
  }
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'confirmed';
  } catch {
    return 'failed';
  }
}
