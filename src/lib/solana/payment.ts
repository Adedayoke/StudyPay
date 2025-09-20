/**
 * Real Solana Pay Integration - Competition Ready
 * Implements official Solana Pay protocol with campus-specific features
 */

import { 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  Connection, 
  Transaction, 
  SystemProgram, 
  TransactionInstruction 
} from '@solana/web3.js';
import { 
  encodeURL, 
  createQR, 
  parseURL,
  validateTransfer
} from '@solana/pay';
import BigNumber from 'bignumber.js';
import QRCode from 'qrcode';
import { solToNairaSync } from './utils';

// Backup QR generation using reliable qrcode library
function generateReliableQR(text: string, size: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    }, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

/**
 * Official Solana Pay request interface
 */
export interface SolanaPayRequest {
  recipient: PublicKey;
  amount: BigNumber;
  label: string;
  message?: string;
  memo?: string;
  reference?: PublicKey;
}

/**
 * Campus payment categories for StudyPay
 */
export type CampusPaymentType = 'food' | 'transport' | 'transfer' | 'tuition' | 'books' | 'events';

/**
 * Create official Solana Pay URL following the specification
 */
export function createSolanaPayURL(request: SolanaPayRequest): URL {
  const { recipient, amount, label, message, memo, reference } = request;
  
  return encodeURL({
    recipient,
    amount: amount,
    label,
    message,
    memo,
    reference,
  });
}

/**
 * Create transaction request URL for Solana Pay
 * This is used for dynamic payment processing
 */
export function createSolanaPayTransactionRequest(
  baseUrl: string,
  paymentType: CampusPaymentType,
  params: Record<string, string>
): URL {
  const url = new URL(`${baseUrl}/api/pay/${paymentType}`);
  
  // Add all parameters to the URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url;
}

/**
 * Generate official Solana Pay QR code
 */
export async function generateSolanaPayQR(
  paymentUrl: URL | string,
  size: number = 400
): Promise<string> {
  try {
    // Ensure we have a proper URL string
    const urlString = paymentUrl.toString();
    console.log('Generating QR for URL:', urlString);
    
    // Try the official @solana/pay createQR function first
    try {
      const qr = createQR(urlString, size, 'white', '#9945FF');
      const svgString = qr.toString();
      console.log('Generated SVG length:', svgString.length);
      
      if (svgString.length > 100) {
        // Create proper base64 encoded data URL
        const base64SVG = btoa(unescape(encodeURIComponent(svgString)));
        const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;
        return dataUrl;
      }
    } catch (officialError) {
      console.log('Official createQR failed, using fallback:', officialError);
    }
    
    // Fallback to reliable QR generation
    console.log('Using reliable QR fallback');
    return await generateReliableQR(urlString, size);
    
  } catch (error) {
    console.error('QR generation error:', error);
    console.error('Error details:', error);
    
    // Final fallback: create a QR with reliable library
    return await generateReliableQR(paymentUrl.toString(), size);
  }
}

/**
 * Parse and validate Solana Pay URL
 */
export function parseSolanaPayURL(url: string): SolanaPayRequest | null {
  try {
    // Parse using the manual method for compatibility
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'solana:') return null;
    
    const recipient = new PublicKey(parsedUrl.pathname);
    const amount = new BigNumber(parsedUrl.searchParams.get('amount') || '0');
    const label = parsedUrl.searchParams.get('label') || 'StudyPay Payment';
    const message = parsedUrl.searchParams.get('message') || undefined;
    const memo = parsedUrl.searchParams.get('memo') || undefined;
    const reference = parsedUrl.searchParams.get('reference') 
      ? new PublicKey(parsedUrl.searchParams.get('reference')!)
      : undefined;
    
    return {
      recipient,
      amount,
      label,
      message,
      memo,
      reference,
    };
  } catch (error) {
    console.error('Error parsing Solana Pay URL:', error);
    return null;
  }
}

/**
 * Validate Solana Pay transaction
 */
export async function validateSolanaPayTransaction(
  connection: Connection,
  signature: string,
  request: SolanaPayRequest
): Promise<boolean> {
  try {
    if (!request.reference) {
      console.warn('No reference provided for validation');
      return false;
    }

    const validation = await validateTransfer(
      connection,
      signature,
      {
        recipient: request.recipient,
        amount: request.amount,
        reference: request.reference,
      }
    );

    return validation !== null;
  } catch (error) {
    console.error('Transaction validation error:', error);
    return false;
  }
}

/**
 * Campus merchant registry for StudyPay
 */
export const CAMPUS_MERCHANTS = {
  food: {
    'mama-adunni': {
      name: "Mama Adunni's Kitchen",
      wallet: '5DyKMBSxHZ1FXRbTG4s9GiRGHgWpTorWMun56LeMCJHd',
      type: 'restaurant',
    },
    'campus-cafe': {
      name: 'Campus Central Cafe',
      wallet: 'GjwEiNqYRqnVQPqfgzJhq8Z8xKXeqNqKjxqrG5xKXeqN',
      type: 'cafe',
    },
  },
  transport: {
    'campus-shuttle': {
      name: 'Campus Shuttle Service',
      wallet: 'TransportWallet1234567890123456789012345678',
      type: 'transport',
    },
  },
  services: {
    'university-bursar': {
      name: 'University Bursar Office',
      wallet: 'UniversityWallet123456789012345678901234567',
      type: 'official',
    },
  },
} as const;

/**
 * Generate real QR code for Solana Pay (legacy function for compatibility)
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
export function solToLamports(solAmount: BigNumber): bigint {
  if (solAmount.isNaN() || solAmount.isLessThanOrEqualTo(0)) {
    throw new Error('Invalid SOL amount for conversion');
  }

  const lamports = solAmount.multipliedBy(LAMPORTS_PER_SOL);

  if (lamports.isNaN() || lamports.isLessThan(1)) {
    throw new Error('SOL amount too small to convert to lamports');
  }

  return BigInt(lamports.toFixed(0));
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
 * Estimate transaction fee for Solana payment
 */
export function estimateTransactionFee(): BigNumber {
  // Solana transactions typically cost ~0.000005 SOL
  return new BigNumber(0.000005);
}

/**
 * Format payment amount for display (shows SOL amounts)
 */
export function formatPaymentAmount(amount: BigNumber): string {
  return `${amount.toFixed(6)} SOL`;
}

/**
 * Format Naira amount for display
 */
export function formatNairaAmount(amount: BigNumber): string {
  return `₦${solToNairaSync(amount).toFixed(0)}`;
}

/**
 * Check if amount is valid for payment (validates SOL amounts)
 */
export function isValidPaymentAmount(amount: BigNumber): boolean {
  return amount.isGreaterThan(0) && amount.isLessThanOrEqualTo(1000); // Max 1000 SOL
}

/**
 * Check if Naira amount is valid for payment
 */
export function isValidNairaAmount(amount: BigNumber): boolean {
  return amount.isGreaterThan(0) && amount.isLessThanOrEqualTo(50000000); // Max 50M Naira
}

/**
 * Create mock vendor address for demo (replace with real addresses)
 */
export function getMockVendorAddress(): string {
  // Using the specified vendor address for testing
  // This represents the default vendor for StudyPay
  return '5DyKMBSxHZ1FXRbTG4s9GiRGHgWpTorWMun56LeMCJHd';
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
    throw new Error('Wallet not connected - no public key available');
  }

  if (!senderWallet.connected) {
    throw new Error('Wallet not connected');
  }

  console.log('Starting SOL transfer:', {
    from: senderWallet.publicKey.toString(),
    to: paymentRequest.recipient.toString(),
    amount: paymentRequest.amount.toString(),
    amountInLamports: solToLamports(paymentRequest.amount).toString(),
    connected: senderWallet.connected,
    walletName: senderWallet.name || 'Unknown'
  });

  // Check if we're on mobile - improved detection for better mobile wallet support
  const isMobile = typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     (window.innerWidth <= 768 && 'ontouchstart' in window));

  console.log('Device detection:', {
    isMobile,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    hasSendTransaction: !!senderWallet.sendTransaction,
    hasSignTransaction: !!senderWallet.signTransaction
  });

  try {
    // Create transfer transaction with mobile optimizations
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderWallet.publicKey,
        toPubkey: paymentRequest.recipient,
        lamports: solToLamports(paymentRequest.amount),
      })
    );

    // Add memo if provided (skip on mobile if it makes transaction too large)
    if (paymentRequest.memo && !isMobile) {
      transaction.add(
        new TransactionInstruction({
          keys: [{ pubkey: senderWallet.publicKey, isSigner: true, isWritable: false }],
          data: Buffer.from(paymentRequest.memo, 'utf-8'),
          programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        })
      );
    } else if (paymentRequest.memo && isMobile) {
      console.log('Skipping memo on mobile for better compatibility');
    }

    // Get recent blockhash with retry logic and mobile optimization
    console.log('Getting recent blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
      isMobile ? 'finalized' : 'confirmed' // Use finalized for mobile for better reliability
    );
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = senderWallet.publicKey;

    console.log('Transaction created:', {
      feePayer: transaction.feePayer?.toString() || 'undefined',
      recentBlockhash: transaction.recentBlockhash,
      lastValidBlockHeight: transaction.lastValidBlockHeight,
      instructions: transaction.instructions.length,
      isMobile
    });

    let signature: string;

    // Use different signing methods for mobile vs desktop
    if (isMobile) {
      console.log('Mobile device detected - using mobile-optimized transaction flow');

      // Try sendTransaction first (works with mobile wallet apps)
      if (senderWallet.sendTransaction) {
        console.log('Attempting mobile sendTransaction...');
        try {
          signature = await senderWallet.sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
          });
          console.log('Mobile sendTransaction successful:', signature);
        } catch (mobileError) {
          console.error('Mobile sendTransaction failed:', mobileError);
          console.log('Falling back to signTransaction flow...');

          // Fallback: Try signTransaction + sendRawTransaction
          if (senderWallet.signTransaction) {
            try {
              const signed = await senderWallet.signTransaction(transaction);
              signature = await connection.sendRawTransaction(signed.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
              });
              console.log('Fallback transaction successful:', signature);
            } catch (fallbackError) {
              console.error('Fallback method also failed:', fallbackError);
              throw new Error(`Mobile transaction failed: ${mobileError instanceof Error ? mobileError.message : 'Unknown error'}`);
            }
          } else {
            throw new Error('Mobile wallet does not support transaction signing');
          }
        }
      } else if (senderWallet.signTransaction) {
        // Some mobile wallets only support signTransaction
        console.log('Mobile wallet only supports signTransaction...');
        const signed = await senderWallet.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        console.log('Mobile signTransaction successful:', signature);
      } else {
        throw new Error('Mobile wallet does not support any transaction methods');
      }
    } else {
      // Desktop: Use traditional sign + send flow
      console.log('Desktop detected: Using standard signTransaction flow');
      if (!senderWallet.signTransaction) {
        throw new Error('Desktop wallet does not support transaction signing');
      }

      const signed = await senderWallet.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      console.log('Desktop transaction successful:', signature);
    }

    // Confirm transaction with mobile-optimized settings
    console.log('Confirming transaction:', signature);

    // Use different confirmation strategies for mobile vs desktop
    let confirmation;
    if (isMobile) {
      // Mobile: Use more lenient confirmation settings
      console.log('Using mobile-optimized confirmation...');
      confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!
      }, 'confirmed');

      // If initial confirmation fails, try a longer wait
      if (confirmation.value.err) {
        console.log('Initial confirmation failed, waiting longer...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

        confirmation = await connection.confirmTransaction({
          signature,
          blockhash: transaction.recentBlockhash!,
          lastValidBlockHeight: transaction.lastValidBlockHeight!
        }, 'confirmed');
      }
    } else {
      // Desktop: Use standard confirmation
      confirmation = await connection.confirmTransaction({
        signature,
        blockhash: transaction.recentBlockhash!,
        lastValidBlockHeight: transaction.lastValidBlockHeight!
      }, 'confirmed');
    }

    if (confirmation.value.err) {
      console.error('Transaction confirmation failed:', confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log('Transaction confirmed successfully');
    return signature;
  } catch (error) {
    console.error('SOL transfer failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      isMobile,
      hasSendTransaction: !!senderWallet.sendTransaction,
      hasSignTransaction: !!senderWallet.signTransaction,
      publicKey: senderWallet.publicKey?.toString(),
      walletName: senderWallet.name || 'Unknown'
    });

    // Provide mobile-specific error messages
    if (isMobile) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled in your mobile wallet app');
        } else if (error.message.includes('network')) {
          throw new Error('Network connection issue. Please check your mobile data/WiFi and try again');
        } else if (error.message.includes('timeout')) {
          throw new Error('Transaction timed out. Mobile networks can be slower - please try again');
        } else {
          throw new Error(`Mobile payment failed: ${error.message}`);
        }
      } else {
        throw new Error('Mobile payment failed. Please ensure your wallet app is up to date and try again');
      }
    } else {
      throw new Error(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
