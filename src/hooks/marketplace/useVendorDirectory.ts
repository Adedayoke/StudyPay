import { useState, useCallback, useMemo } from 'react';

export interface Vendor {
  id: string;
  name: string;
  description: string;
  category: 'food' | 'books' | 'supplies' | 'services' | 'electronics';
  location: {
    building: string;
    floor?: string;
    coordinates?: { lat: number; lng: number };
  };
  rating: number;
  reviewCount: number;
  isActive: boolean;
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  walletAddress: string;
  profileImage?: string;
  coverImage?: string;
  contact: {
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
  verificationStatus: 'verified' | 'pending' | 'unverified';
  joinedDate: Date;
  totalSales?: number;
  averageResponseTime?: string;
}

interface VendorFilters {
  category?: Vendor['category'];
  location?: string;
  rating?: number;
  isActiveOnly?: boolean;
  searchQuery?: string;
}

interface VendorDirectoryState {
  vendors: Vendor[];
  filteredVendors: Vendor[];
  filters: VendorFilters;
  isLoading: boolean;
  error: string | null;
  selectedVendor: Vendor | null;
}

export function useVendorDirectory() {
  const [state, setState] = useState<VendorDirectoryState>({
    vendors: [],
    filteredVendors: [],
    filters: {},
    isLoading: false,
    error: null,
    selectedVendor: null,
  });

  // Mock vendor data for marketplace demonstration
  const mockVendors: Vendor[] = useMemo(() => [
    {
      id: 'vendor-1',
      name: 'Campus Café & Grill',
      description: 'Fresh meals, snacks, and beverages for students. Famous for our jollof rice and suya!',
      category: 'food',
      location: {
        building: 'Student Union Building',
        floor: 'Ground Floor',
        coordinates: { lat: 6.5244, lng: 3.3792 }
      },
      rating: 4.8,
      reviewCount: 234,
      isActive: true,
      operatingHours: {
        open: '07:00',
        close: '20:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      walletAddress: 'CampusCafeVendor123...ABC',
      profileImage: '/images/vendors/campus-cafe.jpg',
      contact: {
        phone: '+234 801 234 5678',
        whatsapp: '+234 801 234 5678'
      },
      verificationStatus: 'verified',
      joinedDate: new Date('2024-01-15'),
      totalSales: 156,
      averageResponseTime: '< 5 mins'
    },
    {
      id: 'vendor-2',
      name: 'UniBooks & Stationery',
      description: 'Complete textbooks, novels, and academic supplies. Best prices for students!',
      category: 'books',
      location: {
        building: 'Faculty of Arts',
        floor: '1st Floor',
        coordinates: { lat: 6.5240, lng: 3.3785 }
      },
      rating: 4.6,
      reviewCount: 89,
      isActive: true,
      operatingHours: {
        open: '08:00',
        close: '18:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      walletAddress: 'UniBooksVendor456...DEF',
      contact: {
        email: 'unibooks@campus.ng'
      },
      verificationStatus: 'verified',
      joinedDate: new Date('2024-02-20'),
      totalSales: 67,
      averageResponseTime: '< 15 mins'
    },
    {
      id: 'vendor-3',
      name: 'TechHub Electronics',
      description: 'Laptops, phones, accessories, and tech repairs. Student-friendly prices!',
      category: 'electronics',
      location: {
        building: 'Engineering Complex',
        floor: 'Ground Floor',
        coordinates: { lat: 6.5250, lng: 3.3800 }
      },
      rating: 4.4,
      reviewCount: 156,
      isActive: true,
      operatingHours: {
        open: '09:00',
        close: '19:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      walletAddress: 'TechHubVendor789...GHI',
      contact: {
        phone: '+234 802 345 6789',
        email: 'techhub@campus.ng'
      },
      verificationStatus: 'verified',
      joinedDate: new Date('2023-11-10'),
      totalSales: 234,
      averageResponseTime: '< 10 mins'
    },
    {
      id: 'vendor-4',
      name: 'Quick Laundry Services',
      description: 'Fast and affordable laundry services for busy students. Same-day delivery!',
      category: 'services',
      location: {
        building: 'Hostel Complex A',
        coordinates: { lat: 6.5235, lng: 3.3790 }
      },
      rating: 4.2,
      reviewCount: 78,
      isActive: false, // Currently closed
      operatingHours: {
        open: '08:00',
        close: '17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      },
      walletAddress: 'LaundryVendor012...JKL',
      contact: {
        phone: '+234 803 456 7890',
        whatsapp: '+234 803 456 7890'
      },
      verificationStatus: 'pending',
      joinedDate: new Date('2024-03-05'),
      totalSales: 45,
      averageResponseTime: '< 30 mins'
    }
  ], []);

  // Initialize vendors on first load
  const loadVendors = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        vendors: mockVendors,
        filteredVendors: mockVendors,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load vendors. Please try again.',
        isLoading: false
      }));
    }
  }, [mockVendors]);

  // Apply filters to vendor list
  const applyFilters = useCallback((filters: VendorFilters) => {
    setState(prev => {
      let filtered = [...prev.vendors];

      // Filter by category
      if (filters.category) {
        filtered = filtered.filter(vendor => vendor.category === filters.category);
      }

      // Filter by location
      if (filters.location) {
        filtered = filtered.filter(vendor => 
          vendor.location.building.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      // Filter by rating
      if (filters.rating) {
        filtered = filtered.filter(vendor => vendor.rating >= filters.rating!);
      }

      // Filter by active status
      if (filters.isActiveOnly) {
        filtered = filtered.filter(vendor => vendor.isActive);
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(vendor =>
          vendor.name.toLowerCase().includes(query) ||
          vendor.description.toLowerCase().includes(query) ||
          vendor.category.toLowerCase().includes(query)
        );
      }

      return {
        ...prev,
        filters,
        filteredVendors: filtered
      };
    });
  }, []);

  // Search vendors
  const searchVendors = useCallback((query: string) => {
    applyFilters({ ...state.filters, searchQuery: query });
  }, [state.filters, applyFilters]);

  // Filter by category
  const filterByCategory = useCallback((category: Vendor['category'] | undefined) => {
    applyFilters({ ...state.filters, category });
  }, [state.filters, applyFilters]);

  // Filter by location
  const filterByLocation = useCallback((location: string | undefined) => {
    applyFilters({ ...state.filters, location });
  }, [state.filters, applyFilters]);

  // Toggle active vendors only
  const toggleActiveOnly = useCallback(() => {
    applyFilters({ ...state.filters, isActiveOnly: !state.filters.isActiveOnly });
  }, [state.filters, applyFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      filteredVendors: prev.vendors
    }));
  }, []);

  // Select vendor for detailed view
  const selectVendor = useCallback((vendor: Vendor | null) => {
    setState(prev => ({ ...prev, selectedVendor: vendor }));
  }, []);

  // Get vendors by category
  const getVendorsByCategory = useCallback((category: Vendor['category']) => {
    return state.vendors.filter(vendor => vendor.category === category);
  }, [state.vendors]);

  // Get featured vendors (top rated)
  const getFeaturedVendors = useCallback((limit: number = 4) => {
    return state.vendors
      .filter(vendor => vendor.isActive && vendor.verificationStatus === 'verified')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }, [state.vendors]);

  // Get vendor statistics
  const getVendorStats = useMemo(() => {
    const total = state.vendors.length;
    const active = state.vendors.filter(v => v.isActive).length;
    const verified = state.vendors.filter(v => v.verificationStatus === 'verified').length;
    const categories = Array.from(new Set(state.vendors.map(v => v.category))).length;

    return { total, active, verified, categories };
  }, [state.vendors]);

  return {
    // State
    vendors: state.filteredVendors,
    allVendors: state.vendors,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    selectedVendor: state.selectedVendor,

    // Actions
    loadVendors,
    searchVendors,
    filterByCategory,
    filterByLocation,
    toggleActiveOnly,
    clearFilters,
    selectVendor,

    // Computed
    getVendorsByCategory,
    getFeaturedVendors,
    vendorStats: getVendorStats,

    // Helper data
    categories: ['food', 'books', 'supplies', 'services', 'electronics'] as const,
    hasActiveFilters: Object.keys(state.filters).length > 0
  };
}
