/**
 * Mobile-Optimized QR Scanner
 * Uses blackbox-vision react-qr-reader for better mobile compatibility
 */

'use client';

import React, { useState, useRef } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { Camera, X, Upload, Type } from 'lucide-react';
import { QrReader } from '@blackbox-vision/react-qr-reader';

interface MobileQRScannerProps {
  onQRDetected: (data: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function MobileQRScanner({ 
  onQRDetected, 
  onError, 
  onClose, 
  isOpen 
}: MobileQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQRResult = (result: any) => {
    if (result?.text) {
      console.log('QR Code detected:', result.text);
      setIsScanning(false);
      setError(null);
      onQRDetected(result.text);
    }
  };

  const handleQRError = (error: any) => {
    console.error('QR Scanner error:', error);
    setError('Failed to scan QR code. Please try again or use manual input.');
    onError?.('QR scanner error');
  };

  const startScanning = () => {
    setError(null);
    setIsScanning(true);
    console.log('Starting QR scanner...');
  };

  const stopScanning = () => {
    setIsScanning(false);
    console.log('Stopping QR scanner...');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // For file upload, we'll just show manual input as fallback
      setError('Please use manual input for file-based QR codes.');
      setShowManualInput(true);
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onQRDetected(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-bg-secondary border-dark-border-primary">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {/* QR Scanner */}
          {!showManualInput && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {isScanning ? (
                  <div className="w-full h-full">
                    <QrReader
                      onResult={(result, error) => {
                        if (error) {
                          handleQRError(error);
                        }
                        if (result) {
                          handleQRResult(result);
                        }
                      }}
                      constraints={{
                        facingMode: 'environment'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Click "Start Camera" to begin scanning</p>
                    </div>
                  </div>
                )}
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-solana-purple-500 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-solana-purple-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-solana-purple-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-solana-purple-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-solana-purple-400 rounded-br-lg"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button
                    onClick={startScanning}
                    className="flex-1 bg-solana-purple-500 hover:bg-solana-purple-600"
                  >
                    <Camera size={16} className="mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="secondary"
                    className="flex-1"
                  >
                    Stop Scanning
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Manual Input */}
          {showManualInput && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Payment URL or QR Data
                </label>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste Solana Pay URL or QR code data here..."
                  className="w-full h-24 px-3 py-2 bg-dark-bg-tertiary border border-dark-border-primary rounded-lg text-white placeholder-gray-400 resize-none"
                />
              </div>
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="w-full bg-solana-purple-500 hover:bg-solana-purple-600"
              >
                Process Payment
              </Button>
            </div>
          )}

          {/* Alternative Options */}
          <div className="mt-6 space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="w-full"
            >
              <Upload size={16} className="mr-2" />
              Upload QR Image
            </Button>
            
            <Button
              onClick={() => setShowManualInput(!showManualInput)}
              variant="secondary"
              className="w-full"
            >
              <Type size={16} className="mr-2" />
              {showManualInput ? 'Use Camera' : 'Manual Input'}
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Help Text */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            Point your camera at a Solana Pay QR code or use manual input
          </div>
        </div>
      </Card>
    </div>
  );
}
