/**
 * Currency Formatter Hook
 * Handles currency conversion and formatting across the app
 */

'use client';

import { useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { usePriceConversion } from './usePriceConversion';
import { nairaToSolSync, solToNairaSync } from '@/lib/solana/utils';

export type CurrencyType = 'SOL' | 'NGN' | 'USD';

export interface CurrencyFormatter {
  // Conversion functions
  solToNaira: (amount: BigNumber) => BigNumber;
  nairaToSol: (amount: BigNumber) => BigNumber;

  // Formatting functions
  formatCurrency: (amount: BigNumber, currency: CurrencyType) => string;
  formatNaira: (amount: BigNumber) => string;
  formatSol: (amount: BigNumber) => string;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  isStale: boolean;
}

export function useCurrencyFormatter(): CurrencyFormatter {
  const { prices, isLoading, error, convertSolToNaira } = usePriceConversion();

  // Convert SOL to Naira
  const solToNaira = useCallback((amount: BigNumber): BigNumber => {
    try {
      return solToNairaSync(amount);
    } catch (error) {
      // Fallback to cached conversion
      return convertSolToNaira(amount).amount;
    }
  }, [convertSolToNaira]);

  // Convert Naira to SOL
  const nairaToSol = useCallback((amount: BigNumber): BigNumber => {
    try {
      return nairaToSolSync(amount);
    } catch (error) {
      // Fallback calculation using cached rate
      const solToNgnRate = convertSolToNaira(new BigNumber(1)).amount.toNumber();
      return amount.dividedBy(solToNgnRate);
    }
  }, [convertSolToNaira]);

  // Format currency amounts
  const formatCurrency = useCallback((amount: BigNumber, currency: CurrencyType): string => {
    switch (currency) {
      case 'SOL':
        return `${amount.toFixed(4)} SOL`;
      case 'NGN':
        return `₦${amount.toFormat(2)}`;
      case 'USD':
        // Approximate USD conversion (1 SOL ≈ $150)
        const usdAmount = amount.multipliedBy(150);
        return `$${usdAmount.toFixed(2)}`;
      default:
        return amount.toString();
    }
  }, []);

  // Format Naira specifically
  const formatNaira = useCallback((amount: BigNumber): string => {
    return `₦${amount.toFormat(2)}`;
  }, []);

  // Format SOL specifically
  const formatSol = useCallback((amount: BigNumber): string => {
    return `${amount.toFixed(4)} SOL`;
  }, []);

  return {
    // Conversion functions
    solToNaira,
    nairaToSol,

    // Formatting functions
    formatCurrency,
    formatNaira,
    formatSol,

    // Loading and error states
    isLoading,
    error,
    lastUpdated: prices.lastUpdated,
    isStale: prices.isStale,
  };
}