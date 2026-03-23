'use client';

export default function OsuError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bento-container">
      <div className="bento-card col-span-4 flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">osu! page crashed</h1>
          <p className="text-sm text-gray-400 mb-4">Could not render osu! components.</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'rgba(232, 67, 147, 0.15)',
              border: '1px solid rgba(232, 67, 147, 0.35)',
              color: '#e84393',
            }}
          >
            Retry osu!
          </button>
        </div>
      </div>
    </main>
  );
}
