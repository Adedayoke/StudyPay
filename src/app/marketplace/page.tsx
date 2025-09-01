/**
 * Marketplace Page - Campus Vendor Marketplace
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Campus Marketplace</h1>
        <Card className="p-6">
          <p className="text-gray-300">Marketplace features coming soon...</p>
        </Card>
      </div>
    </div>
  );
}