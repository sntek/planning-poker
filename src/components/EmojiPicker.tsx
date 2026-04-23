import { useEffect, useRef, useState } from "react";

const QUICK = ["🎯", "✈️", "🍅", "💣", "🧻", "❤️", "💩", "🌟"];

const EXTRA = [
  "🔥", "🚀", "💰", "🎉", "👏", "👎", "🏀", "⚽",
  "🌹", "🎂", "🍕", "🍺", "🍩", "🥜", "🪨", "🔨",
  "⚡", "❄️", "🌈", "🦆", "🧠", "🎈", "🎁", "💎",
  "🧸", "🍿", "🥳", "😎", "🤡", "💀", "👻", "🥶",
  "🤯", "🙈", "🫠", "🫡", "🫶", "🤌", "🤙", "👑",
];

interface EmojiPickerProps {
  selected: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ selected, onChange }: EmojiPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full p-1 shadow-md border border-slate-200">
        {QUICK.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onChange(emoji)}
            className={`w-10 h-10 rounded-full text-xl transition-all ${
              selected === emoji
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md scale-110"
                : "hover:bg-violet-50 hover:scale-110"
            }`}
            title={`Throw ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`w-10 h-10 rounded-full text-xl transition-all font-bold ${
            expanded
              ? "bg-slate-100 text-slate-700"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          }`}
          title="More emojis"
        >
          +
        </button>
      </div>

      {expanded && (
        <div className="absolute left-0 top-full mt-2 z-20 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border-2 border-white p-3">
          <div className="grid grid-cols-8 gap-1">
            {[...QUICK, ...EXTRA].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(emoji);
                  setExpanded(false);
                }}
                className={`w-10 h-10 rounded-lg text-xl transition-all ${
                  selected === emoji
                    ? "bg-violet-100 ring-2 ring-violet-400"
                    : "hover:bg-slate-100 hover:scale-110"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
