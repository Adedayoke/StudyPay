/**
 * PWA Context and Hook
 * Manages Progressive Web App functionality including installation, notifications, and offline state
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
  // Installation
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  
  // Notifications
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  
  // Offline state
  isOnline: boolean;
  
  // Service Worker
  isServiceWorkerSupported: boolean;
  isServiceWorkerRegistered: boolean;
  
  // Update available
  updateAvailable: boolean;
  updateApp: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  // Installation state
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Online state
  const [isOnline, setIsOnline] = useState(true);
  
  // Service Worker state
  const [isServiceWorkerSupported, setIsServiceWorkerSupported] = useState(false);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') return;

    // Initialize PWA features
    initializePWA();
    
    // Setup event listeners
    setupEventListeners();
    
    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializePWA = async () => {
    // Check service worker support
    if ('serviceWorker' in navigator) {
      setIsServiceWorkerSupported(true);
      
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        setIsServiceWorkerRegistered(true);
        setSwRegistration(registration);
        
        console.log('[PWA] Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                console.log('[PWA] Update available');
              }
            });
          }
        });
        
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
    
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      console.log('[PWA] App is installed');
    }
    
    // Check initial notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Check initial online state
    setIsOnline(navigator.onLine);
  };

  const setupEventListeners = () => {
    // Install prompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Network state
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setIsInstallable(true);
    console.log('[PWA] Install prompt available');
  };

  const handleAppInstalled = () => {
    setIsInstalled(true);
    setIsInstallable(false);
    setDeferredPrompt(null);
    console.log('[PWA] App installed successfully');
    
    // Send analytics or show success message
    sendNotification('StudyPay Installed! 🎉', {
      body: 'You can now use StudyPay offline and receive push notifications.',
      icon: '/icons/icon-192x192.png'
    });
  };

  const handleOnline = () => {
    setIsOnline(true);
    console.log('[PWA] Back online');
  };

  const handleOffline = () => {
    setIsOnline(false);
    console.log('[PWA] Gone offline');
  };

  // Install app
  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      // Show install prompt
      const result = await deferredPrompt.prompt();
      console.log('[PWA] Install prompt result:', result);
      
      // Wait for user choice
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
      } else {
        console.log('[PWA] User dismissed install');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      throw error;
    }
  };

  // Request notification permission
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('[PWA] Notification permission granted');
        
        // Register for push notifications if service worker is available
        if (swRegistration) {
          await subscribeToPushNotifications();
        }
      }
      
      return permission;
    } catch (error) {
      console.error('[PWA] Notification permission failed:', error);
      throw error;
    }
  };

  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!swRegistration) return;

    try {
      // Check if already subscribed
      const existingSubscription = await swRegistration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('[PWA] Already subscribed to push notifications');
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      
      console.log('[PWA] Subscribed to push notifications:', subscription);
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userType: 'student' // This should be dynamic based on user role
        })
      });
      
      return subscription;
      
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
    }
  };

  // Send local notification
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (notificationPermission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return;
    }

    if ('serviceWorker' in navigator && swRegistration) {
      // Use service worker for better notification handling
      swRegistration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'studypay-notification',
        requireInteraction: true,
        ...options
      });
    } else {
      // Fallback to regular notification
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options
      });
    }
  };

  // Update app
  const updateApp = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const contextValue: PWAContextType = {
    // Installation
    isInstallable,
    isInstalled,
    installApp,
    
    // Notifications
    notificationPermission,
    requestNotificationPermission,
    sendNotification,
    
    // Offline state
    isOnline,
    
    // Service Worker
    isServiceWorkerSupported,
    isServiceWorkerRegistered,
    
    // Updates
    updateAvailable,
    updateApp
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
}

// Hook to use PWA context
export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

// Hook for push notifications specific to StudyPay
export function useStudyPayNotifications() {
  const { sendNotification, notificationPermission, requestNotificationPermission } = usePWA();

  const sendPaymentNotification = (type: 'sent' | 'received', amount: string, from?: string) => {
    const notifications = {
      sent: {
        title: '💸 Payment Sent Successfully',
        body: `You sent ${amount} SOL`,
        data: { type: 'payment_sent', url: '/student' }
      },
      received: {
        title: '💰 Payment Received!',
        body: `You received ${amount} SOL${from ? ` from ${from}` : ''}`,
        data: { type: 'payment_received', url: '/student' }
      }
    };

    sendNotification(notifications[type].title, {
      body: notifications[type].body,
      data: notifications[type].data
      // Note: actions are handled by service worker
    });
  };

  const sendTransferNotification = (type: 'sent' | 'received', amount: string, studentName?: string) => {
    const notifications = {
      sent: {
        title: '📤 Transfer Sent to Student',
        body: `Sent ${amount} SOL${studentName ? ` to ${studentName}` : ''}`,
        data: { type: 'transfer_sent', url: '/parent' }
      },
      received: {
        title: '📥 Money Received from Parent',
        body: `Received ${amount} SOL for your studies`,
        data: { type: 'transfer_received', url: '/student' }
      }
    };

    sendNotification(notifications[type].title, {
      body: notifications[type].body,
      data: notifications[type].data
    });
  };

  const sendVendorNotification = (amount: string, studentName?: string) => {
    sendNotification('🏪 Sale Completed!', {
      body: `Received ${amount} SOL${studentName ? ` from ${studentName}` : ''}`,
      data: { type: 'sale_completed', url: '/vendor' }
      // Note: actions are handled by service worker
    });
  };

  const sendLowBalanceNotification = (balance: string) => {
    sendNotification('⚠️ Low Balance Alert', {
      body: `Your balance is low: ${balance} SOL. Consider topping up.`,
      data: { type: 'low_balance', url: '/student' },
      requireInteraction: true
    });
  };

  return {
    sendPaymentNotification,
    sendTransferNotification,
    sendVendorNotification,
    sendLowBalanceNotification,
    notificationPermission,
    requestNotificationPermission
  };
}

export type { PWAContextType };
