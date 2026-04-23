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

    if (sub === "" && method === "DELETE") {
      const result = await sql`delete from rooms where id = ${roomId}`;
      if (result.count === 0) return bad("room not found", 404);
      broadcast({ type: "rooms" });
      return new Response(null, { status: 204 });
    }

    if (sub === "/round-title" && method === "POST") {
      const body = await readJson(req);
      const round = int(body.round);
      const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
      if (round == null) return bad("round required");
      await sql`
        insert into rounds (room_id, round_number, title)
        values (${roomId}, ${round}, ${title})
        on conflict (room_id, round_number) do update set title = excluded.title
      `;
      broadcast({ type: "room", roomId });
      return json({ ok: true });
    }

    if (sub === "/select-score" && method === "POST") {
      const body = await readJson(req);
      const round = int(body.round);
      const score = int(body.score);
      if (round == null) return bad("round required");
      if (score == null) return bad("score required");
      await sql`
        insert into rounds (room_id, round_number, selected_score)
        values (${roomId}, ${round}, ${score})
        on conflict (room_id, round_number) do update set selected_score = excluded.selected_score
      `;
      broadcast({ type: "room", roomId });
      return json({ ok: true });
    }

    if (sub === "/history" && method === "GET") {
      const [room] = await sql<RoomRow[]>`select current_round from rooms where id = ${roomId}`;
      if (!room) return bad("room not found", 404);

      type HistoryRow = {
        round_number: number;
        title: string;
        selected_score: number | null;
        vote_count: number;
        average: number | null;
      };

      const rows = await sql<HistoryRow[]>`
        select
          v_agg.round_number,
          coalesce(r.title, '')   as title,
          r.selected_score,
          v_agg.vote_count,
          v_agg.average
        from (
          select round as round_number, count(*)::int as vote_count, avg(points) as average
          from votes
          where room_id = ${roomId}
          group by round
        ) v_agg
        left join rounds r
          on r.room_id = ${roomId} and r.round_number = v_agg.round_number
        order by v_agg.round_number asc
      `;

      return json(
        rows.map((r) => ({
          roundNumber: r.round_number,
          title: r.title,
          selectedScore: r.selected_score,
          voteCount: r.vote_count,
          average: r.average != null ? Number(r.average) : null,
        })),
      );
    }

    if (sub === "/round-data" && method === "GET") {
      const round = int(Number(url.searchParams.get("round")));
      if (round == null) return bad("round required");
      const [row] = await sql<{ title: string; selected_score: number | null }[]>`
        select coalesce(title, '') as title, selected_score
        from rounds where room_id = ${roomId} and round_number = ${round}
      `;
      return json({ title: row?.title ?? "", selectedScore: row?.selected_score ?? null });
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
