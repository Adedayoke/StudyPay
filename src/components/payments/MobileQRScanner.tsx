/**
 * Mobile-Optimized QR Scanner
 * Uses native browser APIs for better mobile compatibility
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Button, Alert } from '@/components/ui';
import { Camera, X, Upload, Type } from 'lucide-react';

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Import QR code library dynamically for better performance
  const [qrCodeReader, setQrCodeReader] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Dynamically import QR code reader with better configuration
      import('@zxing/library').then((ZXing) => {
        console.log('ZXing library loaded successfully');
        
        // Create a more robust QR code reader
        const codeReader = new ZXing.BrowserQRCodeReader();
        setQrCodeReader(codeReader);
        console.log('QR code reader initialized with hints');
      }).catch((err) => {
        console.error('Failed to load QR code reader:', err);
        setError('QR scanner not available. Please use manual input.');
      });
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, [stream]);

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      // Check if we can access the camera
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      });
      
      // Stop the test stream immediately
      testStream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err: any) {
      console.error('Camera permission check failed:', err);
      
      let errorMessage = 'Camera access denied.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please enable camera access and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another app.';
      }
      
      setError(errorMessage);
      setHasPermission(false);
      onError?.(errorMessage);
      return false;
    }
  };

  const startCamera = async () => {
    if (!videoRef.current || !qrCodeReader) return;

    setError(null);
    setIsScanning(true);

    try {
      const hasCamera = await checkCameraPermission();
      if (!hasCamera) return;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      });

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => resolve();
        }
      });

      // Start scanning
      startQRScanning();

    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setError('Failed to start camera. Please try manual input.');
      setIsScanning(false);
      onError?.('Failed to start camera');
    }
  };

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current || !qrCodeReader) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Wait for video metadata to be loaded
    const startScanning = () => {
      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      console.log('Starting QR scanning with video dimensions:', canvas.width, 'x', canvas.height);

      // Scan every 300ms for better responsiveness
      scanIntervalRef.current = setInterval(() => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            // Draw video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get image data
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Try to decode QR code using ZXing
            qrCodeReader.decodeFromImageData(imageData)
              .then((result: any) => {
                if (result && result.text) {
                  console.log('QR Code detected:', result.text);
                  handleQRResult(result.text);
                }
              })
              .catch((err: any) => {
                // Only log actual errors, not "not found" errors
                if (err.message && !err.message.includes('No MultiFormat Readers')) {
                  console.debug('QR decode error:', err.message);
                }
              });
          } catch (err) {
            console.error('Canvas error:', err);
          }
        }
      }, 300);
    };

    // Start scanning when video is ready
    if (video.readyState >= 2) {
      startScanning();
    } else {
      video.addEventListener('loadedmetadata', startScanning, { once: true });
    }
  };

  const handleQRResult = (qrData: string) => {
    cleanup();
    setError(null);
    onQRDetected(qrData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !qrCodeReader) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        qrCodeReader.decodeFromImageData(imageData)
          .then((result: any) => {
            if (result && result.text) {
              handleQRResult(result.text);
            } else {
              setError('No QR code found in the image.');
            }
          })
          .catch(() => {
            setError('Failed to read QR code from image.');
          });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      handleQRResult(manualInput.trim());
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

          {/* Camera View */}
          {!showManualInput && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-solana-purple-500 rounded-lg relative animate-pulse">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-solana-purple-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-solana-purple-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-solana-purple-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-solana-purple-400 rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-solana-purple-400 to-transparent animate-bounce"></div>
                    </div>
                    
                    {/* Status text */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg mx-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          <span className="text-sm">Scanning for QR codes...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button
                    onClick={startCamera}
                    className="flex-1 bg-solana-purple-500 hover:bg-solana-purple-600"
                    disabled={!qrCodeReader}
                  >
                    <Camera size={16} className="mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    onClick={cleanup}
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
              disabled={!qrCodeReader}
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
