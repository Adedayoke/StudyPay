/**
 * Vendor Status Hook
 * Centralizes vendor open/closed logic used across multiple components
 */

import { useMemo } from 'react';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';

interface VendorStatus {
  isOpen: boolean;
  statusText: string;
  statusColor: string;
  nextStatusChange?: string;
}

export function useVendorStatus(vendor: VendorProfile): VendorStatus {
  return useMemo(() => {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const isOpen =
      vendor.operatingHours.days.includes(currentDay) &&
      currentTime >= vendor.operatingHours.open &&
      currentTime <= vendor.operatingHours.close;

    // Calculate next status change
    let nextStatusChange: string | undefined;
    if (isOpen) {
      nextStatusChange = `Closes at ${vendor.operatingHours.close}`;
    } else if (vendor.operatingHours.days.includes(currentDay)) {
      if (currentTime < vendor.operatingHours.open) {
        nextStatusChange = `Opens at ${vendor.operatingHours.open}`;
      } else {
        // Find next open day
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayIndex = days.indexOf(currentDay);
        
        for (let i = 1; i <= 7; i++) {
          const nextDayIndex = (currentDayIndex + i) % 7;
          const nextDay = days[nextDayIndex];
          
          if (vendor.operatingHours.days.includes(nextDay)) {
            const dayName = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
            nextStatusChange = `Opens ${dayName} at ${vendor.operatingHours.open}`;
            break;
          }
        }
      }
    } else {
      // Find next open day
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayIndex = days.indexOf(currentDay);
      
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = days[nextDayIndex];
        
        if (vendor.operatingHours.days.includes(nextDay)) {
          const dayName = nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
          nextStatusChange = `Opens ${dayName} at ${vendor.operatingHours.open}`;
          break;
        }
      }
    }

    return {
      isOpen,
      statusText: isOpen ? "Open" : "Closed",
      statusColor: isOpen ? "text-green-500" : "text-yellow-500",
      nextStatusChange
    };
  }, [vendor.operatingHours, vendor.id]); // Include vendor.id to ensure recalculation when vendor changes
}

/**
 * Hook for multiple vendors status
 */
export function useVendorsStatus(vendors: VendorProfile[]): Record<string, VendorStatus> {
  return useMemo(() => {
    const statusMap: Record<string, VendorStatus> = {};
    
    vendors.forEach(vendor => {
      const now = new Date();
      const currentDay = now
        .toLocaleDateString("en", { weekday: "long" })
        .toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5);

      const isOpen =
        vendor.operatingHours.days.includes(currentDay) &&
        currentTime >= vendor.operatingHours.open &&
        currentTime <= vendor.operatingHours.close;

      statusMap[vendor.id] = {
        isOpen,
        statusText: isOpen ? "Open" : "Closed",
        statusColor: isOpen ? "text-green-500" : "text-yellow-500",
      };
    });

    return statusMap;
  }, [vendors]);
}
