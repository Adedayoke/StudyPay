/**
 * StudyPay Core Types
 * Clean, well-documented type definitions for the entire application
 */

import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// =============================================================================
// User Types
// =============================================================================

export interface Student {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  university: string;
  parentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Parent {
  id: string;
  walletAddress: string;
  email: string;
  name: string;
  country: string;
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  walletAddress: string;
  businessName: string;
  category: VendorCategory;
  university: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum VendorCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  PRINTING = 'printing',
  STATIONERY = 'stationery',
  LAUNDRY = 'laundry',
  OTHER = 'other'
}

// =============================================================================
// Payment Types
// =============================================================================

export interface PaymentRequest {
  id: string;
  amount: BigNumber;
  recipient: string; // Vendor wallet address
  label: string;
  message?: string;
  reference: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Transaction {
  id: string;
  signature: string;
  amount: BigNumber;
  fromAddress: string;
  toAddress: string;
  type: TransactionType;
  status: TransactionStatus;
  reference?: string;
  description: string;
  category?: VendorCategory;
  createdAt: Date;
  confirmedAt?: Date;
}

export enum TransactionType {
  RECEIVE = 'receive', // Parent to Student
  PAYMENT = 'payment', // Student to Vendor
  REFUND = 'refund'    // Vendor to Student
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// =============================================================================
// Solana Pay Types
// =============================================================================

export interface SolanaPayQR {
  url: string;
  reference: PublicKey;
  amount?: BigNumber;
  label?: string;
  message?: string;
}

export interface WalletInfo {
  address: string;
  balance: BigNumber;
  isConnected: boolean;
  publicKey?: PublicKey;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// Currency Types
// =============================================================================

export interface CurrencyConversion {
  from: Currency;
  to: Currency;
  rate: number;
  amount: BigNumber;
  convertedAmount: BigNumber;
  lastUpdated: Date;
}

export enum Currency {
  SOL = 'SOL',
  USDC = 'USDC',
  NGN = 'NGN',
  USD = 'USD',
  GBP = 'GBP'
}

// =============================================================================
// Dashboard Data Types
// =============================================================================

export interface StudentDashboard {
  balance: BigNumber;
  balanceInNaira: BigNumber;
  recentTransactions: Transaction[];
  lowBalanceAlert: boolean;
  pendingReceives: Transaction[];
}

export interface ParentDashboard {
  connectedStudents: Student[];
  totalSent: BigNumber;
  recentTransfers: Transaction[];
  monthlySpendingSummary: SpendingSummary[];
}

export interface SpendingSummary {
  category: VendorCategory;
  amount: BigNumber;
  percentage: number;
  transactionCount: number;
}

// =============================================================================
// Error Types
// =============================================================================

export interface StudyPayError extends Error {
  code: ErrorCode;
  context?: Record<string, any>;
}

export enum ErrorCode {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  USER_REJECTED = 'USER_REJECTED'
}
