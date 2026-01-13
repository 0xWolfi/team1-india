'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, Lock } from 'lucide-react';

export function AccessDeniedHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [errorType, setErrorType] = useState<string>('');

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'not_member' || error === 'access_denied') {
            setErrorType(error);
            setIsOpen(true);
        }
    }, [searchParams]);

    const handleClose = () => {
        setIsOpen(false);
        // Clean URL
        router.replace('/public');
    };

    if (!isOpen) return null;

    const getErrorMessage = () => {
        if (errorType === 'not_member') {
            return {
                title: 'Access Restricted',
                message: 'Your email is not recognized as an active member. If you believe this is a mistake, please contact support or apply for membership.'
            };
        } else if (errorType === 'access_denied') {
            return {
                title: 'Access Denied',
                message: 'You do not have permission to access this section. Please contact an administrator if you believe you should have access.'
            };
        }
        return {
            title: 'Access Error',
            message: 'An error occurred while trying to access this resource.'
        };
    };

    const { title, message } = getErrorMessage();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <Lock className="w-6 h-6 text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-zinc-400 text-sm mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
