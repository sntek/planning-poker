import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { NamePrompt } from "./components/NamePrompt";
import { RoomList } from "./components/RoomList";
import { PlanningRoom } from "./components/PlanningRoom";

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
    <div className="min-h-screen flex flex-col bg-emerald-950">
      <header className="sticky top-0 z-10 bg-emerald-900/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-emerald-700/60 shadow-lg px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-md rotate-[-6deg] hover:rotate-[6deg] transition-transform">
            <span className="text-emerald-950 text-xl">🃏</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-amber-400 tracking-wide">
            Planning Poker
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-amber-200/80">
              Hey, <span className="font-bold text-amber-300">{userName}</span>
            </span>
          )}
          {userName && (
            <button
              onClick={handleClearName}
              className="text-sm text-emerald-400 hover:text-amber-400 font-medium transition-colors"
            >
              Switch name
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
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

      <Toaster position="top-center" toastOptions={{ className: "font-body", duration: 2500 }} theme="dark" />
    </div>
  );
}
