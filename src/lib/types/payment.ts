import BigNumber from 'bignumber.js';

export interface PaymentRequest {
  amount: BigNumber;
  recipientAddress: string;
  purpose?: string;
  memo?: string;
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  confirmations?: number;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  confirmations: number;
  signature?: string;
  blockHeight?: number;
  timestamp?: Date;
}

export interface Transaction {
  id: string;
  signature?: string;
  description: string;
  amount: BigNumber;
  category: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  type: 'incoming' | 'outgoing';
  
  // Legacy fields for backward compatibility
  fromAddress?: string;
  toAddress?: string;
  purpose?: string;
  memo?: string;
  
  // Enhanced blockchain fields
  otherParty?: string; // Address of the other party
  otherPartyName?: string; // Human-readable name
  location?: string; // Physical location if vendor
  fees?: BigNumber;
  confirmations?: number;
  blockHeight?: number;
  isBlockchainTransaction?: boolean; // True for real blockchain txs
}

export interface WalletBalance {
  sol: BigNumber;
  usd?: BigNumber;
  lastUpdated: Date;
}

export interface PaymentQRData {
  recipient: string;
  amount?: BigNumber;
  reference?: string;
  label?: string;
  message?: string;
  memo?: string;
}

export interface StudentPayment {
  id: string;
  studentAddress: string;
  amount: BigNumber;
  purpose: string;
  vendor?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  signature?: string;
}

export interface ParentTransfer {
  id: string;
  parentAddress: string;
  studentAddress: string;
  amount: BigNumber;
  message?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  signature?: string;
}

export interface VendorSale {
  id: string;
  vendorAddress: string;
  customerAddress: string;
  amount: BigNumber;
  items: string[];
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  signature?: string;
}
