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
  products?: VendorMenuItem[]; // Menu items/products offered by this vendor
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
   * Initial vendor data for demo - University of Lagos Campus Vendors
   */
  private getInitialVendors(): VendorProfile[] {
    const now = new Date();

    return [
      // FOOD VENDORS (8 vendors)
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
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'cafe_jollof_special',
            vendorId: 'vendor_campus_cafe',
            name: 'Jollof Rice Special',
            description: 'Authentic Nigerian jollof rice with chicken, plantain, and coleslaw',
            price: new BigNumber(0.045),
            currency: 'SOL',
            category: 'Main Dishes',
            isAvailable: true,
            estimatedPrepTime: 15,
            ingredients: ['Rice', 'Chicken', 'Plantain', 'Coleslaw', 'Spices'],
            createdAt: new Date()
          },
          {
            id: 'cafe_chicken_suya',
            vendorId: 'vendor_campus_cafe',
            name: 'Chicken Suya',
            description: 'Grilled chicken skewers with spicy suya spice and onions',
            price: new BigNumber(0.025),
            currency: 'SOL',
            category: 'Grilled Items',
            isAvailable: true,
            estimatedPrepTime: 10,
            ingredients: ['Chicken', 'Suya Spice', 'Onions', 'Vegetables'],
            createdAt: new Date()
          },
          {
            id: 'cafe_cold_drink',
            vendorId: 'vendor_campus_cafe',
            name: 'Cold Drink',
            description: 'Refreshing cold drinks - Coke, Fanta, Sprite, or Malt',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Soft Drink'],
            createdAt: new Date()
          },
          {
            id: 'cafe_beef_pie',
            vendorId: 'vendor_campus_cafe',
            name: 'Beef Pie',
            description: 'Flaky pastry filled with seasoned ground beef and vegetables',
            price: new BigNumber(0.015),
            currency: 'SOL',
            category: 'Snacks',
            isAvailable: true,
            estimatedPrepTime: 5,
            ingredients: ['Pastry', 'Ground Beef', 'Vegetables', 'Spices'],
            createdAt: new Date()
          },
          {
            id: 'cafe_fried_rice',
            vendorId: 'vendor_campus_cafe',
            name: 'Fried Rice with Chicken',
            description: 'Vegetable fried rice with tender chicken pieces and fried plantain',
            price: new BigNumber(0.035),
            currency: 'SOL',
            category: 'Main Dishes',
            isAvailable: true,
            estimatedPrepTime: 12,
            ingredients: ['Rice', 'Chicken', 'Vegetables', 'Plantain', 'Eggs'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_mama_adunni_kitchen',
        walletAddress: 'MamaAdunniKitchen987654321ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        businessName: 'Mama Adunni\'s Kitchen',
        category: 'food',
        location: {
          building: 'Faculty of Science',
          floor: 'Ground Floor',
          description: 'Near the science lecture halls, popular with science students'
        },
        description: 'Authentic Nigerian cuisine with fresh ingredients. Specializes in pounded yam, egusi soup, and traditional dishes.',
        contactInfo: {
          phone: '+234 803 456 7890',
          whatsapp: '+234 803 456 7890'
        },
        operatingHours: {
          open: '06:30',
          close: '19:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.015),
          averageOrderValue: new BigNumber(0.045)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Student Affairs',
          verificationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.8,
          totalReviews: 203
        },
        stats: {
          totalSales: new BigNumber(22.4),
          totalTransactions: 567,
          joinDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
          popularItems: ['Pounded Yam & Egusi', 'Jollof Rice', 'Moi Moi']
        },
        images: {
          logo: '/vendors/mama-adunni-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'adunni_pounded_yam_egusi',
            vendorId: 'vendor_mama_adunni_kitchen',
            name: 'Pounded Yam & Egusi Soup',
            description: 'Fresh pounded yam with rich egusi soup, goat meat, and traditional spices',
            price: new BigNumber(0.055),
            currency: 'SOL',
            category: 'Traditional Nigerian',
            isAvailable: true,
            estimatedPrepTime: 20,
            ingredients: ['Yam', 'Egusi Seeds', 'Goat Meat', 'Palm Oil', 'Spices'],
            createdAt: new Date()
          },
          {
            id: 'adunni_jollof_rice',
            vendorId: 'vendor_mama_adunni_kitchen',
            name: 'Jollof Rice Special',
            description: 'Authentic Nigerian jollof rice with chicken, plantain, and fresh salad',
            price: new BigNumber(0.042),
            currency: 'SOL',
            category: 'Rice Dishes',
            isAvailable: true,
            estimatedPrepTime: 18,
            ingredients: ['Rice', 'Chicken', 'Tomatoes', 'Plantain', 'Salad'],
            createdAt: new Date()
          },
          {
            id: 'adunni_moi_moi',
            vendorId: 'vendor_mama_adunni_kitchen',
            name: 'Moi Moi (Bean Pudding)',
            description: 'Steamed bean pudding with fish, boiled eggs, and traditional seasoning',
            price: new BigNumber(0.018),
            currency: 'SOL',
            category: 'Snacks',
            isAvailable: true,
            estimatedPrepTime: 25,
            ingredients: ['Beans', 'Fish', 'Eggs', 'Palm Oil', 'Spices'],
            createdAt: new Date()
          },
          {
            id: 'adunni_afang_soup',
            vendorId: 'vendor_mama_adunni_kitchen',
            name: 'Afang Soup with Garri',
            description: 'Traditional Efik soup with afang leaves, waterleaf, and assorted meat',
            price: new BigNumber(0.048),
            currency: 'SOL',
            category: 'Soups',
            isAvailable: true,
            estimatedPrepTime: 22,
            ingredients: ['Afang Leaves', 'Waterleaf', 'Assorted Meat', 'Palm Oil'],
            createdAt: new Date()
          },
          {
            id: 'adunni_fresh_zobo',
            vendorId: 'vendor_mama_adunni_kitchen',
            name: 'Fresh Zobo Drink',
            description: 'Refreshing hibiscus drink with pineapple and ginger',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Hibiscus', 'Pineapple', 'Ginger', 'Sugar'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_student_snacks',
        walletAddress: 'StudentSnacksVendor456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123',
        businessName: 'Student Snacks Hub',
        category: 'food',
        location: {
          building: 'Central Library',
          floor: 'Ground Floor',
          description: 'Convenient location for study breaks'
        },
        description: 'Quick snacks, pastries, and beverages for students. Fresh bread, doughnuts, and cold drinks.',
        contactInfo: {
          phone: '+234 802 345 6789'
        },
        operatingHours: {
          open: '08:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.005),
          averageOrderValue: new BigNumber(0.012)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Library Administration',
          verificationDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.4,
          totalReviews: 89
        },
        stats: {
          totalSales: new BigNumber(5.2),
          totalTransactions: 423,
          joinDate: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 30 * 60 * 1000),
          popularItems: ['Fresh Doughnuts', 'Cold Drinks', 'Meat Pies']
        },
        images: {
          logo: '/vendors/student-snacks-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'snacks_fresh_doughnut',
            vendorId: 'vendor_student_snacks',
            name: 'Fresh Doughnut',
            description: 'Warm, freshly baked doughnut with sugar coating',
            price: new BigNumber(0.006),
            currency: 'SOL',
            category: 'Pastries',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Flour', 'Sugar', 'Eggs', 'Milk', 'Yeast'],
            createdAt: new Date()
          },
          {
            id: 'snacks_meat_pie',
            vendorId: 'vendor_student_snacks',
            name: 'Meat Pie',
            description: 'Flaky pastry filled with seasoned minced meat and vegetables',
            price: new BigNumber(0.012),
            currency: 'SOL',
            category: 'Savory Snacks',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Pastry', 'Minced Meat', 'Vegetables', 'Spices'],
            createdAt: new Date()
          },
          {
            id: 'snacks_cold_drink',
            vendorId: 'vendor_student_snacks',
            name: 'Cold Soft Drink',
            description: 'Chilled Coke, Fanta, Sprite, or Maltina',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Soft Drink'],
            createdAt: new Date()
          },
          {
            id: 'snacks_fresh_bread',
            vendorId: 'vendor_student_snacks',
            name: 'Fresh Bread',
            description: 'Soft, freshly baked bread loaf or rolls',
            price: new BigNumber(0.015),
            currency: 'SOL',
            category: 'Bakery',
            isAvailable: true,
            estimatedPrepTime: 5,
            ingredients: ['Flour', 'Yeast', 'Water', 'Salt'],
            createdAt: new Date()
          },
          {
            id: 'snacks_chocolate_croissant',
            vendorId: 'vendor_student_snacks',
            name: 'Chocolate Croissant',
            description: 'Buttery croissant filled with rich chocolate',
            price: new BigNumber(0.010),
            currency: 'SOL',
            category: 'Pastries',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Flour', 'Butter', 'Chocolate', 'Sugar'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_cafe_one',
        walletAddress: 'CafeOneVendor789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
        businessName: 'Café One',
        category: 'food',
        location: {
          building: 'New Hall',
          floor: 'Ground Floor',
          description: 'Modern café serving international and local cuisine'
        },
        description: 'Contemporary café with WiFi, modern seating, and diverse menu including burgers, pizza, and Nigerian dishes.',
        contactInfo: {
          phone: '+234 701 234 5678',
          email: 'cafeone@unilag.edu.ng'
        },
        operatingHours: {
          open: '07:00',
          close: '22:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.02),
          averageOrderValue: new BigNumber(0.055)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Hall Management',
          verificationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.7,
          totalReviews: 156
        },
        stats: {
          totalSales: new BigNumber(18.9),
          totalTransactions: 389,
          joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 45 * 60 * 1000),
          popularItems: ['Chicken Burger', 'Pizza Slice', 'Smoothies']
        },
        images: {
          logo: '/vendors/cafe-one-logo.jpg',
          banner: '/vendors/cafe-one-banner.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'cafe_cappuccino',
            vendorId: 'vendor_cafe_one',
            name: 'Cappuccino',
            description: 'Rich espresso with steamed milk and foam',
            price: new BigNumber(0.018),
            currency: 'SOL',
            category: 'Coffee',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Espresso', 'Milk', 'Foam'],
            createdAt: new Date()
          },
          {
            id: 'cafe_latte',
            vendorId: 'vendor_cafe_one',
            name: 'Latte',
            description: 'Smooth espresso with steamed milk',
            price: new BigNumber(0.016),
            currency: 'SOL',
            category: 'Coffee',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Espresso', 'Milk'],
            createdAt: new Date()
          },
          {
            id: 'cafe_americano',
            vendorId: 'vendor_cafe_one',
            name: 'Americano',
            description: 'Espresso diluted with hot water',
            price: new BigNumber(0.012),
            currency: 'SOL',
            category: 'Coffee',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Espresso', 'Hot Water'],
            createdAt: new Date()
          },
          {
            id: 'cafe_sandwich',
            vendorId: 'vendor_cafe_one',
            name: 'Club Sandwich',
            description: 'Triple-decker sandwich with chicken, bacon, and veggies',
            price: new BigNumber(0.025),
            currency: 'SOL',
            category: 'Sandwiches',
            isAvailable: true,
            estimatedPrepTime: 5,
            ingredients: ['Bread', 'Chicken', 'Bacon', 'Lettuce', 'Tomato', 'Mayo'],
            createdAt: new Date()
          },
          {
            id: 'cafe_muffin',
            vendorId: 'vendor_cafe_one',
            name: 'Blueberry Muffin',
            description: 'Fresh baked muffin with blueberries',
            price: new BigNumber(0.010),
            currency: 'SOL',
            category: 'Pastries',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Flour', 'Blueberries', 'Sugar', 'Eggs'],
            createdAt: new Date()
          }
        ]
      },

      // BOOKS & STATIONERY (3 vendors)
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
      },
      {
        id: 'vendor_academic_supplies',
        walletAddress: 'AcademicSuppliesVendor123ABCDEFGHIJKLMNOPQRSTUVWXYZ456',
        businessName: 'Academic Supplies Plus',
        category: 'books',
        location: {
          building: 'Central Library',
          floor: '2nd Floor',
          description: 'Specialized academic materials and research supplies'
        },
        description: 'Research materials, academic journals, calculators, and specialized stationery for serious students.',
        contactInfo: {
          phone: '+234 802 567 8901',
          email: 'academic@unilag.edu.ng'
        },
        operatingHours: {
          open: '08:30',
          close: '16:30',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          averageOrderValue: new BigNumber(0.08)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Library Administration',
          verificationDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.5,
          totalReviews: 67
        },
        stats: {
          totalSales: new BigNumber(6.1),
          totalTransactions: 98,
          joinDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
          popularItems: ['Scientific Calculator', 'Research Papers', 'Art Supplies']
        },
        images: {
          logo: '/vendors/academic-supplies-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },

      // SERVICES (3 vendors)
      {
        id: 'vendor_campus_laundry',
        walletAddress: 'CampusLaundryVendor789ABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        businessName: 'Campus Laundry Services',
        category: 'services',
        location: {
          building: 'New Hall',
          floor: 'Basement',
          description: 'Professional laundry and dry cleaning services'
        },
        description: 'Fast, reliable laundry services for students. Wash, dry, and fold services with same-day pickup.',
        contactInfo: {
          phone: '+234 803 678 9012',
          whatsapp: '+234 803 678 9012'
        },
        operatingHours: {
          open: '07:00',
          close: '20:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.025),
          averageOrderValue: new BigNumber(0.065)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Hall Management',
          verificationDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.2,
          totalReviews: 134
        },
        stats: {
          totalSales: new BigNumber(9.8),
          totalTransactions: 178,
          joinDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
          popularItems: ['Wash & Fold', 'Dry Cleaning', 'Ironing Service']
        },
        images: {
          logo: '/vendors/campus-laundry-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'vendor_printing_services',
        walletAddress: 'PrintingServicesVendor456ABCDEFGHIJKLMNOPQRSTUVWXYZ789',
        businessName: 'QuickPrint Campus',
        category: 'services',
        location: {
          building: 'Student Union Building',
          floor: '1st Floor',
          description: 'Fast printing, photocopying, and binding services'
        },
        description: 'High-quality printing services for assignments, projects, and documents. Color and black & white printing.',
        contactInfo: {
          phone: '+234 802 789 0123',
          email: 'print@unilag.edu.ng'
        },
        operatingHours: {
          open: '08:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.008),
          averageOrderValue: new BigNumber(0.022)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Student Affairs',
          verificationDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.4,
          totalReviews: 98
        },
        stats: {
          totalSales: new BigNumber(4.3),
          totalTransactions: 245,
          joinDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          popularItems: ['Color Printing', 'Project Binding', 'Photocopying']
        },
        images: {
          logo: '/vendors/quickprint-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },

      // TRANSPORT (2 vendors)
      {
        id: 'vendor_campus_transport',
        walletAddress: 'CampusTransportVendor012ABCDEFGHIJKLMNOPQRSTUVWXYZ345',
        businessName: 'Campus Shuttle Services',
        category: 'transport',
        location: {
          building: 'Transport Hub',
          floor: 'Ground Floor',
          description: 'Official campus transportation services'
        },
        description: 'Safe and reliable transportation within campus and to nearby areas. Scheduled shuttle services.',
        contactInfo: {
          phone: '+234 803 890 1234',
          whatsapp: '+234 803 890 1234'
        },
        operatingHours: {
          open: '06:00',
          close: '22:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.012),
          averageOrderValue: new BigNumber(0.028)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Transport Department',
          verificationDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.6,
          totalReviews: 312
        },
        stats: {
          totalSales: new BigNumber(12.7),
          totalTransactions: 489,
          joinDate: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 30 * 60 * 1000),
          popularItems: ['Campus Shuttle', 'Airport Transfer', 'Night Service']
        },
        images: {
          logo: '/vendors/campus-transport-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },

      // ELECTRONICS (2 vendors)
      {
        id: 'vendor_tech_hub',
        walletAddress: 'TechHubVendor678ABCDEFGHIJKLMNOPQRSTUVWXYZ901',
        businessName: 'TechHub Campus',
        category: 'electronics',
        location: {
          building: 'Faculty of Engineering',
          floor: 'Ground Floor',
          description: 'Electronics, gadgets, and tech accessories for students'
        },
        description: 'Latest gadgets, phone accessories, laptops, and electronic components. Tech repair services available.',
        contactInfo: {
          phone: '+234 802 901 2345',
          email: 'techhub@unilag.edu.ng'
        },
        operatingHours: {
          open: '09:00',
          close: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          averageOrderValue: new BigNumber(0.25)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Engineering Faculty',
          verificationDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.5,
          totalReviews: 76
        },
        stats: {
          totalSales: new BigNumber(14.2),
          totalTransactions: 67,
          joinDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
          popularItems: ['Phone Chargers', 'Laptop Accessories', 'Headphones']
        },
        images: {
          logo: '/vendors/techhub-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },

      // PRINTING (1 vendor)
      {
        id: 'vendor_digital_printing',
        walletAddress: 'DigitalPrintingVendor234ABCDEFGHIJKLMNOPQRSTUVWXYZ567',
        businessName: 'Digital Print Center',
        category: 'printing',
        location: {
          building: 'Central Library',
          floor: '1st Floor',
          description: 'Advanced digital printing and design services'
        },
        description: 'Professional printing services including banners, posters, business cards, and custom designs.',
        contactInfo: {
          phone: '+234 803 012 3456',
          email: 'digitalprint@unilag.edu.ng'
        },
        operatingHours: {
          open: '08:00',
          close: '16:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          averageOrderValue: new BigNumber(0.045)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Library Administration',
          verificationDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.3,
          totalReviews: 45
        },
        stats: {
          totalSales: new BigNumber(3.8),
          totalTransactions: 92,
          joinDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
          popularItems: ['Posters', 'Business Cards', 'Banners']
        },
        images: {
          logo: '/vendors/digital-print-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },

      // ADDITIONAL FOOD VENDORS (4 more to reach 8 total)
      {
        id: 'vendor_fresh_fruits',
        walletAddress: 'FreshFruitsVendor890ABCDEFGHIJKLMNOPQRSTUVWXYZ123',
        businessName: 'Fresh Fruits & Juices',
        category: 'food',
        location: {
          building: 'Sports Complex',
          floor: 'Ground Floor',
          description: 'Healthy snacks and fresh fruit juices'
        },
        description: 'Fresh tropical fruits, smoothies, and healthy snacks. Perfect for athletes and health-conscious students.',
        contactInfo: {
          phone: '+234 802 123 4567'
        },
        operatingHours: {
          open: '07:00',
          close: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.008),
          averageOrderValue: new BigNumber(0.018)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Sports Department',
          verificationDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.4,
          totalReviews: 78
        },
        stats: {
          totalSales: new BigNumber(2.9),
          totalTransactions: 167,
          joinDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
          popularItems: ['Fresh Pineapple', 'Banana Smoothie', 'Orange Juice']
        },
        images: {
          logo: '/vendors/fresh-fruits-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'fruits_pineapple',
            vendorId: 'vendor_fresh_fruits',
            name: 'Fresh Pineapple',
            description: 'Sweet, juicy pineapple chunks',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Fruits',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Pineapple'],
            createdAt: new Date()
          },
          {
            id: 'fruits_banana_smoothie',
            vendorId: 'vendor_fresh_fruits',
            name: 'Banana Smoothie',
            description: 'Creamy smoothie made with fresh bananas and milk',
            price: new BigNumber(0.012),
            currency: 'SOL',
            category: 'Smoothies',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Banana', 'Milk', 'Honey'],
            createdAt: new Date()
          },
          {
            id: 'fruits_orange_juice',
            vendorId: 'vendor_fresh_fruits',
            name: 'Fresh Orange Juice',
            description: 'Freshly squeezed orange juice',
            price: new BigNumber(0.010),
            currency: 'SOL',
            category: 'Juices',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Oranges'],
            createdAt: new Date()
          },
          {
            id: 'fruits_mixed_fruit_platter',
            vendorId: 'vendor_fresh_fruits',
            name: 'Mixed Fruit Platter',
            description: 'Assortment of seasonal tropical fruits',
            price: new BigNumber(0.015),
            currency: 'SOL',
            category: 'Platters',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Pineapple', 'Banana', 'Orange', 'Watermelon'],
            createdAt: new Date()
          },
          {
            id: 'fruits_coconut_water',
            vendorId: 'vendor_fresh_fruits',
            name: 'Fresh Coconut Water',
            description: 'Natural coconut water straight from the coconut',
            price: new BigNumber(0.009),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Coconut'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_fast_food_corner',
        walletAddress: 'FastFoodCornerVendor567ABCDEFGHIJKLMNOPQRSTUVWXYZ890',
        businessName: 'Fast Food Corner',
        category: 'food',
        location: {
          building: 'Medical Center',
          floor: 'Ground Floor',
          description: 'Quick meals for busy students and staff'
        },
        description: 'Burgers, fries, chicken, and quick Nigerian snacks. Fast service for students on the go.',
        contactInfo: {
          phone: '+234 803 234 5678'
        },
        operatingHours: {
          open: '08:00',
          close: '20:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.012),
          averageOrderValue: new BigNumber(0.032)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Medical Center',
          verificationDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.1,
          totalReviews: 145
        },
        stats: {
          totalSales: new BigNumber(7.6),
          totalTransactions: 289,
          joinDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 45 * 60 * 1000),
          popularItems: ['Chicken Burger', 'French Fries', 'Soft Drinks']
        },
        images: {
          logo: '/vendors/fast-food-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'fast_chicken_burger',
            vendorId: 'vendor_fast_food_corner',
            name: 'Chicken Burger',
            description: 'Grilled chicken patty with lettuce, tomato, and mayo',
            price: new BigNumber(0.020),
            currency: 'SOL',
            category: 'Burgers',
            isAvailable: true,
            estimatedPrepTime: 5,
            ingredients: ['Chicken Patty', 'Bun', 'Lettuce', 'Tomato', 'Mayo'],
            createdAt: new Date()
          },
          {
            id: 'fast_french_fries',
            vendorId: 'vendor_fast_food_corner',
            name: 'French Fries',
            description: 'Crispy golden fries with seasoning',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Sides',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Potatoes', 'Oil', 'Salt'],
            createdAt: new Date()
          },
          {
            id: 'fast_soft_drink',
            vendorId: 'vendor_fast_food_corner',
            name: 'Soft Drink',
            description: 'Coke, Fanta, Sprite, or Maltina',
            price: new BigNumber(0.006),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Soft Drink'],
            createdAt: new Date()
          },
          {
            id: 'fast_chicken_nuggets',
            vendorId: 'vendor_fast_food_corner',
            name: 'Chicken Nuggets',
            description: 'Crispy chicken nuggets with dipping sauce',
            price: new BigNumber(0.015),
            currency: 'SOL',
            category: 'Chicken',
            isAvailable: true,
            estimatedPrepTime: 4,
            ingredients: ['Chicken', 'Breading', 'Oil'],
            createdAt: new Date()
          },
          {
            id: 'fast_fish_roll',
            vendorId: 'vendor_fast_food_corner',
            name: 'Fish Roll',
            description: 'Nigerian fish roll with fish filling',
            price: new BigNumber(0.010),
            currency: 'SOL',
            category: 'Snacks',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Fish', 'Pastry', 'Vegetables'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_healthy_eats',
        walletAddress: 'HealthyEatsVendor123ABCDEFGHIJKLMNOPQRSTUVWXYZ456',
        businessName: 'Healthy Eats Café',
        category: 'food',
        location: {
          building: 'Faculty of Social Sciences',
          floor: 'Ground Floor',
          description: 'Nutritious meals and healthy alternatives'
        },
        description: 'Healthy, balanced meals with fresh ingredients. Salads, wraps, and nutritious Nigerian dishes.',
        contactInfo: {
          phone: '+234 802 345 6789',
          whatsapp: '+234 802 345 6789'
        },
        operatingHours: {
          open: '08:00',
          close: '16:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.018),
          averageOrderValue: new BigNumber(0.042)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Faculty Administration',
          verificationDate: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.5,
          totalReviews: 92
        },
        stats: {
          totalSales: new BigNumber(6.4),
          totalTransactions: 156,
          joinDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          popularItems: ['Grilled Chicken Salad', 'Veggie Wrap', 'Smoothie Bowl']
        },
        images: {
          logo: '/vendors/healthy-eats-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'healthy_grilled_chicken_salad',
            vendorId: 'vendor_healthy_eats',
            name: 'Grilled Chicken Salad',
            description: 'Grilled chicken breast with mixed greens, tomatoes, and light dressing',
            price: new BigNumber(0.025),
            currency: 'SOL',
            category: 'Salads',
            isAvailable: true,
            estimatedPrepTime: 5,
            ingredients: ['Chicken Breast', 'Mixed Greens', 'Tomatoes', 'Cucumber', 'Light Dressing'],
            createdAt: new Date()
          },
          {
            id: 'healthy_veggie_wrap',
            vendorId: 'vendor_healthy_eats',
            name: 'Veggie Wrap',
            description: 'Whole wheat wrap with fresh vegetables and hummus',
            price: new BigNumber(0.018),
            currency: 'SOL',
            category: 'Wraps',
            isAvailable: true,
            estimatedPrepTime: 4,
            ingredients: ['Whole Wheat Wrap', 'Lettuce', 'Tomatoes', 'Cucumber', 'Hummus'],
            createdAt: new Date()
          },
          {
            id: 'healthy_smoothie_bowl',
            vendorId: 'vendor_healthy_eats',
            name: 'Smoothie Bowl',
            description: 'Thick smoothie topped with fresh fruits and granola',
            price: new BigNumber(0.020),
            currency: 'SOL',
            category: 'Smoothies',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Banana', 'Berries', 'Yogurt', 'Granola', 'Honey'],
            createdAt: new Date()
          },
          {
            id: 'healthy_quinoa_bowl',
            vendorId: 'vendor_healthy_eats',
            name: 'Quinoa Power Bowl',
            description: 'Quinoa with roasted vegetables and avocado',
            price: new BigNumber(0.022),
            currency: 'SOL',
            category: 'Bowls',
            isAvailable: true,
            estimatedPrepTime: 6,
            ingredients: ['Quinoa', 'Broccoli', 'Carrots', 'Avocado', 'Olive Oil'],
            createdAt: new Date()
          },
          {
            id: 'healthy_green_juice',
            vendorId: 'vendor_healthy_eats',
            name: 'Green Detox Juice',
            description: 'Fresh green juice with spinach, cucumber, and lemon',
            price: new BigNumber(0.015),
            currency: 'SOL',
            category: 'Juices',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Spinach', 'Cucumber', 'Lemon', 'Ginger'],
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'vendor_night_cafe',
        walletAddress: 'NightCafeVendor789ABCDEFGHIJKLMNOPQRSTUVWXYZ012',
        businessName: 'Night Café',
        category: 'food',
        location: {
          building: 'New Hall',
          floor: 'Ground Floor',
          description: 'Late-night snacks and beverages for night owls'
        },
        description: 'Late-night café serving snacks, coffee, and light meals. Perfect for late study sessions.',
        contactInfo: {
          phone: '+234 803 456 7890'
        },
        operatingHours: {
          open: '20:00',
          close: '02:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        pricing: {
          acceptsCrypto: true,
          preferredCurrency: 'SOL',
          minimumOrder: new BigNumber(0.01),
          averageOrderValue: new BigNumber(0.025)
        },
        verification: {
          isVerified: true,
          verifiedBy: 'Hall Management',
          verificationDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
        },
        rating: {
          average: 4.3,
          totalReviews: 67
        },
        stats: {
          totalSales: new BigNumber(4.1),
          totalTransactions: 178,
          joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lastActiveDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
          popularItems: ['Coffee', 'Sandwiches', 'Energy Drinks']
        },
        images: {
          logo: '/vendors/night-cafe-logo.jpg'
        },
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        products: [
          {
            id: 'night_late_night_coffee',
            vendorId: 'vendor_night_cafe',
            name: 'Late Night Coffee',
            description: 'Strong espresso coffee to keep you awake during study sessions',
            price: new BigNumber(0.012),
            currency: 'SOL',
            category: 'Coffee',
            isAvailable: true,
            estimatedPrepTime: 2,
            ingredients: ['Espresso', 'Hot Water'],
            createdAt: new Date()
          },
          {
            id: 'night_energy_drink',
            vendorId: 'vendor_night_cafe',
            name: 'Energy Drink',
            description: 'Caffeinated energy drink for late-night studying',
            price: new BigNumber(0.008),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Energy Drink'],
            createdAt: new Date()
          },
          {
            id: 'night_midnight_sandwich',
            vendorId: 'vendor_night_cafe',
            name: 'Midnight Sandwich',
            description: 'Quick turkey and cheese sandwich for late-night hunger',
            price: new BigNumber(0.018),
            currency: 'SOL',
            category: 'Sandwiches',
            isAvailable: true,
            estimatedPrepTime: 4,
            ingredients: ['Bread', 'Turkey', 'Cheese', 'Lettuce', 'Mayo'],
            createdAt: new Date()
          },
          {
            id: 'night_chips',
            vendorId: 'vendor_night_cafe',
            name: 'Potato Chips',
            description: 'Crispy potato chips in various flavors',
            price: new BigNumber(0.006),
            currency: 'SOL',
            category: 'Snacks',
            isAvailable: true,
            estimatedPrepTime: 1,
            ingredients: ['Potato Chips'],
            createdAt: new Date()
          },
          {
            id: 'night_hot_chocolate',
            vendorId: 'vendor_night_cafe',
            name: 'Hot Chocolate',
            description: 'Warm hot chocolate to comfort you during late study sessions',
            price: new BigNumber(0.010),
            currency: 'SOL',
            category: 'Beverages',
            isAvailable: true,
            estimatedPrepTime: 3,
            ingredients: ['Milk', 'Chocolate', 'Sugar'],
            createdAt: new Date()
          }
        ]
      }
    ];
  }
}

// Export singleton instance
export const vendorRegistry = VendorRegistry.getInstance();
