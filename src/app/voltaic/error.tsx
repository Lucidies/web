'use client';

import { useEffect } from 'react';

export default function VoltaicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Voltaic page error:', error);
  }, [error]);

  return (
    <main className="bento-container">
      <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Voltaic</h1>
          <p className="text-red-400 mb-4">Something went wrong loading the page.</p>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: '#f97316',
            }}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    </main>
  );
}