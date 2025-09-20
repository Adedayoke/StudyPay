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
  validateTransfer,
  createTransfer
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
 * Create Solana Pay Transfer Request URL for Direct Payments
 * This creates a direct payment URL that can be opened immediately in wallets
 * Perfect for parent-to-student transfers and student direct payments
 */
export function createSolanaPayTransfer(
  recipient: PublicKey,
  amount: BigNumber,
  label: string,
  options?: {
    message?: string;
    memo?: string;
    reference?: PublicKey;
  }
): URL {
  return encodeURL({
    recipient,
    amount,
    label,
    ...(options?.message && { message: options.message }),
    ...(options?.memo && { memo: options.memo }),
    ...(options?.reference && { reference: options.reference }),
  });
}

/**
 * Create Direct Payment URL String
 * Convenience function that returns the payment URL as a string
 */
export function createDirectPaymentURL(
  recipient: PublicKey,
  amount: BigNumber,
  label: string,
  options?: {
    message?: string;
    memo?: string;
    reference?: PublicKey;
  }
): string {
  const paymentURL = createSolanaPayTransfer(recipient, amount, label, options);
  return paymentURL.toString();
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
 * Validate transaction before submission to prevent signature errors
 */
function validateTransactionBeforeSubmission(
  transaction: Transaction,
  senderPublicKey: PublicKey,
  isMobile: boolean
): void {
  console.log('Validating transaction before submission...');

  // Check basic transaction structure
  if (!transaction) {
    throw new Error('Transaction is null or undefined');
  }

  if (!transaction.feePayer) {
    throw new Error('Transaction missing feePayer');
  }

  if (!transaction.recentBlockhash) {
    throw new Error('Transaction missing recentBlockhash');
  }

  if (!transaction.instructions || transaction.instructions.length === 0) {
    throw new Error('Transaction has no instructions');
  }

  // Verify feePayer matches sender
  if (!transaction.feePayer.equals(senderPublicKey)) {
    throw new Error('Transaction feePayer does not match sender public key');
  }

  // Check if transaction has signatures (for signed transactions)
  if (transaction.signatures && transaction.signatures.length > 0) {
    console.log(`Transaction has ${transaction.signatures.length} signatures`);

    // Find signature for our public key
    const ourSignature = transaction.signatures.find((sig: any) =>
      sig.publicKey.equals(senderPublicKey)
    );

    if (!ourSignature) {
      if (isMobile) {
        console.warn('No signature found for sender public key on mobile - this may be normal for some mobile adapters');
      } else {
        throw new Error('No signature found for sender public key');
      }
    }

    if (ourSignature && !ourSignature.signature) {
      if (isMobile) {
        console.warn('Signature for sender public key is null/empty on mobile - this may be normal for some mobile adapters');
      } else {
        throw new Error('Signature for sender public key is null/empty');
      }
    }

    if (ourSignature && ourSignature.signature) {
      console.log('Transaction validation passed - signature present');
    }
  } else if (!isMobile) {
    // For desktop, we expect signatures to be present before submission
    console.warn('Transaction has no signatures - this may cause issues');
  } else {
    console.log('Transaction has no signatures on mobile - this is normal for some mobile adapters');
  }

  console.log('Transaction validation completed successfully');
}

/**
 * Comprehensive mobile wallet connectivity test
 */
async function testMobileWalletConnectivity(wallet: any, connection: Connection): Promise<{
  connected: boolean;
  canSign: boolean;
  canSend: boolean;
  networkStatus: string;
  walletType: string;
  recommendations: string[];
}> {
  const diagnostics = {
    connected: false,
    canSign: false,
    canSend: false,
    networkStatus: 'unknown',
    walletType: 'unknown',
    recommendations: [] as string[]
  };

  try {
    // Test basic connectivity
    diagnostics.connected = wallet.connected && !!wallet.publicKey;

    // Test network connectivity
    try {
      const version = await connection.getVersion();
      diagnostics.networkStatus = version ? 'connected' : 'disconnected';
    } catch (networkError) {
      diagnostics.networkStatus = 'error';
      diagnostics.recommendations.push('Check your internet connection');
    }

    // Test wallet capabilities
    diagnostics.canSign = typeof wallet.signTransaction === 'function';
    diagnostics.canSend = typeof wallet.sendTransaction === 'function';

    // Enhanced Phantom Mobile detection
    if (wallet.name) {
      const walletName = wallet.name.toLowerCase();
      diagnostics.walletType = wallet.name; // Keep original name

      // Specific Phantom Mobile detection
      if (walletName.includes('phantom') ||
          walletName.includes('phantom mobile') ||
          walletName === 'phantom' ||
          walletName.includes('app.phantom') ||
          (walletName.includes('mobile') && walletName.includes('phantom'))) {
        diagnostics.walletType = 'Phantom Mobile';
        diagnostics.recommendations.push('Phantom Mobile detected - this is the recommended wallet!');
        diagnostics.recommendations.push('Ensure you\'re signed into Phantom with the correct account');
        diagnostics.recommendations.push('Make sure Phantom app is updated to the latest version');
      } else if (walletName.includes('solflare') || walletName.includes('solflare')) {
      } else if (walletName.includes('solflare') || walletName.includes('solflare')) {
        diagnostics.walletType = 'Solflare Mobile';
        diagnostics.recommendations.push('Solflare detected - try switching to Phantom for better mobile compatibility');
      } else if (walletName.includes('trust')) {
        diagnostics.walletType = 'Trust Wallet';
        diagnostics.recommendations.push('Trust Wallet detected - ensure Solana network is enabled');
      } else if (walletName.includes('metamask') || walletName.includes('meta')) {
        diagnostics.walletType = 'MetaMask Mobile';
        diagnostics.recommendations.push('MetaMask detected - ensure you have the Solana snap installed');
      } else if (walletName.includes('coinbase') || walletName.includes('cb')) {
        diagnostics.walletType = 'Coinbase Wallet';
        diagnostics.recommendations.push('Coinbase Wallet detected - ensure Solana is enabled in settings');
      } else if (walletName.includes('walletconnect') || walletName.includes('wc')) {
        diagnostics.walletType = 'WalletConnect';
        diagnostics.recommendations.push('WalletConnect detected - ensure the connected wallet supports Solana');
      } else if (walletName.includes('mobile') || walletName.includes('android') || walletName.includes('ios')) {
        diagnostics.walletType = 'Generic Mobile Wallet';
        diagnostics.recommendations.push('Generic mobile wallet detected - try using Phantom or Solflare instead');
      } else {
        diagnostics.walletType = `Unknown (${wallet.name})`;
        diagnostics.recommendations.push('Unknown wallet type - try using Phantom Mobile for best compatibility');
      }
    } else {
      // No wallet name available - try to infer from user agent
      diagnostics.walletType = 'Unknown (no name)';
      diagnostics.recommendations.push('Wallet name not detected - try refreshing the page');
      diagnostics.recommendations.push('Ensure you\'re using a Solana-compatible mobile wallet');
    }

    // Additional wallet identification attempts
    if (diagnostics.walletType.includes('Unknown')) {
      // Try to identify wallet from user agent or other properties
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('phantom') || ua.includes('app.phantom')) {
          diagnostics.walletType = 'Phantom Mobile (detected from UA)';
          diagnostics.recommendations.unshift('Phantom Mobile detected from browser - excellent choice!');
          diagnostics.recommendations.push('Phantom is the most compatible mobile wallet for Solana');
        } else if (ua.includes('solflare')) {
          diagnostics.walletType = 'Solflare Mobile (detected from UA)';
          diagnostics.recommendations.unshift('Solflare detected - try switching to Phantom for better compatibility');
        }
      }

      // Check wallet adapter properties
      if (wallet.adapter) {
        const adapterName = wallet.adapter.name?.toLowerCase() || '';
        if (adapterName.includes('phantom')) {
          diagnostics.walletType = 'Phantom Mobile (Adapter)';
          diagnostics.recommendations.unshift('Phantom adapter detected - should work perfectly!');
        } else {
          diagnostics.walletType = `Adapter: ${wallet.adapter.name || 'Unknown'}`;
        }
      }

      // Check for mobile-specific properties
      if (wallet.isMobile || wallet.mobile) {
        diagnostics.walletType += ' (Mobile)';
      }
    }

    // Add wallet-specific troubleshooting for unknown types
    if (diagnostics.walletType.includes('Unknown')) {
      diagnostics.recommendations.splice(1, 0, '🔍 WALLET IDENTIFICATION HELP:');
      diagnostics.recommendations.splice(2, 0, '• Open your wallet app and check the name in settings');
      diagnostics.recommendations.splice(3, 0, '• Look for "Phantom", "Solflare", "Trust", or "MetaMask" in the name');
      diagnostics.recommendations.splice(4, 0, '• If none of these, your wallet may not support Solana fully');
    }

    // Generate recommendations based on diagnostics
    if (!diagnostics.connected) {
      diagnostics.recommendations.push('Reconnect your mobile wallet');
      diagnostics.recommendations.push('Ensure your wallet app is open and unlocked');
    }

    if (!diagnostics.canSign && !diagnostics.canSend) {
      diagnostics.recommendations.push('Your wallet may not support Solana transactions');
      diagnostics.recommendations.push('Try switching to Phantom Mobile or Solflare');
    }

    if (diagnostics.networkStatus === 'error') {
      diagnostics.recommendations.push('Check your internet connection');
      diagnostics.recommendations.push('Try switching to mobile data if WiFi is unstable');
    }

    // Specific recommendations for unknown wallets
    if (diagnostics.walletType.includes('Unknown')) {
      diagnostics.recommendations.unshift('🔍 WALLET IDENTIFICATION NEEDED');
      diagnostics.recommendations.push('What wallet app are you using? (Phantom, Solflare, Trust, etc.)');
      diagnostics.recommendations.push('Try disconnecting and reconnecting your wallet');
      diagnostics.recommendations.push('For best results, use Phantom Mobile app');
    }

    // Add general mobile troubleshooting
    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('Try refreshing the page and reconnecting');
      diagnostics.recommendations.push('Ensure your wallet app is updated to the latest version');
      diagnostics.recommendations.push('Make sure you have sufficient SOL for transaction fees');
    }

    // Add urgent action items for signature failures
    if (diagnostics.connected && (diagnostics.canSign || diagnostics.canSend)) {
      diagnostics.recommendations.unshift('⚡ QUICK FIXES TO TRY:');
      diagnostics.recommendations.push('1. Close and reopen your wallet app');
      diagnostics.recommendations.push('2. Refresh this page completely');
      diagnostics.recommendations.push('3. Try the payment again immediately');
    }

  } catch (error) {
    console.error('Wallet diagnostics failed:', error);
    diagnostics.recommendations.push('Unable to diagnose wallet - try refreshing');
  }

  return diagnostics;
}

/**
 * Attempt alternative mobile signing methods
 */
async function attemptAlternativeMobileSigning(wallet: any, transaction: Transaction, connection: Connection): Promise<string | null> {
  console.log('Attempting alternative mobile signing methods...');

  try {
    // Method 1: Try with different preflight settings
    if (wallet.sendTransaction) {
      console.log('Trying sendTransaction with different preflight settings...');
      try {
        const signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false, // Try with preflight enabled
          preflightCommitment: 'processed'
        });
        console.log('Alternative method 1 successful');
        return signature;
      } catch (error) {
        console.log('Method 1 failed, trying method 2...');
      }
    }

    // Method 2: Manual sign and send with different settings
    if (wallet.signTransaction) {
      console.log('Trying manual sign with different network settings...');
      try {
        const signedTx = await wallet.signTransaction(transaction);

        if (signedTx) {
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false, // Try with preflight
            preflightCommitment: 'processed'
          });
          console.log('Alternative method 2 successful');
          return signature;
        }
      } catch (error) {
        console.log('Method 2 failed, trying method 3...');
      }
    }

    // Method 3: Try with minimal transaction (test transaction)
    console.log('Trying minimal test transaction...');
    try {
      const testTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: wallet.publicKey, // Send to self for testing
          lamports: 1, // Minimal amount
        })
      );

      // Get fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      testTransaction.recentBlockhash = blockhash;
      testTransaction.feePayer = wallet.publicKey;

      if (wallet.sendTransaction) {
        const testSignature = await wallet.sendTransaction(testTransaction, connection, {
          skipPreflight: true,
          preflightCommitment: 'confirmed'
        });

        console.log('Test transaction successful, wallet is working');
        // If test works, the issue might be with the original transaction
        return null; // Return null to indicate test worked but original should be retried
      }
    } catch (error) {
      console.log('Test transaction also failed:', error);
    }

  } catch (error) {
    console.error('All alternative signing methods failed:', error);
  }

  return null; // All methods failed
}

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

  // Check if we're on mobile - improved detection for better mobile wallet support
  const isMobile = typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     (window.innerWidth <= 768 && 'ontouchstart' in window));

  // Additional mobile wallet connection checks
  if (isMobile) {
    console.log('Mobile device detected - performing connection checks...');

    // Add visual debugging for mobile
    if (typeof window !== 'undefined') {
      const debugDiv = document.createElement('div');
      debugDiv.id = 'mobile-payment-debug';
      debugDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 14px;
        z-index: 10000;
        max-width: 80%;
        text-align: center;
        font-family: monospace;
      `;
      debugDiv.innerHTML = `
        <div style="color: #9945FF; font-weight: bold;">🔄 Initializing Mobile Wallet...</div>
        <div style="margin-top: 10px;">Wallet: ${senderWallet.name || 'Unknown'}</div>
        <div>Amount: ${paymentRequest.amount.toString()} SOL</div>
        <div style="margin-top: 10px; color: yellow;">Preparing wallet for transaction...</div>
      `;

      document.body.appendChild(debugDiv);
    }

    // Check if wallet has required methods for mobile
    if (!senderWallet.sendTransaction && !senderWallet.signTransaction) {
      throw new Error('Mobile wallet is not properly connected. Please ensure your wallet app is open and connected to this website.');
    }

    // Check if wallet is actually connected and ready
    if (!senderWallet.connected) {
      throw new Error('Mobile wallet is not connected. Please connect your wallet app and try again.');
    }

    // Give mobile wallet time to initialize
    console.log('Waiting for mobile wallet to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for mobile wallet

    // Update debug overlay
    if (typeof window !== 'undefined') {
      const debugEl = document.getElementById('mobile-payment-debug');
      if (debugEl) {
        debugEl.innerHTML = `
          <div style="color: #9945FF; font-weight: bold;">📱 Mobile Wallet Ready</div>
          <div style="margin-top: 10px;">Send TX: ${!!senderWallet.sendTransaction ? '✅' : '❌'}</div>
          <div>Sign TX: ${!!senderWallet.signTransaction ? '✅' : '❌'}</div>
          <div>Connected: ${senderWallet.connected ? '✅' : '❌'}</div>
          <div style="margin-top: 10px; color: green;">Starting transaction...</div>
        `;
      }
    }

    console.log('Mobile wallet initialization complete');
  }

  // Improved mobile wallet adapter detection
  const isMobileWalletAdapter = isMobile && (
    senderWallet.name?.toLowerCase().includes('mobile') ||
    senderWallet.name?.toLowerCase().includes('walletconnect') ||
    senderWallet.name?.toLowerCase().includes('metamask') ||
    senderWallet.name?.toLowerCase().includes('trust') ||
    senderWallet.name?.toLowerCase().includes('coinbase') ||
    !senderWallet.sendTransaction || // Mobile adapters often don't have sendTransaction
    (senderWallet.signTransaction && !senderWallet.sendTransaction) // Has sign but not send
  );

  console.log('Device detection:', {
    isMobile,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    hasSendTransaction: !!senderWallet.sendTransaction,
    hasSignTransaction: !!senderWallet.signTransaction,
    walletName: senderWallet.name || 'Unknown',
    isMobileWalletAdapter
  });

  try {
    // Create transfer transaction with mobile optimizations
    const transaction: Transaction = new Transaction().add(
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
      isMobile,
      amount: solToLamports(paymentRequest.amount).toString(),
      recipient: paymentRequest.recipient.toString()
    });

    let signature: string = '';

    // Use different signing methods for mobile vs desktop
    if (isMobile) {
      console.log('Mobile device detected - using enhanced mobile signing flow');

      // Update debug overlay for signing phase
      if (typeof window !== 'undefined') {
        const debugEl = document.getElementById('mobile-payment-debug');
        if (debugEl) {
          debugEl.innerHTML = `
            <div style="color: #9945FF; font-weight: bold;">📝 Signing Transaction...</div>
            <div style="margin-top: 10px;">Send TX: ${!!senderWallet.sendTransaction ? '✅' : '❌'}</div>
            <div>Sign TX: ${!!senderWallet.signTransaction ? '✅' : '❌'}</div>
            <div>Connected: ${senderWallet.connected ? '✅' : '❌'}</div>
            <div style="margin-top: 10px; color: yellow;">Requesting signature from wallet...</div>
          `;
        }
      }

      // Enhanced mobile signing with retry logic
      let signingAttempts = 0;
      const maxSigningAttempts = 3;

      while (signingAttempts < maxSigningAttempts) {
        try {
          console.log(`Mobile signing attempt ${signingAttempts + 1}/${maxSigningAttempts}`);

          // For mobile, try the simplest approach first: let the wallet handle everything
          if (senderWallet.sendTransaction) {
            console.log('Using wallet sendTransaction for mobile...');

            // Update debug overlay
            if (typeof window !== 'undefined') {
              const debugEl = document.getElementById('mobile-payment-debug');
              if (debugEl) {
                debugEl.innerHTML = `
                  <div style="color: #9945FF; font-weight: bold;">📤 Sending via Wallet...</div>
                  <div style="margin-top: 10px;">Attempt: ${signingAttempts + 1}/${maxSigningAttempts}</div>
                  <div style="color: yellow;">Waiting for wallet approval...</div>
                `;
              }
            }

            signature = await senderWallet.sendTransaction(transaction, connection, {
              skipPreflight: true, // Skip preflight for mobile to avoid signature issues
              preflightCommitment: 'confirmed'
            });
            console.log('Mobile sendTransaction successful:', signature);
            break; // Success, exit retry loop
          } else if (senderWallet.signTransaction) {
            console.log('Mobile wallet only has signTransaction, using manual flow...');

            // Update debug overlay
            if (typeof window !== 'undefined') {
              const debugEl = document.getElementById('mobile-payment-debug');
              if (debugEl) {
                debugEl.innerHTML = `
                  <div style="color: #9945FF; font-weight: bold;">✍️ Signing Manually...</div>
                  <div style="margin-top: 10px;">Attempt: ${signingAttempts + 1}/${maxSigningAttempts}</div>
                  <div style="color: yellow;">Requesting signature...</div>
                `;
              }
            }

            const signedTx = await senderWallet.signTransaction(transaction);

            if (signedTx && signedTx.signatures && signedTx.signatures.length > 0) {
              // Verify the signature was actually applied
              const signerSignature = signedTx.signatures.find((sig: any) =>
                sig.publicKey.equals(senderWallet.publicKey)
              );

              if (!signerSignature || !signerSignature.signature) {
                throw new Error('Transaction was not properly signed by wallet');
              }

              console.log('Transaction signed successfully, sending to network...');

              // Update debug overlay
              if (typeof window !== 'undefined') {
                const debugEl = document.getElementById('mobile-payment-debug');
                if (debugEl) {
                  debugEl.innerHTML = `
                    <div style="color: #9945FF; font-weight: bold;">📡 Sending to Network...</div>
                    <div style="margin-top: 10px;">Signature verified: ✅</div>
                    <div style="color: yellow;">Broadcasting transaction...</div>
                  `;
                }
              }

              signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: true, // Skip preflight to avoid validation issues
                preflightCommitment: 'confirmed'
              });
              console.log('Manual mobile transaction successful:', signature);
              break; // Success, exit retry loop
            } else {
              throw new Error('Wallet returned unsigned transaction');
            }
          } else {
            throw new Error('Mobile wallet does not support transaction methods');
          }

        } catch (signingError) {
          signingAttempts++;
          console.error(`Mobile signing attempt ${signingAttempts} failed:`, signingError);

          // Update debug overlay with error
          if (typeof window !== 'undefined') {
            const debugEl = document.getElementById('mobile-payment-debug');
            if (debugEl) {
              debugEl.innerHTML = `
                <div style="color: red; font-weight: bold;">⚠️ Signing Failed</div>
                <div style="margin-top: 10px;">Attempt: ${signingAttempts}/${maxSigningAttempts}</div>
                <div style="font-size: 12px; color: yellow;">${signingError instanceof Error ? signingError.message : 'Unknown error'}</div>
                ${signingAttempts < maxSigningAttempts ? '<div style="margin-top: 10px; color: orange;">Retrying...</div>' : '<div style="margin-top: 10px; color: red;">Max attempts reached</div>'}
              `;
            }
          }

          if (signingAttempts >= maxSigningAttempts) {
            throw new Error(`Mobile signing failed after ${maxSigningAttempts} attempts: ${signingError instanceof Error ? signingError.message : 'Unknown error'}`);
          }

          // Wait before retrying
          console.log('Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
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

    if (!signature) {
      throw new Error('Transaction signature was not obtained - transaction may have failed');
    }

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
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for mobile

        confirmation = await connection.confirmTransaction({
          signature,
          blockhash: transaction.recentBlockhash!,
          lastValidBlockHeight: transaction.lastValidBlockHeight!
        }, 'confirmed');

        // If still failing, try one more time with even longer wait
        if (confirmation.value.err) {
          console.log('Second confirmation failed, final attempt...');
          await new Promise(resolve => setTimeout(resolve, 3000)); // Additional 3 seconds

          confirmation = await connection.confirmTransaction({
            signature,
            blockhash: transaction.recentBlockhash!,
            lastValidBlockHeight: transaction.lastValidBlockHeight!
          }, 'finalized'); // Use finalized for final attempt on mobile
        }
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

    // Clear mobile debug overlay
    if (isMobile && typeof window !== 'undefined') {
      const debugEl = document.getElementById('mobile-payment-debug');
      if (debugEl) {
        debugEl.innerHTML = `
          <div style="color: green; font-weight: bold;">✅ Payment Successful!</div>
          <div style="margin-top: 10px;">Transaction: ${signature.slice(0, 8)}...</div>
        `;
        setTimeout(() => {
          if (debugEl.parentNode) {
            debugEl.parentNode.removeChild(debugEl);
          }
        }, 3000);
      }
    }

    if (!signature) {
      throw new Error('Transaction completed but signature was not captured');
    }

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
      walletName: senderWallet.name || 'Unknown',
      walletConnected: senderWallet.connected,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });

    // Clear mobile debug overlay on error
    if (isMobile && typeof window !== 'undefined') {
      const debugEl = document.getElementById('mobile-payment-debug');
      if (debugEl) {
        debugEl.innerHTML = `
          <div style="color: red; font-weight: bold;">❌ Payment Failed</div>
          <div style="margin-top: 10px; font-size: 12px;">${error instanceof Error ? error.message : 'Unknown error'}</div>
        `;
        setTimeout(() => {
          if (debugEl.parentNode) {
            debugEl.parentNode.removeChild(debugEl);
          }
        }, 5000);
      }
    }

    // Provide mobile-specific error messages
    if (isMobile) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
          throw new Error('Transaction was cancelled in your mobile wallet app. Please try again and approve the transaction.');
        } else if (errorMessage.includes('signature verification failed') || errorMessage.includes('missing signature')) {
          if (isMobile) {
            // Enhanced mobile signature troubleshooting
            console.log('Mobile signature failure - starting comprehensive diagnostics...');

            // Test wallet connectivity
            const walletDiagnostics = await testMobileWalletConnectivity(senderWallet, connection);
            console.log('Wallet diagnostics:', walletDiagnostics);

            // Update debug overlay with diagnostics
            if (typeof window !== 'undefined') {
              const debugEl = document.getElementById('mobile-payment-debug');
              if (debugEl) {
                const recommendationsHtml = walletDiagnostics.recommendations.map(rec => `<div>• ${rec}</div>`).join('');

                debugEl.innerHTML = `
                  <div style="color: orange; font-weight: bold; margin-bottom: 15px;">🔍 Wallet Diagnostics Complete</div>
                  <div style="margin-bottom: 15px; font-size: 12px; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px;">
                    <div style="margin-bottom: 8px;"><strong>Status:</strong></div>
                    <div>Wallet Connected: ${walletDiagnostics.connected ? '✅' : '❌'}</div>
                    <div>Can Sign: ${walletDiagnostics.canSign ? '✅' : '❌'}</div>
                    <div>Can Send: ${walletDiagnostics.canSend ? '✅' : '❌'}</div>
                    <div>Network: ${walletDiagnostics.networkStatus}</div>
                    <div>Wallet Type: ${walletDiagnostics.walletType}</div>
                  </div>
                  <div style="color: yellow; font-size: 12px; line-height: 1.4;">
                    <div style="margin-bottom: 8px;"><strong>Recommended Actions:</strong></div>
                    ${recommendationsHtml}
                  </div>
                  <div style="margin-top: 15px; color: cyan; font-size: 11px;">
                    💡 <strong>Pro Tip:</strong> If using an unknown wallet, try Phantom Mobile for best compatibility
                  </div>
                `;
                setTimeout(() => {
                  if (debugEl.parentNode) {
                    debugEl.parentNode.removeChild(debugEl);
                  }
                }, 12000); // Show longer for troubleshooting
              }
            }

            // Try alternative signing method if diagnostics suggest it
            if (walletDiagnostics.recommendations.includes('Try alternative signing method')) {
              console.log('Attempting alternative signing method...');

              // Create a fresh transaction in case the original is corrupted
              const freshTransaction = new Transaction().add(
                SystemProgram.transfer({
                  fromPubkey: senderWallet.publicKey,
                  toPubkey: paymentRequest.recipient,
                  lamports: solToLamports(paymentRequest.amount),
                })
              );

              // Get fresh blockhash for the new transaction
              const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
              freshTransaction.recentBlockhash = blockhash;
              freshTransaction.lastValidBlockHeight = lastValidBlockHeight;
              freshTransaction.feePayer = senderWallet.publicKey;

              try {
                const altSignature = await attemptAlternativeMobileSigning(senderWallet, freshTransaction, connection);
                if (altSignature) {
                  console.log('Alternative signing successful:', altSignature);

                  // Confirm the alternative transaction
                  const confirmation = await connection.confirmTransaction({
                    signature: altSignature,
                    blockhash: freshTransaction.recentBlockhash!,
                    lastValidBlockHeight: freshTransaction.lastValidBlockHeight!
                  }, 'confirmed');

                  if (confirmation.value.err) {
                    throw new Error(`Alternative transaction failed: ${confirmation.value.err}`);
                  }

                  return altSignature; // Return successful signature
                }
              } catch (altError) {
                console.error('Alternative signing also failed:', altError);
              }
            }

            throw new Error(`Mobile wallet signature issue detected. ${walletDiagnostics.recommendations.join(' ')} Please follow the troubleshooting steps above.`);
          } else {
            throw new Error('Transaction signature verification failed. Please try refreshing your wallet connection.');
          }
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          throw new Error('Network connection issue. Please check your internet connection and try again.');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          if (isMobile) {
            throw new Error('Transaction timed out. Mobile connections can be slower - please wait longer and try again.');
          } else {
            throw new Error('Transaction timed out. Please try again.');
          }
        } else if (errorMessage.includes('wallet') && errorMessage.includes('not connected')) {
          throw new Error('Wallet connection lost. Please reconnect your wallet and try again.');
        } else if (errorMessage.includes('disconnected') || errorMessage.includes('connection lost')) {
          if (isMobile) {
            throw new Error('Mobile wallet connection lost. Please ensure your wallet app remains open and connected throughout the transaction.');
          } else {
            throw new Error('Wallet connection lost. Please reconnect your wallet and try again.');
          }
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled') || errorMessage.includes('rejected')) {
          if (isMobile) {
            throw new Error('Transaction was cancelled in your mobile wallet app. Please try again and approve the transaction when prompted.');
          } else {
            throw new Error('Transaction was cancelled. Please try again and approve the transaction.');
          }
        } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('not enough')) {
          throw new Error('Insufficient SOL balance. Please add more SOL to your wallet and try again.');
        } else if (errorMessage.includes('blockhash') || errorMessage.includes('recent blockhash')) {
          throw new Error('Transaction expired. Please try again with a fresh transaction.');
        } else if (isMobile) {
          throw new Error(`Mobile payment failed: ${error.message}. Try using a different wallet app or the desktop version.`);
        } else {
          throw new Error(`Payment failed: ${error.message}`);
        }
      } else {
        throw new Error('Mobile payment failed unexpectedly. Please ensure your wallet app is up to date and try again.');
      }
    } else {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('signature verification failed') || errorMessage.includes('missing signature')) {
          throw new Error('Transaction signature verification failed. Please try refreshing your wallet connection.');
        } else {
          throw new Error(`Transfer failed: ${error.message}`);
        }
      } else {
        throw new Error('Transfer failed: Unknown error occurred');
      }
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
 * Simple test to check mobile wallet connection status
 * Call this function to see wallet status on mobile screen
 */
export function showMobileWalletStatus(wallet: any): void {
  if (typeof window === 'undefined') return;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (window.innerWidth <= 768 && 'ontouchstart' in window);

  if (!isMobile) {
    console.log('Not a mobile device - wallet status:', {
      connected: !!wallet?.connected,
      hasSendTransaction: !!wallet?.sendTransaction,
      hasSignTransaction: !!wallet?.signTransaction,
      walletName: wallet?.name || 'Unknown'
    });
    return;
  }

  // Create status overlay for mobile
  const statusDiv = document.createElement('div');
  statusDiv.id = 'mobile-wallet-status';
  statusDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 9999;
    max-width: 250px;
    font-family: monospace;
  `;

  const status = {
    connected: !!wallet?.connected,
    hasSendTransaction: !!wallet?.sendTransaction,
    hasSignTransaction: !!wallet?.signTransaction,
    walletName: wallet?.name || 'Unknown',
    publicKey: wallet?.publicKey?.toString()?.slice(0, 8) + '...' || 'null'
  };

  statusDiv.innerHTML = `
    <div style="font-weight: bold; color: #9945FF;">📱 Wallet Status</div>
    <div style="margin-top: 8px;">Wallet: ${status.walletName}</div>
    <div>Connected: ${status.connected ? '✅' : '❌'}</div>
    <div>Send TX: ${status.hasSendTransaction ? '✅' : '❌'}</div>
    <div>Sign TX: ${status.hasSignTransaction ? '✅' : '❌'}</div>
    <div>PK: ${status.publicKey}</div>
    <div style="margin-top: 8px; font-size: 10px; color: yellow;">
      ${!status.connected ? '❌ Connect wallet first' :
        !status.hasSendTransaction && !status.hasSignTransaction ? '❌ Wallet not ready' :
        '✅ Wallet ready for payments'}
    </div>
  `;

  document.body.appendChild(statusDiv);

  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.parentNode.removeChild(statusDiv);
    }
  }, 8000);
}
export async function testMobileWalletConnection(wallet: any): Promise<{
  connected: boolean;
  hasSendTransaction: boolean;
  hasSignTransaction: boolean;
  walletName: string;
  publicKey: string | null;
  isMobile: boolean;
  userAgent: string;
}> {
  const isMobile = typeof window !== 'undefined' &&
    (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
     (window.innerWidth <= 768 && 'ontouchstart' in window));

  const result = {
    connected: !!wallet?.connected,
    hasSendTransaction: !!wallet?.sendTransaction,
    hasSignTransaction: !!wallet?.signTransaction,
    walletName: wallet?.name || 'Unknown',
    publicKey: wallet?.publicKey?.toString() || null,
    isMobile,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

  console.log('Mobile Wallet Test Results:', result);

  // Show results visually for mobile debugging
  if (isMobile && typeof window !== 'undefined') {
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 9999;
      max-width: 300px;
      font-family: monospace;
    `;
    debugDiv.innerHTML = `
      <strong>Mobile Wallet Debug:</strong><br>
      Connected: ${result.connected ? '✅' : '❌'}<br>
      Send TX: ${result.hasSendTransaction ? '✅' : '❌'}<br>
      Sign TX: ${result.hasSignTransaction ? '✅' : '❌'}<br>
      Wallet: ${result.walletName}<br>
      PK: ${result.publicKey ? result.publicKey.slice(0, 8) + '...' : 'null'}<br>
      Mobile: ${result.isMobile ? '✅' : '❌'}
    `;

    document.body.appendChild(debugDiv);

    // Remove after 10 seconds
    setTimeout(() => {
      if (debugDiv.parentNode) {
        debugDiv.parentNode.removeChild(debugDiv);
      }
    }, 10000);
  }

  return result;
}
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
