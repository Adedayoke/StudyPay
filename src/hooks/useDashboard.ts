/**
 * Common Dashboard Hook
 * Extracts shared dashboard functionality across all user types
 */

'use client';

import { useState } from 'react';
import { useStudyPayWallet } from '@/components/wallet/WalletProvider';
import BigNumber from 'bignumber.js';

export type DashboardTab = string;

export interface DashboardState<T extends DashboardTab> {
  // Wallet state
  balance: BigNumber;
  connected: boolean;
  publicKey: any; // Solana PublicKey object
  refreshBalance: () => Promise<void>;

  // Navigation state
  activeTab: T;
  setActiveTab: (tab: T) => void;

  // Mobile menu state
  navMenu: boolean;
  setNavMenu: (open: boolean) => void;
}

export function useDashboard<T extends DashboardTab>(defaultTab: T): DashboardState<T> {
  const { balance, connected, publicKey, refreshBalance } = useStudyPayWallet();
  const [activeTab, setActiveTab] = useState<T>(defaultTab);
  const [navMenu, setNavMenu] = useState(false);

  return {
    // Wallet state
    balance: new BigNumber(balance),
    connected,
    publicKey,
    refreshBalance,

    // Navigation state
    activeTab,
    setActiveTab,

    // Mobile menu state
    navMenu,
    setNavMenu,
  };
}