import { createHttpClient } from "./http";
import type { ApiClient } from "./types";

let client: ApiClient | null = null;

export function api(): ApiClient {
  if (!client) client = createHttpClient();
  return client;
}

export type { ApiClient, Room, Vote, VoteStats, RoundRecord, RoundData, Event, Channel } from "./types";
