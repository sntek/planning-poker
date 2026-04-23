# Planning Poker

A whimsical planning poker table for your team. Bun + React + Postgres, deployable with Docker.

## Stack

- **Frontend**: React 19 + Vite + Tailwind (Fredoka display font, floating blobs, confetti on consensus)
- **Backend**: Bun native HTTP + WebSocket server
- **Database**: Postgres
- **Real-time**: WebSocket fan-out on mutations; clients refetch on relevant events
- **Deploy**: one Docker image, Postgres container alongside

No auth — this is a LAN team tool. Users type a name, that's it.

## Local design preview (no backend)

The frontend has a built-in mock mode that persists to `localStorage` and syncs across browser tabs via `BroadcastChannel`. Open the app in two tabs with different names to feel the multi-player flow without running anything server-side.

```bash
bun install
echo "VITE_USE_MOCK=1" > .env.local
bun run dev
```

A yellow "design preview" pill appears in the header so you know you're in mock mode.

## Full local stack (frontend + Bun server + Postgres)

Bring up Postgres first:

```bash
docker run --rm -d \
  --name poker-pg \
  -e POSTGRES_USER=poker -e POSTGRES_PASSWORD=poker -e POSTGRES_DB=planning_poker \
  -p 5432:5432 postgres:16-alpine
```

Then in one terminal:

```bash
export DATABASE_URL=postgres://poker:poker@localhost:5432/planning_poker
bun run dev:server
```

In another terminal (make sure `VITE_USE_MOCK` is unset or `0`):

```bash
bun run dev
```

Vite proxies `/api` and `/ws` to `http://localhost:3001` by default (override with `VITE_API_TARGET`).

## Docker (production-style)

```bash
cp .env.example .env      # adjust secrets
docker compose up --build -d
```

The `app` container builds the frontend, then the Bun server serves the static bundle and API/WebSocket on the same port. Open `http://<your-host>:3001`.

To deploy on your Lanthanum server, copy the repo over and run the same command. Data persists in the `postgres_data` named volume.

## Scripts

- `bun run dev` — frontend only (mock or proxied)
- `bun run dev:server` — backend with file watch
- `bun run build` — build the frontend to `dist/`
- `bun run server:start` — run the server (production)
- `bun run server:migrate` — run migrations only
- `bun run lint` — typecheck frontend + server + production build

## Layout

```
.
├── server/              # Bun backend
│   ├── src/
│   │   ├── index.ts     # HTTP + WS server, static fallback
│   │   ├── routes.ts    # REST handlers
│   │   ├── hub.ts       # WebSocket channel fan-out
│   │   ├── db.ts        # Postgres client
│   │   └── migrate.ts   # simple file-based migrator
│   └── migrations/      # *.sql, applied in order
├── src/                 # React frontend
│   ├── api/             # ApiClient interface, HTTP client, mock client
│   ├── hooks/           # useRoom, useRooms, useVotes, useStats
│   └── components/      # NamePrompt, RoomList, PlanningRoom, VotingInterface, ResultsDisplay
├── Dockerfile
└── docker-compose.yml
```
