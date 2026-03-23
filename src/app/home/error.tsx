'use client';

export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bento-container">
      <div className="bento-card col-span-4 flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Home tab failed to load</h1>
          <p className="text-sm text-gray-400 mb-4">Profile widgets could not be rendered.</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </main>
  );
}
