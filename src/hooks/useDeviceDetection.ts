/**
 * Device Detection Hook
 * Centralizes mobile/desktop detection logic used across payment components
 */

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenWidth: number;
  userAgent: string;
  preferredPaymentMethod: 'mobile' | 'desktop';
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Default values for SSR
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenWidth: 1024,
      userAgent: '',
      preferredPaymentMethod: 'desktop'
    };
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      if (typeof window === 'undefined') return;

      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      
      // Mobile detection
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = screenWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window;
      
      const isMobile = isMobileUA || (isMobileScreen && isTouchDevice);
      const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (screenWidth > 768 && screenWidth <= 1024 && isTouchDevice);
      const isDesktop = !isMobile && !isTablet;

      // Determine preferred payment method
      // Mobile devices prefer Solana Pay (external wallet)
      // Desktop prefers direct wallet connection
      const preferredPaymentMethod: 'mobile' | 'desktop' = isMobile ? 'mobile' : 'desktop';

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth,
        userAgent,
        preferredPaymentMethod
      });
    };

    // Update on mount
    updateDeviceInfo();

    // Update on resize
    window.addEventListener('resize', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

/**
 * Simple hook that just returns mobile status
 * For components that only need to know if device is mobile
 */
export function useIsMobile(): boolean {
  const { isMobile } = useDeviceDetection();
  return isMobile;
}

/**
 * Hook for payment method preference
 * Returns the optimal payment method for the current device
 */
export function usePaymentMethod(): {
  preferredMethod: 'mobile' | 'desktop';
  isMobile: boolean;
  shouldUseSolanaPay: boolean;
} {
  const { isMobile, preferredPaymentMethod } = useDeviceDetection();
  
  return {
    preferredMethod: preferredPaymentMethod,
    isMobile,
    shouldUseSolanaPay: isMobile // Mobile devices should use Solana Pay
  };
}
