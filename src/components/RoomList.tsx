import { useState } from "react";
import { toast } from "sonner";
import { api } from "../api";
import { useRooms } from "../hooks/useRealtime";
import type { Room } from "../api";

interface RoomListProps {
  userName: string;
  onJoinRoom: (roomId: string) => void;
}

export function RoomList({ userName, onJoinRoom }: RoomListProps) {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const rooms = useRooms();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setIsCreating(true);
    try {
      const room = await api().createRoom({ name: roomName.trim(), creatorName: userName });
      setRoomName("");
      onJoinRoom(room.id);
    } catch {
      toast.error("Couldn't create room");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"?`)) return;
    setDeleting(room.id);
    try {
      await api().deleteRoom(room.id);
    } catch {
      toast.error("Couldn't delete room");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pt-2 pb-4">
        <h1 className="text-2xl font-display font-semibold text-gray-900">Rooms</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a room or join an existing one.</p>
      </div>

      {/* Create */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room name"
            maxLength={80}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
          />
          <button
            type="submit"
            disabled={!roomName.trim() || isCreating}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating…" : "Create"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {rooms === undefined ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : rooms.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No rooms yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <li key={room.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{room.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {room.creatorName} · Round {room.currentRound}
                    {room.isVoting && (
                      <span className="ml-2 text-indigo-500 font-medium">● live</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {room.creatorName === userName && (
                    <button
                      onClick={() => handleDelete(room)}
                      disabled={deleting === room.id}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg disabled:opacity-40"
                      title="Delete room"
                    >
                      {deleting === room.id ? "…" : "✕"}
                    </button>
                  )}
                  <button
                    onClick={() => onJoinRoom(room.id)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Join
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
