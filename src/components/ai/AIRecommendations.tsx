/**
 * AI Vendor Recommendations Component
 * Shows personalized vendor recommendations using rule-based AI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { VendorRecommendation, aiService } from '@/lib/ai/aiService';
import { VendorProfile } from '@/lib/vendors/vendorRegistry';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { Clock, Star, MapPin, Zap } from 'lucide-react';
import BigNumber from 'bignumber.js';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface AIRecommendationsProps {
  onVendorClick: (vendorId: string) => void;
  context?: {
    timeOfDay?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    location?: string;
    budget?: BigNumber;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export default function AIRecommendations({ onVendorClick, context }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<VendorRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useCurrencyFormatter();

  useEffect(() => {
    loadRecommendations();
  }, [context]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's transaction history for personalization
      const transactions = await transactionStorage.getAllTransactions();
      const studentId = 'demo-student'; // In real app, get from auth context

      // Get AI recommendations
      const aiRecommendations = await aiService.recommendVendors(
        studentId,
        transactions,
        context || {
          timeOfDay: getCurrentTimeOfDay(),
          urgency: 'medium'
        }
      );

      setRecommendations(aiRecommendations);
    } catch (err) {
      console.error('Error loading AI recommendations:', err);
      setError('Unable to load AI recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTimeOfDay = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour <= 10) return 'breakfast';
    if (hour >= 11 && hour <= 15) return 'lunch';
    if (hour >= 17 && hour <= 21) return 'dinner';
    return 'snack';
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-blue-500';
    return 'text-yellow-500';
  };

  const getAIScoreText = (score: number) => {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    return 'Fair Match';
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-dark-text-primary">AI Picks for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show section if no recommendations or error
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-dark-text-primary">AI Picks for You</h2>
        <Badge variant="secondary" className="text-xs">
          Smart Recommendations
        </Badge>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <div
            key={rec.vendorId}
            className="cursor-pointer"
            onClick={() => onVendorClick(rec.vendorId)}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              {/* AI Score Badge */}
              <div className="flex items-center justify-between mb-3">
              <Badge
                className={`text-xs ${getAIScoreColor(rec.score)} border-current`}
              >
                <Star className="w-3 h-3 mr-1" />
                {getAIScoreText(rec.score)}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-dark-text-secondary">
                <Clock className="w-4 h-4" />
                {rec.estimatedPrepTime}min
              </div>
            </div>

            {/* Vendor Info */}
            <div className="mb-3">
              <h3 className="font-semibold text-dark-text-primary mb-1">
                {rec.vendor.businessName}
              </h3>
              <p className="text-sm text-dark-text-secondary mb-2">
                {rec.vendor.category} • {rec.vendor.location.building}
              </p>
              <div className="flex items-center gap-1 text-sm text-dark-text-secondary">
                <MapPin className="w-4 h-4" />
                {rec.vendor.location.description}
              </div>
            </div>

            {/* AI Reasons */}
            <div className="mb-3">
              <div className="text-xs font-medium text-dark-text-primary mb-1">Why this?</div>
              <ul className="text-xs text-dark-text-secondary space-y-1">
                {rec.reasons.slice(0, 2).map((reason, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Price Estimate */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-dark-text-secondary">Est. cost: </span>
                <span className="font-medium text-dark-text-primary">
                  {currencyFormatter.formatSol(rec.estimatedCost)}
                </span>
              </div>
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click from firing
                  onVendorClick(rec.vendorId); // Same action as card click
                }}
              >
                View Menu
              </Button>
            </div>
          </Card>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-dark-text-secondary">
          AI recommendations based on your preferences, time, and location
        </p>
      </div>
    </div>
  );
}