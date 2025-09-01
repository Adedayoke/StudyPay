/**
 * PWA Install Component
 * Handles app installation prompt and offline indicators
 */

'use client';

import React, { useState } from 'react';
import { usePWA } from './PWAProvider';
import { Button, Alert, Badge } from '@/components/ui';

export function PWAInstallBanner() {
  const { isInstallable, installApp, isInstalled } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installApp();
      setDismissed(true);
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Alert className="bg-solana-purple-600 border-solana-purple-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-3">
            <h4 className="text-sm font-medium">Install StudyPay</h4>
            <p className="text-xs opacity-90 mt-1">
              Get instant access, offline capabilities, and push notifications!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-solana-purple-600 hover:bg-gray-100"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDismissed(true)}
              className="text-white hover:bg-solana-purple-700"
            >
              ✕
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}

export function PWAStatusIndicator() {
  const { 
    isOnline, 
    isInstalled, 
    updateAvailable, 
    updateApp,
    isServiceWorkerRegistered 
  } = usePWA();

  return (
    <div className="flex items-center space-x-2">
      {/* Online/Offline Status */}
      <Badge 
        variant={isOnline ? 'success' : 'warning'}
        className="text-xs"
      >
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </Badge>

      {/* PWA Status */}
      {isInstalled && (
        <Badge variant="secondary" className="text-xs">
          📱 PWA
        </Badge>
      )}

      {/* Service Worker Status */}
      {isServiceWorkerRegistered && (
        <Badge variant="secondary" className="text-xs">
          ⚡ SW
        </Badge>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Button
          size="sm"
          variant="primary"
          onClick={updateApp}
          className="text-xs px-2 py-1"
        >
          🔄 Update
        </Button>
      )}
    </div>
  );
}

export function PWANotificationPermission() {
  const { 
    notificationPermission, 
    requestNotificationPermission 
  } = usePWA();
  const [isRequesting, setIsRequesting] = useState(false);

  if (notificationPermission === 'granted') {
    return (
      <Badge variant="success" className="text-xs">
        🔔 Notifications Enabled
      </Badge>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
        <p className="text-xs text-yellow-800">Notifications blocked. Enable in browser settings for payment alerts.</p>
      </div>
    );
  }

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await requestNotificationPermission();
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Alert className="bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-3">
          <h4 className="text-sm font-medium text-blue-800">Enable Notifications</h4>
          <p className="text-xs text-blue-600 mt-1">
            Get notified about payments, transfers, and low balance alerts
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={handleRequest}
          disabled={isRequesting}
        >
          {isRequesting ? 'Enabling...' : 'Enable'}
        </Button>
      </div>
    </Alert>
  );
}

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
      <div className="flex items-center justify-center space-x-2">
        <span>🔴</span>
        <span>You're offline. Some features may be limited.</span>
        <span>Transactions will sync when connection returns.</span>
      </div>
    </div>
  );
}
