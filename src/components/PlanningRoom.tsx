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

  const wasVotingRef = useRef<boolean>(false);
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

  const safeCall =
    (label: string, fn: () => Promise<unknown>, success?: string) => async () => {
      try {
        await fn();
        if (success) toast.success(success);
      } catch (err) {
        console.error(err);
        toast.error(`${label} failed`);
      }
    };

  const handleVote = async (points: number) => {
    if (!room) return;
    try {
      await api().castVote({ roomId, round: room.currentRound, voterName: userName, points });
    } catch {
      toast.error("Couldn't cast vote");
    }
  };

  const handleSelectScore = async (score: number) => {
    if (!room) return;
    try {
      await api().selectScore(roomId, room.currentRound, score);
    } catch {
      toast.error("Couldn't save score");
    }
  };

  if (room === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl animate-bounce">🎲</span>
        <p className="text-emerald-400 font-display">Finding your table...</p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="bg-emerald-900/60 rounded-2xl p-12 text-center border border-emerald-700/50">
        <p className="text-5xl mb-3">🕳️</p>
        <p className="text-amber-200 mb-4">This table has closed.</p>
        <button
          onClick={onLeave}
          className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold rounded-lg transition-colors"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  const completedHistory = (history ?? []).filter((r) => r.roundNumber < room.currentRound);

  return (
    <div className="space-y-5">
      {/* Room header */}
      <div className="bg-emerald-900/60 rounded-2xl p-6 border border-emerald-700/50">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-amber-300">
              {room.name}
            </h1>
            <p className="text-sm text-emerald-400">
              Round {room.currentRound} · {room.creatorName}
            </p>
          </div>
          <button
            onClick={onLeave}
            className="text-sm text-emerald-500 hover:text-amber-400 font-medium transition-colors"
          >
            Leave ←
          </button>
        </div>

        {/* Round title */}
        <RoundTitleInput
          roomId={roomId}
          round={room.currentRound}
          currentTitle={roundData?.title ?? ""}
          isCreator={isCreator}
          disabled={false}
        />

        {/* Creator controls */}
        {isCreator && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {!room.isVoting ? (
              <button
                onClick={safeCall("Start voting", () => api().startVoting(roomId), "Voting started 🗳️")}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
              >
                ▶ Start voting
              </button>
            ) : (
              <button
                onClick={safeCall("Reveal", () => api().stopVoting(roomId), "Cards on the table! 🎴")}
                className="flex-1 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-semibold rounded-xl transition-colors"
              >
                ✦ Reveal cards
              </button>
            )}
            {!room.isVoting && votes && votes.length > 0 && (
              <button
                onClick={safeCall("Next round", () => api().nextRound(roomId), "Fresh deck! 🔀")}
                className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-amber-300 font-semibold rounded-xl border border-emerald-700 transition-colors"
              >
                Next round →
              </button>
            )}
          </div>
        )}

        {/* Participants */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
              At the table ({votes?.length ?? 0})
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${room.isVoting ? "bg-emerald-400 animate-pulse" : "bg-emerald-800"}`} />
              <span className="text-xs text-emerald-500">
                {room.isVoting ? "Voting in progress" : "Waiting to deal"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!votes?.length && (
              <p className="text-sm text-emerald-700 italic">No cards in hand yet...</p>
            )}
            {votes?.map((vote) => {
              const isMe = vote.voterName === userName;
              return (
                <div
                  key={vote.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    isMe
                      ? "bg-amber-400/20 text-amber-300 border-amber-500/40"
                      : "bg-emerald-800/50 text-emerald-300 border-emerald-700"
                  }`}
                >
                  {vote.voterName}
                  {!room.isVoting ? (
                    <span className="ml-1.5 font-bold text-amber-400">{vote.points}</span>
                  ) : (
                    <span className="ml-1.5 opacity-50">🎴</span>
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
        <>
          <ResultsDisplay
            stats={voteStats}
            selectedScore={roundData?.selectedScore ?? null}
            isCreator={isCreator}
            onSelectScore={handleSelectScore}
          />
        </>
      ) : (
        <div className="bg-emerald-900/60 rounded-2xl p-12 border border-emerald-700/50 text-center">
          <p className="text-5xl mb-4 opacity-60">⏳</p>
          <p className="text-emerald-400">
            {isCreator ? "Start voting when the team is ready" : "Waiting for the host to deal..."}
          </p>
        </div>
      )}

      {/* Round history */}
      {completedHistory.length > 0 && (
        <RoundHistory records={completedHistory} />
      )}
    </div>
  );
}

/* ── Round title input ───────────────────────────────────────── */

function RoundTitleInput({
  roomId,
  round,
  currentTitle,
  isCreator,
  disabled,
}: {
  roomId: string;
  round: number;
  currentTitle: string;
  isCreator: boolean;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(currentTitle);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = async () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === currentTitle) return;
    try {
      await api().setRoundTitle(roomId, round, trimmed);
    } catch {
      toast.error("Couldn't save title");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") void commit();
    if (e.key === "Escape") setEditing(false);
  };

  if (!isCreator) {
    return currentTitle ? (
      <p className="text-emerald-300 text-sm italic">"{currentTitle}"</p>
    ) : null;
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={handleKey}
        maxLength={200}
        placeholder="What are we estimating?"
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-emerald-950/70 border border-emerald-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none text-amber-100 placeholder:text-emerald-700 text-sm"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className="text-left w-full text-sm group"
    >
      {currentTitle ? (
        <span className="text-emerald-300 italic">
          "{currentTitle}"
          <span className="ml-2 opacity-0 group-hover:opacity-60 text-amber-400 text-xs transition-opacity">edit</span>
        </span>
      ) : (
        <span className="text-emerald-700 italic hover:text-emerald-500 transition-colors">
          + Add a round title...
        </span>
      )}
    </button>
  );
}

/* ── Round history ───────────────────────────────────────────── */

function RoundHistory({ records }: { records: RoundRecord[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-emerald-900/60 rounded-2xl border border-emerald-700/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-emerald-800/30 transition-colors"
      >
        <span className="text-xs font-semibold text-amber-300 uppercase tracking-widest">
          Round history ({records.length})
        </span>
        <span className="text-emerald-500 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-0 text-xs font-semibold text-emerald-600 uppercase tracking-widest px-2 pb-1">
            <span>#</span>
            <span>Title</span>
            <span className="text-right">Avg</span>
            <span className="text-right">Score</span>
          </div>
          {records.map((r) => (
            <div
              key={r.roundNumber}
              className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center px-3 py-2 rounded-xl border border-emerald-800 bg-emerald-950/40 text-sm"
            >
              <span className="text-emerald-600 font-mono">{r.roundNumber}</span>
              <span className="text-emerald-300 truncate">
                {r.title || <span className="text-emerald-700 italic">untitled</span>}
              </span>
              <span className="text-emerald-400 text-right">
                {r.average != null ? r.average.toFixed(1) : "—"}
              </span>
              <span className={`text-right font-bold font-display ${r.selectedScore != null ? "text-amber-400" : "text-emerald-700"}`}>
                {r.selectedScore ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function celebrate() {
  const duration = 1200;
  const end = Date.now() + duration;
  const colors = ["#fbbf24", "#10b981", "#ffffff", "#f59e0b", "#34d399"];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
