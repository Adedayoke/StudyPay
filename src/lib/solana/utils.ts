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
    const lamportsBigNum = solToLamports(amount);
    const lamports = BigInt(lamportsBigNum.toFixed(0));

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

// =============================================================================
// Live Price Service
// =============================================================================

interface PriceData {
  solToNgn: number;
  solToUsd: number;
  lastUpdated: number;
  isStale: boolean;
}

class PriceService {
  private static instance: PriceService;
  private priceData: PriceData | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly STALE_DURATION = 15 * 60 * 1000; // 15 minutes
  private isFetching = false;

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  async getPrices(): Promise<PriceData> {
    // Return cached data if still fresh
    if (this.priceData && !this.isStale()) {
      return this.priceData;
    }

    // Don't fetch if already fetching
    if (this.isFetching) {
      // Return stale data if available, otherwise fallback
      if (this.priceData) {
        return { ...this.priceData, isStale: true };
      }
      return this.getFallbackPrices();
    }

    this.isFetching = true;

    try {
      const prices = await this.fetchPrices();
      this.priceData = {
        ...prices,
        lastUpdated: Date.now(),
        isStale: false
      };
      return this.priceData;
    } catch (error) {
      console.warn('Failed to fetch live prices:', error);
      // Return stale data if available, otherwise fallback
      if (this.priceData) {
        return { ...this.priceData, isStale: true };
      }
      return this.getFallbackPrices();
    } finally {
      this.isFetching = false;
    }
  }

  private async fetchPrices(): Promise<Omit<PriceData, 'lastUpdated' | 'isStale'>> {
    // Try CoinGecko API first
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd,ngn'
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.solana || !data.solana.usd) {
        throw new Error('Invalid CoinGecko response');
      }

      const solToUsd = data.solana.usd;
      const solToNgn = data.solana.ngn || solToUsd * 1500; // Fallback NGN rate

      return {
        solToNgn,
        solToUsd
      };
    } catch (error) {
      console.warn('CoinGecko API failed, trying alternative API:', error);

      // Try CoinMarketCap as fallback
      try {
        const response = await fetch(
          'https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/chart?id=5426&range=1D'
        );

        if (response.ok) {
          const data = await response.json();
          const keys = Object.keys(data.data.points);
          if (keys.length === 0) {
            throw new Error('No price data available');
          }
          const latestPrice = data.data.points[keys[keys.length - 1]];
          const solToUsd = latestPrice.v[0];

          return {
            solToNgn: solToUsd * 1500, // Approximate NGN rate
            solToUsd
          };
        }
      } catch (fallbackError) {
        console.warn('CoinMarketCap API also failed:', fallbackError);
      }

      throw error; // Re-throw to use fallback prices
    }
  }

  private getFallbackPrices(): PriceData {
    // Fallback to mock rates if all APIs fail
    console.warn('Using fallback mock prices');
    return {
      solToNgn: 300000, // Mock rate
      solToUsd: 150,   // Mock rate
      lastUpdated: Date.now(),
      isStale: true
    };
  }

  private isStale(): boolean {
    if (!this.priceData) return true;
    const age = Date.now() - this.priceData.lastUpdated;
    return age > this.STALE_DURATION;
  }

  isCacheValid(): boolean {
    if (!this.priceData) return false;
    const age = Date.now() - this.priceData.lastUpdated;
    return age < this.CACHE_DURATION;
  }
}

// =============================================================================
// Currency Conversion Utilities
// =============================================================================

/**
 * Convert SOL amount to Nigerian Naira (live exchange rate)
 */
export async function solToNaira(solAmount: BigNumber): Promise<BigNumber> {
  try {
    const priceService = PriceService.getInstance();
    const prices = await priceService.getPrices();
    return solAmount.multipliedBy(prices.solToNgn);
  } catch (error) {
    console.warn('Using fallback conversion rate:', error);
    // Fallback to mock rate if API fails
    return solAmount.multipliedBy(300000);
  }
}

/**
 * Convert SOL amount to Nigerian Naira (synchronous with cached rate)
 */
export function solToNairaSync(solAmount: BigNumber): BigNumber {
  const priceService = PriceService.getInstance();

  if (priceService.isCacheValid() && priceService['priceData']) {
    return solAmount.multipliedBy(priceService['priceData'].solToNgn);
  }

  // Fallback to mock rate if no cached data
  return solAmount.multipliedBy(300000);
}

/**
 * Convert Naira to SOL amount (live exchange rate)
 */
export async function nairaToSol(nairaAmount: BigNumber): Promise<BigNumber> {
  try {
    const priceService = PriceService.getInstance();
    const prices = await priceService.getPrices();
    return nairaAmount.dividedBy(prices.solToNgn);
  } catch (error) {
    console.warn('Using fallback conversion rate:', error);
    // Fallback to mock rate if API fails
    return nairaAmount.dividedBy(300000);
  }
}

/**
 * Convert Naira to SOL amount (synchronous with cached rate)
 */
export function nairaToSolSync(nairaAmount: BigNumber): BigNumber {
  const priceService = PriceService.getInstance();

  let solAmount: BigNumber;
  if (priceService.isCacheValid() && priceService['priceData']) {
    solAmount = nairaAmount.dividedBy(priceService['priceData'].solToNgn);
  } else {
    // Fallback to mock rate if no cached data
    solAmount = nairaAmount.dividedBy(300000);
  }

  // Ensure minimum SOL amount and round to 9 decimal places
  if (solAmount.isLessThan(0.000001)) {
    throw new Error('Amount too small to convert to SOL');
  }

  return solAmount.decimalPlaces(9, BigNumber.ROUND_DOWN);
}

/**
 * Get current SOL price information
 */
export async function getSolPriceInfo(): Promise<{
  solToNgn: number;
  solToUsd: number;
  lastUpdated: number;
  isStale: boolean;
  source: string;
}> {
  const priceService = PriceService.getInstance();
  const prices = await priceService.getPrices();

  return {
    ...prices,
    source: prices.isStale ? 'cached/fallback' : 'live'
  };
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
