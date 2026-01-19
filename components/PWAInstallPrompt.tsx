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

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

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
  if (isStandalone || !showPrompt) return null;

  // iOS-specific prompt with instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 text-slate-50 p-4 rounded-xl shadow-2xl max-w-md mx-auto ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-slate-100">Install Team1 India</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Install this app on your iPhone for quick access and offline support.
              </p>
              <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold">1</span>
                  Tap the Share button
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </p>
                <p className="text-xs text-slate-300 flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold">2</span>
                  Scroll and tap &quot;Add to Home Screen&quot;
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              aria-label="Dismiss install prompt"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full mt-3 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 text-slate-50 p-4 rounded-xl shadow-2xl max-w-md mx-auto ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-slate-100">Install Team1 India</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Add to your home screen for quick access, offline support, and a native app experience.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label="Dismiss install prompt"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/50"
          >
            Maybe later
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm shadow-indigo-900/20 transition-all hover:shadow-indigo-900/40 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Install App
          </button>
        </div>
      </div>
    </div>
  );
}
