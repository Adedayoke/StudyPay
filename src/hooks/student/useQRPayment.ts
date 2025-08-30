import { useState } from 'react';

export const useQRPayment = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleQRScanned = (url: string) => {
    setPaymentUrl(url);
    setShowScanner(false);
    setShowConfirmation(true);
  };

  const handlePaymentConfirm = (onPaymentComplete?: () => Promise<void>) => {
    return async () => {
      // Payment completion is handled by PaymentExecutor component
      setShowConfirmation(false);
      setPaymentUrl('');
      
      // Execute callback if provided
      if (onPaymentComplete) {
        await onPaymentComplete();
      }
    };
  };

  const handlePaymentCancel = () => {
    setShowConfirmation(false);
    setPaymentUrl('');
  };

  const openScanner = () => {
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  return {
    // State
    showScanner,
    paymentUrl,
    showConfirmation,
    
    // Actions
    handleQRScanned,
    handlePaymentConfirm,
    handlePaymentCancel,
    openScanner,
    closeScanner,
    
    // Computed
    hasPaymentUrl: !!paymentUrl,
    isProcessingPayment: showConfirmation && !!paymentUrl
  };
};