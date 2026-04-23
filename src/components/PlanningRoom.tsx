import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { api } from "../api";
import { useHistory, useRoom, useRoundData, useStats, useVotes } from "../hooks/useRealtime";
import { VotingInterface } from "./VotingInterface";
import { ResultsDisplay } from "./ResultsDisplay";
import type { RoundRecord } from "../api";

interface PlanningRoomProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
}

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export function PlanningRoom({ roomId, userName, onLeave }: PlanningRoomProps) {
  const room = useRoom(roomId);
  const votes = useVotes(roomId, room?.currentRound ?? null);
  const voteStats = useStats(roomId, room?.currentRound ?? null);
  const roundData = useRoundData(roomId, room?.currentRound ?? null);
  const history = useHistory(roomId);

  const wasVotingRef = useRef(false);
  useEffect(() => {
    if (!room) return;
    if (wasVotingRef.current && !room.isVoting && voteStats && voteStats.totalVotes > 1) {
      const allSame = voteStats.votes.every((v) => v.points === voteStats.votes[0].points);
      if (allSame) celebrate();
    }
    wasVotingRef.current = room.isVoting;
  }, [room, voteStats]);

  const isCreator = room?.creatorName === userName;
  const userVote = votes?.find((v) => v.voterName === userName);

  const safeCall = (fn: () => Promise<unknown>, success?: string) => async () => {
    try { await fn(); if (success) toast.success(success); }
    catch (err) { console.error(err); toast.error("Something went wrong"); }
  };

  const handleVote = async (points: number) => {
    if (!room) return;
    try { await api().castVote({ roomId, round: room.currentRound, voterName: userName, points }); }
    catch { toast.error("Couldn't cast vote"); }
  };

  if (room === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl animate-bounce">🎲</span>
        <p className="text-slate-600 font-display">Peeking at the table...</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-12 border-2 border-white text-center">
        <p className="text-5xl mb-3">🕳️</p>
        <p className="text-slate-700 mb-4">This table has vanished!</p>
        <button onClick={onLeave} className="px-5 py-2 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors">
          Back to lobby
        </button>
      </div>
    );
  }

  const completedHistory = (history ?? []).filter((r) => r.roundNumber < room.currentRound);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 border-2 border-white">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">{room.name}</h1>
            <p className="text-sm text-slate-600">
              Round {room.currentRound} · Hosted by <span className="font-semibold">{room.creatorName}</span>
            </p>
          </div>
          <button onClick={onLeave} className="px-4 py-2 text-slate-500 hover:text-rose-600 font-semibold transition-colors">
            Leave ←
          </button>
        </div>

        <RoundTitleInput
          roomId={roomId}
          round={room.currentRound}
          currentTitle={roundData?.title ?? ""}
          isCreator={isCreator}
        />

        {isCreator && (
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            {!room.isVoting ? (
              <button
                onClick={safeCall(() => api().startVoting(roomId), "Let's vote! 🗳️")}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md hover:shadow-lg"
              >
                ▶ Start voting
              </button>
            ) : (
              <button
                onClick={safeCall(() => api().stopVoting(roomId), "Cards on the table! 🎴")}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md hover:shadow-lg animate-pulse"
              >
                ✨ Reveal cards
              </button>
            )}
            {!room.isVoting && !!votes?.length && (
              <button
                onClick={safeCall(() => api().nextRound(roomId), "Fresh deck! 🔀")}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md hover:shadow-lg"
              >
                Next round →
              </button>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">
              At the table ({votes?.length ?? 0})
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${room.isVoting ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="text-sm text-slate-600">{room.isVoting ? "Voting in progress" : "Waiting to start"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!votes?.length && <p className="text-sm text-slate-400 italic">Nobody&rsquo;s picked a card yet...</p>}
            {votes?.map((vote) => {
              const isMe = vote.voterName === userName;
              return (
                <div
                  key={vote.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    isMe
                      ? "bg-violet-100 text-violet-800 border-violet-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {vote.voterName}
                  {!room.isVoting ? (
                    <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-violet-700 font-bold">{vote.points}</span>
                  ) : (
                    <span className="ml-2">🎴</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Voting / results */}
      {room.isVoting ? (
        <VotingInterface fibonacci={FIBONACCI} selectedValue={userVote?.points} onVote={handleVote} />
      ) : votes && votes.length > 0 ? (
        <ResultsDisplay
          stats={voteStats}
          selectedScore={roundData?.selectedScore ?? null}
          isCreator={isCreator}
          onSelectScore={(score) =>
            api().selectScore(roomId, room.currentRound, score).catch(() => toast.error("Couldn't save score"))
          }
        />
      ) : (
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-12 border-2 border-white text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl animate-pulse">⏳</span>
          </div>
          <p className="text-slate-700 font-display text-lg">
            {isCreator ? 'Press "Start voting" when the team is ready' : "Waiting for the host to deal..."}
          </p>
        </div>
      )}

      {/* History */}
      {completedHistory.length > 0 && <RoundHistory records={completedHistory} />}
    </div>
  );
}

/* ── Round title ─────────────────────────────────────────────── */

function RoundTitleInput({
  roomId, round, currentTitle, isCreator,
}: { roomId: string; round: number; currentTitle: string; isCreator: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = async () => {
    setEditing(false);
    if (draft.trim() === currentTitle) return;
    try { await api().setRoundTitle(roomId, round, draft.trim()); }
    catch { toast.error("Couldn't save title"); }
  };

  if (!isCreator) {
    return currentTitle
      ? <p className="text-slate-500 text-sm italic mb-1">"{currentTitle}"</p>
      : null;
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => { if (e.key === "Enter") void commit(); if (e.key === "Escape") setEditing(false); }}
        maxLength={200}
        placeholder="What are we estimating?"
        className="w-full mb-1 px-4 py-2 rounded-xl bg-slate-50 border-2 border-violet-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-slate-700 text-sm"
      />
    );
  }

  return (
    <button onClick={() => { setDraft(currentTitle); setEditing(true); }} className="block text-sm text-left mb-1 group">
      {currentTitle
        ? <span className="text-slate-500 italic">"{currentTitle}" <span className="opacity-0 group-hover:opacity-60 text-violet-400 text-xs transition-opacity">edit</span></span>
        : <span className="text-slate-400 hover:text-violet-400 transition-colors">+ Add a round title...</span>
      }
    </button>
  );
}

/* ── History ─────────────────────────────────────────────────── */

function RoundHistory({ records }: { records: RoundRecord[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border-2 border-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors"
      >
        <span className="font-display font-bold text-slate-700 flex items-center gap-2">
          <span>📋</span> Round history ({records.length})
        </span>
        <span className="text-slate-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="px-6 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Title</th>
                <th className="px-2 py-2 font-semibold text-right">Avg</th>
                <th className="px-6 py-2 font-semibold text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map((r) => (
                <tr key={r.roundNumber} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3 text-slate-400 font-mono">{r.roundNumber}</td>
                  <td className="px-2 py-3 text-slate-600 max-w-[200px] truncate">
                    {r.title || <span className="text-slate-300 italic">untitled</span>}
                  </td>
                  <td className="px-2 py-3 text-slate-500 text-right">
                    {r.average != null ? r.average.toFixed(1) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {r.selectedScore != null
                      ? <span className="font-display font-bold text-violet-700">{r.selectedScore}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function celebrate() {
  const end = Date.now() + 1200;
  const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
