/**
 * Dynamic Vendor Registry System
 * Manages campus vendor registration, profiles, and discovery
 */

import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export interface VendorLocation {
  building: string;
  floor?: string;
  room?: string;
  description: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface VendorProfile {
  id: string;
  walletAddress: string;
  businessName: string;
  category: 'food' | 'books' | 'electronics' | 'services' | 'transport' | 'printing' | 'other';
  location: VendorLocation;
  description: string;
  contactInfo: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  operatingHours: {
    open: string; // "09:00"
    close: string; // "17:00"
    days: string[]; // ["monday", "tuesday", ...]
  };
  pricing: {
    acceptsCrypto: boolean;
    preferredCurrency: 'SOL' | 'USDC';
    minimumOrder?: BigNumber;
    averageOrderValue?: BigNumber;
  };
  verification: {
    isVerified: boolean;
    verifiedBy?: string;
    verificationDate?: Date;
    documents?: string[]; // Document hashes/references
  };
  rating: {
    average: number;
    totalReviews: number;
    lastReviewDate?: Date;
  };
  stats: {
    totalSales: BigNumber;
    totalTransactions: number;
    joinDate: Date;
    lastActiveDate: Date;
    popularItems?: string[];
  };
  images: {
    logo?: string;
    banner?: string;
    gallery?: string[];
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorSearchFilters {
  category?: string;
  location?: string;
  isOpen?: boolean;
  minRating?: number;
  acceptsCrypto?: boolean;
  searchTerm?: string;
}

export interface VendorMenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: BigNumber;
  currency: 'SOL' | 'USDC';
  category: string;
  isAvailable: boolean;
  images?: string[];
  estimatedPrepTime?: number; // minutes
  ingredients?: string[];
  allergens?: string[];
  nutritionInfo?: any;
  createdAt: Date;
}

const STORAGE_KEY = 'studypay_vendors';
const MENU_STORAGE_KEY = 'studypay_vendor_menus';

/**
 * Dynamic Vendor Registry Service
 */
export class VendorRegistry {
  private static instance: VendorRegistry;
  
  public static getInstance(): VendorRegistry {
    if (!VendorRegistry.instance) {
      VendorRegistry.instance = new VendorRegistry();
    }
    return VendorRegistry.instance;
  }

  /**
   * Register a new vendor
   */
  async registerVendor(vendorData: Omit<VendorProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<VendorProfile> {
    const vendors = this.getAllVendors();
    
    // Check if wallet already registered
    const existingVendor = vendors.find(v => v.walletAddress === vendorData.walletAddress);
    if (existingVendor) {
      throw new Error('Wallet address already registered as vendor');
    }

    const newVendor: VendorProfile = {
      ...vendorData,
      id: this.generateVendorId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    vendors.push(newVendor);
    this.saveVendors(vendors);
    
    console.log(`Vendor registered: ${newVendor.businessName} (${newVendor.id})`);
    return newVendor;
  }

  /**
   * Update vendor profile
   */
  async updateVendor(vendorId: string, updates: Partial<VendorProfile>): Promise<VendorProfile> {
    const vendors = this.getAllVendors();
    const index = vendors.findIndex(v => v.id === vendorId);
    
    if (index === -1) {
      throw new Error('Vendor not found');
    }

    const updatedVendor = {
      ...vendors[index],
      ...updates,
      updatedAt: new Date()
    };

    vendors[index] = updatedVendor;
    this.saveVendors(vendors);
    
    return updatedVendor;
  }

  /**
   * Get vendor by wallet address
   */
  getVendorByWallet(walletAddress: string): VendorProfile | null {
    const vendors = this.getAllVendors();
    return vendors.find(v => v.walletAddress === walletAddress) || null;
  }

  /**
   * Get vendor by ID
   */
  getVendorById(vendorId: string): VendorProfile | null {
    const vendors = this.getAllVendors();
    return vendors.find(v => v.id === vendorId) || null;
  }

  /**
   * Search vendors with filters
   */
  searchVendors(filters: VendorSearchFilters): VendorProfile[] {
    let vendors = this.getAllVendors();

    // Filter by active status
    vendors = vendors.filter(v => v.isActive);

    // Apply filters
    if (filters.category) {
      vendors = vendors.filter(v => v.category === filters.category);
    }

    if (filters.location) {
      vendors = vendors.filter(v => 
        v.location.building.toLowerCase().includes(filters.location!.toLowerCase()) ||
        v.location.description.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.minRating) {
      vendors = vendors.filter(v => v.rating.average >= filters.minRating!);
    }

    if (filters.acceptsCrypto !== undefined) {
      vendors = vendors.filter(v => v.pricing.acceptsCrypto === filters.acceptsCrypto);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      vendors = vendors.filter(v => 
        v.businessName.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term) ||
        v.location.description.toLowerCase().includes(term)
      );
    }

    if (filters.isOpen) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

      vendors = vendors.filter(v => {
        if (!v.operatingHours.days.includes(currentDay)) return false;
        return currentTime >= v.operatingHours.open && currentTime <= v.operatingHours.close;
      });
    }

    // Sort by rating and activity
    return vendors.sort((a, b) => {
      // Verified vendors first
      if (a.verification.isVerified && !b.verification.isVerified) return -1;
      if (!a.verification.isVerified && b.verification.isVerified) return 1;
      
      // Then by rating
      if (a.rating.average !== b.rating.average) {
        return b.rating.average - a.rating.average;
      }
      
      // Then by recent activity
      return b.stats.lastActiveDate.getTime() - a.stats.lastActiveDate.getTime();
    });
  }

  /**
   * Get vendors by category
   */
  getVendorsByCategory(category: string): VendorProfile[] {
    return this.searchVendors({ category });
  }

  /**
   * Get vendors by location
   */
  getVendorsByLocation(building: string): VendorProfile[] {
    return this.searchVendors({ location: building });
  }

  /**
   * Get all vendors
   */
  getAllVendors(): VendorProfile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return this.getInitialVendors();
      
      const parsed = JSON.parse(stored);
      return parsed.map((vendor: any) => ({
        ...vendor,
        pricing: {
          ...vendor.pricing,
          minimumOrder: vendor.pricing.minimumOrder ? new BigNumber(vendor.pricing.minimumOrder) : undefined,
          averageOrderValue: vendor.pricing.averageOrderValue ? new BigNumber(vendor.pricing.averageOrderValue) : undefined
        },
        stats: {
          ...vendor.stats,
          totalSales: new BigNumber(vendor.stats.totalSales),
          joinDate: new Date(vendor.stats.joinDate),
          lastActiveDate: new Date(vendor.stats.lastActiveDate)
        },
        verification: {
          ...vendor.verification,
          verificationDate: vendor.verification.verificationDate ? new Date(vendor.verification.verificationDate) : undefined
        },
        rating: {
          ...vendor.rating,
          lastReviewDate: vendor.rating.lastReviewDate ? new Date(vendor.rating.lastReviewDate) : undefined
        },
        createdAt: new Date(vendor.createdAt),
        updatedAt: new Date(vendor.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading vendors:', error);
      return this.getInitialVendors();
    }
  }

  /**
   * Save vendors to localStorage
   */
  private saveVendors(vendors: VendorProfile[]): void {
    try {
      const serializable = vendors.map(vendor => ({
        ...vendor,
        pricing: {
          ...vendor.pricing,
          minimumOrder: vendor.pricing.minimumOrder?.toString(),
          averageOrderValue: vendor.pricing.averageOrderValue?.toString()
        },
        stats: {
          ...vendor.stats,
          totalSales: vendor.stats.totalSales.toString(),
          joinDate: vendor.stats.joinDate.toISOString(),
          lastActiveDate: vendor.stats.lastActiveDate.toISOString()
        },
        verification: {
          ...vendor.verification,
          verificationDate: vendor.verification.verificationDate?.toISOString()
        },
        rating: {
          ...vendor.rating,
          lastReviewDate: vendor.rating.lastReviewDate?.toISOString()
        },
        createdAt: vendor.createdAt.toISOString(),
        updatedAt: vendor.updatedAt.toISOString()
      }));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving vendors:', error);
    }
  }

  /**
   * Generate unique vendor ID
   */
  private generateVendorId(): string {
    return `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initial vendor data for demo
   */
  private getInitialVendors(): VendorProfile[] {
    const now = new Date();
    
    return [
      {
        id: 'vendor_campus_cafe',
        walletAddress: 'CampusCafeVendor123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        businessName: 'Campus Café & Grill',
        category: 'food',
        location: {
          building: 'Student Union Building',
          floor: 'Ground Floor',
          room: 'Food Court A',
          description: 'Main food court, next to the bookstore'
        },
        description: 'Fresh Nigerian meals, snacks, and beverages. Popular for jollof rice, suya, and local delicacies.',
        contactInfo: {
          phone: '+234 809 123 4567',
          whatsapp: '+234 809 123 4567'
        },
        operatingHours: {
          open: '07:00',
          close: '20:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.01),
          averageOrderValue: new BigNumber(0.035)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Campus Administration',
          verificationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.6,
          totalReviews: 127
        },
        stats: {
          totalSales: new BigNumber(15.8),
          totalTransactions: 432,
          joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          popularItems: ['Jollof Rice Special', 'Chicken Suya', 'Cold Drinks']
        },
        images: {
          logo: '/vendors/campus-cafe-logo.jpg',
          banner: '/vendors/campus-cafe-banner.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'vendor_uni_books',
        walletAddress: 'UniBooksVendor456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123',
        businessName: 'UniBooks & Stationery',
        category: 'books',
        location: {
          building: 'Faculty of Arts',
          floor: '1st Floor',
          description: 'Academic bookstore and stationery supplies'
        },
        description: 'Textbooks, notebooks, stationery, and academic materials. Course books for all faculties.',
        contactInfo: {
          phone: '+234 803 987 6543',
          email: 'unibooks@campus.edu'
        },
        operatingHours: {
          open: '08:00',
          close: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          averageOrderValue: new BigNumber(0.15)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Academic Board',
          verificationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.3,
          totalReviews: 89
        },
        stats: {
          totalSales: new BigNumber(8.2),
          totalTransactions: 156,
          joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 5 * 60 * 60 * 1000),
          popularItems: ['Course Textbooks', 'Notebooks', 'Pens & Pencils']
        },
        images: {
          logo: '/vendors/uni-books-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
  }
}

// Export singleton instance
export const vendorRegistry = VendorRegistry.getInstance();
