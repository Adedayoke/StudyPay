/**
 * Live Price Conversion Hook
 * Provides real-time SOL to Naira conversion with caching and error handling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import BigNumber from 'bignumber.js';
import { solToNaira as asyncSolToNaira, nairaToSol as asyncNairaToSol, getSolPriceInfo, solToNairaSync, nairaToSolSync } from '@/lib/solana/utils';

interface PriceState {
  solToNgn: number;
  solToUsd: number;
  lastUpdated: number;
  isStale: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PriceConversionResult {
  amount: BigNumber;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  isStale: boolean;
}

export function usePriceConversion() {
  const [priceState, setPriceState] = useState<PriceState>({
    solToNgn: 50000, // Fallback rate
    solToUsd: 150,   // Fallback rate
    lastUpdated: 0,
    isStale: true,
    isLoading: false,
    error: null
  });

  // Load prices on mount and periodically refresh
  const loadPrices = useCallback(async () => {
    setPriceState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const priceInfo = await getSolPriceInfo();
      setPriceState({
        solToNgn: priceInfo.solToNgn,
        solToUsd: priceInfo.solToUsd,
        lastUpdated: priceInfo.lastUpdated,
        isStale: priceInfo.isStale,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setPriceState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load prices'
      }));
    }
  }, []);

  // Auto-refresh prices every 5 minutes
  useEffect(() => {
    loadPrices();

    const interval = setInterval(() => {
      loadPrices();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadPrices]);

  // Convert SOL to Naira
  const convertSolToNaira = useCallback((solAmount: BigNumber): PriceConversionResult => {
    try {
      const amount = solToNairaSync(solAmount);
      return {
        amount,
        isLoading: priceState.isLoading,
        error: priceState.error,
        lastUpdated: priceState.lastUpdated,
        isStale: priceState.isStale
      };
    } catch (error) {
      return {
        amount: solAmount.multipliedBy(300000), // Fallback
        isLoading: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
        lastUpdated: priceState.lastUpdated,
        isStale: true
      };
    }
  }, [priceState]);

  // Convert Naira to SOL
  const convertNairaToSol = useCallback((nairaAmount: BigNumber): PriceConversionResult => {
    try {
      const amount = nairaToSolSync(nairaAmount);
      return {
        amount,
        isLoading: priceState.isLoading,
        error: priceState.error,
        lastUpdated: priceState.lastUpdated,
        isStale: priceState.isStale
      };
    } catch (error) {
      return {
        amount: nairaAmount.dividedBy(50000), // Fallback
        isLoading: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
        lastUpdated: priceState.lastUpdated,
        isStale: true
      };
    }
  }, [priceState]);

  // Async conversion methods
  const convertSolToNairaAsync = useCallback(async (solAmount: BigNumber): Promise<BigNumber> => {
    return await asyncSolToNaira(solAmount);
  }, []);

  const convertNairaToSolAsync = useCallback(async (nairaAmount: BigNumber): Promise<BigNumber> => {
    return await asyncNairaToSol(nairaAmount);
  }, []);

  return {
    // Price state
    prices: {
      solToNgn: priceState.solToNgn,
      solToUsd: priceState.solToUsd,
      lastUpdated: priceState.lastUpdated,
      isStale: priceState.isStale
    },
    isLoading: priceState.isLoading,
    error: priceState.error,

    // Conversion methods
    convertSolToNaira,
    convertNairaToSol,
    convertSolToNairaAsync,
    convertNairaToSolAsync,

    // Utility methods
    refreshPrices: loadPrices,
    formatPrice: (amount: BigNumber, currency: 'SOL' | 'NGN' | 'USD') => {
      switch (currency) {
        case 'SOL':
          return `${amount.toFixed(4)} SOL`;
        case 'NGN':
          return `₦${amount.toFormat(2)}`;
        case 'USD':
          return `$${amount.toFixed(2)}`;
        default:
          return amount.toString();
      }
    }
  };
}

/**
 * Hook for displaying SOL amount with Naira equivalent
 */
export function useSolDisplay(solAmount: BigNumber) {
  const { convertSolToNaira, isLoading, error, prices } = usePriceConversion();

  const nairaEquivalent = convertSolToNaira(solAmount);

  return {
    solAmount,
    nairaAmount: nairaEquivalent.amount,
    displayText: `≈ ₦${nairaEquivalent.amount.toFixed(0)}`,
    isLoading,
    error,
    isStale: nairaEquivalent.isStale,
    lastUpdated: nairaEquivalent.lastUpdated,
    exchangeRate: prices.solToNgn
  };
}

/**
 * Hook for displaying Naira amount with SOL equivalent
 */
export function useNairaDisplay(nairaAmount: BigNumber) {
  const { convertNairaToSol, isLoading, error, prices } = usePriceConversion();

  const solEquivalent = convertNairaToSol(nairaAmount);

  return {
    nairaAmount,
    solAmount: solEquivalent.amount,
    displayText: `≈ ${solEquivalent.amount.toFixed(4)} SOL`,
    isLoading,
    error,
    isStale: solEquivalent.isStale,
    lastUpdated: solEquivalent.lastUpdated,
    exchangeRate: prices.solToNgn
  };
}