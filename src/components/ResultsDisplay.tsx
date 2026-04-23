import type { VoteStats } from "../api";

interface ResultsDisplayProps {
  stats: VoteStats | null | undefined;
}

export function ResultsDisplay({ stats }: ResultsDisplayProps) {
  if (!stats) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-12 border-2 border-white text-center">
        <p className="text-slate-600">No cards in play yet.</p>
      </div>
    );
  }

  const allSame =
    stats.totalVotes > 1 && stats.votes.every((v) => v.points === stats.votes[0].points);
  const sorted = [...stats.votes].sort((a, b) => a.points - b.points);
  const spread = sorted.length > 1 ? sorted[sorted.length - 1].points - sorted[0].points : 0;

  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-white">
      <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-800 mb-1 text-center">
        {allSame ? "🎯 Unanimous!" : "The reveal"}
      </h2>
      {allSame ? (
        <p className="text-center text-emerald-600 font-medium mb-6">
          The team is in perfect harmony.
        </p>
      ) : (
        <p className="text-center text-slate-600 mb-6">
          {spread >= 8 ? "Big disagreement — time to chat!" : "Close, but let's talk it through."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Average"
          value={stats.average.toFixed(2)}
          gradient="from-violet-100 to-violet-200"
          accent="text-violet-700"
        />
        <StatCard
          label="Round down"
          value={String(stats.roundedDown)}
          gradient="from-sky-100 to-sky-200"
          accent="text-sky-700"
        />
        <StatCard
          label="Round up"
          value={String(stats.roundedUp)}
          gradient="from-rose-100 to-rose-200"
          accent="text-rose-700"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Cards played ({stats.totalVotes})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map((vote, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-100"
            >
              <span className="font-medium text-slate-700 truncate pr-2">
                {vote.voterName}
              </span>
              <span className="flex-shrink-0 w-10 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-display font-black rounded-lg flex items-center justify-center shadow-sm">
                {vote.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  gradient,
  accent,
}: {
  label: string;
  value: string;
  gradient: string;
  accent: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-center border-2 border-white shadow-sm`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${accent}`}>
        {label}
      </p>
      <p className={`text-4xl font-display font-black ${accent}`}>{value}</p>
    </div>
  );
}
