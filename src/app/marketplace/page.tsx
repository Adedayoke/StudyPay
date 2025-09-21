/**
 * Marketplace Page - Campus Vendor Marketplace
 * Complete vendor discovery and browsing interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { vendorRegistry, VendorProfile, VendorSearchFilters } from '@/lib/vendors/vendorRegistry';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import BigNumber from 'bignumber.js';
import Logo from '@/components/ui/Logo';
import { Search, Filter, MapPin, Clock, Star, Phone } from 'lucide-react';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Add router for navigation
  const router = useRouter();

  // Use extracted hooks
  const currencyFormatter = useCurrencyFormatter();
  const {
    data: vendors,
    isLoading,
    error,
    loadData: loadVendors
  } = useDataLoader<VendorProfile[]>(
    async () => vendorRegistry.getAllVendors(),
    [],
    true // Auto-load on mount
  );

  const [filteredVendors, setFilteredVendors] = useState<VendorProfile[]>([]);

  // Filter vendors when search, category, or vendors data changes
  useEffect(() => {
    if (vendors) {
      filterVendors();
    }
  }, [vendors, searchTerm, selectedCategory]);

  const filterVendors = () => {
    if (!vendors) {
      setFilteredVendors([]);
      return;
    }

    let filtered = vendors;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(vendor => vendor.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.businessName.toLowerCase().includes(term) ||
        vendor.description.toLowerCase().includes(term) ||
        vendor.location.building.toLowerCase().includes(term)
      );
    }

    setFilteredVendors(filtered);
  };

  // Categories for filtering
  const categories = [
    { value: '', label: 'All Categories', icon: 'other' },
    { value: 'food', label: 'Food & Drinks', icon: 'food' },
    { value: 'books', label: 'Books & Stationery', icon: 'books' },
    { value: 'electronics', label: 'Electronics', icon: 'electronics' },
    { value: 'services', label: 'Services', icon: 'services' },
    { value: 'transport', label: 'Transport', icon: 'transport' },
    { value: 'printing', label: 'Printing', icon: 'printing' },
  ];

  const getVendorStatusColor = (vendor: VendorProfile) => {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const isOpen =
      vendor.operatingHours.days.includes(currentDay) &&
      currentTime >= vendor.operatingHours.open &&
      currentTime <= vendor.operatingHours.close;

    return isOpen ? "text-green-500" : "text-yellow-500";
  };

  const getVendorStatusText = (vendor: VendorProfile) => {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString("en", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);

    const isOpen =
      vendor.operatingHours.days.includes(currentDay) &&
      currentTime >= vendor.operatingHours.open &&
      currentTime <= vendor.operatingHours.close;

    return isOpen ? "Open" : "Closed";
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  const handleVendorNavigation = (vendorId: string) => {
    // Navigate to student page with vendor parameter
    router.push(`/student?vendors=true&vendorId=${vendorId}`);
  };

  return (
    <div className="min-h-screen bg-dark-bg-secondary text-white">
      {/* Header */}
      <header className="bg-dark-bg-secondary shadow-dark border-b border-dark-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-solana-purple-500/20 text-solana-purple-400">
                <div className="flex items-center gap-1">
                  <StudyPayIcon name="store" size={14} />
                  <span>Campus Marketplace</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-solana-purple-400 to-solana-green-400 bg-clip-text text-transparent">
            Campus Marketplace
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Discover and pay at 16+ verified campus vendors instantly with Solana Pay
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search vendors, products, or locations..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-dark-bg-secondary border-dark-border-primary text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.value}
                onClick={() => handleCategoryFilter(category.value)}
                variant={selectedCategory === category.value ? "primary" : "secondary"}
                size="sm"
                className={`${
                  selectedCategory === category.value
                    ? 'bg-solana-purple-500 hover:bg-solana-purple-600'
                    : 'bg-dark-bg-secondary hover:bg-dark-bg-tertiary border-dark-border-primary'
                }`}
              >
                <StudyPayIcon name={category.icon as any} size={16} className="mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-gray-300">
            {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
            {selectedCategory && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
          </div>
          {(searchTerm || selectedCategory) && (
            <Button
              onClick={clearFilters}
              variant="secondary"
              size="sm"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading campus vendors...</p>
          </div>
        )}

        {/* Error State */}
        {/* Error handling removed - using direct vendor registry */}

        {/* Vendor Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="bg-dark-bg-secondary border-dark-border-primary hover:border-solana-purple-500/50 transition-colors cursor-pointer group"
              >
                <div className="p-6">
                  {/* Vendor Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-solana-purple-400 transition-colors">
                        {vendor.businessName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {vendor.category}
                        </Badge>
                        <div className={`flex items-center gap-1 text-xs ${getVendorStatusColor(vendor)}`}>
                          <div className={`w-2 h-2 rounded-full ${getVendorStatusText(vendor) === 'Open' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          {getVendorStatusText(vendor)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-300">{vendor.rating.average}</span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.location.building}</span>
                  </div>

                  {/* Operating Hours */}
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{vendor.operatingHours.open} - {vendor.operatingHours.close}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {vendor.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-gray-400">Reviews</div>
                      <div className="text-white font-medium">{vendor.rating.totalReviews}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Avg. Order</div>
                      <div className="text-white font-medium">
                        {currencyFormatter.formatNaira(currencyFormatter.solToNaira(vendor.pricing.averageOrderValue || new BigNumber(0)))}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  {vendor.contactInfo.phone && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{vendor.contactInfo.phone}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    className="w-full bg-solana-purple-500 hover:bg-solana-purple-600"
                    onClick={() => handleVendorNavigation(vendor.id)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <StudyPayIcon name="scan" size={16} />
                      <span>View & Pay</span>
                    </div>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <StudyPayIcon name="search" size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No vendors found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                clearFilters();
              }}
              variant="secondary"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            🌟 <strong>{vendors?.length || 0} verified vendors</strong> across University of Lagos campus
          </p>
          <p className="text-xs mt-1">
            All payments processed instantly via Solana Pay • No hidden fees
          </p>
        </div>
      </main>
    </div>
  );
}