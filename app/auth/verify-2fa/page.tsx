"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Verify2FAPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<"totp" | "recovery">("totp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, method }),
      });
      const data = await res.json();
      if (data.success) {
        await update({ twoFactorVerified: true });
        const role = (session?.user as any)?.role;
        router.push(role === "CORE" ? "/core" : role === "MEMBER" ? "/member" : "/public");
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="w-full max-w-sm mx-4 sm:mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">Two-Factor Verification</h1>
          <p className="text-zinc-600 dark:text-zinc-500 text-sm mt-2">Enter your authentication code to continue</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setMethod("totp")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === "totp" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500"}`}
          >
            Authenticator
          </button>
          <button
            onClick={() => setMethod("recovery")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${method === "recovery" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500"}`}
          >
            Recovery Code
          </button>
        </div>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={method === "totp" ? "Enter 6-digit code" : "Enter recovery code (XXXX-XXXX)"}
          className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-transparent text-black dark:text-white text-center text-base sm:text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          maxLength={method === "totp" ? 6 : 9}
          autoFocus
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading || !code}
          className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );
}
