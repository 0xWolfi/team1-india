'use client';

import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type, isVisible, onClose, duration = 4000 }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
        error: <AlertCircle className="w-5 h-5 text-white" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-zinc-800 border-white/10',
        info: 'bg-blue-500/10 border-blue-500/20',
    };

    const textColors = {
        success: 'text-emerald-400',
        error: 'text-white',
        info: 'text-blue-400',
    };

    return (
        <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl max-w-md ${bgColors[type]}`}>
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <p className={`flex-1 text-sm font-medium ${textColors[type]}`}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                </button>
            </div>
        </div>
    );
}
