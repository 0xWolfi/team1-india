"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function PublicConsentModal() {
  const router = useRouter();
  const { data: session, update } = useSession(); // update function to soft-refresh session
  const [agreedNewsletter, setAgreedNewsletter] = useState(false);
  const [agreedLegal, setAgreedLegal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  const isFormValid = agreedNewsletter && agreedLegal;

  const handleConfirm = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      // 1. Update Database
      const res = await fetch("/api/public/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              consentNewsletter: agreedNewsletter,
              consentLegal: agreedLegal 
          })
      });

      if (!res.ok) throw new Error("Failed to update consent");

      // 2. Update Session (so the modal disappears)
      await update({ consent: true });
      
      // Force hard refresh to ensure middleware/client-components catch the change
      window.location.reload(); 
    } catch (error) {
      console.error("Consent update failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/40 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Final Step</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Please review and accept our terms to access your account.</p>
        </div>

        <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 min-w-5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${agreedNewsletter ? 'bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 group-hover:border-black/30 dark:group-hover:border-white/30 group-hover:bg-black/10 dark:group-hover:bg-black/40'}`}>
                   {agreedNewsletter && <Check className="w-3.5 h-3.5 stroke-[3]"/>}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreedNewsletter}
                  onChange={(e) => setAgreedNewsletter(e.target.checked)}
                />
                <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  I agree to receive Team1 updates and promotional communications. I can opt out anytime.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className={`mt-0.5 min-w-5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${agreedLegal ? 'bg-white border-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 group-hover:border-black/30 dark:group-hover:border-white/30 group-hover:bg-black/10 dark:group-hover:bg-black/40'}`}>
                   {agreedLegal && <Check className="w-3.5 h-3.5 stroke-[3]"/>}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreedLegal}
                  onChange={(e) => setAgreedLegal(e.target.checked)}
                />
                <span className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  I agree to the <Link href="https://www.avax.network/privacy-policy" target="_blank" className="text-black dark:text-white hover:underline decoration-yellow-500/50">Privacy Policy</Link> and <Link href="https://www.avax.network/legal" target="_blank" className="text-black dark:text-white hover:underline decoration-yellow-500/50">Legal Terms</Link>.
                </span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!isFormValid || isLoading}
              className={`group w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 overflow-hidden
                ${isFormValid && !isLoading
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                  : 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-black/5 dark:border-white/5'}
              `}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <span className="group-hover:scale-110 transition-transform duration-300">Complete Setup</span>
              )}
            </button>
        </div>
      </div>
    </div>
  );
}
