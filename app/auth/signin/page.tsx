"use client";

import React, { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Terminal, AlertTriangle } from "lucide-react";

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/access-check";
    const error = searchParams.get("error");

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl });
    };

    return (
        <div className="relative min-h-screen bg-black text-white flex items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            </div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md p-8 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl mb-4 border border-white/10 shadow-inner">
                        <Terminal className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        Core Terminal
                    </h1>
                    <p className="text-zinc-500 text-sm font-mono">
                        Team1 India Internal Access
                    </p>
                </div>

                {error && (
                     <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                     >
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-200">
                             <span className="font-bold block text-red-400 mb-1">Access Denied</span>
                             Your account does not have permission to access the Core Terminal.
                        </div>
                     </motion.div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleSignIn}
                        className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-all duration-200 active:scale-[0.98]"
                    >
                         {/* Google Icon SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-4 border-t border-white/5">
                        <span className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            Secure Connection
                        </span>
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" />
                            Core Access Only
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
