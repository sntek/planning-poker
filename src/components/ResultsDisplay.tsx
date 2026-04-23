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
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-white">
        <div className="text-center mb-6">
          <h2 className="text-xl font-display font-bold text-slate-800 mb-1">
            {allSame ? "🎯 Unanimous!" : "The reveal"}
          </h2>
          <p className="text-sm text-slate-600">
            {allSame ? "Perfect consensus." : spread >= 8 ? "Big disagreement — time to chat!" : "Close, but let's talk it through."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-600 font-medium mb-1">Average</p>
            <p className="text-3xl font-display font-bold text-blue-700">{stats.average.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
            <p className="text-sm text-purple-600 font-medium mb-1">Rounded down</p>
            <p className="text-3xl font-display font-bold text-purple-700">{stats.roundedDown}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 text-center">
            <p className="text-sm text-pink-600 font-medium mb-1">Rounded up</p>
            <p className="text-3xl font-display font-bold text-pink-700">{stats.roundedUp}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Individual votes ({stats.totalVotes})</h3>
          <div className="space-y-2">
            {sorted.map((vote, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="font-medium text-slate-700">{vote.voterName}</span>
                <span className="px-3 py-1 bg-blue-500 text-white font-display font-bold rounded-lg">{vote.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score acceptance */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 border-2 border-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-slate-800">
            {isCreator ? "What's the call? 🎲" : "Accepted score"}
          </h3>
          {selectedScore != null && (
            <span className="px-4 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display font-bold rounded-xl shadow-md">
              {selectedScore} pts
            </span>
          )}
        </div>

        {isCreator ? (
          <div className="flex flex-wrap gap-2">
            {FIBONACCI.map((v) => (
              <button
                key={v}
                onClick={() => onSelectScore(v)}
                className={`w-12 h-14 rounded-xl font-display font-bold text-lg transition-all transform-gpu ${
                  selectedScore === v
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg scale-110"
                    : "bg-slate-100 text-slate-700 hover:bg-violet-100 hover:text-violet-700 border-2 border-slate-200 hover:border-violet-300 hover:scale-105"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        ) : selectedScore == null ? (
          <p className="text-sm text-slate-500 italic">Waiting for the host to make the call...</p>
        ) : null}
      </div>
    </div>
  );
}
