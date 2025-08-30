import { useState, useCallback, useMemo } from 'react';
import { Vendor } from './useVendorDirectory';

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number; // Price in SOL
  priceNGN: number; // Price in Naira for display
  category: string;
  subcategory?: string;
  images: string[];
  availability: 'available' | 'low-stock' | 'out-of-stock';
  stockQuantity?: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isPromoted: boolean;
  specifications?: Record<string, string>;
  variants?: {
    name: string;
    options: { label: string; value: string; priceModifier?: number }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProductFilters {
  vendorId?: string;
  category?: string;
  priceRange?: { min: number; max: number };
  availability?: Product['availability'];
  rating?: number;
  searchQuery?: string;
  tags?: string[];
}

interface ProductCatalogState {
  products: Product[];
  filteredProducts: Product[];
  filters: ProductFilters;
  isLoading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  sortBy: 'name' | 'price' | 'rating' | 'newest';
  sortOrder: 'asc' | 'desc';
}

export function useProductCatalog() {
  const [state, setState] = useState<ProductCatalogState>({
    products: [],
    filteredProducts: [],
    filters: {},
    isLoading: false,
    error: null,
    selectedProduct: null,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  // Mock product data for marketplace demonstration
  const mockProducts: Product[] = useMemo(() => {
    const products: Product[] = [
    // Campus Café Products
    {
      id: 'product-1',
      vendorId: 'vendor-1',
      name: 'Jollof Rice Combo',
      description: 'Our signature jollof rice with grilled chicken, plantain, and coleslaw',
      price: 0.0083, // ~₦1,500 at ₦180,000/SOL
      priceNGN: 1500,
      category: 'food',
      subcategory: 'main-dishes',
      images: ['/images/products/jollof-combo.jpg'],
      availability: 'available',
      stockQuantity: 25,
      rating: 4.9,
      reviewCount: 89,
      tags: ['popular', 'combo', 'chicken', 'local'],
      isPromoted: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-08-20'),
    },
    {
      id: 'product-2',
      vendorId: 'vendor-1',
      name: 'Suya Platter',
      description: 'Spicy grilled beef suya with onions, tomatoes, and our special sauce',
      price: 0.0056, // ~₦1,000
      priceNGN: 1000,
      category: 'food',
      subcategory: 'snacks',
      images: ['/images/products/suya-platter.jpg'],
      availability: 'available',
      stockQuantity: 15,
      rating: 4.7,
      reviewCount: 67,
      tags: ['spicy', 'beef', 'local', 'evening'],
      isPromoted: false,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-08-15'),
    },
    {
      id: 'product-3',
      vendorId: 'vendor-1',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice, perfect for hot Lagos weather',
      price: 0.0028, // ~₦500
      priceNGN: 500,
      category: 'food',
      subcategory: 'beverages',
      images: ['/images/products/orange-juice.jpg'],
      availability: 'low-stock',
      stockQuantity: 5,
      rating: 4.5,
      reviewCount: 34,
      tags: ['fresh', 'healthy', 'vitamin-c'],
      isPromoted: false,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-08-25'),
    },

    // UniBooks Products  
    {
      id: 'product-4',
      vendorId: 'vendor-2',
      name: 'Introduction to Psychology (5th Edition)',
      description: 'Complete textbook for PSY 101 - Introduction to Psychology. Excellent condition.',
      price: 0.0333, // ~₦6,000
      priceNGN: 6000,
      category: 'books',
      subcategory: 'textbooks',
      images: ['/images/products/psychology-textbook.jpg'],
      availability: 'available',
      stockQuantity: 8,
      rating: 4.8,
      reviewCount: 23,
      tags: ['textbook', 'psychology', 'undergrad', 'required'],
      isPromoted: true,
      specifications: {
        'Author': 'David G. Myers',
        'Publisher': 'Worth Publishers',
        'ISBN': '978-1-4641-4095-2',
        'Pages': '896',
        'Condition': 'Very Good'
      },
      createdAt: new Date('2024-02-25'),
      updatedAt: new Date('2024-08-10'),
    },
    {
      id: 'product-5',
      vendorId: 'vendor-2',
      name: 'Scientific Calculator (Casio FX-991ES)',
      description: 'Advanced scientific calculator for mathematics and engineering courses',
      price: 0.0194, // ~₦3,500
      priceNGN: 3500,
      category: 'supplies',
      subcategory: 'calculators',
      images: ['/images/products/calculator.jpg'],
      availability: 'available',
      stockQuantity: 12,
      rating: 4.6,
      reviewCount: 45,
      tags: ['calculator', 'scientific', 'casio', 'mathematics'],
      isPromoted: false,
      specifications: {
        'Brand': 'Casio',
        'Model': 'FX-991ES PLUS',
        'Functions': '417',
        'Display': '2-line Natural Display',
        'Battery': 'Solar + LR44'
      },
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-08-05'),
    },

    // TechHub Products
    {
      id: 'product-6',
      vendorId: 'vendor-3',
      name: 'Student Laptop - HP Pavilion 15',
      description: 'Perfect laptop for students: Intel i5, 8GB RAM, 256GB SSD, Windows 11',
      price: 1.6667, // ~₊300,000
      priceNGN: 300000,
      category: 'electronics',
      subcategory: 'laptops',
      images: ['/images/products/hp-laptop.jpg'],
      availability: 'available',
      stockQuantity: 3,
      rating: 4.4,
      reviewCount: 18,
      tags: ['laptop', 'student', 'hp', 'productivity'],
      isPromoted: true,
      specifications: {
        'Processor': 'Intel Core i5-1135G7',
        'RAM': '8GB DDR4',
        'Storage': '256GB SSD',
        'Display': '15.6" Full HD',
        'OS': 'Windows 11 Home',
        'Warranty': '1 Year'
      },
      variants: [
        {
          name: 'Storage',
          options: [
            { label: '256GB SSD', value: '256gb' },
            { label: '512GB SSD', value: '512gb', priceModifier: 0.2778 } // +₦50,000
          ]
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-08-20'),
    },
    {
      id: 'product-7',
      vendorId: 'vendor-3',
      name: 'Bluetooth Headphones - Sony WH-CH720N',
      description: 'Noise-canceling wireless headphones perfect for studying and entertainment',
      price: 0.2778, // ~₦50,000
      priceNGN: 50000,
      category: 'electronics',
      subcategory: 'audio',
      images: ['/images/products/sony-headphones.jpg'],
      availability: 'available',
      stockQuantity: 7,
      rating: 4.7,
      reviewCount: 29,
      tags: ['headphones', 'wireless', 'noise-canceling', 'sony'],
      isPromoted: false,
      specifications: {
        'Brand': 'Sony',
        'Model': 'WH-CH720N',
        'Type': 'Over-ear, Wireless',
        'Battery Life': '35 hours',
        'Noise Canceling': 'Yes',
        'Microphone': 'Built-in'
      },
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-08-18'),
    },

    // Quick Laundry Services
    {
      id: 'product-8',
      vendorId: 'vendor-4',
      name: 'Express Wash & Fold Service',
      description: 'Same-day laundry service: wash, dry, and fold. Ready in 6 hours!',
      price: 0.0167, // ~₦3,000
      priceNGN: 3000,
      category: 'services',
      subcategory: 'laundry',
      images: ['/images/products/laundry-service.jpg'],
      availability: 'available',
      rating: 4.2,
      reviewCount: 56,
      tags: ['laundry', 'same-day', 'express', 'convenient'],
      isPromoted: false,
      specifications: {
        'Turnaround': '6 hours',
        'Pickup': 'Free (hostel areas)',
        'Delivery': 'Free (hostel areas)',
        'Weight Limit': '5kg per load',
        'Detergent': 'Included'
      },
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-08-12'),
    }
    ];
    
    return products;
  }, []);

  // Initialize products on first load
  const loadProducts = useCallback(async (vendorId?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let products = mockProducts;
      if (vendorId) {
        products = products.filter(product => product.vendorId === vendorId);
      }
      
      setState(prev => ({
        ...prev,
        products,
        filteredProducts: products,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load products. Please try again.',
        isLoading: false
      }));
    }
  }, [mockProducts]);

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    setState(prev => {
      let filtered = [...prev.products];

      // Apply filters
      if (prev.filters.vendorId) {
        filtered = filtered.filter(product => product.vendorId === prev.filters.vendorId);
      }

      if (prev.filters.category) {
        filtered = filtered.filter(product => product.category === prev.filters.category);
      }

      if (prev.filters.priceRange) {
        const { min, max } = prev.filters.priceRange;
        filtered = filtered.filter(product => product.price >= min && product.price <= max);
      }

      if (prev.filters.availability) {
        filtered = filtered.filter(product => product.availability === prev.filters.availability);
      }

      if (prev.filters.rating !== undefined) {
        filtered = filtered.filter(product => product.rating >= prev.filters.rating!);
      }

      if (prev.filters.searchQuery) {
        const query = prev.filters.searchQuery.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (prev.filters.tags && prev.filters.tags.length > 0) {
        filtered = filtered.filter(product =>
          prev.filters.tags!.some(tag => product.tags.includes(tag))
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (prev.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'rating':
            comparison = a.rating - b.rating;
            break;
          case 'newest':
            comparison = b.createdAt.getTime() - a.createdAt.getTime();
            break;
        }

        return prev.sortOrder === 'desc' ? -comparison : comparison;
      });

      return { ...prev, filteredProducts: filtered };
    });
  }, []);

  // Filter products
  const applyFilters = useCallback((filters: ProductFilters) => {
    setState(prev => ({ ...prev, filters }));
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Search products
  const searchProducts = useCallback((query: string) => {
    setState(prev => ({ 
      ...prev, 
      filters: { ...prev.filters, searchQuery: query }
    }));
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Sort products
  const sortProducts = useCallback((sortBy: ProductCatalogState['sortBy'], sortOrder: ProductCatalogState['sortOrder']) => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Select product
  const selectProduct = useCallback((product: Product | null) => {
    setState(prev => ({ ...prev, selectedProduct: product }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
      filteredProducts: prev.products
    }));
  }, []);

  // Get featured products
  const getFeaturedProducts = useCallback((limit: number = 6) => {
    return state.products
      .filter(product => product.isPromoted && product.availability === 'available')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }, [state.products]);

  // Get products by category
  const getProductsByCategory = useCallback((category: string) => {
    return state.products.filter(product => product.category === category);
  }, [state.products]);

  // Get popular tags
  const getPopularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    state.products.forEach(product => {
      product.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [state.products]);

  // Get price range
  const getPriceRange = useMemo(() => {
    if (state.products.length === 0) return { min: 0, max: 0 };
    
    const prices = state.products.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [state.products]);

  return {
    // State
    products: state.filteredProducts,
    allProducts: state.products,
    filters: state.filters,
    isLoading: state.isLoading,
    error: state.error,
    selectedProduct: state.selectedProduct,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    // Actions
    loadProducts,
    applyFilters,
    searchProducts,
    sortProducts,
    selectProduct,
    clearFilters,

    // Computed
    getFeaturedProducts,
    getProductsByCategory,
    popularTags: getPopularTags,
    priceRange: getPriceRange,

    // Helper data
    categories: ['food', 'books', 'supplies', 'services', 'electronics'] as const,
    availabilityOptions: ['available', 'low-stock', 'out-of-stock'] as const,
    sortOptions: [
      { value: 'name', label: 'Name' },
      { value: 'price', label: 'Price' },
      { value: 'rating', label: 'Rating' },
      { value: 'newest', label: 'Newest' }
    ] as const,
    hasActiveFilters: Object.keys(state.filters).length > 0
  };
}
