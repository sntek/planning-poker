import type { VoteStats } from "../api";

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

interface ResultsDisplayProps {
  stats: VoteStats | null | undefined;
  selectedScore: number | null;
  isCreator: boolean;
  onSelectScore: (score: number) => void;
}

export function ResultsDisplay({ stats, selectedScore, isCreator, onSelectScore }: ResultsDisplayProps) {
  if (!stats) {
    return (
      <div className="bg-emerald-900/60 rounded-2xl p-12 border border-emerald-700/50 text-center">
        <p className="text-emerald-500">No votes yet.</p>
      </div>
    );
  }

  const allSame =
    stats.totalVotes > 1 && stats.votes.every((v) => v.points === stats.votes[0].points);
  const sorted = [...stats.votes].sort((a, b) => a.points - b.points);
  const spread = sorted.length > 1 ? sorted[sorted.length - 1].points - sorted[0].points : 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="bg-emerald-900/60 rounded-2xl p-6 sm:p-8 border border-emerald-700/50">
        <div className="text-center mb-5">
          <h2 className="text-xl font-display font-bold text-amber-300 mb-1">
            {allSame ? "🎯 Unanimous!" : "The reveal"}
          </h2>
          <p className="text-sm text-emerald-400">
            {allSame
              ? "Perfect consensus."
              : spread >= 8
              ? "Big spread — worth a discussion."
              : "Pretty close!"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Average" value={stats.average.toFixed(2)} />
          <StatCard label="Round down" value={String(stats.roundedDown)} />
          <StatCard label="Round up" value={String(stats.roundedUp)} />
        </div>

        <div>
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest mb-3">
            Individual votes ({stats.totalVotes})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sorted.map((vote, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-800 bg-emerald-950/40"
              >
                <span className="text-emerald-300 text-sm truncate pr-2">{vote.voterName}</span>
                <span className="flex-shrink-0 w-9 h-11 bg-white text-slate-800 font-display font-black rounded-lg flex items-center justify-center text-lg shadow-sm border border-slate-200">
                  {vote.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score acceptance */}
      <div className="bg-emerald-900/60 rounded-2xl p-5 border border-emerald-700/50">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
            {selectedScore != null ? "Accepted score" : isCreator ? "What's the call?" : "Accepted score"}
          </p>
          {selectedScore != null && (
            <span className="w-12 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 text-emerald-950 font-display font-black rounded-xl flex items-center justify-center text-2xl shadow-md">
              {selectedScore}
            </span>
          )}
        </div>

        {isCreator ? (
          <div className="flex flex-wrap gap-2">
            {FIBONACCI.map((v) => (
              <button
                key={v}
                onClick={() => onSelectScore(v)}
                className={`w-12 h-14 rounded-xl font-display font-bold text-xl transition-all ${
                  selectedScore === v
                    ? "bg-amber-400 text-emerald-950 shadow-md scale-105"
                    : "bg-emerald-950/60 text-emerald-300 border border-emerald-700 hover:border-amber-400/60 hover:text-amber-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        ) : selectedScore == null ? (
          <p className="text-sm text-emerald-600 italic">Host hasn't made the call yet...</p>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/50 p-4 text-center">
      <p className="text-xs text-emerald-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-display font-black text-amber-400">{value}</p>
    </div>
  );
}
