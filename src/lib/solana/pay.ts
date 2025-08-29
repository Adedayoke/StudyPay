/**
 * Solana Pay Integration
 * Handles QR code generation, payment requests, and transaction processing
 */

import { PublicKey } from '@solana/web3.js';
import { createQR, encodeURL, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { PaymentRequest, SolanaPayQR, StudyPayError, ErrorCode } from '../types';
import { connection } from './config';
import { generatePaymentReference, validatePaymentAmount, createStudyPayError } from './utils';

// =============================================================================
// Payment Request Creation
// =============================================================================

/**
 * Create a Solana Pay payment request with QR code
 */
export async function createPaymentRequest(
  recipientAddress: string,
  amount: BigNumber,
  label: string,
  message?: string
): Promise<{ paymentRequest: PaymentRequest; qrCode: SolanaPayQR }> {
  try {
    // Validate inputs
    const amountValidation = validatePaymentAmount(amount);
    if (!amountValidation.valid) {
      throw createStudyPayError(ErrorCode.INVALID_ADDRESS, amountValidation.error!);
    }

    const recipient = new PublicKey(recipientAddress);
    const reference = generatePaymentReference();
    
    // Create the payment URL
    const url = encodeURL({
      recipient,
      amount,
      label,
      message,
      reference: new PublicKey(reference), // This should be a public key for reference
    });

    // Generate QR code
    const qrCode = createQR(url, 400, 'white', 'black');

    const paymentRequest: PaymentRequest = {
      id: reference,
      amount,
      recipient: recipientAddress,
      label,
      message,
      reference,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };

    return {
      paymentRequest,
      qrCode: {
        url: url.toString(),
        reference: new PublicKey(reference),
        amount,
        label,
        message,
      },
    };
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw createStudyPayError(ErrorCode.TRANSACTION_FAILED, 'Failed to create payment request');
  }
}

/**
 * Create a simple payment QR for vendors
 */
export async function createVendorPaymentQR(
  vendorAddress: string,
  amount: BigNumber,
  itemName: string
): Promise<SolanaPayQR> {
  const label = `StudyPay - ${itemName}`;
  const message = `Payment for ${itemName}`;
  
  const { qrCode } = await createPaymentRequest(vendorAddress, amount, label, message);
  return qrCode;
}

// =============================================================================
// Payment Processing
// =============================================================================

/**
 * Process a Solana Pay transaction
 */
export async function processPayment(
  paymentRequest: PaymentRequest,
  signature: string
): Promise<boolean> {
  try {
    // Validate the transaction against the payment request
    const recipient = new PublicKey(paymentRequest.recipient);
    const reference = new PublicKey(paymentRequest.reference);
    
    const validation = await validateTransfer(
      connection,
      signature,
      {
        recipient,
        amount: paymentRequest.amount,
        reference,
      }
    );

    return validation !== null;
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
}

// =============================================================================
// Payment Monitoring
// =============================================================================

/**
 * Monitor for payment completion
 */
export async function monitorPayment(
  paymentRequest: PaymentRequest,
  onStatusUpdate: (status: 'pending' | 'confirmed' | 'failed' | 'expired') => void,
  timeoutMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<string | null> {
  const startTime = Date.now();
  const reference = new PublicKey(paymentRequest.reference);
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(async () => {
      try {
        // Check if payment has expired
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          onStatusUpdate('expired');
          resolve(null);
          return;
        }

        // Check for transactions with this reference
        const signatures = await connection.getSignaturesForAddress(reference, { limit: 10 });
        
        if (signatures.length > 0) {
          const latestSignature = signatures[0].signature;
          
          // Validate the transaction
          const isValid = await processPayment(paymentRequest, latestSignature);
          
          if (isValid) {
            clearInterval(checkInterval);
            onStatusUpdate('confirmed');
            resolve(latestSignature);
          } else {
            onStatusUpdate('failed');
          }
        } else {
          onStatusUpdate('pending');
        }
      } catch (error) {
        console.error('Error monitoring payment:', error);
        onStatusUpdate('pending');
      }
    }, 3000); // Check every 3 seconds
  });
}

// =============================================================================
// QR Code Utilities
// =============================================================================

/**
 * Generate QR code data URL for display
 */
export function getQRCodeDataURL(qrCode: SolanaPayQR): string {
  try {
    const canvas = document.createElement('canvas');
    const qr = createQR(qrCode.url, 400, 'white', 'black');
    
    // This is a simplified version - in practice, you'd need to properly
    // render the QR code to canvas and get the data URL
    return qrCode.url; // For now, return the URL
  } catch (error) {
    console.error('Error generating QR code data URL:', error);
    throw createStudyPayError(ErrorCode.TRANSACTION_FAILED, 'Failed to generate QR code');
  }
}

// =============================================================================
// Student-Specific Payment Functions
// =============================================================================

/**
 * Create a payment request for campus food purchase
 */
export async function createFoodPaymentRequest(
  vendorAddress: string,
  amount: BigNumber,
  foodItem: string
): Promise<{ paymentRequest: PaymentRequest; qrCode: SolanaPayQR }> {
  return createPaymentRequest(
    vendorAddress,
    amount,
    `StudyPay - Food Purchase`,
    `Payment for ${foodItem} - Campus Dining`
  );
}

/**
 * Create a payment request for transport
 */
export async function createTransportPaymentRequest(
  vendorAddress: string,
  amount: BigNumber,
  route: string
): Promise<{ paymentRequest: PaymentRequest; qrCode: SolanaPayQR }> {
  return createPaymentRequest(
    vendorAddress,
    amount,
    `StudyPay - Transport`,
    `Payment for ${route} - Campus Transport`
  );
}

// =============================================================================
// Parent-to-Student Transfer Functions
// =============================================================================

/**
 * Create a transfer request from parent to student
 */
export async function createParentTransfer(
  studentAddress: string,
  amount: BigNumber,
  purpose: 'allowance' | 'emergency' | 'tuition' | 'other'
): Promise<{ paymentRequest: PaymentRequest; qrCode: SolanaPayQR }> {
  const labels = {
    allowance: 'StudyPay - Monthly Allowance',
    emergency: 'StudyPay - Emergency Fund',
    tuition: 'StudyPay - Tuition Payment',
    other: 'StudyPay - Transfer'
  };

  return createPaymentRequest(
    studentAddress,
    amount,
    labels[purpose],
    `Transfer from parent - ${purpose}`
  );
}
