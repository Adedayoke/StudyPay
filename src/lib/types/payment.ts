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
  fromAddress: string;
  toAddress: string;
  amount: BigNumber;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  timestamp: Date;
  purpose?: string;
  memo?: string;
  fees?: BigNumber;
  confirmations?: number;
  blockHeight?: number;
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
