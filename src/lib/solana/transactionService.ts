/**
 * Real Solana Transaction Service
 * Fetches and processes actual blockchain transactions for StudyPay
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { Transaction } from '@/lib/types/payment';
import BigNumber from 'bignumber.js';

// Basic vendor mapping for transaction enrichment (Phase 1)
const VENDOR_DIRECTORY = {
  // Known campus vendor addresses (can be expanded)
  'CampusCafeVendor123...ABC': {
    name: 'Campus Café & Grill',
    category: 'food',
    location: 'Student Union Building'
  },
  'UniBooksVendor456...DEF': {
    name: 'UniBooks & Stationery', 
    category: 'books',
    location: 'Faculty of Arts'
  },
  'TechHubVendor789...GHI': {
    name: 'TechHub Electronics',
    category: 'electronics', 
    location: 'Engineering Complex'
  },
  'LaundryVendor012...JKL': {
    name: 'Quick Laundry Services',
    category: 'services',
    location: 'Hostel Complex A'
  }
} as const;

export interface SolanaTransactionService {
  fetchTransactions(publicKey: PublicKey, limit?: number): Promise<Transaction[]>;
  parseTransaction(tx: ParsedTransactionWithMeta, userPublicKey: PublicKey): Transaction | null;
  enrichTransaction(tx: Transaction): Transaction;
}

export class RealSolanaTransactionService implements SolanaTransactionService {
  private connection: Connection;

  constructor(rpcEndpoint?: string) {
    // Use devnet for development, can be switched to mainnet later
    this.connection = new Connection(
      rpcEndpoint || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }

  /**
   * Fetch real transactions from Solana blockchain for a given wallet
   */
  async fetchTransactions(publicKey: PublicKey, limit: number = 50): Promise<Transaction[]> {
    try {
      console.log(`Fetching transactions for wallet: ${publicKey.toBase58()}`);
      
      // Get transaction signatures for the wallet
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      console.log(`Found ${signatures.length} transaction signatures`);

      if (signatures.length === 0) {
        console.log('No transactions found for this wallet');
        return [];
      }

      // Fetch detailed transaction data
      const transactions: Transaction[] = [];
      
      for (const sigInfo of signatures) {
        try {
          const tx = await this.connection.getParsedTransaction(
            sigInfo.signature,
            { maxSupportedTransactionVersion: 0 }
          );

          if (tx) {
            const parsedTx = this.parseTransaction(tx, publicKey);
            if (parsedTx) {
              const enrichedTx = this.enrichTransaction(parsedTx);
              transactions.push(enrichedTx);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch transaction ${sigInfo.signature}:`, error);
          // Continue with other transactions
        }
      }

      console.log(`Successfully parsed ${transactions.length} transactions`);
      return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error('Error fetching transactions from Solana:', error);
      throw new Error('Failed to fetch blockchain transactions');
    }
  }

  /**
   * Parse a Solana transaction into our Transaction format
   */
  parseTransaction(tx: ParsedTransactionWithMeta, userPublicKey: PublicKey): Transaction | null {
    try {
      if (!tx.meta || tx.meta.err) {
        // Skip failed transactions
        return null;
      }

      const blockTime = tx.blockTime;
      const signatures = tx.transaction.signatures;
      const signature = signatures && signatures.length > 0 ? signatures[0] : null;
      const userAddress = userPublicKey.toBase58();

      // Get account balances before and after
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;
      const accountKeys = tx.transaction.message.accountKeys;

      // Find user's account index
      let userAccountIndex = -1;
      for (let i = 0; i < accountKeys.length; i++) {
        if (accountKeys[i].pubkey.toBase58() === userAddress) {
          userAccountIndex = i;
          break;
        }
      }

      if (userAccountIndex === -1) {
        // User not involved in this transaction
        return null;
      }

      // Calculate amount change for user (in lamports)
      const preBalance = preBalances[userAccountIndex];
      const postBalance = postBalances[userAccountIndex];
      const balanceChange = postBalance - preBalance;

      // Skip if no balance change
      if (balanceChange === 0) {
        return null;
      }

      // Convert lamports to SOL
      const LAMPORTS_PER_SOL = 1000000000;
      const amountSOL = Math.abs(balanceChange) / LAMPORTS_PER_SOL;
      const isIncoming = balanceChange > 0;

      // Try to identify the other party (recipient/sender)
      let otherParty = 'Unknown';
      let otherAddress = '';
      
      // Look for the account with opposite balance change
      for (let i = 0; i < accountKeys.length; i++) {
        if (i !== userAccountIndex) {
          const otherPreBalance = preBalances[i];
          const otherPostBalance = postBalances[i];
          const otherBalanceChange = otherPostBalance - otherPreBalance;
          
          // If this account had opposite balance change, it's likely the other party
          if ((isIncoming && otherBalanceChange < 0) || (!isIncoming && otherBalanceChange > 0)) {
            otherAddress = accountKeys[i].pubkey.toBase58();
            otherParty = this.getVendorName(otherAddress) || `${otherAddress.slice(0, 8)}...`;
            break;
          }
        }
      }

      // Try to extract memo/description from transaction
      let description = '';
      const instructions = tx.transaction.message.instructions;
      
      for (const instruction of instructions) {
        // Look for memo instruction
        if ('data' in instruction) {
          try {
            // Decode memo if present
            const decoded = Buffer.from(instruction.data, 'base64').toString('utf-8');
            if (decoded && decoded.length > 0 && decoded.length < 100) {
              description = decoded;
              break;
            }
          } catch (e) {
            // Ignore decode errors
          }
        }
      }

      // Fallback description
      if (!description) {
        description = isIncoming 
          ? `Received from ${otherParty}`
          : `Payment to ${otherParty}`;
      }

      // Determine category based on vendor or amount
      const category = this.categorizeTransaction(otherAddress, amountSOL, description);

      return {
        id: signature || `tx_${Date.now()}`,
        signature: signature || undefined,
        description,
        amount: new BigNumber(amountSOL),
        category,
        timestamp: blockTime ? new Date(blockTime * 1000) : new Date(),
        status: 'confirmed' as const,
        type: isIncoming ? 'incoming' : 'outgoing',
        otherParty: otherAddress,
        otherPartyName: otherParty,
        fees: tx.meta.fee ? new BigNumber(tx.meta.fee / LAMPORTS_PER_SOL) : undefined,
        isBlockchainTransaction: true
      };

    } catch (error) {
      console.error('Error parsing transaction:', error);
      return null;
    }
  }

  /**
   * Enrich transaction with additional metadata
   */
  enrichTransaction(tx: Transaction): Transaction {
    // Add vendor information if we recognize the address
    if (tx.otherParty && VENDOR_DIRECTORY[tx.otherParty as keyof typeof VENDOR_DIRECTORY]) {
      const vendor = VENDOR_DIRECTORY[tx.otherParty as keyof typeof VENDOR_DIRECTORY];
      return {
        ...tx,
        otherPartyName: vendor.name,
        category: vendor.category as any,
        location: vendor.location
      };
    }

    return tx;
  }

  /**
   * Get vendor name from address
   */
  private getVendorName(address: string): string | null {
    const vendor = VENDOR_DIRECTORY[address as keyof typeof VENDOR_DIRECTORY];
    return vendor?.name || null;
  }

  /**
   * Categorize transaction based on context
   */
  private categorizeTransaction(otherAddress: string, amount: number, description: string): string {
    // Check if it's a known vendor
    const vendor = VENDOR_DIRECTORY[otherAddress as keyof typeof VENDOR_DIRECTORY];
    if (vendor) {
      return vendor.category;
    }

    // Categorize by amount (heuristic)
    if (amount < 0.01) return 'micro'; // Very small amounts
    if (amount < 0.05) return 'snacks'; // Likely food/drinks
    if (amount < 0.2) return 'transport'; // Transport or services
    if (amount < 1) return 'services'; // Larger services
    return 'other'; // Large amounts

    // Could also categorize by description keywords
    // const desc = description.toLowerCase();
    // if (desc.includes('food') || desc.includes('rice') || desc.includes('cafe')) return 'food';
    // if (desc.includes('book') || desc.includes('text')) return 'books';
    // etc.
  }

  /**
   * Get connection for external use
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Singleton instance for app-wide use
let transactionService: RealSolanaTransactionService | null = null;

export function getSolanaTransactionService(): RealSolanaTransactionService {
  if (!transactionService) {
    transactionService = new RealSolanaTransactionService();
  }
  return transactionService;
}
