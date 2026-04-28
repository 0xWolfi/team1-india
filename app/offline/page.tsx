'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white px-4 sm:px-6 md:px-8">
      <div className="text-center max-w-md w-full">
        {/* Offline Icon */}
        <div className="mb-8 flex justify-center">
          <svg
            className="w-20 h-20 sm:w-24 sm:h-24 text-zinc-500 dark:text-zinc-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tighter">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Don't worry—reconnect and we'll get you back in.
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 hover:scale-105 transform"
        >
          Try Again
        </button>

        {/* Network Status Indicator */}
        <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10">
          <p className="text-sm text-zinc-600 dark:text-zinc-500 mb-2">Network Status</p>
          <div className="flex items-center justify-center gap-2" role="status">
            <div
              className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
              role="img"
              aria-label="Network Status: Disconnected"
            ></div>
            <span className="text-sm text-zinc-600 dark:text-zinc-500 font-mono">Disconnected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
