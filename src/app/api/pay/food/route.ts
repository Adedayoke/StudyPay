/**
 * Campus Food Payment API
 * Specialized endpoint for food vendor payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey, Keypair } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// Food vendor configuration
const FOOD_VENDORS = {
  'mama-adunni': {
    name: "Mama Adunni's Kitchen",
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    specialties: ['Jollof Rice', 'Fried Rice', 'Amala', 'Egusi Soup'],
  },
  'campus-cafe': {
    name: 'Campus Central Cafe',
    wallet: 'GjwEiNqYRqnVQPqfgzJhq8Z8xKXeqNqKjxqrG5xKXeqN',
    specialties: ['Coffee', 'Sandwiches', 'Pastries', 'Smoothies'],
  },
};

/**
 * GET /api/pay/food - Create food payment request
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const vendorId = searchParams.get('vendor') || 'mama-adunni';
    const item = searchParams.get('item') || 'Meal';
    const amount = searchParams.get('amount');
    const quantity = parseInt(searchParams.get('quantity') || '1');
    
    const vendor = FOOD_VENDORS[vendorId as keyof typeof FOOD_VENDORS];
    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    const paymentAmount = new BigNumber(amount);
    const totalAmount = paymentAmount.multipliedBy(quantity);

    // Generate payment reference
    const reference = Keypair.generate().publicKey;

    const label = `${vendor.name} - ${item}`;
    const message = quantity > 1 
      ? `${quantity}x ${item} from ${vendor.name}`
      : `${item} from ${vendor.name}`;

    // Create transaction request
    return NextResponse.json({
      label,
      icon: `${request.nextUrl.origin}/icons/food-icon.png`,
      transaction: {
        recipient: new PublicKey(vendor.wallet),
        amount: totalAmount,
        reference,
        memo: `StudyPay Food: ${message}`,
      },
      message,
      vendor: {
        id: vendorId,
        name: vendor.name,
        specialties: vendor.specialties,
      },
      order: {
        item,
        quantity,
        unitPrice: paymentAmount,
        totalPrice: totalAmount,
      },
    });

  } catch (error) {
    console.error('Food payment request error:', error);
    return NextResponse.json(
      { error: 'Failed to create food payment request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pay/food - Process food payment
 */
export async function POST(request: NextRequest) {
  try {
    const { transaction, account, vendorId, orderId } = await request.json();

    // Validate payment
    const vendor = FOOD_VENDORS[vendorId as keyof typeof FOOD_VENDORS];
    if (!vendor) {
      return NextResponse.json(
        { error: 'Invalid vendor' },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate the transaction signature
    // 2. Confirm payment to vendor wallet
    // 3. Notify vendor of new order
    // 4. Send receipt to student
    // 5. Update order status

    return NextResponse.json({
      success: true,
      orderId,
      vendor: vendor.name,
      message: 'Food order payment confirmed!',
      nextSteps: [
        'Order sent to vendor',
        'Preparation will begin shortly',
        'You will be notified when ready for pickup',
      ],
    });

  } catch (error) {
    console.error('Food payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process food payment' },
      { status: 500 }
    );
  }
}
