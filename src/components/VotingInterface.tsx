const SUITS = ["♠", "♥", "♦", "♣", "♠", "♥", "♦", "♣", "♠", "♥"];

interface VotingInterfaceProps {
  fibonacci: number[];
  selectedValue?: number;
  onVote: (points: number) => void;
}

export function VotingInterface({ fibonacci, selectedValue, onVote }: VotingInterfaceProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4 text-center">
        Pick your card
      </p>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
        {fibonacci.map((value, i) => {
          const selected = selectedValue === value;
          const suit = SUITS[i % SUITS.length];
          const red = suit === "♥" || suit === "♦";
          return (
            <button
              key={value}
              onClick={() => onVote(value)}
              className={`relative aspect-[3/4] rounded-xl font-display font-black text-2xl sm:text-3xl transition-all transform-gpu ${
                selected
                  ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-xl scale-105 -translate-y-1.5 ring-4 ring-violet-200"
                  : "bg-white text-gray-800 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1.5 hover:border-gray-300"
              }`}
            >
              <span className={`absolute top-1 left-1.5 text-[10px] font-bold ${selected ? "text-white/70" : red ? "text-rose-400" : "text-gray-400"}`}>{suit}</span>
              <span className={`absolute bottom-1 right-1.5 text-[10px] font-bold rotate-180 ${selected ? "text-white/70" : red ? "text-rose-400" : "text-gray-400"}`}>{suit}</span>
              {value}
            </button>
          );
        })}
      </div>
      {selectedValue !== undefined && (
        <p className="text-center text-xs text-gray-400 mt-4">
          You picked <span className="font-bold text-gray-600">{selectedValue}</span> — tap to change
        </p>
      )}
    </div>
  );
}
