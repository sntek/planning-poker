interface VotingInterfaceProps {
  fibonacci: number[];
  selectedValue?: number;
  onVote: (points: number) => void;
}

const SUITS = ["♠", "♥", "♦", "♣", "♠", "♥", "♦"];

export function VotingInterface({
  fibonacci,
  selectedValue,
  onVote,
}: VotingInterfaceProps) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-white">
      <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-800 mb-5 text-center">
        Pick your card
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4">
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
                  ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-2xl scale-105 -translate-y-2 ring-4 ring-violet-200"
                  : "bg-white text-slate-800 shadow-md hover:shadow-xl hover:-translate-y-2 hover:rotate-[-2deg] border-2 border-slate-200 hover:border-violet-300"
              }`}
            >
              <span
                className={`absolute top-1 left-2 text-sm ${
                  selected ? "text-white/90" : suitIsRed ? "text-rose-500" : "text-slate-600"
                }`}
              >
                {suit}
              </span>
              <span
                className={`absolute bottom-1 right-2 text-sm rotate-180 ${
                  selected ? "text-white/90" : suitIsRed ? "text-rose-500" : "text-slate-600"
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
        <p className="text-center text-sm text-slate-600 mt-5 font-medium">
          You&rsquo;re holding{" "}
          <span className="font-display font-bold text-violet-700 text-base">
            {selectedValue}
          </span>
          . Change your mind? Tap another card.
        </p>
      )}
    </div>
  );
}
