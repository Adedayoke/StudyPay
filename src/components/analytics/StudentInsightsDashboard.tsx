/**
 * Student Insights Dashboard
 * Personalized spending analytics and recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { analyticsEngine, StudentInsights } from '@/lib/analytics/analyticsEngine';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { usePriceConversion } from '@/hooks/usePriceConversion';
import { VendorProfile, vendorRegistry } from '@/lib/vendors/vendorRegistry';
import { StudyPayIcon } from '@/lib/utils/iconMap';

interface StudentInsightsDashboardProps {
  walletAddress: string;
  studentId: string;
}

export default function StudentInsightsDashboard({ 
  walletAddress, 
  studentId 
}: StudentInsightsDashboardProps) {
  const [insights, setInsights] = useState<StudentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester'>('month');
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);

  const { convertSolToNaira, isLoading: priceLoading, error: priceError } = usePriceConversion();

  // Wrapper functions to maintain compatibility
  const solToNaira = (amount: BigNumber) => convertSolToNaira(amount).amount;
  const formatCurrency = (amount: BigNumber, currency: string) => {
    if (currency === 'SOL') {
      return `${amount.toFixed(4)} SOL`;
    } else if (currency === 'NGN') {
      return `₦${amount.toFormat(2)}`;
    }
    return amount.toString();
  };

  useEffect(() => {
    loadInsights();
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, selectedPeriod]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const transactions = await transactionStorage.getAllTransactions(walletAddress);
      const studentInsights = await analyticsEngine.generateStudentInsights(
        studentId,
        selectedPeriod,
        transactions
      );
      
      setInsights(studentInsights);
    } catch (error) {
      console.error('Error loading student insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    const allVendors = vendorRegistry.getAllVendors();
    setVendors(allVendors);
  };

  const getVendorById = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId);
  };

  const getSpendingTrendIcon = (trend: string, size: number = 16) => {
    switch (trend) {
      case 'increasing': return <StudyPayIcon name="trending" size={size} />;
      case 'decreasing': return <StudyPayIcon name="trendingDown" size={size}/>;
      case 'stable': return <StudyPayIcon name="stats" size={size} />;
      default: return <StudyPayIcon name="analytics" size={size} />;
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'text-green-500';
      case 'near': return 'text-yellow-500';
      case 'over': return 'text-red-500';
      default: return 'text-dark-text-primary';
    }
  };

  const getBudgetStatusIcon = (status: string, size: number = 16) => {
    switch (status) {
      case 'under': return <StudyPayIcon name="success" size={size} />;
      case 'near': return <StudyPayIcon name="warning" size={size} />;
      case 'over': return <StudyPayIcon name="error" size={size} />;
      default: return <StudyPayIcon name="analytics" size={size} />;
    }
  };

  const getRecommendationIcon = (type: string, size: number = 16) => {
    switch (type) {
      case 'savings': return <StudyPayIcon name="money" size={size} />;
      case 'discovery': return <StudyPayIcon name="search" size={size} />;
      case 'budget': return <StudyPayIcon name="analytics" size={size} />;
      case 'habit': return <StudyPayIcon name="target" size={size} />;
      default: return <StudyPayIcon name="lightbulb" size={size} />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-solana-purple-500 mx-auto"></div>
        <p className="text-center mt-2 text-dark-text-secondary">Loading your insights...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card className="p-6 text-center bg-dark-bg-secondary border-dark-border-primary">
        <div className="text-4xl mb-4 flex justify-center">
          <StudyPayIcon name="analytics" size={48} />
        </div>
        <h3 className="font-semibold text-dark-text-primary mb-2">No Insights Available</h3>
        <p className="text-dark-text-secondary">
          Start making transactions to see personalized insights!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex md:flex-row flex-col gap-3 md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-text-primary">
            <StudyPayIcon name="lightbulb" className="inline h-6 w-6 mr-1" /> Your Spending Insights
          </h2>
          <p className="text-dark-text-secondary">
            Personalized analytics and smart recommendations
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['week', 'month', 'semester'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Spending Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Total Spent</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                ₦{solToNaira(insights.spendingAnalytics.totalSpent).toFixed(0)}
              </p>
              <p className="text-xs text-dark-text-muted">
                ≈ {formatCurrency(insights.spendingAnalytics.totalSpent, 'SOL')}
              </p>
            </div>
            <StudyPayIcon name="coins" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Avg. per Day</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                ₦{solToNaira(insights.spendingAnalytics.averagePerDay).toFixed(0)}
              </p>
              <p className="text-xs text-dark-text-muted">Daily average</p>
            </div>
            <StudyPayIcon name="calendar" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>

        <Card className="p-4 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-text-secondary">Transactions</p>
              <p className="text-2xl font-bold text-dark-text-primary">
                {insights.spendingAnalytics.totalTransactions}
              </p>
              <p className="text-xs text-dark-text-muted">
                {insights.spendingAnalytics.frequencyPerWeek.toFixed(1)}/week
              </p>
            </div>
            <StudyPayIcon name="shopping-bag" className="h-7 w-7 text-solana-purple-500" />
          </div>
        </Card>
      </div>

      {/* Spending Trend */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          {getSpendingTrendIcon(insights.spendingAnalytics.spendingTrend)} Spending Trend
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-text-secondary">Current Trend</span>
              <Badge variant={
                insights.spendingAnalytics.spendingTrend === 'increasing' ? 'warning' :
                insights.spendingAnalytics.spendingTrend === 'decreasing' ? 'success' : 'secondary'
              }>
                {insights.spendingAnalytics.spendingTrend.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-dark-text-muted mb-4">
              {insights.spendingAnalytics.spendingTrend === 'increasing' && 
                "Your spending has been increasing lately. Consider reviewing your budget."}
              {insights.spendingAnalytics.spendingTrend === 'decreasing' && 
                "Great job! You've been spending less recently."}
              {insights.spendingAnalytics.spendingTrend === 'stable' && 
                "Your spending has been consistent."}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-dark-text-primary mb-3">Peak Spending Times</h4>
            <div className="space-y-2">
              {insights.spendingAnalytics.peakSpendingTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-dark-text-secondary">{time}</span>
                  <div className="w-16 h-2 bg-dark-bg-tertiary rounded-full">
                    <div 
                      className="h-2 bg-solana-purple-500 rounded-full"
                      style={{ width: `${(index + 1) * 25}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Spending Categories */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          <StudyPayIcon name="analytics" className="inline h-5 w-5 mr-1" /> Spending by Category
        </h3>
        
        <div className="space-y-4">
          {insights.spendingAnalytics.categoryBreakdown.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{category.emoji}</div>
                <div>
                  <h4 className="font-medium text-dark-text-primary">{category.category}</h4>
                  <p className="text-sm text-dark-text-secondary">
                    {category.transactions} transactions
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-dark-text-primary">
                  ₦{solToNaira(category.amount).toFixed(0)}
                </div>
                <div className="text-xs text-dark-text-secondary">
                  ≈ {formatCurrency(category.amount, 'SOL')}
                </div>
                <div className="text-sm text-dark-text-secondary">
                  {category.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Budget Analysis */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          <StudyPayIcon name="analytics" size={20} />
          Budget Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-dark-text-secondary">Budget Status</span>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getBudgetStatusIcon(insights.insights.budgetStatus)}
                </span>
                <span className={`font-semibold ${getBudgetStatusColor(insights.insights.budgetStatus)}`}>
                  {insights.insights.budgetStatus.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="w-full bg-dark-bg-tertiary rounded-full h-4 mb-2">
              <div 
                className={`h-4 rounded-full ${
                  insights.insights.budgetStatus === 'over' ? 'bg-red-500' :
                  insights.insights.budgetStatus === 'near' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(insights.insights.budgetUtilization, 100)}%` }}
              />
            </div>
            
            <p className="text-sm text-dark-text-muted">
              {insights.insights.budgetUtilization.toFixed(1)}% of estimated budget used
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-dark-text-primary mb-3">Spending Habits</h4>
            <div className="space-y-2">
              {insights.insights.spendingHabits.map((habit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm"><StudyPayIcon name="star" className="h-3 w-3 text-yellow-400" /></span>
                  <span className="text-sm text-dark-text-secondary">{habit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {showRecommendations && insights.recommendations.length > 0 && (
        <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-text-primary flex items-center gap-2">
              <StudyPayIcon name="lightbulb" size={20} />
              Smart Recommendations
            </h3>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setShowRecommendations(false)}
            >
              Hide
            </Button>
          </div>
          
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-dark-bg-tertiary rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl mt-1">
                    {getRecommendationIcon(rec.type)}
                  </span>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-dark-text-primary">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'danger' : 
                                   rec.priority === 'medium' ? 'warning' : 'secondary'}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-dark-text-secondary mb-2">
                      {rec.description}
                    </p>
                    
                    {rec.potentialSavings && (
                      <div className="text-sm text-green-500">
                        <span className="flex items-center gap-1">
                          <StudyPayIcon name="money" size={14} />
                          Potential savings: ₦{solToNaira(rec.potentialSavings).toFixed(0)}
                        </span>
                      </div>
                    )}
                    
                    {rec.vendorId && (
                      <div className="mt-2">
                        {(() => {
                          const vendor = getVendorById(rec.vendorId);
                          return vendor ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-dark-text-muted">Related:</span>
                              <span className="text-xs bg-solana-purple-500 text-white px-2 py-1 rounded">
                                {vendor.businessName}
                              </span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Favorite Vendors */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          ⭐ Your Favorite Vendors
        </h3>
        
        {insights.spendingAnalytics.favoriteVendors.length > 0 ? (
          <div className="space-y-3">
            {insights.spendingAnalytics.favoriteVendors.map((fav, index) => {
              const vendor = getVendorById(fav.vendorId);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-bg-tertiary rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-solana-purple-500 text-white text-sm rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-dark-text-primary">
                        {vendor?.businessName || fav.vendorId}
                      </h4>
                      <p className="text-sm text-dark-text-secondary">
                        {vendor?.category || 'Unknown Category'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-dark-text-primary">
                      ₦{solToNaira(fav.totalSpent).toFixed(0)}
                    </div>
                    <div className="text-sm text-dark-text-secondary">
                      {fav.visitCount} visits
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-dark-text-secondary">
            No vendor preferences yet. Keep shopping to see your favorites!
          </div>
        )}
      </Card>

      {/* Goals and Achievements */}
      <Card className="p-6 bg-dark-bg-secondary border-dark-border-primary">
        <h3 className="text-lg font-semibold text-dark-text-primary mb-4">
          <StudyPayIcon name="target" size={20} />
          Goals & Achievements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-dark-text-primary mb-3">Savings Opportunities</h4>
            <div className="space-y-2">
              {insights.insights.savingsOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-green-500">
                    <StudyPayIcon name="money" size={16} />
                  </span>
                  <span className="text-sm text-dark-text-secondary">{opportunity}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-dark-text-primary mb-3">Achievements</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500"><StudyPayIcon name="trophy" className="h-4 w-4" /></span>
                <span className="text-sm text-dark-text-secondary">
                  Smart Spender - {insights.spendingAnalytics.totalTransactions} transactions
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">
                  <StudyPayIcon name="target" size={16} />
                </span>
                <span className="text-sm text-dark-text-secondary">
                  Budget Conscious - {insights.insights.budgetUtilization < 90 ? 'Under budget' : 'Budget aware'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-purple-500"><StudyPayIcon name="refresh-cw" className="h-4 w-4" /></span>
                <span className="text-sm text-dark-text-secondary">
                  Regular User - {insights.spendingAnalytics.frequencyPerWeek.toFixed(1)} transactions/week
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Last Updated */}
      <div className="text-center text-sm text-dark-text-muted">
        Insights last updated: {insights.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}
