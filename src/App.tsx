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

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🃏</span>
          <span className="font-display font-semibold text-gray-900 text-lg">Planning Poker</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {userName && (
            <span className="text-gray-500">
              {userName}
            </span>
          )}
          {userName && (
            <button
              onClick={() => {
                localStorage.removeItem(NAME_KEY);
                setUserName(null);
                setCurrentRoomId(null);
              }}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              Switch name
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 sm:p-10">
        <div className="w-full max-w-2xl">
          {!userName ? (
            <NamePrompt onSubmit={(name) => {
              localStorage.setItem(NAME_KEY, name);
              setUserName(name);
            }} />
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

      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    </div>
  );
}
