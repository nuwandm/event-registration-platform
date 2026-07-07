import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

export type ScannerState = 'idle' | 'starting' | 'scanning' | 'stopped' | 'error';

interface UseQRScannerOptions {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export function useQRScanner(elementId: string, options: UseQRScannerOptions) {
  const { onScan, onError } = options;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScannerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const start = useCallback(async () => {
    if (state === 'scanning' || state === 'starting') return;
    setState('starting');
    setErrorMessage(null);

    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isMountedRef.current) onScan(decodedText);
        },
        // Suppress per-frame errors (camera is scanning, just not detected)
        () => {}
      );

      if (isMountedRef.current) setState('scanning');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.includes('Permission')
            ? 'Camera access denied. Please allow camera permission and retry.'
            : err.message.includes('NotFound')
            ? 'No camera found on this device.'
            : 'Could not start camera. Please try again.'
          : 'Camera error';

      if (isMountedRef.current) {
        setState('error');
        setErrorMessage(msg);
        onError?.(msg);
      }
    }
  }, [elementId, onScan, onError, state]);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const scannerState = scanner.getState();
      if (
        scannerState === Html5QrcodeScannerState.SCANNING ||
        scannerState === Html5QrcodeScannerState.PAUSED
      ) {
        await scanner.stop();
      }
    } catch {
      // Ignore stop errors (scanner may already be stopped)
    } finally {
      scannerRef.current = null;
      if (isMountedRef.current) setState('stopped');
    }
  }, []);

  const pause = useCallback(() => {
    scannerRef.current?.pause(true);
  }, []);

  const resume = useCallback(() => {
    scannerRef.current?.resume();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        try {
          const s = scanner.getState();
          if (s === Html5QrcodeScannerState.SCANNING || s === Html5QrcodeScannerState.PAUSED) {
            scanner.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return { state, errorMessage, start, stop, pause, resume };
}
