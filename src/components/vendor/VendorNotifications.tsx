/**
 * Vendor Notification System
 * Shows real-time payment alerts to vendors
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Alert, Button } from '@/components/ui';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { vendorTransactionService, VendorTransaction } from '@/lib/services/vendorTransactionService';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { BigNumber } from 'bignumber.js';

interface VendorNotificationsProps {
  vendorWallet?: string;
  onNotificationClick?: (transaction: VendorTransaction) => void;
}

export default function VendorNotifications({ 
  vendorWallet, 
  onNotificationClick 
}: VendorNotificationsProps) {
  const [notifications, setNotifications] = useState<VendorTransaction[]>([]);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const { convertSolToNaira } = usePriceConversion();
  const currencyFormatter = useCurrencyFormatter();

  // Check for new transactions every 5 seconds
  useEffect(() => {
    if (!vendorWallet) return;

    const checkForNewTransactions = () => {
      const recentTransactions = vendorTransactionService
        .getTransactionsByVendor(vendorWallet)
        .filter(tx => tx.timestamp > lastChecked && tx.status === 'confirmed');

      if (recentTransactions.length > 0) {
        // Play notification sound
        if (soundEnabled) {
          playNotificationSound();
        }

        // Add to notifications
        setNotifications(prev => [...recentTransactions, ...prev].slice(0, 5));
        setLastChecked(new Date());
        
        console.log('🔔 New payment notifications:', recentTransactions.length);
      }
    };

    // Check immediately
    checkForNewTransactions();

    // Then check every 5 seconds
    const interval = setInterval(checkForNewTransactions, 5000);

    return () => clearInterval(interval);
  }, [vendorWallet, lastChecked, soundEnabled]);

  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const dismissNotification = (transactionId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== transactionId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-dark-bg-secondary border border-dark-border-primary rounded-lg p-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-dark-text-primary">
            Payment Alerts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={clearAllNotifications}
            className="p-1"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.map((transaction) => (
        <div
          key={transaction.id}
          className="cursor-pointer hover:bg-green-500/10 transition-colors"
          onClick={() => {
            onNotificationClick?.(transaction);
            dismissNotification(transaction.id);
          }}
        >
          <Alert
            type="success"
          >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {transaction.paymentMethod === 'mobile' ? '📱' : '💻'}
              </div>
              <div>
                <div className="font-semibold text-green-400">
                  Payment Received!
                </div>
                <div className="text-sm text-dark-text-primary">
                  {transaction.description}
                </div>
                <div className="text-xs text-dark-text-secondary">
                  {transaction.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-400">
                +{currencyFormatter.formatCurrency(
                  convertSolToNaira(transaction.amount)?.amount || new BigNumber(0), 
                  'NGN'
                )}
              </div>
              <div className="text-xs text-dark-text-muted">
                {currencyFormatter.formatCurrency(transaction.amount, 'SOL')}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              dismissNotification(transaction.id);
            }}
            className="absolute top-2 right-2 p-1 opacity-50 hover:opacity-100"
          >
            ✕
          </Button>
        </Alert>
        </div>
      ))}

      {/* Settings */}
      <div className="text-xs text-center text-dark-text-muted">
        {soundEnabled ? '🔊 Sound enabled' : '🔇 Sound disabled'} • 
        Auto-refresh every 5s
      </div>
    </div>
  );
}
