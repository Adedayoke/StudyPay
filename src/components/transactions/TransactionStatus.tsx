'use client';

import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';

interface TransactionStatusProps {
  signature: string;
  onStatusUpdate?: (status: string) => void;
  showDetails?: boolean;
}

interface StatusStep {
  id: string;
  name: string;
  status: 'pending' | 'current' | 'completed' | 'failed';
  timestamp?: Date;
}

export default function TransactionStatus({ 
  signature, 
  onStatusUpdate,
  showDetails = true 
}: TransactionStatusProps) {
  const { connection } = useConnection();
  const [currentStatus, setCurrentStatus] = useState<string>('pending');
  const [confirmations, setConfirmations] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [steps, setSteps] = useState<StatusStep[]>([
    { id: 'submitted', name: 'Transaction Submitted', status: 'completed', timestamp: new Date() },
    { id: 'processing', name: 'Processing on Solana', status: 'current' },
    { id: 'confirmed', name: 'Transaction Confirmed', status: 'pending' },
    { id: 'finalized', name: 'Transaction Finalized', status: 'pending' }
  ]);

  useEffect(() => {
    if (!signature || !isMonitoring || !connection) return;

    const monitorTransaction = async () => {
      try {
        // Check transaction status
        const confirmation = await connection.getSignatureStatus(signature);
        
        if (confirmation.value) {
          const { confirmationStatus, confirmations: txConfirmations } = confirmation.value;
          
          setConfirmations(txConfirmations || 0);
          
          let status = 'pending';
          if (confirmationStatus === 'confirmed') {
            status = 'confirmed';
          } else if (confirmationStatus === 'finalized') {
            status = 'finalized';
          }
          
          setCurrentStatus(status);
          
          // Update steps based on status
          const newSteps = [...steps];
          
          if (status === 'confirmed' || status === 'finalized') {
            // Mark processing as completed
            const processingIndex = newSteps.findIndex(s => s.id === 'processing');
            if (processingIndex >= 0) {
              newSteps[processingIndex] = { 
                ...newSteps[processingIndex], 
                status: 'completed',
                timestamp: new Date()
              };
            }
            
            // Mark confirmed as completed
            const confirmedIndex = newSteps.findIndex(s => s.id === 'confirmed');
            if (confirmedIndex >= 0) {
              newSteps[confirmedIndex] = { 
                ...newSteps[confirmedIndex], 
                status: 'completed',
                timestamp: new Date()
              };
            }
            
            if (status === 'finalized') {
              // Mark finalized as completed
              const finalizedIndex = newSteps.findIndex(s => s.id === 'finalized');
              if (finalizedIndex >= 0) {
                newSteps[finalizedIndex] = { 
                  ...newSteps[finalizedIndex], 
                  status: 'completed',
                  timestamp: new Date()
                };
              }
              setIsMonitoring(false);
            } else {
              // Mark finalized as current
              const finalizedIndex = newSteps.findIndex(s => s.id === 'finalized');
              if (finalizedIndex >= 0) {
                newSteps[finalizedIndex] = { 
                  ...newSteps[finalizedIndex], 
                  status: 'current'
                };
              }
            }
          }
          
          setSteps(newSteps);
          onStatusUpdate?.(status);
        }
        
      } catch (error) {
        console.error('Error monitoring transaction:', error);
        // Mark current step as failed
        const newSteps = [...steps];
        const currentIndex = newSteps.findIndex(s => s.status === 'current');
        if (currentIndex >= 0) {
          newSteps[currentIndex] = { 
            ...newSteps[currentIndex], 
            status: 'failed',
            timestamp: new Date()
          };
        }
        setSteps(newSteps);
        setCurrentStatus('failed');
        setIsMonitoring(false);
      }
    };

    const interval = setInterval(monitorTransaction, 2000); // Check every 2 seconds
    
    // Initial check
    monitorTransaction();

    return () => clearInterval(interval);
  }, [signature, isMonitoring, connection]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '⭕';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-[#14F195]';
      case 'current':
        return 'text-[#9945FF]';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  const getOverallStatusText = () => {
    switch (currentStatus) {
      case 'confirmed':
        return 'Payment Confirmed!';
      case 'finalized':
        return 'Payment Complete!';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Processing Payment...';
    }
  };

  const getOverallStatusColor = () => {
    switch (currentStatus) {
      case 'confirmed':
      case 'finalized':
        return 'text-[#14F195]';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-[#9945FF]';
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-2xl mb-2">
          {currentStatus === 'finalized' ? '🎉' : 
           currentStatus === 'confirmed' ? '✅' : 
           currentStatus === 'failed' ? '❌' : '⏳'}
        </div>
        <h3 className={`text-lg font-semibold ${getOverallStatusColor()}`}>
          {getOverallStatusText()}
        </h3>
        {confirmations > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {confirmations} network confirmations
          </p>
        )}
      </div>

      {/* Transaction Details */}
      <div className="bg-[#2D2D2D] rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Transaction ID</span>
          <button
            onClick={() => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')}
            className="text-[#9945FF] hover:text-[#8A3FE8] text-sm underline"
          >
            View on Explorer ↗
          </button>
        </div>
        <div className="text-white font-mono text-xs break-all">
          {signature}
        </div>
      </div>

      {/* Progress Steps */}
      {showDetails && (
        <div className="space-y-4">
          <h4 className="text-white font-medium">Transaction Progress</h4>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`text-xl ${getStatusColor(step.status)}`}>
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    step.status === 'completed' ? 'text-[#14F195]' :
                    step.status === 'current' ? 'text-[#9945FF]' :
                    step.status === 'failed' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {step.name}
                  </div>
                  {step.timestamp && (
                    <div className="text-xs text-gray-500">
                      {step.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {step.status === 'current' && isMonitoring && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#9945FF] rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-[#9945FF] rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-[#9945FF] rounded-full animate-pulse delay-150"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="mt-6 pt-4 border-t border-[#333] text-center">
        <div className="text-xs text-gray-500">
          Powered by Solana Network • Devnet Environment
        </div>
      </div>
    </div>
  );
}
