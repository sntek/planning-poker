import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

export const sql = postgres(url, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export type RoomRow = {
  id: string;
  name: string;
  creator_name: string;
  is_voting: boolean;
  current_round: number;
  created_at: Date;
};

export type VoteRow = {
  id: string;
  room_id: string;
  round: number;
  voter_name: string;
  points: number;
  created_at: Date;
};
