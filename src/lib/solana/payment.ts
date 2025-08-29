/**
 * Real Solana Pay Integration
 * Handles actual payment URL creation and QR generation
 */

import { 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Connection, 
  Transaction, 
  SystemProgram, 
  TransactionInstruction 
} from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';
import BigNumber from 'bignumber.js';

/**
 * Payment request interface for Solana Pay
 */
export interface SolanaPayRequest {
  recipient: PublicKey;
  amount: BigNumber;
  label: string;
  message?: string;
  memo?: string;
}

/**
 * Create real Solana Pay URL
 */
export function createSolanaPayURL(request: SolanaPayRequest): URL {
  const { recipient, amount, label, message, memo } = request;
  
  return encodeURL({
    recipient,
    amount: amount,
    label,
    message,
    memo,
  });
}

/**
 * Generate real QR code for Solana Pay
 */
export async function generatePaymentQR(request: SolanaPayRequest): Promise<string> {
  try {
    const url = createSolanaPayURL(request);
    const qrCode = createQR(url, 256, 'transparent');
    
    // Convert QR code to data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    canvas.width = 256;
    canvas.height = 256;
    
    // Draw QR code with Solana purple background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 256, 256);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(qrCode.toString());
    });
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validate Solana Pay URL
 */
export function validateSolanaPayURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'solana:';
  } catch {
    return false;
  }
}

/**
 * Convert SOL amount to lamports
 */
export function solToLamports(solAmount: BigNumber): number {
  return solAmount.multipliedBy(LAMPORTS_PER_SOL).toNumber();
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): BigNumber {
  return new BigNumber(lamports).dividedBy(LAMPORTS_PER_SOL);
}

/**
 * Create payment request for vendor
 */
export function createVendorPaymentRequest(
  vendorAddress: string,
  amount: BigNumber,
  description: string
): SolanaPayRequest {
  return {
    recipient: new PublicKey(vendorAddress),
    amount,
    label: 'StudyPay Campus Payment',
    message: description,
    memo: `StudyPay: ${description}`,
  };
}

/**
 * Create payment request for parent-to-student transfer
 */
export function createStudentTransferRequest(
  studentAddress: string,
  amount: BigNumber,
  parentNote?: string
): SolanaPayRequest {
  return {
    recipient: new PublicKey(studentAddress),
    amount,
    label: 'StudyPay Allowance',
    message: parentNote || 'Allowance from parent',
    memo: `StudyPay transfer: ${parentNote || 'allowance'}`,
  };
}

/**
 * Parse Solana Pay URL to extract payment details
 */
export function parseSolanaPayURL(url: string): SolanaPayRequest | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'solana:') return null;
    
    const recipient = new PublicKey(parsedUrl.pathname);
    const amount = new BigNumber(parsedUrl.searchParams.get('amount') || '0');
    const label = parsedUrl.searchParams.get('label') || 'StudyPay Payment';
    const message = parsedUrl.searchParams.get('message') || undefined;
    const memo = parsedUrl.searchParams.get('memo') || undefined;
    
    return {
      recipient,
      amount,
      label,
      message,
      memo,
    };
  } catch (error) {
    console.error('Error parsing Solana Pay URL:', error);
    return null;
  }
}

/**
 * Estimate transaction fee for Solana payment
 */
export function estimateTransactionFee(): BigNumber {
  // Solana transactions typically cost ~0.000005 SOL
  return new BigNumber(0.000005);
}

/**
 * Format payment amount for display
 */
export function formatPaymentAmount(amount: BigNumber): string {
  return `${amount.toFixed(6)} SOL`;
}

/**
 * Check if amount is valid for payment
 */
export function isValidPaymentAmount(amount: BigNumber): boolean {
  return amount.isGreaterThan(0) && amount.isLessThanOrEqualTo(1000); // Max 1000 SOL
}

/**
 * Create mock vendor address for demo (replace with real addresses)
 */
export function getMockVendorAddress(): string {
  // Using a valid Solana devnet address for testing
  // This represents "Mama Adunni's Kitchen" vendor
  return '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
}

/**
 * Create mock student address for demo (replace with real addresses)  
 */
export function getMockStudentAddress(): string {
  // Using a different valid Solana devnet address for testing
  return 'GjwEiNqYRqnVQPqfgzJhq8Z8xKXeqNqKjxqrG5xKXeqN';
}

// =============================================================================
// Real SOL Transfer Execution (Step 1.2)
// =============================================================================

/**
 * Execute real SOL transfer using wallet adapter
 */
export async function executeSOLTransfer(
  connection: Connection,
  senderWallet: any, // Wallet from useWallet hook
  paymentRequest: SolanaPayRequest
): Promise<string> {
  if (!senderWallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  if (!senderWallet.signTransaction) {
    throw new Error('Wallet does not support transaction signing');
  }

  try {
    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: paymentRequest.recipient,
        lamports: solToLamports(paymentRequest.amount),
      })
    );

    // Add memo if provided
    if (paymentRequest.memo) {
      transaction.add(
        new TransactionInstruction({
          keys: [{ pubkey: senderWallet.publicKey, isSigner: true, isWritable: false }],
          data: Buffer.from(paymentRequest.memo, 'utf-8'),
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        })
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderWallet.publicKey;

    // Sign and send transaction
    const signed = await senderWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('SOL transfer failed:', error);
    throw new Error(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Monitor payment transaction status
 */
export async function monitorPaymentTransaction(
  connection: Connection,
  signature: string,
  onStatusUpdate?: (status: PaymentStatus) => void
): Promise<PaymentResult> {
  try {
    onStatusUpdate?.('processing');

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      onStatusUpdate?.('failed');
      return {
        signature,
        status: 'failed',
        error: confirmation.value.err.toString(),
      };
    }

    onStatusUpdate?.('confirmed');
    return {
      signature,
      status: 'confirmed',
      confirmedAt: new Date(),
    };

  } catch (error) {
    onStatusUpdate?.('failed');
    return {
      signature,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute and monitor complete payment flow
 */
export async function executePaymentFlow(
  connection: Connection,
  senderWallet: any,
  paymentRequest: SolanaPayRequest,
  onStatusUpdate?: (status: PaymentStatus) => void
): Promise<PaymentResult> {
  try {
    onStatusUpdate?.('initiating');

    // Execute the transfer
    const signature = await executeSOLTransfer(connection, senderWallet, paymentRequest);
    
    // Monitor the transaction
    const result = await monitorPaymentTransaction(connection, signature, onStatusUpdate);
    
    return result;
  } catch (error) {
    onStatusUpdate?.('failed');
    return {
      signature: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if wallet has sufficient balance for payment
 */
export async function checkSufficientBalance(
  connection: Connection,
  walletPubkey: PublicKey,
  paymentAmount: BigNumber
): Promise<{ sufficient: boolean; currentBalance: BigNumber; required: BigNumber }> {
  try {
    const balance = await connection.getBalance(walletPubkey);
    const currentBalanceSOL = lamportsToSol(balance);
    const requiredAmount = paymentAmount.plus(estimateTransactionFee());
    
    return {
      sufficient: currentBalanceSOL.isGreaterThanOrEqualTo(requiredAmount),
      currentBalance: currentBalanceSOL,
      required: requiredAmount,
    };
  } catch (error) {
    console.error('Balance check failed:', error);
    return {
      sufficient: false,
      currentBalance: new BigNumber(0),
      required: paymentAmount.plus(estimateTransactionFee()),
    };
  }
}

// =============================================================================
// Payment Status Types
// =============================================================================

export type PaymentStatus = 'initiating' | 'processing' | 'confirmed' | 'failed' | 'expired';

export interface PaymentResult {
  signature: string;
  status: PaymentStatus;
  confirmedAt?: Date;
  error?: string;
}
