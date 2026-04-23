interface VotingInterfaceProps {
  fibonacci: number[];
  selectedValue?: number;
  onVote: (points: number) => void;
}

const SUITS = ["♠", "♥", "♦", "♣", "♠", "♥", "♦", "♣", "♠", "♥"];

export function VotingInterface({
  fibonacci,
  selectedValue,
  onVote,
}: VotingInterfaceProps) {
  return (
    <div className="bg-emerald-900/60 rounded-2xl p-6 sm:p-8 border border-emerald-700/50">
      <h2 className="text-base font-semibold text-amber-300 uppercase tracking-widest mb-5 text-center">
        Pick your card
      </h2>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 sm:gap-4">
        {fibonacci.map((value, i) => {
          const selected = selectedValue === value;
          const suit = SUITS[i % SUITS.length];
          const suitIsRed = suit === "♥" || suit === "♦";
          return (
            <button
              key={value}
              onClick={() => onVote(value)}
              className={`group relative aspect-[3/4] rounded-2xl font-display font-black text-3xl sm:text-4xl transition-all transform-gpu ${
                selected
                  ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-2xl scale-105 -translate-y-2 ring-4 ring-violet-400/30"
                  : "bg-white text-slate-800 shadow-md hover:shadow-xl hover:-translate-y-2 hover:rotate-[-2deg] border border-slate-200"
              }`}
            >
              <span
                className={`absolute top-1 left-2 text-xs font-bold ${
                  selected ? "text-white/80" : suitIsRed ? "text-rose-500" : "text-slate-500"
                }`}
              >
                {suit}
              </span>
              <span
                className={`absolute bottom-1 right-2 text-xs font-bold rotate-180 ${
                  selected ? "text-white/80" : suitIsRed ? "text-rose-500" : "text-slate-500"
                }`}
              >
                {suit}
              </span>
              <span className="inline-block">{value}</span>
            </button>
          );
        })}
      </div>
      {selectedValue !== undefined && (
        <p className="text-center text-sm text-emerald-400 mt-5">
          Holding{" "}
          <span className="font-bold text-amber-400">{selectedValue}</span>
          {" · "}tap another to change
        </p>
      )}
    </div>
  );
}
