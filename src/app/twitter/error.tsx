'use client';

import { useEffect } from 'react';

export default function TwitterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Twitter page error:', error);
  }, [error]);

  return (
    <main className="bento-container">
      <div className="bento-card col-span-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Twitter / X</h1>
          <p className="text-red-400 mb-4">Something went wrong loading the page.</p>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'rgba(29, 155, 240, 0.15)',
              border: '1px solid rgba(29, 155, 240, 0.3)',
              color: '#1d9bf0',
            }}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
