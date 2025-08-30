/**
 * Vendor Discovery Component
 * Allows students to discover and interact with campus vendors
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { vendorRegistry, VendorProfile, VendorSearchFilters } from '@/lib/vendors/vendorRegistry';
import { formatCurrency, solToNaira } from '@/lib/solana/utils';
import BigNumber from 'bignumber.js';

interface VendorDiscoveryProps {
  onVendorSelect?: (vendor: VendorProfile) => void;
  selectedCategory?: string;
  showSearch?: boolean;
}

export default function VendorDiscovery({ 
  onVendorSelect, 
  selectedCategory,
  showSearch = true 
}: VendorDiscoveryProps) {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<VendorSearchFilters>({
    category: selectedCategory
  });

  // Load vendors on mount and filter changes
  useEffect(() => {
    loadVendors();
  }, [searchFilters]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const searchResults = vendorRegistry.searchVendors(searchFilters);
      setVendors(searchResults);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof VendorSearchFilters, value: any) => {
    setSearchFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const categories = [
    { value: '', label: 'All Categories', emoji: '🏪' },
    { value: 'food', label: 'Food & Drinks', emoji: '🍽️' },
    { value: 'books', label: 'Books & Stationery', emoji: '📚' },
    { value: 'electronics', label: 'Electronics', emoji: '💻' },
    { value: 'services', label: 'Services', emoji: '🔧' },
    { value: 'transport', label: 'Transport', emoji: '🚌' },
    { value: 'printing', label: 'Printing', emoji: '🖨️' }
  ];

  const getVendorStatusColor = (vendor: VendorProfile) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const isOpen = vendor.operatingHours.days.includes(currentDay) &&
                   currentTime >= vendor.operatingHours.open &&
                   currentTime <= vendor.operatingHours.close;
    
    return isOpen ? 'text-green-500' : 'text-yellow-500';
  };

  const getVendorStatusText = (vendor: VendorProfile) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const isOpen = vendor.operatingHours.days.includes(currentDay) &&
                   currentTime >= vendor.operatingHours.open &&
                   currentTime <= vendor.operatingHours.close;
    
    return isOpen ? 'Open' : 'Closed';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {showSearch && (
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <Input
                type="text"
                placeholder="Search vendors, food, services..."
                value={searchFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.value}
                  variant={searchFilters.category === category.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleFilterChange('category', category.value || undefined)}
                  className="text-xs"
                >
                  {category.emoji} {category.label}
                </Button>
              ))}
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap gap-2 text-sm">
              <Button
                variant={searchFilters.isOpen ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleFilterChange('isOpen', !searchFilters.isOpen)}
              >
                {searchFilters.isOpen ? '✅' : '⏰'} Open Now
              </Button>
              
              <Button
                variant={searchFilters.acceptsCrypto ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => handleFilterChange('acceptsCrypto', !searchFilters.acceptsCrypto)}
              >
                {searchFilters.acceptsCrypto ? '💰' : '🪙'} Crypto Accepted
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Vendor Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto"></div>
            <p className="mt-2 text-dark-text-secondary">Discovering vendors...</p>
          </div>
        ) : vendors.length > 0 ? (
          <>
            <div className="text-sm text-dark-text-secondary mb-4">
              Found {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
            </div>
            
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => onVendorSelect?.(vendor)}
                className="cursor-pointer"
              >
                <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary hover:border-solana-purple-500 transition-colors">
                  <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-2xl">
                        {vendor.category === 'food' && '🍽️'}
                        {vendor.category === 'books' && '📚'}
                        {vendor.category === 'electronics' && '💻'}
                        {vendor.category === 'services' && '🔧'}
                        {vendor.category === 'transport' && '🚌'}
                        {vendor.category === 'printing' && '🖨️'}
                        {vendor.category === 'other' && '🏪'}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-dark-text-primary">
                            {vendor.businessName}
                          </h3>
                          {vendor.verification.isVerified && (
                            <Badge variant="success" className="text-xs">
                              ✅ Verified
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-dark-text-secondary">
                          {vendor.location.building}
                          {vendor.location.floor && ` • ${vendor.location.floor}`}
                          {vendor.location.room && ` • ${vendor.location.room}`}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-dark-text-muted mb-3 line-clamp-2">
                      {vendor.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-dark-text-secondary">
                      <div className="flex items-center space-x-1">
                        <span>⭐</span>
                        <span>{vendor.rating.average.toFixed(1)}</span>
                        <span>({vendor.rating.totalReviews})</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>📦</span>
                        <span>{vendor.stats.totalTransactions} orders</span>
                      </div>
                      
                      {vendor.pricing.averageOrderValue && (
                        <div className="flex items-center space-x-1">
                          <span>💰</span>
                          <span>~{formatCurrency(vendor.pricing.averageOrderValue, 'SOL')}</span>
                          <span className="text-dark-text-muted">
                            (₦{solToNaira(vendor.pricing.averageOrderValue).toFixed(0)})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Popular Items */}
                    {vendor.stats.popularItems && vendor.stats.popularItems.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-dark-text-secondary mb-1">Popular:</div>
                        <div className="flex flex-wrap gap-1">
                          {vendor.stats.popularItems.slice(0, 3).map((item, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-dark-bg-tertiary text-xs rounded-md text-dark-text-muted"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status and Action */}
                  <div className="text-right ml-4">
                    <div className={`text-sm font-medium ${getVendorStatusColor(vendor)}`}>
                      {getVendorStatusText(vendor)}
                    </div>
                    
                    <div className="text-xs text-dark-text-secondary mt-1">
                      {vendor.operatingHours.open} - {vendor.operatingHours.close}
                    </div>

                    {vendor.pricing.acceptsCrypto && (
                      <div className="mt-2">
                        <Badge variant="primary" className="text-xs">
                          💰 SOL
                        </Badge>
                      </div>
                    )}

                    {onVendorSelect && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVendorSelect(vendor);
                        }}
                      >
                        Visit
                      </Button>
                    )}
                  </div>
                </div>
                </Card>
              </div>
            ))}
          </>
        ) : (
          <Card className="p-8 text-center bg-dark-bg-secondary border-dark-border-primary">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-semibold text-dark-text-primary mb-2">
              No vendors found
            </h3>
            <p className="text-dark-text-secondary">
              Try adjusting your search filters or check back later for new vendors.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
