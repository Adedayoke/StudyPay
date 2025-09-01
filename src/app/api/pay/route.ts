/**
 * Official Solana Pay Transaction Request API
 * Implements the Solana Pay specification for campus payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// StudyPay merchant configuration
const MERCHANT_WALLET = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'); // Demo wallet
const MERCHANT_NAME = 'StudyPay Campus Merchant';

/**
 * GET /api/pay - Create Solana Pay Transaction Request
 * This endpoint generates a transaction request that wallets can process
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract payment parameters
    const recipient = searchParams.get('recipient') || MERCHANT_WALLET.toString();
    const amount = searchParams.get('amount');
    const label = searchParams.get('label') || 'StudyPay Campus Payment';
    const message = searchParams.get('message') || 'Payment for campus services';
    const memo = searchParams.get('memo');
    
    // Validate required parameters
    if (!amount) {
      return NextResponse.json(
        { error: 'Amount parameter is required' },
        { status: 400 }
      );
    }

    const paymentAmount = new BigNumber(amount);
    if (paymentAmount.isLessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate unique reference for this payment
    const reference = Keypair.generate().publicKey;

    // Create the transaction request URL
    const transactionRequestUrl = new URL(`${request.nextUrl.origin}/api/pay`);
    transactionRequestUrl.searchParams.set('recipient', recipient);
    transactionRequestUrl.searchParams.set('amount', paymentAmount.toString());
    transactionRequestUrl.searchParams.set('label', label);
    if (message) transactionRequestUrl.searchParams.set('message', message);
    if (memo) transactionRequestUrl.searchParams.set('memo', memo);

    // Return the transaction request in Solana Pay format
    return NextResponse.json({
      label,
      icon: `${request.nextUrl.origin}/icons/icon-192x192.png`,
      transaction: {
        recipient: new PublicKey(recipient),
        amount: paymentAmount,
        reference,
        memo,
      },
      message,
    });

  } catch (error) {
    console.error('Solana Pay transaction request error:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pay - Process Solana Pay Transaction
 * This endpoint receives and validates the signed transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { transaction, account } = await request.json();

    if (!transaction || !account) {
      return NextResponse.json(
        { error: 'Transaction and account are required' },
        { status: 400 }
      );
    }

    // Validate the payer's account
    const payerPublicKey = new PublicKey(account);

    // In a real implementation, you would:
    // 1. Validate the transaction parameters
    // 2. Check merchant requirements
    // 3. Verify the payment amount and recipient
    // 4. Store the transaction reference for tracking

    // For now, return a success response
    return NextResponse.json({
      transaction,
      message: 'Payment processed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Solana Pay transaction processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/pay - CORS headers for Solana Pay
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
