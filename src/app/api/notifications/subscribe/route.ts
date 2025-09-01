/**
 * Push Notification Subscription API
 * Handles subscription and push notification sending
 */

import { NextRequest, NextResponse } from 'next/server';

// Note: web-push will be imported when VAPID keys are configured
// import webpush from 'web-push';

// Configure VAPID keys (should be in environment variables)
// webpush.setVapidDetails(
//   'mailto:your-email@studypay.com',
//   process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );

// In-memory storage (use database in production)
const subscriptions = new Map();

export async function POST(request: NextRequest) {
  try {
    const { subscription, userType, walletAddress } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription is required' },
        { status: 400 }
      );
    }

    // Store subscription with user info
    const subscriptionKey = `${userType}-${walletAddress}`;
    subscriptions.set(subscriptionKey, {
      subscription,
      userType,
      walletAddress,
      createdAt: new Date().toISOString()
    });

    console.log(`[Push] Subscription saved for ${subscriptionKey}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });

  } catch (error) {
    console.error('[Push] Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userType = url.searchParams.get('userType');
  
  if (!userType) {
    return NextResponse.json(
      { error: 'userType parameter is required' },
      { status: 400 }
    );
  }

  // Get all subscriptions for user type
  const userSubscriptions = Array.from(subscriptions.entries())
    .filter(([key]) => key.startsWith(userType))
    .map(([key, data]) => ({ key, ...data }));

  return NextResponse.json({ 
    subscriptions: userSubscriptions,
    count: userSubscriptions.length 
  });
}
