'use client';
import { useConflictResolution, ConflictData } from '@/lib/conflictResolution';

interface ConflictModalProps<T> {
  conflict: ConflictData<T> | null;
  onResolve: (data: T) => void;
  onCancel: () => void;
}

export function ConflictResolutionModal<T extends Record<string, any>>({
  conflict,
  onResolve,
  onCancel,
}: ConflictModalProps<T>) {
  if (!conflict) return null;

  const handleUseServer = () => {
    onResolve(conflict.serverVersion);
  };

  const handleUseLocal = () => {
    onResolve(conflict.localVersion);
  };

  const handleMerge = () => {
    // Auto-merge strategy
    const merged: any = { ...conflict.serverVersion };
    conflict.conflictFields.forEach(field => {
      // Keep local changes for now
      merged[field] = conflict.localVersion[field];
    });
    onResolve(merged as T);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">⚠️ Conflict Detected</h2>
        
        <p className="text-zinc-400 text-sm mb-4">
          The data on the server has changed since you started editing. Choose how to resolve:
        </p>

        {/* Conflict fields */}
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
          <div className="text-xs font-bold text-zinc-500 mb-2">Conflicting Fields:</div>
          {conflict.conflictFields.map(field => (
            <div key={field} className="mb-3 pb-3 border-b border-white/5 last:border-0">
              <div className="font-medium text-white mb-2">{field}</div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-zinc-500 mb-1">Server Version:</div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-red-400">
                    {JSON.stringify(conflict.serverVersion[field])}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Your Version:</div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-blue-400">
                    {JSON.stringify(conflict.localVersion[field])}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resolution buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUseServer}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
          >
            Use Server Version
          </button>
          <button
            onClick={handleUseLocal}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
          >
            Use My Version
          </button>
          <button
            onClick={handleMerge}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
          >
            Auto-Merge
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full mt-3 text-zinc-500 hover:text-white text-sm transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
