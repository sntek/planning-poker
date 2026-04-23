import type { VoteStats } from "../api";

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

interface ResultsDisplayProps {
  stats: VoteStats | null | undefined;
  selectedScore: number | null;
  isCreator: boolean;
  onSelectScore: (score: number) => void;
}

export function ResultsDisplay({ stats, selectedScore, isCreator, onSelectScore }: ResultsDisplayProps) {
  if (!stats) return null;

  const allSame = stats.totalVotes > 1 && stats.votes.every((v) => v.points === stats.votes[0].points);
  const sorted = [...stats.votes].sort((a, b) => a.points - b.points);
  const spread = sorted.length > 1 ? sorted[sorted.length - 1].points - sorted[0].points : 0;

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Results</span>
          {allSame && <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">Unanimous</span>}
          {!allSame && spread >= 8 && <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">High spread</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Average", value: stats.average.toFixed(2) },
            { label: "Round down", value: String(stats.roundedDown) },
            { label: "Round up", value: String(stats.roundedUp) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-2xl font-display font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {sorted.map((vote, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50">
              <span className="text-sm text-gray-600">{vote.voterName}</span>
              <span className="text-sm font-bold text-gray-900">{vote.points}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score selection */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {isCreator ? "Accepted score" : "Score"}
          </span>
          {selectedScore != null && (
            <span className="text-2xl font-display font-bold text-indigo-600">{selectedScore}</span>
          )}
        </div>

        {isCreator ? (
          <div className="flex flex-wrap gap-1.5">
            {FIBONACCI.map((v) => (
              <button
                key={v}
                onClick={() => onSelectScore(v)}
                className={`w-10 h-12 rounded-lg font-display font-bold text-base transition-all ${
                  selectedScore === v
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        ) : selectedScore == null ? (
          <p className="text-sm text-gray-400">Waiting for host to pick a score…</p>
        ) : null}
      </div>
    </div>
  );
}
