/**
 * Mobile-Friendly Wallet Provider
 * Enhanced wallet support for PWA with mobile-specific adapters
 */

'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { 
  ConnectionProvider, 
  WalletProvider,
  useWallet,
  useConnection 
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Desktop wallet adapters
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

// Mobile-specific adapters
import { 
  WalletModalProvider,
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui';

import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// StudyPay components
import { StudyPayIcon } from '../../lib/utils/iconMap';

// =============================================================================
// Mobile Detection and Wallet Configuration
// =============================================================================

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768;
}

function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent;
  return (
    ua.includes('Instagram') ||
    ua.includes('FBAN') ||
    ua.includes('FBAV') ||
    ua.includes('Twitter') ||
    ua.includes('Line/')
  );
}

interface MobilePWAWalletProviderProps {
  children: React.ReactNode;
}

export function MobilePWAWalletProvider({ children }: MobilePWAWalletProviderProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    setDeviceType(isMobile() ? 'mobile' : 'desktop');
    setIsInApp(isInAppBrowser());
  }, []);

  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure wallets based on device type
  const wallets = useMemo(() => {
    const baseWallets = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ];

    if (deviceType === 'mobile') {
      // Mobile-specific wallet configuration
      return [
        // Phantom supports mobile deep linking
        new PhantomWalletAdapter({
          appName: 'StudyPay',
          appIcon: '/icons/icon-192x192.png',
          appUrl: window.location.origin,
          appDescription: 'Blockchain student payment system'
        }),
        // Solflare has good mobile support
        new SolflareWalletAdapter(),
      ];
    }

    return baseWallets;
  }, [deviceType]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={!isInApp} // Don't auto-connect in in-app browsers
      >
        <WalletModalProvider>
          <MobileWalletContext.Provider value={{ deviceType, isInApp }}>
            {children}
          </MobileWalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// =============================================================================
// Mobile Wallet Context
// =============================================================================

interface MobileWalletContextType {
  deviceType: 'mobile' | 'desktop';
  isInApp: boolean;
}

const MobileWalletContext = React.createContext<MobileWalletContextType>({
  deviceType: 'desktop',
  isInApp: false
});

export function useMobileWallet() {
  return React.useContext(MobileWalletContext);
}

// =============================================================================
// Enhanced Wallet Button for Mobile PWA
// =============================================================================

export function PWAWalletButton() {
  const { connected, connecting, publicKey, wallet } = useWallet();
  const { deviceType, isInApp } = useMobileWallet();
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);

  // Handle mobile wallet connection issues
  const handleMobileConnection = () => {
    if (deviceType === 'mobile' && !connected) {
      if (isInApp) {
        setShowMobileInstructions(true);
        return;
      }
      
      // Try to open wallet app directly
      if (wallet?.adapter.name === 'Phantom') {
        // Phantom mobile deep link
        const phantomUrl = `phantom://v1/connect?app_url=${encodeURIComponent(window.location.origin)}&redirect_link=${encodeURIComponent(window.location.href)}`;
        window.open(phantomUrl, '_blank');
      }
    }
  };

  if (showMobileInstructions) {
    return (
      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center justify-center gap-2">
          <StudyPayIcon name="mobile" size={16} />
          Mobile Wallet Instructions
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          For the best experience, please:
        </p>
        <ol className="text-sm text-yellow-700 text-left space-y-1 mb-3">
          <li>1. Install Phantom or Solflare wallet app</li>
          <li>2. Open StudyPay in your phone's browser (not in-app)</li>
          <li>3. Connect your wallet</li>
        </ol>
        <button
          onClick={() => setShowMobileInstructions(false)}
          className="bg-yellow-600 text-white px-4 py-2 rounded text-sm"
        >
          Got it!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <WalletMultiButton 
        className={`
          bg-solana-gradient hover:bg-solana-gradient-dark text-white font-medium py-2 px-4 rounded-lg
          transition-all duration-200 shadow-md hover:shadow-lg
          ${deviceType === 'mobile' ? 'w-full' : ''}
        `}
        onClick={handleMobileConnection}
      />
      
      {deviceType === 'mobile' && !connected && !connecting && (
        <p className="text-xs text-gray-500 text-center max-w-xs flex items-center justify-center gap-1">
          <StudyPayIcon name="mobile" size={12} />
          Mobile tip: Install Phantom or Solflare app for best experience
        </p>
      )}
      
      {connected && publicKey && (
        <div className="text-xs text-gray-400 font-mono">
          {deviceType === 'mobile' 
            ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
            : `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`
          }
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Mobile Wallet Status Indicator
// =============================================================================

export function MobileWalletStatus() {
  const { connected, connecting, wallet } = useWallet();
  const { deviceType } = useMobileWallet();

  if (connecting) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (connected && wallet) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm flex items-center gap-1">
          {wallet.adapter.name}
          <StudyPayIcon name={deviceType === 'mobile' ? 'mobile' : 'desktop'} size={12} />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-sm">Not connected</span>
    </div>
  );
}
