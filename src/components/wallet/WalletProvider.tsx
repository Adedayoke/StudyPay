/**
 * Wallet Connection Component
 * Clean, reusable wallet connection interface with proper error handling
 */

'use client';

import React, { useMemo } from 'react';
import { 
  ConnectionProvider, 
  WalletProvider,
  useWallet,
  useConnection 
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { 
  WalletModalProvider,
  WalletMultiButton,
  WalletDisconnectButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

import { usePriceConversion } from '@/hooks/usePriceConversion';

// =============================================================================
// Wallet Context Provider
// =============================================================================

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for hackathon
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Detect if user is on mobile - improved detection
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    // Check user agent for mobile devices
    const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    );
    
    // Check for touch capability (most mobile devices have touch)
    const hasTouchScreen = 'ontouchstart' in window || 
      (window.navigator && window.navigator.maxTouchPoints > 0);
    
    // Check screen width (tablets and small screens)
    const smallScreen = window.innerWidth <= 768;
    
    // Consider mobile if any of these conditions are true
    return userAgentMobile || (hasTouchScreen && smallScreen);
  }, []);

  // Configure supported wallets - prioritize mobile wallets on mobile devices
  const wallets = useMemo(
    () => {
      const phantom = new PhantomWalletAdapter();
      const solflare = new SolflareWalletAdapter();
      const trust = new TrustWalletAdapter();
      
      // On mobile, prioritize Solflare and Trust (mobile apps), then Phantom
      // On desktop, prioritize Phantom (extension), then Solflare and Trust
      return isMobile ? [solflare, trust, phantom] : [phantom, solflare, trust];
    },
    [isMobile]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// =============================================================================
// Wallet Connection Button
// =============================================================================

interface WalletButtonProps {
  variant?: 'connect' | 'disconnect';
  className?: string;
}

export function WalletButton({ variant = 'connect', className }: WalletButtonProps) {
  if (variant === 'disconnect') {
    return (
      <WalletDisconnectButton 
        className={`
          bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg
          transition-colors duration-200 ${className}
        `}
      />
    );
  }

  return (
    <WalletMultiButton 
      className={`
        bg-gradient-to-r from-purple-500 to-green-500 hover:from-purple-600 hover:to-green-600 
        text-white font-medium py-2 px-4 rounded-lg
        transition-all duration-200 shadow-md hover:shadow-lg ${className}
      `}
    />
  );
}

// =============================================================================
// Wallet Status Component
// =============================================================================

export function WalletStatus() {
  const { publicKey, connected, connecting } = useWallet();
  const { connection } = useConnection();
  const { convertSolToNaira } = usePriceConversion();
  const [balance, setBalance] = React.useState<number | null>(null);

  // Fetch balance when wallet connects
  React.useEffect(() => {
    if (connected && publicKey) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1000000000); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };

      fetchBalance();
      
      // Set up interval to update balance
      const interval = setInterval(fetchBalance, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, connection]);

  if (connecting) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-solana-purple-500"></div>
        <span className="text-xs md:text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="text-sm text-gray-500">
        Wallet not connected
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">Connected</span>
      </div>
      
      <div className="mt-1 text-xs text-green-700">
        <div>Address: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</div>
        {balance !== null && (
          <div className="space-y-1">
            <div>Balance: {balance.toFixed(4)} SOL</div>
            <div className="font-medium">
              ≈ ₦{convertSolToNaira(new BigNumber(balance)).amount.toFormat(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Wallet Guard Component
// =============================================================================

interface WalletGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="text-center py-8">
        {fallback || (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-6">
              You need to connect your wallet to use StudyPay
            </p>
            <WalletButton />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

// =============================================================================
// Custom Wallet Hook
// =============================================================================

export function useStudyPayWallet() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  const refreshBalance = React.useCallback(async () => {
    if (wallet.publicKey && wallet.connected) {
      setLoading(true);
      try {
        const balance = await connection.getBalance(wallet.publicKey);
        setBalance(balance / 1000000000); // Convert to SOL
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [wallet.publicKey, wallet.connected, connection]);

  React.useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return {
    ...wallet,
    balance,
    balanceLoading: loading,
    refreshBalance,
    connection,
  };
}
