import type { ApiClient } from "./types";
import { createHttpClient } from "./http";
import { createMockClient } from "./mock";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";

let client: ApiClient | null = null;

export function api(): ApiClient {
  if (!client) {
    client = USE_MOCK ? createMockClient() : createHttpClient();
  }
  return client;
}

export type { ApiClient, Room, Vote, VoteStats, Event, Channel } from "./types";
