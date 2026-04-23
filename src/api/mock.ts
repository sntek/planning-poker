import type { ApiClient, Channel, Event, Room, Vote, VoteStats } from "./types";

const STORAGE_KEY = "planningPoker.mockState";
const CHANNEL_NAME = "planningPoker.mockEvents";

type State = {
  rooms: Room[];
  votes: Vote[];
};

function emptyState(): State {
  return { rooms: [], votes: [] };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rooms) || !Array.isArray(parsed.votes)) {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

function saveState(state: State) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function createMockClient(): ApiClient {
  const listeners = new Map<Channel, Set<(e: Event) => void>>();

  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

  function fanOut(event: Event) {
    const channel: Channel =
      event.type === "rooms" ? "rooms" : (`room:${event.roomId}` as Channel);
    const handlers = listeners.get(channel);
    if (handlers) for (const h of handlers) h(event);
  }

  function emit(event: Event) {
    fanOut(event);
    if (bc) bc.postMessage(event);
  }

  if (bc) {
    bc.onmessage = (msg) => fanOut(msg.data as Event);
  }

  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    const oldS: State = e.oldValue ? JSON.parse(e.oldValue) : emptyState();
    const newS: State = e.newValue ? JSON.parse(e.newValue) : emptyState();
    if (oldS.rooms.length !== newS.rooms.length) fanOut({ type: "rooms" });
    const changedRooms = new Set<string>();
    for (const r of newS.rooms) {
      const prev = oldS.rooms.find((x) => x.id === r.id);
      if (!prev || prev.isVoting !== r.isVoting || prev.currentRound !== r.currentRound) {
        changedRooms.add(r.id);
      }
    }
    for (const id of changedRooms) fanOut({ type: "room", roomId: id });
    const affectedVoteRooms = new Set<string>();
    const voteKey = (v: Vote) => `${v.roomId}:${v.round}:${v.voterName}:${v.points}`;
    const oldVotes = new Set(oldS.votes.map(voteKey));
    const newVotes = new Set(newS.votes.map(voteKey));
    for (const v of newS.votes) if (!oldVotes.has(voteKey(v))) affectedVoteRooms.add(v.roomId);
    for (const v of oldS.votes) if (!newVotes.has(voteKey(v))) affectedVoteRooms.add(v.roomId);
    for (const id of affectedVoteRooms) fanOut({ type: "votes", roomId: id });
  });

  function mutate(fn: (s: State) => Event[]) {
    const state = loadState();
    const events = fn(state);
    saveState(state);
    for (const ev of events) emit(ev);
  }

  return {
    async listRooms() {
      const state = loadState();
      return delay(
        [...state.rooms]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 20),
      );
    },

    async createRoom({ name, creatorName }) {
      let created!: Room;
      mutate((state) => {
        created = {
          id: uuid(),
          name,
          creatorName,
          isVoting: false,
          currentRound: 1,
          createdAt: new Date().toISOString(),
        };
        state.rooms.unshift(created);
        return [{ type: "rooms" }];
      });
      return delay(created);
    },

    async getRoom(id) {
      const state = loadState();
      return delay(state.rooms.find((r) => r.id === id) ?? null);
    },

    async getVotes(roomId, round) {
      const state = loadState();
      return delay(state.votes.filter((v) => v.roomId === roomId && v.round === round));
    },

    async getStats(roomId, round) {
      const state = loadState();
      const rows = state.votes.filter((v) => v.roomId === roomId && v.round === round);
      if (rows.length === 0) return delay(null);
      const total = rows.reduce((s, v) => s + v.points, 0);
      const avg = total / rows.length;
      return delay({
        average: avg,
        roundedDown: Math.floor(avg),
        roundedUp: Math.ceil(avg),
        totalVotes: rows.length,
        votes: rows.map((v) => ({ voterName: v.voterName, points: v.points })),
      });
    },

    async castVote({ roomId, round, voterName, points }) {
      mutate((state) => {
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) throw new Error("room not found");
        if (!room.isVoting) throw new Error("voting is not active");
        const existing = state.votes.find(
          (v) => v.roomId === roomId && v.round === round && v.voterName === voterName,
        );
        if (existing) existing.points = points;
        else state.votes.push({ id: uuid(), roomId, round, voterName, points });
        return [{ type: "votes", roomId }];
      });
      await delay(null);
    },

    async startVoting(roomId) {
      mutate((state) => {
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) throw new Error("room not found");
        room.isVoting = true;
        return [{ type: "room", roomId }];
      });
      await delay(null);
    },

    async stopVoting(roomId) {
      mutate((state) => {
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) throw new Error("room not found");
        room.isVoting = false;
        return [{ type: "room", roomId }];
      });
      await delay(null);
    },

    async nextRound(roomId) {
      mutate((state) => {
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) throw new Error("room not found");
        room.isVoting = false;
        room.currentRound += 1;
        return [
          { type: "room", roomId },
          { type: "votes", roomId },
        ];
      });
      await delay(null);
    },

    subscribe(channel, handler) {
      let set = listeners.get(channel);
      if (!set) {
        set = new Set();
        listeners.set(channel, set);
      }
      set.add(handler);
      return () => {
        const current = listeners.get(channel);
        if (!current) return;
        current.delete(handler);
        if (current.size === 0) listeners.delete(channel);
      };
    },
  };
}
