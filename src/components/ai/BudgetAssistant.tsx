/**
 * AI Budget Assistant Component
 * Shows budget alerts and spending predictions using rule-based AI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { BudgetAlert, aiService } from '@/lib/ai/aiService';
import { transactionStorage } from '@/lib/utils/transactionStorage';
import { StudyPayIcon } from '@/lib/utils/iconMap';
import { AlertTriangle, TrendingUp, DollarSign, Lightbulb } from 'lucide-react';
import BigNumber from 'bignumber.js';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface BudgetAssistantProps {
  studentId?: string;
  weeklyBudget?: BigNumber;
  compact?: boolean; // For smaller displays
}

export default function BudgetAssistant({
  studentId = 'demo-student',
  weeklyBudget,
  compact = false
}: BudgetAssistantProps) {
  const [budgetAlert, setBudgetAlert] = useState<BudgetAlert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currencyFormatter = useCurrencyFormatter();

  useEffect(() => {
    loadBudgetAnalysis();
  }, [studentId, weeklyBudget]);

  const loadBudgetAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's transaction history
      const transactions = await transactionStorage.getAllTransactions();

      // Get AI budget analysis
      const alert = await aiService.analyzeBudget(studentId, transactions, weeklyBudget);
      setBudgetAlert(alert);
    } catch (err) {
      console.error('Error loading budget analysis:', err);
      setError('Unable to analyze budget');
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <TrendingUp className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <DollarSign className="w-5 h-5 text-blue-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </Card>
    );
  }

  if (error || !budgetAlert) {
    return null; // Don't show if no alert or error
  }

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border-l-4 ${getAlertColor(budgetAlert.type)}`}>
        <div className="flex items-center gap-2 mb-2">
          {getAlertIcon(budgetAlert.type)}
          <span className="text-sm font-medium text-dark-text-primary">
            Budget Alert
          </span>
        </div>
        <p className="text-sm text-dark-text-secondary">
          {budgetAlert.message}
        </p>
      </div>
    );
  }

  return (
    <Card className={`p-6 border-l-4 ${getAlertColor(budgetAlert.type)}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {getAlertIcon(budgetAlert.type)}
        <div>
          <h3 className="font-semibold text-dark-text-primary">AI Budget Assistant</h3>
          <Badge variant="secondary" className="text-xs mt-1">
            Smart Spending Analysis
          </Badge>
        </div>
      </div>

      {/* Alert Message */}
      <div className="mb-4">
        <p className="text-dark-text-primary font-medium mb-2">
          {budgetAlert.message}
        </p>
        {budgetAlert.predictedOverspend.gt(0) && (
          <p className="text-sm text-dark-text-secondary">
            Predicted overspend: {currencyFormatter.formatSol(budgetAlert.predictedOverspend)}
          </p>
        )}
      </div>

      {/* Suggestions */}
      {budgetAlert.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-dark-text-primary mb-2">
            💡 AI Suggestions:
          </h4>
          <ul className="text-sm text-dark-text-secondary space-y-1">
            {budgetAlert.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {budgetAlert.actionable && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            View Budget Details
          </Button>
          <Button size="sm" variant="primary">
            Find Cheaper Options
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-dark-border-primary">
        <p className="text-xs text-dark-text-secondary">
          AI analysis based on your spending patterns and market data
        </p>
      </div>
    </Card>
  );
}