import { PerformanceMetrics } from "@/lib/types";

interface PerformanceStatsProps {
  stats: PerformanceMetrics;
}

export function PerformanceStats({ stats }: PerformanceStatsProps) {
  return (
    <div className="bento-card col-span-2 !p-4">
      <h2 className="text-lg font-semibold mb-3">Performance Stats</h2>
      <div className="space-y-2">
        {/* K/D Ratio */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">K/D Ratio</span>
          <span className="font-semibold tabular-nums text-sm">
            {stats.overall_kd.toFixed(2)}
          </span>
        </div>

        {/* Average Combat Score */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Avg Combat Score</span>
          <span className="font-semibold tabular-nums text-sm">
            {Math.round(stats.avg_combat_score)}
          </span>
        </div>

        {/* Win Rate */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Win Rate</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                style={{ width: `${Math.min(stats.win_rate, 100)}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-sm text-green-400">
              {stats.win_rate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Headshot Percentage */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Headshot %</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                style={{ width: `${Math.min(stats.headshot_percentage, 100)}%` }}
              />
            </div>
            <span className="font-semibold tabular-nums text-sm text-purple-400">
              {stats.headshot_percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Average K/D/A */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Avg K/D/A</span>
          <span className="font-semibold tabular-nums text-sm">
            {stats.avg_kills.toFixed(1)}/{stats.avg_deaths.toFixed(1)}/
            {stats.avg_assists.toFixed(1)}
          </span>
        </div>

        {/* Total Games */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Games Played</span>
          <span className="font-semibold tabular-nums text-sm">
            {stats.total_games} ({stats.wins}W - {stats.losses}L)
          </span>
        </div>

        {/* Average Damage */}
        <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400 text-xs">Avg Damage</span>
          <span className="font-semibold tabular-nums text-sm">
            {Math.round(stats.avg_damage)}
          </span>
        </div>
      </div>
    </div>
  );
}
