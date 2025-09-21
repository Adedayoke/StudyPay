/**
 * Data Loader Hook
 * Handles common data loading patterns with loading states, error handling, and refresh functionality
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

export interface DataLoaderState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastLoaded: number | null;
}

export interface DataLoaderActions<T> {
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setData: (data: T) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function useDataLoader<T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = [],
  autoLoad: boolean = true
): DataLoaderState<T> & DataLoaderActions<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);

  // Load data function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadFunction();
      setData(result);
      setLastLoaded(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Data loading error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadFunction]);

  // Refresh data function (similar to load but shows refreshing state)
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const result = await loadFunction();
      setData(result);
      setLastLoaded(Date.now());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      setError(errorMessage);
      console.error('Data refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadFunction]);

  // Manual data setter
  const setDataManual = useCallback((newData: T) => {
    setData(newData);
    setLastLoaded(Date.now());
    setError(null);
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsRefreshing(false);
    setError(null);
    setLastLoaded(null);
  }, []);

  // Auto-load effect
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, dependencies);

  return {
    // State
    data,
    isLoading,
    isRefreshing,
    error,
    lastLoaded,

    // Actions
    loadData,
    refreshData,
    setData: setDataManual,
    setError,
    reset,
  };
}