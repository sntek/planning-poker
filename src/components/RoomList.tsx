import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { useRooms } from "../hooks/useRealtime";

interface RoomListProps {
  userName: string;
  onJoinRoom: (roomId: string) => void;
}

const PLACEHOLDERS = [
  "Project Moonshot",
  "The Refactor Quest",
  "Sprint 42 Planning",
  "Operation Ship It",
  "The Great Backlog Grooming",
];

export function RoomList({ userName, onJoinRoom }: RoomListProps) {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [placeholder] = useState(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
  );
  const rooms = useRooms();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsCreating(true);
    try {
      const room = await api().createRoom({
        name: roomName.trim(),
        creatorName: userName,
      });
      toast.success("Deck shuffled! 🎴");
      setRoomName("");
      onJoinRoom(room.id);
    } catch {
      toast.error("Couldn't create room — try again?");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-slate-800 mb-2">
          Shall we plan?
        </h1>
        <p className="text-slate-600 text-lg">
          Spin up a new table or slide into an existing one
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 border-2 border-white">
        <h2 className="text-xl font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🎴</span> Deal a new deck
        </h2>
        <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={placeholder}
            maxLength={80}
            className="flex-1 px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!roomName.trim() || isCreating}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white font-display font-bold rounded-2xl hover:scale-[1.03] active:scale-95 transition-transform shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isCreating ? "Shuffling..." : "Create table"}
          </button>
        </form>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 border-2 border-white">
        <h2 className="text-xl font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏠</span> Open tables
        </h2>
        {rooms === undefined ? (
          <div className="flex justify-center py-10">
            <span className="text-3xl animate-bounce">🎲</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="text-5xl mb-3">🪑</p>
            <p>All tables are empty. Be the first to deal in!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-100 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 group-hover:text-violet-700 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Hosted by <span className="font-semibold">{room.creatorName}</span>
                    {" · "}
                    Round {room.currentRound}
                    {room.isVoting && (
                      <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        voting now
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => onJoinRoom(room.id)}
                  className="px-5 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-md"
                >
                  Join →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
