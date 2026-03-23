import { RecentForm as RecentFormType } from "@/lib/types";

interface RecentFormProps {
  recentForm: RecentFormType;
}

export function RecentForm({ recentForm }: RecentFormProps) {
  const { last_five_results, current_streak, avg_rr_change, trend } = recentForm;

  return (
    <div className="bento-card col-span-4 !p-4">
      <h2 className="text-lg font-semibold mb-3">Recent Form</h2>
      <div className="flex items-center justify-between gap-4">
        {/* Last 5 Games */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 mr-1">Last 5:</span>
          <div className="flex gap-1.5">
            {last_five_results.map((result, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                  result.won
                    ? "bg-green-500/20 text-green-400 border-2 border-green-500"
                    : "bg-red-500/20 text-red-400 border-2 border-red-500"
                }`}
              >
                {result.won ? "W" : "L"}
              </div>
            ))}
          </div>
        </div>

        {/* Current Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">Streak:</span>
          <span
            className={`font-semibold text-sm ${
              current_streak.type === "win" ? "text-green-400" : "text-red-400"
            }`}
          >
            {current_streak.count} {current_streak.type === "win" ? "W" : "L"}
          </span>
        </div>

        {/* Average RR Change */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">Avg RR:</span>
          <span
            className={`font-semibold text-sm ${
              avg_rr_change > 0
                ? "text-green-400"
                : avg_rr_change < 0
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {avg_rr_change > 0 ? "+" : ""}
            {avg_rr_change.toFixed(1)}
          </span>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400">Trend:</span>
          <div className="flex items-center gap-1">
            {trend === "up" && (
              <>
                <svg
                  className="w-3 h-3 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-400 font-semibold text-sm">Up</span>
              </>
            )}
            {trend === "down" && (
              <>
                <svg
                  className="w-3 h-3 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-400 font-semibold text-sm">Down</span>
              </>
            )}
            {trend === "stable" && (
              <>
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-400 font-semibold text-sm">Stable</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
