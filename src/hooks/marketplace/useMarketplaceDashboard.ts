import { useState, useCallback, useEffect } from 'react';
import { useVendorDirectory, Vendor } from './useVendorDirectory';
import { useProductCatalog, Product } from './useProductCatalog';

type MarketplaceView = 'overview' | 'vendors' | 'products' | 'vendor-detail' | 'product-detail' | 'search-results';

interface MarketplaceDashboardState {
  currentView: MarketplaceView;
  searchQuery: string;
  selectedCategory: string | null;
  isInitialized: boolean;
  error: string | null;
}

interface SearchResults {
  vendors: Vendor[];
  products: Product[];
  totalResults: number;
}

export function useMarketplaceDashboard() {
  const [state, setState] = useState<MarketplaceDashboardState>({
    currentView: 'overview',
    searchQuery: '',
    selectedCategory: null,
    isInitialized: false,
    error: null,
  });

  // Initialize marketplace hooks
  const vendorDirectory = useVendorDirectory();
  const productCatalog = useProductCatalog();

  // Initialize marketplace data
  const initializeMarketplace = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Load vendors and products in parallel
      await Promise.all([
        vendorDirectory.loadVendors(),
        productCatalog.loadProducts()
      ]);

      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Failed to initialize marketplace:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load marketplace data. Please refresh the page.',
        isInitialized: true
      }));
    }
  }, [vendorDirectory, productCatalog]);

  // Initialize on mount
  useEffect(() => {
    if (!state.isInitialized) {
      initializeMarketplace();
    }
  }, [state.isInitialized, initializeMarketplace]);

  // Navigate to different views
  const navigateToView = useCallback((view: MarketplaceView) => {
    setState(prev => ({ ...prev, currentView: view }));
    
    // Clear selections when navigating to overview
    if (view === 'overview') {
      vendorDirectory.selectVendor(null);
      productCatalog.selectProduct(null);
      setState(prev => ({ ...prev, selectedCategory: null, searchQuery: '' }));
    }
  }, [vendorDirectory, productCatalog]);

  // Navigate to vendor detail
  const viewVendorDetail = useCallback((vendor: Vendor) => {
    vendorDirectory.selectVendor(vendor);
    // Load products for this vendor
    productCatalog.loadProducts(vendor.id);
    setState(prev => ({ ...prev, currentView: 'vendor-detail' }));
  }, [vendorDirectory, productCatalog]);

  // Navigate to product detail
  const viewProductDetail = useCallback((product: Product) => {
    productCatalog.selectProduct(product);
    setState(prev => ({ ...prev, currentView: 'product-detail' }));
  }, [productCatalog]);

  // Global search across vendors and products
  const performSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, currentView: 'search-results' }));
    
    // Search both vendors and products
    vendorDirectory.searchVendors(query);
    productCatalog.searchProducts(query);
  }, [vendorDirectory, productCatalog]);

  // Filter by category
  const filterByCategory = useCallback((category: string | null) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
    
    if (category) {
      vendorDirectory.filterByCategory(category as any);
      productCatalog.applyFilters({ category });
      setState(prev => ({ ...prev, currentView: 'products' }));
    } else {
      vendorDirectory.clearFilters();
      productCatalog.clearFilters();
    }
  }, [vendorDirectory, productCatalog]);

  // Get search results
  const getSearchResults = useCallback((): SearchResults => {
    const vendors = vendorDirectory.vendors;
    const products = productCatalog.products;
    
    return {
      vendors,
      products,
      totalResults: vendors.length + products.length
    };
  }, [vendorDirectory.vendors, productCatalog.products]);

  // Get marketplace overview data
  const getOverviewData = useCallback(() => {
    return {
      featuredVendors: vendorDirectory.getFeaturedVendors(4),
      featuredProducts: productCatalog.getFeaturedProducts(6),
      vendorStats: vendorDirectory.vendorStats,
      popularCategories: ['food', 'books', 'electronics', 'services'] as const,
      popularTags: productCatalog.popularTags.slice(0, 6)
    };
  }, [vendorDirectory, productCatalog]);

  // Get category statistics
  const getCategoryStats = useCallback(() => {
    const categories = ['food', 'books', 'supplies', 'services', 'electronics'] as const;
    
    return categories.map(category => {
      const vendorCount = vendorDirectory.getVendorsByCategory(category).length;
      const productCount = productCatalog.getProductsByCategory(category).length;
      
      return {
        category,
        vendorCount,
        productCount,
        totalItems: vendorCount + productCount
      };
    });
  }, [vendorDirectory, productCatalog]);

  // Quick actions
  const quickActions = {
    browseFood: () => filterByCategory('food'),
    browseBooks: () => filterByCategory('books'),
    browseElectronics: () => filterByCategory('electronics'),
    viewAllVendors: () => navigateToView('vendors'),
    viewAllProducts: () => navigateToView('products'),
    searchFood: () => performSearch('food'),
    searchBooks: () => performSearch('books'),
  };

  // Go back navigation
  const goBack = useCallback(() => {
    switch (state.currentView) {
      case 'vendor-detail':
        navigateToView('vendors');
        break;
      case 'product-detail':
        navigateToView('products');
        break;
      case 'search-results':
        navigateToView('overview');
        setState(prev => ({ ...prev, searchQuery: '' }));
        break;
      default:
        navigateToView('overview');
    }
  }, [state.currentView, navigateToView]);

  // Refresh marketplace data
  const refreshMarketplace = useCallback(async () => {
    setState(prev => ({ ...prev, isInitialized: false }));
    await initializeMarketplace();
  }, [initializeMarketplace]);

  // Check if marketplace is loading
  const isLoading = vendorDirectory.isLoading || productCatalog.isLoading || !state.isInitialized;

  // Get combined error state
  const error = state.error || vendorDirectory.error || productCatalog.error;

  return {
    // State
    currentView: state.currentView,
    searchQuery: state.searchQuery,
    selectedCategory: state.selectedCategory,
    isInitialized: state.isInitialized,
    isLoading,
    error,

    // Selected items
    selectedVendor: vendorDirectory.selectedVendor,
    selectedProduct: productCatalog.selectedProduct,

    // Navigation
    navigateToView,
    viewVendorDetail,
    viewProductDetail,
    goBack,

    // Search and filtering
    performSearch,
    filterByCategory,
    getSearchResults,

    // Data access
    vendors: vendorDirectory.vendors,
    products: productCatalog.products,
    getOverviewData,
    getCategoryStats,

    // Actions
    quickActions,
    refreshMarketplace,

    // Sub-hooks (for advanced usage)
    vendorDirectory,
    productCatalog,

    // Helper data
    categories: ['food', 'books', 'supplies', 'services', 'electronics'] as const,
    viewTitles: {
      overview: 'Campus Marketplace',
      vendors: 'Vendor Directory',
      products: 'Product Catalog',
      'vendor-detail': vendorDirectory.selectedVendor?.name || 'Vendor Details',
      'product-detail': productCatalog.selectedProduct?.name || 'Product Details',
      'search-results': `Search Results: "${state.searchQuery}"`
    },
    
    // Navigation helpers
    canGoBack: state.currentView !== 'overview',
    showSearch: ['overview', 'vendors', 'products', 'search-results'].includes(state.currentView),
    showCategoryFilter: ['overview', 'products'].includes(state.currentView)
  };
}
