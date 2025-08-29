/**
 * Core Solana Utilities
 * Clean, reusable functions for Solana blockchain operations
 */

import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  ParsedAccountData
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  getAccount 
} from '@solana/spl-token';
import BigNumber from 'bignumber.js';
import { connection, USDC_MINT, SOL_DECIMALS, USDC_DECIMALS } from './config';
import { WalletInfo, StudyPayError, ErrorCode } from '../types';

// =============================================================================
// Wallet Utilities
// =============================================================================

/**
 * Get wallet balance in SOL and USDC
 */
export async function getWalletBalance(walletAddress: string): Promise<WalletInfo> {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey);
    const solInLamports = new BigNumber(solBalance);
    const solAmount = solInLamports.dividedBy(LAMPORTS_PER_SOL);
    
    // For now, we'll focus on SOL. USDC balance can be added later
    return {
      address: walletAddress,
      balance: solAmount,
      isConnected: true,
      publicKey
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw createStudyPayError(ErrorCode.NETWORK_ERROR, 'Failed to fetch wallet balance', { walletAddress });
  }
}

/**
 * Validate if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert SOL to Lamports
 */
export function solToLamports(sol: BigNumber): BigNumber {
  return sol.multipliedBy(LAMPORTS_PER_SOL);
}

/**
 * Convert Lamports to SOL
 */
export function lamportsToSol(lamports: BigNumber): BigNumber {
  return lamports.dividedBy(LAMPORTS_PER_SOL);
}

// =============================================================================
// Transaction Utilities
// =============================================================================

/**
 * Create a SOL transfer transaction
 */
export async function createSolTransfer(
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amount: BigNumber
): Promise<Transaction> {
  try {
    const lamports = solToLamports(amount).toNumber();
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    return transaction;
  } catch (error) {
    console.error('Error creating SOL transfer:', error);
    throw createStudyPayError(ErrorCode.TRANSACTION_FAILED, 'Failed to create transfer transaction');
  }
}

/**
 * Check transaction status
 */
export async function getTransactionStatus(signature: string): Promise<'confirmed' | 'failed' | 'pending'> {
  try {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value === null) {
      return 'pending';
    }
    
    if (status.value.err) {
      return 'failed';
    }
    
    return 'confirmed';
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return 'pending';
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransactionConfirmation(
  signature: string,
  timeout: number = 30000
): Promise<boolean> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const status = await getTransactionStatus(signature);
    
    if (status === 'confirmed') {
      return true;
    }
    
    if (status === 'failed') {
      return false;
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Timeout reached
  return false;
}

// =============================================================================
// Currency Conversion Utilities
// =============================================================================

/**
 * Convert SOL amount to Nigerian Naira (mock exchange rate for demo)
 */
export function solToNaira(solAmount: BigNumber): BigNumber {
  // Mock exchange rate: 1 SOL = ₦50,000 (this would come from a real API)
  const MOCK_SOL_TO_NGN_RATE = 50000;
  return solAmount.multipliedBy(MOCK_SOL_TO_NGN_RATE);
}

/**
 * Convert Naira to SOL amount (mock exchange rate for demo)
 */
export function nairaToSol(nairaAmount: BigNumber): BigNumber {
  const MOCK_SOL_TO_NGN_RATE = 50000;
  return nairaAmount.dividedBy(MOCK_SOL_TO_NGN_RATE);
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: BigNumber, currency: 'SOL' | 'NGN' | 'USD'): string {
  switch (currency) {
    case 'SOL':
      return `${amount.toFixed(4)} SOL`;
    case 'NGN':
      return `₦${amount.toFormat(2)}`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    default:
      return amount.toString();
  }
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Create a StudyPay-specific error
 */
export function createStudyPayError(
  code: ErrorCode,
  message: string,
  context?: Record<string, any>
): StudyPayError {
  const error = new Error(message) as StudyPayError;
  error.code = code;
  error.context = context;
  return error;
}

/**
 * Handle Solana transaction errors
 */
export function handleSolanaError(error: any): StudyPayError {
  console.error('Solana error:', error);
  
  // Map common Solana errors to our error codes
  if (error.message?.includes('insufficient funds')) {
    return createStudyPayError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance for transaction');
  }
  
  if (error.message?.includes('User rejected')) {
    return createStudyPayError(ErrorCode.USER_REJECTED, 'Transaction was rejected by user');
  }
  
  if (error.message?.includes('Invalid public key')) {
    return createStudyPayError(ErrorCode.INVALID_ADDRESS, 'Invalid wallet address');
  }
  
  // Default to transaction failed
  return createStudyPayError(ErrorCode.TRANSACTION_FAILED, 'Transaction failed. Please try again.');
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: BigNumber): { valid: boolean; error?: string } {
  if (amount.isLessThanOrEqualTo(0)) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount.isLessThan(0.001)) {
    return { valid: false, error: 'Minimum payment amount is 0.001 SOL' };
  }
  
  if (amount.isGreaterThan(10)) {
    return { valid: false, error: 'Maximum payment amount is 10 SOL' };
  }
  
  return { valid: true };
}

/**
 * Generate a unique reference for payments
 */
export function generatePaymentReference(): string {
  return `SP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
