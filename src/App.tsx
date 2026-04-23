import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { NamePrompt } from "./components/NamePrompt";
import { RoomList } from "./components/RoomList";
import { PlanningRoom } from "./components/PlanningRoom";
import { USE_MOCK } from "./api";

const NAME_KEY = "planningPokerUserName";

export default function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY);
    if (stored) setUserName(stored);
  }, []);

  const handleNameSubmit = (name: string) => {
    localStorage.setItem(NAME_KEY, name);
    setUserName(name);
  };

  const handleClearName = () => {
    localStorage.removeItem(NAME_KEY);
    setUserName(null);
    setCurrentRoomId(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-sky-100 via-violet-100 to-rose-100">
      <FloatingShapes />

      <header className="relative sticky top-0 z-10 bg-white/70 backdrop-blur-md h-16 flex justify-between items-center border-b border-white/40 shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md rotate-[-6deg] hover:rotate-[6deg] transition-transform">
            <span className="text-white text-xl">🃏</span>
          </div>
          <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent">
            Planning Poker
          </h1>
          {USE_MOCK && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-amber-200 text-amber-900 rounded-full border border-amber-300">
              design preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-slate-700">
              Hey, <span className="font-bold text-violet-700">{userName}</span>
            </span>
          )}
          {userName && (
            <button
              onClick={handleClearName}
              className="text-sm text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              Switch name
            </button>
          )}
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto">
          {!userName ? (
            <NamePrompt onSubmit={handleNameSubmit} />
          ) : currentRoomId ? (
            <PlanningRoom
              roomId={currentRoomId}
              userName={userName}
              onLeave={() => setCurrentRoomId(null)}
            />
          ) : (
            <RoomList userName={userName} onJoinRoom={setCurrentRoomId} />
          )}
        </div>
      </main>

      <Toaster
        position="top-center"
        toastOptions={{ className: "font-body", duration: 2500 }}
      />
    </div>
  );
}

function FloatingShapes() {
  const shapes = [
    { size: "w-64 h-64", color: "bg-violet-300/40", top: "-top-20", left: "-left-20", delay: "0s" },
    { size: "w-80 h-80", color: "bg-rose-300/40", top: "top-1/3", left: "-right-32", delay: "2s" },
    { size: "w-56 h-56", color: "bg-sky-300/40", top: "bottom-0", left: "left-1/4", delay: "4s" },
    { size: "w-72 h-72", color: "bg-amber-200/40", top: "-bottom-20", left: "right-1/3", delay: "1s" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {shapes.map((s, i) => (
        <div
          key={i}
          className={`absolute ${s.size} ${s.color} ${s.top} ${s.left} rounded-full blur-3xl animate-float`}
          style={{ animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
