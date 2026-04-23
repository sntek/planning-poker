import { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { api } from "../api";
import { useRoom, useStats, useVotes } from "../hooks/useRealtime";
import { VotingInterface } from "./VotingInterface";
import { ResultsDisplay } from "./ResultsDisplay";

interface PlanningRoomProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
}

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

export function PlanningRoom({ roomId, userName, onLeave }: PlanningRoomProps) {
  const room = useRoom(roomId);
  const votes = useVotes(roomId, room?.currentRound ?? null);
  const voteStats = useStats(roomId, room?.currentRound ?? null);

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

  const safeCall = (label: string, fn: () => Promise<unknown>, success?: string) => async () => {
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
      await api().castVote({
        roomId,
        round: room.currentRound,
        voterName: userName,
        points,
      });
    } catch {
      toast.error("Couldn't cast vote");
    }
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
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-12 text-center">
        <p className="text-5xl mb-3">🕳️</p>
        <p className="text-slate-700 mb-4">This table has vanished!</p>
        <button
          onClick={onLeave}
          className="px-5 py-2 bg-violet-500 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-6 border-2 border-white">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">
              {room.name}
            </h1>
            <p className="text-sm text-slate-600">
              Round {room.currentRound} · Hosted by{" "}
              <span className="font-semibold">{room.creatorName}</span>
            </p>
          </div>
          <button
            onClick={onLeave}
            className="px-4 py-2 text-slate-500 hover:text-rose-600 font-semibold transition-colors"
          >
            Leave ←
          </button>
        </div>

        {isCreator && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {!room.isVoting ? (
              <button
                onClick={safeCall(
                  "Start voting",
                  () => api().startVoting(roomId),
                  "Let's vote! 🗳️",
                )}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-lg"
              >
                ▶ Start voting
              </button>
            ) : (
              <button
                onClick={safeCall(
                  "Reveal",
                  () => api().stopVoting(roomId),
                  "Cards on the table! 🎴",
                )}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-lg animate-pulse"
              >
                ✨ Reveal cards
              </button>
            )}
            {!room.isVoting && votes && votes.length > 0 && (
              <button
                onClick={safeCall(
                  "Next round",
                  () => api().nextRound(roomId),
                  "Fresh deck! 🔀",
                )}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-display font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-lg"
              >
                Next round →
              </button>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              At the table ({votes?.length || 0})
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  room.isVoting ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span className="text-sm font-medium text-slate-600">
                {room.isVoting ? "Voting in progress" : "Waiting to deal"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {votes?.length === 0 && (
              <p className="text-sm text-slate-500 italic">
                Nobody&rsquo;s picked a card yet...
              </p>
            )}
            {votes?.map((vote) => {
              const isMe = vote.voterName === userName;
              const showPoints = !room.isVoting;
              return (
                <div
                  key={vote.id}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all ${
                    isMe
                      ? "bg-violet-100 text-violet-800 border-violet-300"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span>{vote.voterName}</span>
                  {showPoints ? (
                    <span className="ml-2 px-2 py-0.5 bg-white rounded-full text-violet-700 font-bold">
                      {vote.points}
                    </span>
                  ) : (
                    <span className="ml-2">🎴</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {room.isVoting ? (
        <VotingInterface
          fibonacci={FIBONACCI}
          selectedValue={userVote?.points}
          onVote={handleVote}
        />
      ) : votes && votes.length > 0 ? (
        <ResultsDisplay stats={voteStats} />
      ) : (
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-12 border-2 border-white text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl animate-pulse">⏳</span>
          </div>
          <p className="text-slate-700 font-display text-lg">
            {isCreator
              ? "Tap \u201CStart voting\u201D when the team is ready"
              : "Waiting for the host to deal..."}
          </p>
        </div>
      )}
    </div>
  );
}

function celebrate() {
  const duration = 1200;
  const end = Date.now() + duration;
  const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
