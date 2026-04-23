import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { useRooms } from "../hooks/useRealtime";
import type { Room } from "../api";

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
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"?`)) return;
    setDeleting(room.id);
    try {
      await api().deleteRoom(room.id);
      toast.success("Table closed");
    } catch {
      toast.error("Couldn't delete room");
    } finally {
      setDeleting(null);
    }
  };
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
      toast.success("Table opened 🎴");
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
      <div className="text-center py-2">
        <h1 className="text-4xl sm:text-5xl font-display font-bold text-amber-400 mb-2">
          Shall we play?
        </h1>
        <p className="text-emerald-400/70">
          Open a new table or join an existing one
        </p>
      </div>

      <div className="bg-emerald-900/60 rounded-2xl p-6 border border-emerald-700/50">
        <h2 className="text-base font-semibold text-amber-300 uppercase tracking-widest mb-4">
          New table
        </h2>
        <form onSubmit={handleCreateRoom} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder={placeholder}
            maxLength={80}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-950/70 border border-emerald-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all text-amber-100 placeholder:text-emerald-600"
          />
          <button
            type="submit"
            disabled={!roomName.trim() || isCreating}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCreating ? "Opening..." : "Open table"}
          </button>
        </form>
      </div>

      <div className="bg-emerald-900/60 rounded-2xl p-6 border border-emerald-700/50">
        <h2 className="text-base font-semibold text-amber-300 uppercase tracking-widest mb-4">
          Open tables
        </h2>
        {rooms === undefined ? (
          <div className="flex justify-center py-10">
            <span className="text-3xl animate-bounce">🎲</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10 text-emerald-500">
            <p className="text-4xl mb-3">🪑</p>
            <p>No tables open. Deal first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-800 hover:border-amber-500/50 hover:bg-emerald-800/40 transition-all"
              >
                <div>
                  <h3 className="font-semibold text-amber-100">{room.name}</h3>
                  <p className="text-sm text-emerald-400">
                    {room.creatorName} · Round {room.currentRound}
                    {room.isVoting && (
                      <span className="ml-2 inline-flex items-center gap-1 text-emerald-300">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        live
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {room.creatorName === userName && (
                    <button
                      onClick={() => handleDelete(room)}
                      disabled={deleting === room.id}
                      className="px-3 py-2 text-emerald-600 hover:text-rose-400 text-sm font-medium transition-colors disabled:opacity-40"
                      title="Delete room"
                    >
                      {deleting === room.id ? "…" : "✕"}
                    </button>
                  )}
                  <button
                    onClick={() => onJoinRoom(room.id)}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold rounded-lg text-sm transition-colors"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
