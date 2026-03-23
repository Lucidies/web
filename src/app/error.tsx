'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#06070b] text-white">
        <main className="bento-container min-h-screen flex items-center justify-center">
          <div className="bento-card col-span-4 !p-6 text-center max-w-xl">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-400 mb-5">
              We hit an unexpected error while rendering this page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
