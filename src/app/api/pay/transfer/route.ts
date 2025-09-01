/**
 * Parent-to-Student Transfer API
 * Specialized endpoint for parent allowance transfers
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// Transfer categories and limits
const TRANSFER_CATEGORIES = {
  'allowance': {
    name: 'Weekly Allowance',
    maxAmount: 100, // SOL
    description: 'Regular weekly spending money',
  },
  'emergency': {
    name: 'Emergency Fund',
    maxAmount: 500,
    description: 'Urgent financial assistance',
  },
  'tuition': {
    name: 'Tuition Payment',
    maxAmount: 5000,
    description: 'Academic fees and expenses',
  },
  'textbooks': {
    name: 'Textbook Fund',
    maxAmount: 200,
    description: 'Academic materials and supplies',
  },
  'meal-plan': {
    name: 'Meal Plan Top-up',
    maxAmount: 300,
    description: 'Campus dining credits',
  },
};

/**
 * GET /api/pay/transfer - Create parent transfer request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const studentWallet = searchParams.get('student');
    const category = searchParams.get('category') || 'allowance';
    const amount = searchParams.get('amount');
    const note = searchParams.get('note') || '';
    
    if (!studentWallet) {
      return NextResponse.json(
        { error: 'Student wallet address is required' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Transfer amount is required' },
        { status: 400 }
      );
    }

    const transferCategory = TRANSFER_CATEGORIES[category as keyof typeof TRANSFER_CATEGORIES];
    if (!transferCategory) {
      return NextResponse.json(
        { error: 'Invalid transfer category' },
        { status: 400 }
      );
    }

    const transferAmount = new BigNumber(amount);
    
    // Validate amount limits
    if (transferAmount.isGreaterThan(transferCategory.maxAmount)) {
      return NextResponse.json(
        { 
          error: `Amount exceeds maximum for ${transferCategory.name}`,
          maxAmount: transferCategory.maxAmount,
        },
        { status: 400 }
      );
    }

    if (transferAmount.isLessThanOrEqualTo(0)) {
      return NextResponse.json(
        { error: 'Transfer amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate transfer reference
    const reference = Keypair.generate().publicKey;

    const label = `StudyPay - ${transferCategory.name}`;
    const message = note 
      ? `${transferCategory.description}: ${note}`
      : transferCategory.description;

    return NextResponse.json({
      label,
      icon: `${request.nextUrl.origin}/icons/transfer-icon.png`,
      transaction: {
        recipient: new PublicKey(studentWallet),
        amount: transferAmount,
        reference,
        memo: `StudyPay Transfer: ${category} - ${formatAmount(transferAmount)}`,
      },
      message,
      transfer: {
        category,
        categoryName: transferCategory.name,
        student: studentWallet,
        amount: transferAmount.toNumber(),
        note,
        maxAllowed: transferCategory.maxAmount,
      },
      parentInstructions: [
        'Review transfer details carefully',
        'Confirm recipient wallet address',
        'Complete payment with your wallet',
        'Student will be notified immediately',
      ],
    });

  } catch (error) {
    console.error('Parent transfer request error:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pay/transfer - Process parent transfer
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      transaction, 
      account, 
      studentWallet, 
      category, 
      transferId 
    } = await request.json();

    const transferCategory = TRANSFER_CATEGORIES[category as keyof typeof TRANSFER_CATEGORIES];
    if (!transferCategory) {
      return NextResponse.json(
        { error: 'Invalid transfer category' },
        { status: 400 }
      );
    }

    // Generate transfer confirmation
    const confirmationId = `TRF-${Date.now().toString(36).toUpperCase()}`;

    // In production, this would:
    // 1. Validate transaction signature
    // 2. Confirm SOL transfer to student wallet
    // 3. Send push notification to student
    // 4. Log transfer in family dashboard
    // 5. Send email confirmation to parent

    return NextResponse.json({
      success: true,
      transferId,
      confirmationId,
      category: transferCategory.name,
      student: studentWallet,
      message: 'Transfer sent successfully!',
      notifications: {
        parent: 'Transfer confirmation sent to your email',
        student: 'Student will receive push notification',
      },
      tracking: {
        confirmationId,
        expectedDelivery: 'Immediate (confirmed on blockchain)',
        status: 'completed',
      },
    });

  } catch (error) {
    console.error('Parent transfer processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}

// Helper function to format SOL amounts
function formatAmount(amount: BigNumber): string {
  return `${amount.toFixed(6)} SOL`;
}
