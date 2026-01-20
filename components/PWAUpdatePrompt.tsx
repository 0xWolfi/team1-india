"use client";

import { useEffect, useState } from "react";

export default function PwaUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check for updates on mount
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowPrompt(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              // If new worker is installed and there is an existing controller, it means an update exists
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(newWorker);
                setShowPrompt(true);
              }
            });
          }
        });
      }
    });

    // Reload when the new SW takes control
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    // Fallback if waitingWorker is lost but prompt is shown? 
    // Usually shouldn't happen, but we can also check registration again.
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white/80 backdrop-blur-md border border-zinc-200 text-zinc-900 p-4 rounded-xl shadow-2xl max-w-sm ring-1 ring-black/5">
        <div className="flex gap-4">
          <div className="p-2 bg-zinc-100 rounded-lg h-fit">
            <svg 
              className="w-5 h-5 text-zinc-900" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-sm text-zinc-900">Update Available</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              A new version of the app is ready. Refresh to update.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 pl-11">
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-1 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-100"
            aria-label="Dismiss update notification"
          >
            Dismiss
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg shadow-sm shadow-zinc-900/20 transition-all hover:shadow-zinc-900/40"
          >
            Refresh App
          </button>
        </div>
      </div>
    </div>
  );
}
