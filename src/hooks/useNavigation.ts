/**
 * Navigation Hook
 * Handles navigation state and mobile menu functionality
 */

'use client';

import { useState, useCallback } from 'react';

export interface NavigationState {
  activeTab: string;
  mobileMenuOpen: boolean;
  breadcrumbs: string[];
}

export interface NavigationActions {
  setActiveTab: (tab: string) => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  addBreadcrumb: (crumb: string) => void;
  clearBreadcrumbs: () => void;
  goBack: () => void;
}

export function useNavigation(initialTab: string = ''): NavigationState & NavigationActions {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const addBreadcrumb = useCallback((crumb: string) => {
    setBreadcrumbs(prev => [...prev, crumb]);
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  const goBack = useCallback(() => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(prev => prev.slice(0, -1));
    }
  }, [breadcrumbs]);

  return {
    // State
    activeTab,
    mobileMenuOpen,
    breadcrumbs,

    // Actions
    setActiveTab,
    toggleMobileMenu,
    openMobileMenu,
    closeMobileMenu,
    addBreadcrumb,
    clearBreadcrumbs,
    goBack,
  };
}