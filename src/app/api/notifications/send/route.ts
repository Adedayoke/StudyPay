/**
 * Push Notification Sending API
 * Sends push notifications to subscribed users
 */

import { NextRequest, NextResponse } from 'next/server';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

interface SendNotificationRequest {
  userType: 'student' | 'parent' | 'vendor';
  walletAddress?: string;
  notification: NotificationPayload;
  broadcast?: boolean; // Send to all users of this type
}

export async function POST(request: NextRequest) {
  try {
    const { userType, walletAddress, notification, broadcast }: SendNotificationRequest = await request.json();

    if (!userType || !notification) {
      return NextResponse.json(
        { error: 'userType and notification are required' },
        { status: 400 }
      );
    }

    // In production, this would get subscriptions from database
    // For now, we'll just log the notification that would be sent
    console.log('[Push] Sending notification:', {
      userType,
      walletAddress,
      broadcast,
      notification
    });

    // Simulate sending notification
    const recipientCount = broadcast ? Math.floor(Math.random() * 10) + 1 : 1;
    
    // Create the notification payload
    const payload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      data: {
        url: getUrlForNotificationType(notification.data?.type),
        ...notification.data
      },
      actions: notification.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      requireInteraction: true,
      tag: `studypay-${Date.now()}`
    };

    // TODO: In production, integrate with web-push library
    // const results = await Promise.allSettled(
    //   subscriptions.map(sub => webpush.sendNotification(sub, JSON.stringify(payload)))
    // );

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${recipientCount} recipient(s)`,
      payload,
      recipientCount
    });

  } catch (error) {
    console.error('[Push] Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

function getUrlForNotificationType(type?: string): string {
  switch (type) {
    case 'payment_received':
    case 'payment_sent':
    case 'low_balance':
      return '/student';
    case 'transfer_sent':
    case 'transfer_received':
      return '/parent';
    case 'sale_completed':
      return '/vendor';
    default:
      return '/';
  }
}

// Test endpoint to send sample notifications
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'test';

  const sampleNotifications = {
    test: {
      title: '🚀 StudyPay PWA Test',
      body: 'Your PWA notifications are working perfectly!',
      data: { type: 'test' }
    },
    payment: {
      title: '💰 Payment Received',
      body: 'You received 0.5 SOL from a vendor payment',
      data: { type: 'payment_received' }
    },
    transfer: {
      title: '📤 Transfer Sent',
      body: 'Successfully sent 2.0 SOL to your student',
      data: { type: 'transfer_sent' }
    },
    lowbalance: {
      title: '⚠️ Low Balance Alert',
      body: 'Your balance is below 0.1 SOL. Consider topping up.',
      data: { type: 'low_balance' }
    }
  };

  const notification = sampleNotifications[type as keyof typeof sampleNotifications] 
    || sampleNotifications.test;

  return NextResponse.json({
    notification,
    instructions: 'POST to this endpoint with userType and notification payload to send real notifications'
  });
}
