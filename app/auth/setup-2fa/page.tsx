"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Setup2FAPage() {
  const router = useRouter();
  const [step, setStep] = useState<"setup" | "verify" | "recovery">("setup");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/totp/setup", { method: "POST" });
      const data = await res.json();
      setSecret(data.secret);
      setUri(data.uri);
      setStep("verify");
    } catch { setError("Failed to setup"); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        // Generate recovery codes
        const recovRes = await fetch("/api/auth/2fa/recovery/generate", { method: "POST" });
        const recovData = await recovRes.json();
        setRecoveryCodes(recovData.codes);
        setStep("recovery");
      } else { setError(data.error || "Invalid code"); }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDone = () => {
    router.push("/core");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white">Setup Two-Factor Authentication</h1>
          <p className="text-zinc-500 text-sm mt-2">
            {step === "setup" && "Secure your account with an authenticator app"}
            {step === "verify" && "Scan the QR code with your authenticator app, then enter the code"}
            {step === "recovery" && "Save these recovery codes in a safe place"}
          </p>
        </div>

        {step === "setup" && (
          <button onClick={handleSetup} disabled={loading} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
            {loading ? "Setting up..." : "Setup Authenticator App"}
          </button>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 mb-2">Manual entry key:</p>
              <p className="font-mono text-sm text-black dark:text-white break-all select-all">{secret}</p>
              <p className="text-xs text-zinc-400 mt-2">URI: <span className="break-all">{uri}</span></p>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-black dark:text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              maxLength={6}
              autoFocus
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button onClick={handleVerify} disabled={loading || code.length !== 6} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        )}

        {step === "recovery" && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-red-500 font-bold mb-3">Save these codes! They won&apos;t be shown again.</p>
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((c, i) => (
                  <div key={i} className="font-mono text-sm text-black dark:text-white bg-white dark:bg-black px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 text-center">
                    {c}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleDone} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90">
              I&apos;ve Saved My Codes — Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
