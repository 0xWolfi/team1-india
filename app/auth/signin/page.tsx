"use client";

import React, { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, Terminal, AlertTriangle, Globe } from "lucide-react";

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/access-check";
    const error = searchParams.get("error");

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl });
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
             {/* Default background from layout.tsx will show through */}

            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                className="relative z-10 w-full max-w-sm"
            >
                {/* Glass Card */}
                <div className="relative group">
                    {/* Glowing Border Effect - Monochrome */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-zinc-500 via-zinc-800 to-zinc-500 rounded-2xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity duration-500"></div>
                    
                    <div className="relative px-8 py-10 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.9)]">
                        
                        {/* Header */}
                        <div className="flex flex-col items-center mb-10 text-center">
                            <motion.div 
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group/icon"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"/>
                                <Terminal className="w-7 h-7 text-white relative z-10" />
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-3xl font-bold text-white tracking-tight mb-2"
                            >
                                Core Access
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-zinc-500 text-sm font-medium tracking-wide uppercase"
                            >
                                Authorized Personnel Only
                            </motion.p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mb-6 p-3 rounded-lg bg-zinc-800/50 border border-white/10 flex items-center gap-3 overflow-hidden text-zinc-300"
                            >
                                <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span className="text-xs font-medium">Authentication Failed. Access Denied.</span>
                            </motion.div>
                        )}

                        {/* Login Button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            onClick={handleGoogleSignIn}
                            className="group/btn relative w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] overflow-hidden flex items-center justify-center gap-3"
                        >
                             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                             
                             <svg className="w-5 h-5 grayscale group-hover/btn:grayscale-0 transition-all duration-300" viewBox="0 0 24 24">
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
                            <span>Sign in with Google</span>
                        </motion.button>
                        
                        {/* Footer Status - Monochrome */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4"
                        >
                            <div className="flex items-center gap-2 group/status cursor-default">
                                <div className="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover/status:bg-white/10 transition-colors">
                                    <Globe className="w-3 h-3 text-zinc-400 group-hover/status:text-white transition-colors" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">System</span>
                                    <span className="text-[10px] text-zinc-300 font-mono">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 group/status cursor-default justify-end">
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Connection</span>
                                    <span className="text-[10px] text-zinc-300 font-mono">Secure</span>
                                </div>
                                <div className="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover/status:bg-white/10 transition-colors">
                                    <ShieldCheck className="w-3 h-3 text-zinc-400 group-hover/status:text-white transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6 text-center"
                >
                    <p className="text-[10px] text-zinc-600 font-mono">
                        Team1 India Internal Network • v2.0.4
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-zinc-600 text-sm font-mono animate-pulse">Initializing Core...</div>}>
            <SignInContent />
        </Suspense>
    );
}
