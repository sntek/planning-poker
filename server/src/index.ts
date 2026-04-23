import { randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { migrate } from "./migrate";
import { handleApi } from "./routes";
import { broadcast, register, subscribe, unregister, unsubscribe, type WsData } from "./hub";

const PORT = Number(process.env.PORT ?? 3001);
const STATIC_DIR = process.env.STATIC_DIR;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(pathname: string): Response | null {
  if (!STATIC_DIR) return null;
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(STATIC_DIR, safe);
  if (!filePath.startsWith(STATIC_DIR)) return new Response("forbidden", { status: 403 });

  let stat;
  try {
    stat = statSync(filePath);
  } catch {
    stat = null;
  }

  if (!stat || stat.isDirectory()) {
    filePath = join(STATIC_DIR, "index.html");
    if (!existsSync(filePath)) return null;
  }

  const file = Bun.file(filePath);
  const ext = extname(filePath).toLowerCase();
  return new Response(file, {
    headers: { "content-type": MIME[ext] ?? "application/octet-stream" },
  });
}

await migrate();

const server = Bun.serve<WsData>({
  port: PORT,
  async fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const ok = server.upgrade(req, {
        data: { id: randomUUID(), channels: new Set<string>() },
      });
      return ok ? undefined : new Response("upgrade failed", { status: 400 });
    }

    if (url.pathname === "/healthz") {
      return new Response("ok");
    }

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(req, url);
      } catch (err) {
        console.error("[api error]", err);
        return new Response(JSON.stringify({ error: "internal" }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    const staticResponse = serveStatic(url.pathname);
    if (staticResponse) return staticResponse;

    return new Response("not found", { status: 404 });
  },
  websocket: {
    open(ws) {
      register(ws);
    },
    close(ws) {
      unregister(ws);
    },
    message(ws, raw) {
      let msg: unknown;
      try {
        msg = typeof raw === "string" ? JSON.parse(raw) : JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;
      const m = msg as {
        type?: string;
        channel?: string;
        roomId?: string;
        from?: string;
        to?: string;
        emoji?: string;
      };
      if (m.type === "subscribe" && typeof m.channel === "string") {
        subscribe(ws, m.channel);
      } else if (m.type === "unsubscribe" && typeof m.channel === "string") {
        unsubscribe(ws, m.channel);
      } else if (
        m.type === "throw" &&
        typeof m.roomId === "string" &&
        typeof m.from === "string" &&
        typeof m.to === "string" &&
        typeof m.emoji === "string" &&
        m.emoji.length <= 16
      ) {
        broadcast({ type: "throw", roomId: m.roomId, from: m.from, to: m.to, emoji: m.emoji });
      }
    },
  },
});

console.log(`[server] listening on :${server.port}`);
