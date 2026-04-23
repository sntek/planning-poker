import { sql, type RoomRow, type VoteRow } from "./db";
import { broadcast } from "./hub";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function bad(message: string, status = 400) {
  return json({ error: message }, status);
}

function serializeRoom(r: RoomRow) {
  return {
    id: r.id,
    name: r.name,
    creatorName: r.creator_name,
    isVoting: r.is_voting,
    currentRound: r.current_round,
    createdAt: r.created_at.toISOString(),
  };
}

function serializeVote(v: VoteRow) {
  return {
    id: v.id,
    roomId: v.room_id,
    round: v.round,
    voterName: v.voter_name,
    points: v.points,
  };
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function str(v: unknown, max = 80): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function int(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v)) return null;
  return v;
}

export async function handleApi(req: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace(/^\/api/, "");
  const method = req.method;

  if (path === "/rooms" && method === "GET") {
    const rows = await sql<RoomRow[]>`
      select * from rooms order by created_at desc limit 20
    `;
    return json(rows.map(serializeRoom));
  }

  if (path === "/rooms" && method === "POST") {
    const body = await readJson(req);
    const name = str(body.name);
    const creatorName = str(body.creatorName);
    if (!name) return bad("name required");
    if (!creatorName) return bad("creatorName required");
    const [row] = await sql<RoomRow[]>`
      insert into rooms (name, creator_name) values (${name}, ${creatorName})
      returning *
    `;
    broadcast({ type: "rooms" });
    return json(serializeRoom(row), 201);
  }

  const roomMatch = path.match(/^\/rooms\/([^/]+)(\/[^?]*)?$/);
  if (roomMatch) {
    const roomId = roomMatch[1];
    const sub = roomMatch[2] ?? "";
    if (!UUID_RE.test(roomId)) return bad("invalid room id", 404);

    if (sub === "" && method === "GET") {
      const [row] = await sql<RoomRow[]>`select * from rooms where id = ${roomId}`;
      if (!row) return bad("room not found", 404);
      return json(serializeRoom(row));
    }

    if (sub === "/start" && method === "POST") {
      const [row] = await sql<RoomRow[]>`
        update rooms set is_voting = true where id = ${roomId} returning *
      `;
      if (!row) return bad("room not found", 404);
      broadcast({ type: "room", roomId });
      return json(serializeRoom(row));
    }

    if (sub === "/stop" && method === "POST") {
      const [row] = await sql<RoomRow[]>`
        update rooms set is_voting = false where id = ${roomId} returning *
      `;
      if (!row) return bad("room not found", 404);
      broadcast({ type: "room", roomId });
      return json(serializeRoom(row));
    }

    if (sub === "/next" && method === "POST") {
      const [row] = await sql<RoomRow[]>`
        update rooms
        set is_voting = false, current_round = current_round + 1
        where id = ${roomId} returning *
      `;
      if (!row) return bad("room not found", 404);
      broadcast({ type: "room", roomId });
      broadcast({ type: "votes", roomId });
      return json(serializeRoom(row));
    }

    if (sub === "/votes" && method === "GET") {
      const round = int(Number(url.searchParams.get("round")));
      if (round == null) return bad("round required");
      const rows = await sql<VoteRow[]>`
        select * from votes where room_id = ${roomId} and round = ${round}
        order by created_at asc
      `;
      return json(rows.map(serializeVote));
    }

    if (sub === "/stats" && method === "GET") {
      const round = int(Number(url.searchParams.get("round")));
      if (round == null) return bad("round required");
      const rows = await sql<VoteRow[]>`
        select * from votes where room_id = ${roomId} and round = ${round}
        order by created_at asc
      `;
      if (rows.length === 0) return json(null);
      const total = rows.reduce((s, v) => s + v.points, 0);
      const avg = total / rows.length;
      return json({
        average: avg,
        roundedDown: Math.floor(avg),
        roundedUp: Math.ceil(avg),
        totalVotes: rows.length,
        votes: rows.map((v) => ({ voterName: v.voter_name, points: v.points })),
      });
    }

    if (sub === "/vote" && method === "POST") {
      const body = await readJson(req);
      const round = int(body.round);
      const voterName = str(body.voterName);
      const points = int(body.points);
      if (round == null) return bad("round required");
      if (!voterName) return bad("voterName required");
      if (points == null) return bad("points required");

      const [room] = await sql<RoomRow[]>`select * from rooms where id = ${roomId}`;
      if (!room) return bad("room not found", 404);
      if (!room.is_voting) return bad("voting is not active", 409);

      await sql`
        insert into votes (room_id, round, voter_name, points)
        values (${roomId}, ${round}, ${voterName}, ${points})
        on conflict (room_id, round, voter_name)
        do update set points = excluded.points
      `;
      broadcast({ type: "votes", roomId });
      return json({ ok: true });
    }
  }

  return bad("not found", 404);
}
