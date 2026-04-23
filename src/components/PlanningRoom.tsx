import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { api } from "../api";
import { useHistory, useRoom, useRoundData, useStats, useVotes } from "../hooks/useRealtime";
import { VotingInterface } from "./VotingInterface";
import { ResultsDisplay } from "./ResultsDisplay";
import { EmojiPicker } from "./EmojiPicker";
import { ThrowLayer } from "./ThrowLayer";
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

  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const throwEmoji = (emoji: string) => {
    if (!hoveredTarget) {
      setShakeKey((k) => k + 1);
      toast("Hover over a teammate first 🎯", { duration: 1500 });
      return;
    }
    api().throwEmoji({ roomId, from: userName, to: hoveredTarget, emoji });
  };

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

  const others = (votes ?? []).filter((v) => v.voterName !== userName);
  const completedHistory = (history ?? []).filter((r) => r.roundNumber < room.currentRound);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-5 border-2 border-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">{room.name}</h1>
            <p className="text-sm text-slate-600">
              Round {room.currentRound} · Hosted by <span className="font-semibold">{room.creatorName}</span>
            </p>
            <div className="mt-1">
              <RoundTitleInput
                roomId={roomId}
                round={room.currentRound}
                currentTitle={roundData?.title ?? ""}
                isCreator={isCreator}
              />
            </div>
          </div>
          <button onClick={onLeave} className="text-slate-500 hover:text-rose-600 font-semibold transition-colors">
            Leave ←
          </button>
        </div>

        {isCreator && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
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
      </div>

      {/* Poker table */}
      <div className="bg-gradient-to-br from-emerald-50 via-violet-50 to-rose-50 rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-white">
        {/* Others at top */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 min-h-[100px]">
          {others.length === 0 ? (
            <div className="text-slate-400 italic text-sm py-6">Waiting for more players...</div>
          ) : (
            others.map((vote) => (
              <ParticipantSeat
                key={vote.id}
                name={vote.voterName}
                points={vote.points}
                hasVoted={true}
                isMe={false}
                isVoting={room.isVoting}
                isTarget={hoveredTarget === vote.voterName}
                onHover={() => setHoveredTarget(vote.voterName)}
              />
            ))
          )}
        </div>

        {/* Central table */}
        <CenterTable
          isVoting={room.isVoting}
          voteCount={votes?.length ?? 0}
          stats={voteStats}
          selectedScore={roundData?.selectedScore ?? null}
          isCreator={isCreator}
        />

        {/* Me at bottom */}
        <div className="flex justify-center mt-6">
          <ParticipantSeat
            name={userName}
            points={userVote?.points}
            hasVoted={!!userVote}
            isMe={true}
            isVoting={room.isVoting}
            isTarget={hoveredTarget === userName}
            onHover={() => setHoveredTarget(userName)}
          />
        </div>
      </div>

      {/* Emoji picker bar */}
      <div className="flex flex-col items-center gap-2">
        <EmojiPicker onThrow={throwEmoji} shakeKey={shakeKey} />
        <p className="text-xs text-slate-500 italic">
          {hoveredTarget
            ? <>Aiming at <span className="font-bold text-violet-600">{hoveredTarget}</span> — tap an emoji to throw</>
            : "Hover over a player to aim, then tap an emoji"
          }
        </p>
      </div>

      {/* Voting cards or results */}
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
      ) : null}

      {/* Round history */}
      {completedHistory.length > 0 && <RoundHistory records={completedHistory} />}

      <ThrowLayer roomId={roomId} />
    </div>
  );
}

/* ── Participant seat ─────────────────────────────────────────── */

function ParticipantSeat({
  name, points, hasVoted, isMe, isVoting, isTarget, onHover,
}: {
  name: string;
  points?: number;
  hasVoted: boolean;
  isMe: boolean;
  isVoting: boolean;
  isTarget: boolean;
  onHover: () => void;
}) {
  const revealed = !isVoting && hasVoted && points != null;

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onFocus={onHover}
      className="flex flex-col items-center gap-2 group cursor-crosshair focus:outline-none"
    >
      <div
        data-user-chip={name}
        className={`relative w-16 sm:w-20 rounded-xl flex items-center justify-center transition-all duration-200 transform-gpu ${
          isTarget ? "scale-110 -translate-y-1" : "group-hover:scale-105"
        } ${
          revealed
            ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white font-display font-black text-3xl shadow-lg border-2 border-white"
            : hasVoted
              ? "bg-gradient-to-br from-violet-400 to-fuchsia-500 shadow-md border-2 border-white"
              : "bg-white border-2 border-dashed border-slate-300"
        } ${isTarget ? "ring-4 ring-violet-300/70 shadow-xl" : ""}`}
        style={{ aspectRatio: "3/4" }}
      >
        {revealed && <span>{points}</span>}
        {hasVoted && !revealed && (
          <div className="absolute inset-2 rounded-md border-2 border-white/40" />
        )}
      </div>
      <span className={`text-sm font-semibold ${isTarget ? "text-violet-600" : isMe ? "text-violet-700" : "text-slate-700"}`}>
        {name}
        {isMe && <span className="text-slate-400 font-normal"> (you)</span>}
      </span>
    </button>
  );
}

/* ── Center table (status) ────────────────────────────────────── */

function CenterTable({
  isVoting, voteCount, stats, selectedScore, isCreator,
}: {
  isVoting: boolean;
  voteCount: number;
  stats: ReturnType<typeof useStats>;
  selectedScore: number | null;
  isCreator: boolean;
}) {
  let content: React.ReactNode;
  if (isVoting) {
    content = (
      <div className="text-center">
        <p className="text-xl sm:text-2xl font-display font-bold text-slate-700 mb-1">
          Pick your cards!
        </p>
        <p className="text-sm text-slate-500">
          {voteCount} {voteCount === 1 ? "vote" : "votes"} in
        </p>
      </div>
    );
  } else if (stats) {
    const allSame = stats.totalVotes > 1 && stats.votes.every((v) => v.points === stats.votes[0].points);
    content = (
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
          {allSame ? "🎯 Unanimous" : "Average"}
        </p>
        <p className="text-4xl sm:text-5xl font-display font-black text-violet-700">
          {stats.average.toFixed(1)}
        </p>
        {selectedScore != null && (
          <p className="text-xs text-slate-500 mt-2">
            accepted: <span className="font-bold text-violet-700 text-base">{selectedScore}</span>
          </p>
        )}
      </div>
    );
  } else {
    content = (
      <div className="text-center">
        <p className="text-4xl mb-2 opacity-60">⏳</p>
        <p className="text-sm text-slate-500 font-display">
          {isCreator ? 'Press "Start voting" when ready' : "Waiting for the host..."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-md bg-white/80 backdrop-blur rounded-3xl py-8 px-6 border-2 border-white shadow-inner">
      {content}
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
      ? <p className="text-slate-500 text-sm italic">"{currentTitle}"</p>
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
        className="px-3 py-1.5 rounded-lg bg-white border-2 border-violet-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-slate-700 text-sm min-w-[240px]"
      />
    );
  }

  return (
    <button onClick={() => { setDraft(currentTitle); setEditing(true); }} className="text-sm text-left group">
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
