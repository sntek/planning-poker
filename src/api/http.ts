import type { ApiClient, Channel, Event, Room, RoundData, RoundRecord, Vote, VoteStats } from "./types";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

class WsSocket {
  private ws: WebSocket | null = null;
  private channels = new Map<Channel, Set<(e: Event) => void>>();
  private pending: string[] = [];
  private retry = 0;
  private closed = false;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    if (this.closed) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.addEventListener("open", () => {
      this.retry = 0;
      for (const channel of this.channels.keys()) {
        ws.send(JSON.stringify({ type: "subscribe", channel }));
      }
      for (const msg of this.pending.splice(0)) ws.send(msg);
    });
    ws.addEventListener("message", (ev) => {
      let event: Event;
      try {
        event = JSON.parse(ev.data);
      } catch {
        return;
      }
      const channel: Channel =
        event.type === "rooms" ? "rooms" : (`room:${event.roomId}` as Channel);
      const handlers = this.channels.get(channel);
      if (handlers) for (const h of handlers) h(event);
    });
    ws.addEventListener("close", () => {
      this.ws = null;
      if (this.closed) return;
      const delay = Math.min(1000 * 2 ** this.retry++, 15000);
      setTimeout(() => this.connect(), delay);
    });
    ws.addEventListener("error", () => ws.close());
  }

  private send(msg: object) {
    const serialized = JSON.stringify(msg);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(serialized);
    else this.pending.push(serialized);
  }

  sendRaw(msg: object) {
    this.send(msg);
  }

  subscribe(channel: Channel, handler: (e: Event) => void): () => void {
    let handlers = this.channels.get(channel);
    if (!handlers) {
      handlers = new Set();
      this.channels.set(channel, handlers);
      this.send({ type: "subscribe", channel });
    }
    handlers.add(handler);
    return () => {
      const set = this.channels.get(channel);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) {
        this.channels.delete(channel);
        this.send({ type: "unsubscribe", channel });
      }
    };
  }
}

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function createHttpClient(): ApiClient {
  const socket = new WsSocket(wsUrl());

  return {
    listRooms: () => req<Room[]>("/api/rooms"),
    createRoom: (input) =>
      req<Room>("/api/rooms", { method: "POST", body: JSON.stringify(input) }),
    getRoom: (id) =>
      req<Room>(`/api/rooms/${id}`).catch((err) => {
        if (String(err).includes("404")) return null;
        throw err;
      }),
    getVotes: (roomId, round) =>
      req<Vote[]>(`/api/rooms/${roomId}/votes?round=${round}`),
    getStats: (roomId, round) =>
      req<VoteStats | null>(`/api/rooms/${roomId}/stats?round=${round}`),
    castVote: (input) =>
      req<void>(`/api/rooms/${input.roomId}/vote`, {
        method: "POST",
        body: JSON.stringify({
          round: input.round,
          voterName: input.voterName,
          points: input.points,
        }),
      }),
    startVoting: (roomId) =>
      req<void>(`/api/rooms/${roomId}/start`, { method: "POST" }),
    stopVoting: (roomId) =>
      req<void>(`/api/rooms/${roomId}/stop`, { method: "POST" }),
    nextRound: (roomId) =>
      req<void>(`/api/rooms/${roomId}/next`, { method: "POST" }),
    deleteRoom: (id) => req<void>(`/api/rooms/${id}`, { method: "DELETE" }),
    setRoundTitle: (roomId, round, title) =>
      req<void>(`/api/rooms/${roomId}/round-title`, {
        method: "POST",
        body: JSON.stringify({ round, title }),
      }),
    selectScore: (roomId, round, score) =>
      req<void>(`/api/rooms/${roomId}/select-score`, {
        method: "POST",
        body: JSON.stringify({ round, score }),
      }),
    getRoundData: (roomId, round) =>
      req<RoundData>(`/api/rooms/${roomId}/round-data?round=${round}`),
    getHistory: (roomId) => req<RoundRecord[]>(`/api/rooms/${roomId}/history`),
    throwEmoji: (input) => socket.sendRaw({ type: "throw", ...input }),
    subscribe: (channel, handler) => socket.subscribe(channel, handler),
  };
}
