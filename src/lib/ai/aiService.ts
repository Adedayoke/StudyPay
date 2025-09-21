/**
 * AI Service for StudyPay - Focused Implementation
 * Rule-based AI for vendor recommendations and budget assistance
 */

import { Transaction } from '@/lib/types/payment';
import { VendorProfile, vendorRegistry } from '@/lib/vendors/vendorRegistry';
import { AnalyticsEngine } from '@/lib/analytics/analyticsEngine';
import BigNumber from 'bignumber.js';

export interface VendorRecommendation {
  vendorId: string;
  vendor: VendorProfile;
  score: number; // 0-1 relevance score
  reasons: string[];
  estimatedCost: BigNumber;
  estimatedPrepTime: number;
}

export interface BudgetAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  predictedOverspend: BigNumber;
  suggestions: string[];
  actionable: boolean;
}

/**
 * Focused AI Service - Rule-based intelligence for demo
 */
export class AIService {
  private static instance: AIService;
  private analyticsEngine = AnalyticsEngine.getInstance();

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Smart Vendor Recommendations - Rule-based AI
   * Considers: time of day, location, budget, past preferences, ratings
   */
  async recommendVendors(
    studentId: string,
    transactions: Transaction[],
    context: {
      timeOfDay?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      location?: string;
      budget?: BigNumber;
      urgency?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<VendorRecommendation[]> {
    const allVendors = vendorRegistry.getAllVendors();
    const recommendations: VendorRecommendation[] = [];

    // Get student's spending history
    const insights = await this.analyticsEngine.generateStudentInsights(
      studentId,
      'month',
      transactions
    );

    for (const vendor of allVendors) {
      const score = this.calculateRecommendationScore(vendor, insights, context);

      if (score.score > 0.3) { // Only show relevant recommendations
        recommendations.push({
          vendorId: vendor.id,
          vendor,
          score: score.score,
          reasons: score.reasons,
          estimatedCost: this.estimateOrderCost(vendor),
          estimatedPrepTime: this.estimatePrepTime(vendor, context.urgency)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 recommendations
  }

  /**
   * Calculate recommendation score using simple rules
   */
  private calculateRecommendationScore(
    vendor: VendorProfile,
    insights: any,
    context: any
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Rule 1: Time appropriateness (30% weight)
    if (context.timeOfDay) {
      const timeScore = this.evaluateTimeFit(vendor, context.timeOfDay);
      score += timeScore * 0.3;
      if (timeScore > 0.7) reasons.push('Perfect for ' + context.timeOfDay);
    }

    // Rule 2: Past preference (25% weight)
    const favoriteVendor = insights.spendingAnalytics.favoriteVendors
      .find((fav: any) => fav.vendorId === vendor.id);

    if (favoriteVendor) {
      const prefScore = Math.min(favoriteVendor.visits / 5, 1); // Cap at 5 visits
      score += prefScore * 0.25;
      reasons.push(`You've ordered here ${favoriteVendor.visits} times`);
    }

    // Rule 3: Budget compatibility (20% weight)
    if (context.budget) {
      const avgCost = this.estimateOrderCost(vendor);
      if (avgCost.lte(context.budget)) {
        score += 0.2;
        reasons.push('Fits your budget');
      }
    }

    // Rule 4: Rating & speed (15% weight)
    if (vendor.rating?.average && vendor.rating.average >= 4.0) {
      score += 0.15;
      reasons.push('Highly rated by students');
    }

    // Rule 5: Urgency (10% weight)
    if (context.urgency === 'high') {
      const avgPrepTime = this.estimatePrepTime(vendor, 'high');
      if (avgPrepTime <= 10) {
        score += 0.1;
        reasons.push('Quick service available');
      }
    }

    return { score: Math.min(1, score), reasons };
  }

  /**
   * Evaluate if vendor is appropriate for time of day
   */
  private evaluateTimeFit(vendor: VendorProfile, timeOfDay: string): number {
    const currentHour = new Date().getHours();

    switch (timeOfDay) {
      case 'breakfast':
        return (currentHour >= 6 && currentHour <= 10) ? 1.0 : 0.3;
      case 'lunch':
        return (currentHour >= 11 && currentHour <= 15) ? 1.0 : 0.5;
      case 'dinner':
        return (currentHour >= 17 && currentHour <= 21) ? 1.0 : 0.4;
      case 'snack':
        return 0.8; // Snacks are always appropriate
      default:
        return 0.5;
    }
  }

  /**
   * Budget AI Assistant - Simple rule-based predictions
   */
  async analyzeBudget(
    studentId: string,
    transactions: Transaction[],
    weeklyBudget?: BigNumber
  ): Promise<BudgetAlert | null> {
    const insights = await this.analyticsEngine.generateStudentInsights(
      studentId,
      'month',
      transactions
    );

    // Get this week's spending
    const thisWeekTransactions = this.getThisWeekTransactions(transactions);
    const thisWeekSpending = thisWeekTransactions.reduce(
      (sum, t) => sum.plus(t.amount),
      new BigNumber(0)
    );

    // Calculate predicted weekly spending
    const avgDailySpending = insights.spendingAnalytics.averageDaily;
    const predictedWeeklySpending = avgDailySpending.multipliedBy(7);

    // Default budget if not provided
    const budget = weeklyBudget || avgDailySpending.multipliedBy(7).multipliedBy(1.2);

    const budgetUtilization = thisWeekSpending.dividedBy(budget).toNumber();

    // Rule-based alerts
    if (budgetUtilization >= 0.9) {
      const overspend = predictedWeeklySpending.minus(budget);
      return {
        type: 'danger',
        message: `You're at ${Math.round(budgetUtilization * 100)}% of your weekly budget`,
        predictedOverspend: overspend.gt(0) ? overspend : new BigNumber(0),
        suggestions: [
          'Consider cheaper alternatives this week',
          'Look for combo deals or meal plans',
          'Try vendors during off-peak hours'
        ],
        actionable: true
      };
    } else if (budgetUtilization >= 0.75) {
      return {
        type: 'warning',
        message: `You've used ${Math.round(budgetUtilization * 100)}% of your weekly budget`,
        predictedOverspend: new BigNumber(0),
        suggestions: [
          'Monitor spending closely',
          'Plan remaining meals carefully'
        ],
        actionable: true
      };
    }

    return null; // No alert needed
  }

  /**
   * Get transactions from this week
   */
  private getThisWeekTransactions(transactions: Transaction[]): Transaction[] {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return transactions.filter(t => t.timestamp >= startOfWeek);
  }

  /**
   * Estimate order cost for a vendor
   */
  private estimateOrderCost(vendor: VendorProfile): BigNumber {
    if (!vendor.products || vendor.products.length === 0) {
      return new BigNumber(0.03); // Default estimate
    }

    const availableProducts = vendor.products.filter(p => p.isAvailable);
    if (availableProducts.length === 0) return new BigNumber(0.03);

    const totalPrice = availableProducts.reduce(
      (sum, product) => sum.plus(product.price),
      new BigNumber(0)
    );

    return totalPrice.dividedBy(availableProducts.length);
  }

  /**
   * Estimate preparation time
   */
  private estimatePrepTime(vendor: VendorProfile, urgency?: string): number {
    if (!vendor.products || vendor.products.length === 0) return 15;

    const avgPrepTime = vendor.products
      .filter(p => p.isAvailable)
      .reduce((sum, product) => sum + (product.estimatedPrepTime || 10), 0) /
      vendor.products.length;

    // Reduce time for urgent orders
    if (urgency === 'high') {
      return Math.max(5, avgPrepTime * 0.7);
    }

    return avgPrepTime;
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();

export interface BudgetPrediction {
  predictedSpending: BigNumber;
  confidence: number; // 0-1
  timeframe: 'week' | 'month' | 'semester';
  factors: string[];
  recommendations: string[];
}

export interface SmartSearchResult {
  query: string;
  vendors: VendorRecommendation[];
  items: Array<{
    vendorId: string;
    itemId: string;
    name: string;
    price: BigNumber;
    relevance: number;
  }>;
  suggestions: string[];
}

export interface AIInsights {
  spendingPatterns: {
    pattern: 'conservative' | 'moderate' | 'high';
    confidence: number;
    description: string;
  };
  budgetOptimization: {
    currentUtilization: number;
    recommendedBudget: BigNumber;
    potentialSavings: BigNumber;
    suggestions: string[];
  };
  vendorPreferences: {
    favoriteCategories: string[];
    preferredPriceRange: {
      min: BigNumber;
      max: BigNumber;
    };
    preferredTimes: string[];
  };
}
