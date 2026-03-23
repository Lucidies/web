'use client';

export default function ValorantError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bento-container">
      <div className="bento-card col-span-4 flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Valorant page crashed</h1>
          <p className="text-sm text-gray-400 mb-4">Could not render Valorant components.</p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'rgba(255, 70, 85, 0.15)',
              border: '1px solid rgba(255, 70, 85, 0.35)',
              color: '#ff4655',
            }}
          >
            Retry Valorant
          </button>
        </div>
      </div>
    </main>
  );
}
