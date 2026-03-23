import { AgentStats as AgentStatsType } from "@/lib/types";

interface AgentStatsProps {
  agents: AgentStatsType[];
}

export function AgentStats({ agents }: AgentStatsProps) {
  if (!agents || agents.length === 0) {
    return (
      <div className="bento-card col-span-2">
        <h2 className="text-xl font-semibold mb-4">Agent Statistics</h2>
        <p className="text-gray-400 text-center py-8">No agent data available</p>
      </div>
    );
  }

  // Take top 5 agents
  const topAgents = agents.slice(0, 5);

  return (
    <div className="bento-card col-span-2 !p-4">
      <h2 className="text-lg font-semibold mb-3">Agent Statistics</h2>
      <div className="space-y-2">
        {topAgents.map((agent, index) => (
          <div
            key={agent.agent}
            className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
          >
            {/* Rank Number */}
            <div className="flex-shrink-0 w-5 text-center">
              <span className="text-gray-400 font-semibold text-xs">#{index + 1}</span>
            </div>

            {/* Agent Icon - Using placeholder since we don't have agent icons in the API response */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-center leading-tight">
                {agent.agent.slice(0, 3).toUpperCase()}
              </span>
            </div>

            {/* Agent Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-0.5">{agent.agent}</div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{agent.games_played} games</span>
                <span>•</span>
                <span className={agent.win_rate >= 50 ? "text-green-400" : "text-red-400"}>
                  {agent.win_rate.toFixed(0)}% WR
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <div className="font-semibold tabular-nums text-sm mb-0.5">
                {agent.kd_ratio.toFixed(2)} K/D
              </div>
              <div className="text-xs text-gray-400 tabular-nums">
                {Math.round(agent.avg_combat_score)} ACS
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Most Played Summary */}
      {agents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            Most Played:{" "}
            <span className="text-white font-semibold">
              {agents[0].agent}
            </span>{" "}
            ({agents[0].games_played} games)
          </div>
        </div>
      )}
    </div>
  );
}
