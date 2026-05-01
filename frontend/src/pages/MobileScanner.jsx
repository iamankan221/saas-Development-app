import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import BarcodeScanner from "@/components/BarcodeScanner";

// Use same origin as the page (Vite will proxy /socket.io to backend)
const socket = io(window.location.origin);

export default function MobileScanner() {
  const [sessionId, setSessionId] = useState(null);
  const [lastScan, setLastScan] = useState(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("sid");
    
    if (id) {
      setSessionId(id);
      socket.emit("join-session", id);
      setStatus("Connected to PC");
    } else {
      setStatus("Invalid Session");
    }

    socket.on("connect", () => {
      if (id) socket.emit("join-session", id);
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  const handleScan = (barcode) => {
    if (sessionId) {
      socket.emit("scan-result", { sessionId, barcode });
      setLastScan(barcode);
      
      // Feedback vibration if supported
      if (navigator.vibrate) navigator.vibrate(100);
      
      // Flash the screen for feedback
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 bg-white z-[200] animate-pulse duration-75";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 100);

      // Reset last scan feedback after 2 seconds
      setTimeout(() => setLastScan(null), 2000);
    }
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Access Denied</h1>
        <p className="text-slate-500 leading-relaxed font-medium">Please scan the QR code on your Computer screen to link your mobile scanner.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-lg font-black text-slate-800 leading-tight tracking-tight">Wireless Scanner</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{status}</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Main Scanner Body */}
      <div className="flex-1 relative">
        <BarcodeScanner 
          isInline={true}
          onScan={handleScan}
        />
        
        {/* Success Toast */}
        {lastScan && (
          <div className="absolute top-10 left-4 right-4 z-50">
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 duration-300 border-2 border-white/20">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Sent to PC</p>
                <p className="text-base font-black truncate">{lastScan}</p>
              </div>
            </div>
          </div>
        )}

        {/* Framing Guides */}
        <div className="absolute inset-0 pointer-events-none border-[3rem] border-black/60">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[25vh] border-2 border-white/30 rounded-3xl" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-md p-8 text-center border-t border-white/5">
        <p className="text-white/30 text-[9px] font-black tracking-[0.4em] uppercase">VyaparBook Vision Link • Secure Connection</p>
      </div>
    </div>
  );
}
