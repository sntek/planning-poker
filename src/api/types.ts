export type Room = {
  id: string;
  name: string;
  creatorName: string;
  isVoting: boolean;
  currentRound: number;
  createdAt: string;
};

export type Vote = {
  id: string;
  roomId: string;
  round: number;
  voterName: string;
  points: number;
};

export type VoteStats = {
  average: number;
  roundedDown: number;
  roundedUp: number;
  totalVotes: number;
  votes: Array<{ voterName: string; points: number }>;
};

export type RoundRecord = {
  roundNumber: number;
  title: string;
  selectedScore: number | null;
  voteCount: number;
  average: number | null;
};

export type RoundData = {
  title: string;
  selectedScore: number | null;
};

export type Channel = "rooms" | `room:${string}`;

export type Event =
  | { type: "rooms" }
  | { type: "room"; roomId: string }
  | { type: "votes"; roomId: string };

export interface ApiClient {
  listRooms(): Promise<Room[]>;
  createRoom(input: { name: string; creatorName: string }): Promise<Room>;
  getRoom(id: string): Promise<Room | null>;
  getVotes(roomId: string, round: number): Promise<Vote[]>;
  getStats(roomId: string, round: number): Promise<VoteStats | null>;
  castVote(input: { roomId: string; round: number; voterName: string; points: number }): Promise<void>;
  startVoting(roomId: string): Promise<void>;
  stopVoting(roomId: string): Promise<void>;
  nextRound(roomId: string): Promise<void>;
  deleteRoom(id: string): Promise<void>;
  setRoundTitle(roomId: string, round: number, title: string): Promise<void>;
  selectScore(roomId: string, round: number, score: number): Promise<void>;
  getRoundData(roomId: string, round: number): Promise<RoundData>;
  getHistory(roomId: string): Promise<RoundRecord[]>;
  subscribe(channel: Channel, handler: (event: Event) => void): () => void;
}
