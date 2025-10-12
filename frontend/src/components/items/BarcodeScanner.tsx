import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  fetchProductByBarcode,
  formatProductName,
  suggestEmojiFromProduct,
  estimateExpiryDate,
  ProductInfo
} from "@/services/barcodeService";

interface BarcodeScannerProps {
  onProductFound: (productData: {
    name: string;
    emoji: string;
    productInfo: ProductInfo;
  }) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload' | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false); // Prevent multiple scans

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const handleBarcodeDetected = async (decodedText: string) => {
    // Prevent processing multiple scans at once
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    console.log('Barcode detected:', decodedText);
    setIsFetching(true);

    // Stop scanner immediately
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }

    try {
      // Fetch product information
      const product = await fetchProductByBarcode(decodedText);

      if (!product) {
        toast.error('Product not found in database. Please enter details manually.');
        processingRef.current = false;
        onClose();
        return;
      }

      // Extract and format product data
      const productData = {
        name: formatProductName(product),
        emoji: suggestEmojiFromProduct(product),
        productInfo: product,
      };

      // Call the callback to populate the form
      onProductFound(productData);

      // Don't show toast here - let the parent component handle it
      // Close the scanner
      onClose();
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast.error('Failed to fetch product information');
      processingRef.current = false;
      onClose();
    } finally {
      setIsFetching(false);
      processingRef.current = false;
    }
  };

  const startCameraScanning = async () => {
    setScanMode('camera');
    setIsScanning(true);

    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10, // Increased for better detection
          qrbox: { width: 250, height: 250 }, // Square box - no qrbox restriction for better scanning
          aspectRatio: 1.777778, // 16:9
          videoConstraints: {
            facingMode: "environment",
            advanced: [{ zoom: 1.0 }]
          },
          // Enable more barcode formats for better detection
          formatsToSupport: [
            // Most common formats
            0, // UPC_A
            1, // UPC_E
            2, // EAN_8
            3, // EAN_13
            8, // CODE_39
            9, // CODE_93
            10, // CODE_128
            11, // ITF
            12, // RSS_14
            13, // RSS_EXPANDED
          ],
          // Better detection settings
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native browser API if available
          }
        },
        handleBarcodeDetected,
        (errorMessage) => {
          // Ignore verbose error messages
          if (!errorMessage.includes('NotFoundException')) {
            console.log('Scan error:', errorMessage);
          }
        }
      );
    } catch (error: any) {
      console.error('Error starting camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
      setScanMode(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScanMode('upload');
    setIsFetching(true);

    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      await handleBarcodeDetected(decodedText);
    } catch (error: any) {
      console.error('Error scanning file:', error);
      toast.error('Could not detect barcode in image. Please try again.');
      setScanMode(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleStopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
    setScanMode(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <style>
        {`
          #barcode-reader video {
            transform: scaleX(-1);
          }
          #barcode-reader canvas {
            transform: scaleX(-1);
          }
        `}
      </style>
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>
                {scanMode === 'camera'
                  ? 'Point your camera at the barcode'
                  : 'Choose how to scan the barcode'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isFetching}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scanner Preview */}
          <div
            id="barcode-reader"
            className={`${scanMode ? 'block' : 'hidden'} w-full min-h-[400px] rounded-lg overflow-hidden border-2 border-primary`}
          />

          {/* Loading State */}
          {isFetching && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Looking up product...</p>
            </div>
          )}

          {/* Action Buttons */}
          {!scanMode && !isFetching && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                size="lg"
                variant="default"
                onClick={startCameraScanning}
                className="h-24 flex-col gap-2"
              >
                <Camera className="h-8 w-8" />
                <span>Use Camera</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex-col gap-2"
              >
                <Upload className="h-8 w-8" />
                <span>Upload Image</span>
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Stop Button */}
          {isScanning && !isFetching && (
            <Button
              size="lg"
              variant="destructive"
              onClick={handleStopScanning}
              className="w-full"
            >
              Stop Scanning
            </Button>
          )}

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            Supports UPC, EAN, and most common barcode formats
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
