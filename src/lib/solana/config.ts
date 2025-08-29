/**
 * Solana Configuration and Constants
 * Central configuration for all Solana-related settings
 */

import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// =============================================================================
// Network Configuration
// =============================================================================

export const SOLANA_NETWORK = 'devnet'; // Use devnet for hackathon
export const RPC_ENDPOINT = clusterApiUrl(SOLANA_NETWORK);

// Create a connection instance
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// =============================================================================
// Token Configuration
// =============================================================================

// Devnet USDC token mint address
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// SOL is the native token, no mint address needed
export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;

// =============================================================================
// Payment Configuration
// =============================================================================

export const PAYMENT_CONFIG = {
  // Default payment timeout (15 minutes)
  TIMEOUT_SECONDS: 15 * 60,
  
  // Minimum and maximum payment amounts (in SOL)
  MIN_AMOUNT: 0.001,
  MAX_AMOUNT: 10,
  
  // Transaction confirmation requirements
  CONFIRMATION_COMMITMENT: 'confirmed' as const,
  
  // Polling intervals
  TRANSACTION_POLL_INTERVAL: 2000, // 2 seconds
  BALANCE_UPDATE_INTERVAL: 5000,   // 5 seconds
};

// =============================================================================
// Currency Configuration
// =============================================================================

export const CURRENCY_CONFIG = {
  // Exchange rate update interval (5 minutes)
  RATE_UPDATE_INTERVAL: 5 * 60 * 1000,
  
  // Default currency for Nigerian students
  DEFAULT_DISPLAY_CURRENCY: 'NGN',
  
  // Supported currencies
  SUPPORTED_CURRENCIES: ['SOL', 'USDC', 'NGN', 'USD', 'GBP'] as const,
};

// =============================================================================
// Wallet Configuration
// =============================================================================

export const WALLET_CONFIG = {
  // Auto-connect on app load
  AUTO_CONNECT: true,
  
  // Wallet adapter names
  PHANTOM: 'Phantom',
  SOLFLARE: 'Solflare',
  
  // Supported wallets for the hackathon demo
  SUPPORTED_WALLETS: ['Phantom'] as const,
};

// =============================================================================
// API Configuration
// =============================================================================

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000, // 10 seconds
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  
  // Endpoints
  ENDPOINTS: {
    TRANSACTIONS: '/transactions',
    BALANCE: '/balance',
    PAYMENT_REQUEST: '/payment-request',
    EXCHANGE_RATES: '/exchange-rates',
  } as const,
};

// =============================================================================
// Development Configuration
// =============================================================================

export const DEV_CONFIG = {
  // Enable debug logging
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Mock data for demo
  USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK === 'true',
  
  // Test wallets for demo (devnet only)
  TEST_WALLETS: {
    STUDENT: 'DemoStudentWallet123...',
    PARENT: 'DemoParentWallet456...',
    VENDOR: 'DemoVendorWallet789...',
  },
};

// =============================================================================
// Error Messages
// =============================================================================

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_ADDRESS: 'Invalid wallet address provided',
  PAYMENT_EXPIRED: 'Payment request has expired',
  USER_REJECTED: 'Transaction was rejected by user',
} as const;

// =============================================================================
// Success Messages
// =============================================================================

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SENT: 'Transaction sent successfully',
  PAYMENT_CONFIRMED: 'Payment confirmed on blockchain',
  BALANCE_UPDATED: 'Balance updated',
} as const;
