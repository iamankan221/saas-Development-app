import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Enhanced BarcodeScanner Component
 * Uses lower-level Html5Qrcode for better reliability and control
 */
export default function BarcodeScanner({ onScan, onClose, isInline = false }) {
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    const scannerId = isInline ? "barcode-reader-inline" : "barcode-reader-surface";
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      qrbox: { width: 280, height: 160 },
      aspectRatio: isInline ? (window.innerWidth / window.innerHeight) : 1.777778
    };

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            // In inline mode, we might want to keep scanning, 
            // but for now we'll follow the same pattern
            onScan(decodedText);
          }
        );
        setIsInitializing(false);
      } catch (err) {
        console.error("Scanner Error:", err);
        setError("Camera access denied or not found.");
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("Stop failed", e));
      }
    };
  }, [onScan, isInline]);

  const ScannerSurface = (
    <div className={`relative ${isInline ? "w-full h-full" : "aspect-video rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-900"}`}>
      <div id={isInline ? "barcode-reader-inline" : "barcode-reader-surface"} className="w-full h-full object-cover" />
      
      {(isInitializing || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-center p-6">
          {isInitializing ? (
            <>
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-white text-sm font-bold">Initializing Vision...</p>
            </>
          ) : (
            <>
              <p className="text-white text-sm font-bold">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold">Retry</button>
            </>
          )}
        </div>
      )}

      {!isInitializing && !error && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-[40px] border-black/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[160px] border-2 border-blue-400 rounded-xl shadow-[0_0_0_999px_rgba(0,0,0,0.3)]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan" />
          </div>
        </div>
      )}
    </div>
  );

  if (isInline) return ScannerSurface;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Scanner Vision</h3>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Active Mode</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-8">
          {ScannerSurface}
          <div className="mt-8 flex items-center gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div><p className="text-sm font-bold text-slate-800">Ready to Scan</p><p className="text-xs text-slate-500">Hold product steady.</p></div>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan { animation: scan 2s linear infinite; }`}} />
    </div>
  );
}
