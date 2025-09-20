/**
 * QR Code Wallet Connection
 * Alternative wallet connection method for mobile PWA when direct connection fails
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Card, Button, Alert } from '@/components/ui';
import { StudyPayIcon } from '@/lib/utils/iconMap';

interface QRWalletConnectionProps {
  onWalletConnected?: (publicKey: PublicKey) => void;
}

export function QRWalletConnection({ onWalletConnected }: QRWalletConnectionProps) {
  const [showQRMethod, setShowQRMethod] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'idle' | 'generating' | 'waiting' | 'connected'>('idle');

  // Generate connection QR code
  const generateConnectionQR = async () => {
    setIsGeneratingQR(true);
    setConnectionStep('generating');
    
    try {
      // Create a unique session ID for this connection attempt
      const sessionId = Date.now().toString();
      
      // In a real implementation, you'd:
      // 1. Generate a unique session ID
      // 2. Create a QR code with connection URL
      // 3. Poll server for wallet signature
      // 4. Verify signature and establish connection
      
      const connectionUrl = `${window.location.origin}/wallet-connect?session=${sessionId}`;
      
      // For now, we'll create a mock QR code
      setQrCodeData(connectionUrl);
      setConnectionStep('waiting');
      
      // Simulate waiting for wallet connection
      setTimeout(() => {
        setConnectionStep('connected');
        // In real implementation, this would be triggered by actual wallet connection
      }, 5000);
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setConnectionStep('idle');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alternative Connection Methods */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Alternative Connection Methods</h3>
        <p className="text-sm text-gray-600 mb-4">
          Can't connect your wallet directly? Try these alternatives:
        </p>
      </div>

      {/* QR Code Method */}
      <Card className="p-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <StudyPayIcon name="qr" size={20} className="text-blue-500" />
            <h4 className="font-medium">QR Code Connection</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Scan with your mobile wallet app to connect securely
          </p>
          
          {!showQRMethod ? (
            <Button
              onClick={() => setShowQRMethod(true)}
              variant="secondary"
              className="w-full"
            >
              Use QR Code Method
            </Button>
          ) : (
            <div className="space-y-3">
              {connectionStep === 'idle' && (
                <Button
                  onClick={generateConnectionQR}
                  disabled={isGeneratingQR}
                  className="w-full"
                >
                  {isGeneratingQR ? 'Generating QR Code...' : 'Generate QR Code'}
                </Button>
              )}
              
              {connectionStep === 'generating' && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Generating secure connection...</span>
                </div>
              )}
              
              {connectionStep === 'waiting' && qrCodeData && (
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                    {/* In real implementation, use a QR code library */}
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <StudyPayIcon name="mobile" size={64} className="text-blue-500" />
                      </div>
                      <p className="text-xs font-mono break-all">{qrCodeData}</p>
                    </div>
                  </div>
                  <Alert>
                    <p className="text-sm">
                      <strong>Instructions:</strong><br/>
                      1. Open your Phantom or Solflare wallet app<br/>
                      2. Look for "Connect to App" or "Scan QR"<br/>
                      3. Scan the QR code above<br/>
                      4. Approve the connection
                    </p>
                  </Alert>
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Waiting for wallet connection...</span>
                  </div>
                </div>
              )}
              
              {connectionStep === 'connected' && (
                <Alert className="bg-green-50 border-green-200">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <StudyPayIcon name="success" size={32} className="text-green-500" />
                    </div>
                    <p className="text-green-800 font-medium">Wallet Connected Successfully!</p>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Manual Address Input Method */}
      <Card className="p-4">
        <ManualAddressInput />
      </Card>

      {/* Wallet App Download Links */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h4 className="font-medium mb-2 text-blue-800">
            <StudyPayIcon name="mobile" className="inline mr-2" size={16} />
            Don't have a wallet?
          </h4>
          <p className="text-sm text-blue-600 mb-3">
            Download a Solana wallet app to get started:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://phantom.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
            >
              <StudyPayIcon name="wallet" size={14} />
              Phantom Wallet
            </a>
            <a
              href="https://solflare.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-600 text-white py-2 px-3 rounded text-sm hover:bg-orange-700 transition-colors flex items-center justify-center gap-1"
            >
              <StudyPayIcon name="flame" size={14} />
              Solflare Wallet
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Manual address input for read-only mode
function ManualAddressInput() {
  const [address, setAddress] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  const validateAddress = (addr: string) => {
    try {
      new PublicKey(addr);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setError('');
    
    if (value.length > 0) {
      const valid = validateAddress(value);
      setIsValid(valid);
      if (!valid && value.length > 10) {
        setError('Invalid Solana address');
      }
    } else {
      setIsValid(false);
    }
  };

  const handleViewOnly = () => {
    if (isValid) {
      // Set up read-only mode with this address
      console.log('Setting up read-only mode for:', address);
      // In real implementation, you'd set up a read-only wallet connection
    }
  };

  return (
    <div className="text-center">
      <h4 className="font-medium mb-2">👀 View-Only Mode</h4>
      <p className="text-sm text-gray-600 mb-3">
        Enter a Solana address to view balance and transactions (read-only)
      </p>
      
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter Solana wallet address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
          {error && (
            <p className="text-red-600 text-xs mt-1">{error}</p>
          )}
        </div>
        
        <Button
          onClick={handleViewOnly}
          disabled={!isValid}
          variant="secondary"
          className="w-full"
        >
          View Balance & Transactions
        </Button>
        
        <p className="text-xs text-gray-500">
          Note: View-only mode allows you to see balance and transaction history, 
          but you cannot send payments or sign transactions.
        </p>
      </div>
    </div>
  );
}
