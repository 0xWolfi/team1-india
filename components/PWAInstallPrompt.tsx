"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const detectMobile = () => {
    const ua = navigator.userAgent || "";
    const uaMobile = (navigator as any).userAgentData?.mobile;
    return Boolean(uaMobile || /Android|iPhone|iPad|iPod|Mobile/i.test(ua));
  };

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    const mobile = detectMobile();
    setIsMobile(mobile);
    if (!mobile) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user dismissed the prompt recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        return;
      }
    }

    // For iOS, show prompt after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome, capture the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if already installed or prompt shouldn't be shown
  if (isStandalone || !showPrompt || !isMobile) return null;

  // iOS-specific prompt with instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/80 backdrop-blur-2xl border border-white/40 text-black p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-w-md mx-auto ring-1 ring-black/5">
            {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                <div>
                     <h3 className="font-bold text-base leading-tight">Install App</h3>
                     <p className="text-xs text-zinc-500 font-medium">Add to Home Screen</p>
                </div>
             </div>
             <button
               onClick={handleDismiss}
               className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-zinc-400"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-4 group">
                 <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 font-bold text-sm text-black/60 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">1</div>
                 <p className="text-sm font-medium text-zinc-700">Tap the <span className="font-bold text-blue-500">Share</span> button <span className="inline-block align-middle pb-1"><svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></span> below</p>
            </div>
            <div className="flex items-center gap-4 group">
                 <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 font-bold text-sm text-black/60 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">2</div>
                 <p className="text-sm font-medium text-zinc-700">Select <span className="font-bold text-black">Add to Home Screen</span></p>
            </div>
          </div>
          
           {/* Maybe Later */}
           <button
             onClick={handleDismiss}
             className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-black hover:bg-black/5 transition-all"
           >
             Maybe later
           </button>
        </div>
      </div>
    );
  }

  // Android/Chrome install prompt
  if (!installPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-2xl border border-white/40 text-black p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] max-w-md mx-auto ring-1 ring-black/5">
         <div className="flex items-start justify-between gap-4 mb-4">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                 </div>
                <div>
                     <h3 className="font-bold text-base leading-tight">Install Team1 Hub</h3>
                     <p className="text-xs text-zinc-500 font-medium">Native App Experience</p>
                </div>
             </div>
             <button
               onClick={handleDismiss}
               className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-zinc-400"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>

        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          Install for full screen experience, offline access, and instant updates.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDismiss}
            className="px-4 py-3 rounded-xl text-xs font-bold text-zinc-500 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            Maybe later
          </button>
          <button
            onClick={handleInstall}
            className="px-4 py-3 rounded-xl text-xs font-bold bg-black text-white hover:bg-zinc-800 transition-colors shadow-lg shadow-black/20 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Install Now
          </button>
        </div>
      </div>
    </div>
  );
}
