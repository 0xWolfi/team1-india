"use client";

import { useState, useEffect } from "react";
import { Shield, Smartphone, Key, CheckCircle } from "lucide-react";

export function TwoFactorSetup() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/2fa/status").then((r) => r.json()).then((d) => { setStatus(d); setLoading(false); });
  }, []);

  const handleSetupTotp = () => { window.location.href = "/auth/setup-2fa"; };

  if (loading) return <div className="text-zinc-400 text-sm">Loading 2FA status...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-5 h-5 text-zinc-500" />
        <h3 className="font-bold text-black dark:text-white">Two-Factor Authentication</h3>
        {status?.enabled && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">Enabled</span>}
      </div>

      <div className="space-y-3">
        {/* TOTP */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-zinc-400" />
            <div>
              <div className="text-sm font-medium text-black dark:text-white">Authenticator App</div>
              <div className="text-xs text-zinc-500">Google Authenticator, Authy, etc.</div>
            </div>
          </div>
          {status?.totp ? (
            <span className="flex items-center gap-1 text-green-500 text-xs font-medium"><CheckCircle className="w-4 h-4" />Active</span>
          ) : (
            <button onClick={handleSetupTotp} className="px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:opacity-90">Setup</button>
          )}
        </div>

        {/* Passkeys */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-black/5 dark:border-white/5">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-zinc-400" />
            <div>
              <div className="text-sm font-medium text-black dark:text-white">Passkeys</div>
              <div className="text-xs text-zinc-500">{status?.passkeys?.length || 0} registered</div>
            </div>
          </div>
          {status?.passkey ? (
            <span className="flex items-center gap-1 text-green-500 text-xs font-medium"><CheckCircle className="w-4 h-4" />Active</span>
          ) : (
            <span className="text-xs text-zinc-400">Setup via authenticator first</span>
          )}
        </div>
      </div>
    </div>
  );
}
