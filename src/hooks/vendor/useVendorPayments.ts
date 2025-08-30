import { useState } from 'react';
import BigNumber from 'bignumber.js';

export interface PaymentRequest {
  id: string;
  amount: BigNumber;
  description: string;
  createdAt: Date;
  expiresAt: Date;
  qrCodeUrl?: string;
  status: 'active' | 'completed' | 'expired';
}

export const useVendorPayments = () => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const createPaymentRequest = async (amount: BigNumber, description: string): Promise<PaymentRequest> => {
    setIsGeneratingQR(true);
    
    try {
      const paymentRequest: PaymentRequest = {
        id: `payment_${Date.now()}`,
        amount,
        description,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        status: 'active'
      };

      setPaymentRequests(prev => [paymentRequest, ...prev]);
      return paymentRequest;
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const completePaymentRequest = (requestId: string, signature: string) => {
    setPaymentRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'completed' as const }
          : req
      )
    );
  };

  const expirePaymentRequest = (requestId: string) => {
    setPaymentRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'expired' as const }
          : req
      )
    );
  };

  const removePaymentRequest = (requestId: string) => {
    setPaymentRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const getActiveRequests = () => {
    return paymentRequests.filter(req => req.status === 'active');
  };

  const getCompletedRequests = () => {
    return paymentRequests.filter(req => req.status === 'completed');
  };

  const getTotalEarnings = () => {
    return getCompletedRequests().reduce(
      (total, req) => total.plus(req.amount),
      new BigNumber(0)
    );
  };

  // Auto-expire old requests
  const cleanupExpiredRequests = () => {
    const now = new Date();
    setPaymentRequests(prev => 
      prev.map(req => {
        if (req.status === 'active' && req.expiresAt < now) {
          return { ...req, status: 'expired' as const };
        }
        return req;
      })
    );
  };

  return {
    // State
    paymentRequests,
    isGeneratingQR,
    
    // Actions
    createPaymentRequest,
    completePaymentRequest,
    expirePaymentRequest,
    removePaymentRequest,
    cleanupExpiredRequests,
    
    // Getters
    getActiveRequests,
    getCompletedRequests,
    getTotalEarnings,
    
    // Computed values
    activeRequestsCount: getActiveRequests().length,
    completedRequestsCount: getCompletedRequests().length,
    totalEarnings: getTotalEarnings(),
    hasActiveRequests: getActiveRequests().length > 0,
    hasCompletedRequests: getCompletedRequests().length > 0
  };
};