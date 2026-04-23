import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const QUICK = ["🎯", "✈️", "🍅", "💣", "🧻", "❤️", "💩", "🌟"];

const EXTRA = [
  "🔥", "🚀", "💰", "🎉", "👏", "👎", "🏀", "⚽",
  "🌹", "🎂", "🍕", "🍺", "🍩", "🥜", "🪨", "🔨",
  "⚡", "❄️", "🌈", "🦆", "🧠", "🎈", "🎁", "💎",
  "🧸", "🍿", "🥳", "😎", "🤡", "💀", "👻", "🥶",
  "🤯", "🙈", "🫠", "🫡", "🫶", "🤌", "🤙", "👑",
];

interface EmojiPickerProps {
  onThrow: (emoji: string) => void;
  shakeKey?: number; // change to trigger a shake animation
}

export function EmojiPicker({ onThrow, shakeKey = 0 }: EmojiPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const [shake, setShake] = useState(0);

  // Trigger shake when shakeKey changes
  useEffect(() => {
    if (shakeKey > 0) setShake(shakeKey);
  }, [shakeKey]);

  // Close expanded on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target)) {
        // check if click is inside the dropdown too
        const dropdown = document.getElementById("emoji-dropdown");
        if (!dropdown?.contains(target)) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // Position the dropdown above the + button
  useLayoutEffect(() => {
    if (!expanded || !plusRef.current) return;
    const rect = plusRef.current.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(window.innerWidth - 368, rect.left + rect.width / 2 - 180)),
      top: rect.top - 8,
    });
  }, [expanded]);

  const handleEmojiClick = (emoji: string) => {
    onThrow(emoji);
  };

  return (
    <>
      <div
        ref={triggerRef}
        key={shake}
        className="inline-flex items-center gap-1 bg-white/95 backdrop-blur rounded-full p-1.5 shadow-lg border-2 border-white"
        style={shake ? { animation: "pickerShake 0.4s" } : undefined}
      >
        {QUICK.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleEmojiClick(emoji)}
            className="w-11 h-11 rounded-full text-2xl hover:bg-violet-100 hover:scale-125 active:scale-90 transition-transform"
            title={`Throw ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          ref={plusRef}
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`w-11 h-11 rounded-full text-2xl font-bold transition-colors ${
            expanded
              ? "bg-violet-100 text-violet-700"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          }`}
          title="More emojis"
        >
          +
        </button>
      </div>

      {expanded && pos && createPortal(
        <div
          id="emoji-dropdown"
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            zIndex: 100,
            transform: "translateY(-100%)",
          }}
          className="w-[360px] max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border-2 border-white p-3"
        >
          <div className="grid grid-cols-8 gap-1">
            {[...QUICK, ...EXTRA].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="w-10 h-10 rounded-lg text-xl hover:bg-violet-100 hover:scale-125 active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        @keyframes pickerShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-2deg); }
          40% { transform: translateX(8px) rotate(2deg); }
          60% { transform: translateX(-6px) rotate(-1deg); }
          80% { transform: translateX(6px) rotate(1deg); }
        }
      `}</style>
    </>
  );
}
