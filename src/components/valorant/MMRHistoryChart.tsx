import { ValorantMMRHistory } from "@/lib/types";

interface MMRHistoryChartProps {
  history: ValorantMMRHistory;
}

export function MMRHistoryChart({ history }: MMRHistoryChartProps) {
  if (!history || !history.data || history.data.length === 0) {
    return (
      <div className="bento-card col-span-2 !p-4">
        <h2 className="text-lg font-semibold mb-3">MMR History</h2>
        <p className="text-gray-400 text-center py-4 text-sm">
          No MMR history available
        </p>
      </div>
    );
  }

  // Take last 20 games and reverse to show oldest to newest
  const chartData = history.data.slice(0, 20).reverse();
  
  // Calculate chart dimensions
  const minMMR = Math.min(...chartData.map((d) => d.elo));
  const maxMMR = Math.max(...chartData.map((d) => d.elo));
  const mmrRange = maxMMR - minMMR;
  const padding = mmrRange * 0.1 || 50; // 10% padding or 50 if range is 0
  
  const chartMin = minMMR - padding;
  const chartMax = maxMMR + padding;
  const chartRange = chartMax - chartMin;

  // SVG dimensions
  const height = 150; // pixels - reduced from 200
  const pointRadius = 4;

  // Calculate points for the line
  const points = chartData.map((entry, index) => {
    const x = (index / (chartData.length - 1)) * 100;
    const y = ((chartMax - entry.elo) / chartRange) * 100;
    return { x, y, entry };
  });

  // Create path for the line
  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  // Create gradient path (area under the line)
  const gradientPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className="bento-card col-span-2 !p-4">
      <h2 className="text-lg font-semibold mb-3">MMR History</h2>
      
      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id="mmrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path
            d={gradientPath}
            fill="url(#mmrGradient)"
            className="transition-all duration-300"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="0.5"
            className="transition-all duration-300"
          />

          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r={pointRadius / 10}
                fill="#8b5cf6"
                className="transition-all duration-300 hover:r-2"
              />
              <title>
                Game {index + 1}: {point.entry.elo} MMR (
                {point.entry.mmr_change_to_last_game > 0 ? "+" : ""}
                {point.entry.mmr_change_to_last_game} RR)
              </title>
            </g>
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-0.5">Current</div>
          <div className="font-semibold tabular-nums text-sm">{chartData[chartData.length - 1].elo}</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-0.5">Peak</div>
          <div className="font-semibold tabular-nums text-sm text-green-400">{maxMMR}</div>
        </div>
        <div className="text-center p-2 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-0.5">Change</div>
          <div
            className={`font-semibold tabular-nums text-sm ${
              chartData[chartData.length - 1].elo - chartData[0].elo > 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {chartData[chartData.length - 1].elo - chartData[0].elo > 0 ? "+" : ""}
            {chartData[chartData.length - 1].elo - chartData[0].elo}
          </div>
        </div>
      </div>
    </div>
  );
}
