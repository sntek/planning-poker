import type { ServerWebSocket } from "bun";

export type WsData = { id: string; channels: Set<string> };
export type Event =
  | { type: "rooms" }
  | { type: "room"; roomId: string }
  | { type: "votes"; roomId: string }
  | { type: "throw"; roomId: string; from: string; to: string; emoji: string };

const clients = new Map<string, ServerWebSocket<WsData>>();

export function register(ws: ServerWebSocket<WsData>) {
  clients.set(ws.data.id, ws);
}

export function unregister(ws: ServerWebSocket<WsData>) {
  clients.delete(ws.data.id);
}

export function subscribe(ws: ServerWebSocket<WsData>, channel: string) {
  ws.data.channels.add(channel);
}

export function unsubscribe(ws: ServerWebSocket<WsData>, channel: string) {
  ws.data.channels.delete(channel);
}

export function broadcast(event: Event) {
  const channel = channelFor(event);
  const payload = JSON.stringify(event);
  for (const ws of clients.values()) {
    if (ws.data.channels.has(channel)) {
      ws.send(payload);
    }
  }
}

function channelFor(event: Event): string {
  switch (event.type) {
    case "rooms":
      return "rooms";
    case "room":
    case "votes":
    case "throw":
      return `room:${event.roomId}`;
  }
}
