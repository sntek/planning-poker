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
    return <div className="py-20 text-center text-gray-400 text-sm">Loading…</div>;
  }
  if (room === null) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
        <p className="text-gray-500 mb-4">This room no longer exists.</p>
        <button onClick={onLeave} className="text-sm text-indigo-600 hover:underline">← Back to rooms</button>
      </div>
    );
  }

  const completedHistory = (history ?? []).filter((r) => r.roundNumber < room.currentRound);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-display font-semibold text-gray-900">{room.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Round {room.currentRound} · {room.creatorName}</p>
          </div>
          <button onClick={onLeave} className="text-sm text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            Leave
          </button>
        </div>

        <RoundTitleInput
          roomId={roomId}
          round={room.currentRound}
          currentTitle={roundData?.title ?? ""}
          isCreator={isCreator}
        />

        {isCreator && (
          <div className="flex gap-2 mt-4">
            {!room.isVoting ? (
              <button
                onClick={safeCall(() => api().startVoting(roomId))}
                className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Start voting
              </button>
            ) : (
              <button
                onClick={safeCall(() => api().stopVoting(roomId))}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Reveal cards
              </button>
            )}
            {!room.isVoting && !!votes?.length && (
              <button
                onClick={safeCall(() => api().nextRound(roomId))}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Next round
              </button>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {votes?.length ?? 0} {votes?.length === 1 ? "voter" : "voters"}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${room.isVoting ? "bg-indigo-500 animate-pulse" : "bg-gray-300"}`} />
              <span className="text-xs text-gray-400">{room.isVoting ? "Voting" : "Waiting"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {!votes?.length && <span className="text-xs text-gray-300 italic">No votes yet</span>}
            {votes?.map((vote) => (
              <span
                key={vote.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  vote.voterName === userName
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {vote.voterName}
                {!room.isVoting && <span className="font-bold">{vote.points}</span>}
                {room.isVoting && <span className="opacity-40">🎴</span>}
              </span>
            ))}
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
          onSelectScore={(score) => api().selectScore(roomId, room.currentRound, score).catch(() => toast.error("Couldn't save score"))}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center text-gray-400 text-sm">
          {isCreator ? "Press "Start voting" when ready." : "Waiting for the host to start…"}
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
  const ref = useRef<HTMLInputElement>(null);

  const commit = async () => {
    setEditing(false);
    if (draft.trim() === currentTitle) return;
    try { await api().setRoundTitle(roomId, round, draft.trim()); }
    catch { toast.error("Couldn't save title"); }
  };

  if (!isCreator) {
    return currentTitle
      ? <p className="text-sm text-gray-500 italic">"{currentTitle}"</p>
      : null;
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => { if (e.key === "Enter") void commit(); if (e.key === "Escape") setEditing(false); }}
        maxLength={200}
        placeholder="What are we estimating?"
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none text-gray-700 placeholder:text-gray-300"
      />
    );
  }

  return (
    <button onClick={() => { setDraft(currentTitle); setEditing(true); }} className="text-sm text-left group">
      {currentTitle
        ? <span className="text-gray-500 italic">"{currentTitle}" <span className="opacity-0 group-hover:opacity-100 text-gray-300 text-xs transition-opacity">edit</span></span>
        : <span className="text-gray-300 hover:text-gray-400 transition-colors">+ Round title</span>
      }
    </button>
  );
}

/* ── History ─────────────────────────────────────────────────── */

function RoundHistory({ records }: { records: RoundRecord[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">History</span>
        <span className="text-gray-300 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="px-5 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">Title</th>
                <th className="px-2 py-2 font-medium text-right">Avg</th>
                <th className="px-5 py-2 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {records.map((r) => (
                <tr key={r.roundNumber} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-400 font-mono">{r.roundNumber}</td>
                  <td className="px-2 py-3 text-gray-600 max-w-[200px] truncate">
                    {r.title || <span className="text-gray-300 italic">untitled</span>}
                  </td>
                  <td className="px-2 py-3 text-gray-400 text-right">
                    {r.average != null ? r.average.toFixed(1) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {r.selectedScore ?? <span className="text-gray-300">—</span>}
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
  const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e0e7ff"];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
