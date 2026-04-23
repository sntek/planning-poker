create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creator_name text not null,
  is_voting boolean not null default false,
  current_round integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists rooms_created_at_idx on rooms (created_at desc);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round integer not null,
  voter_name text not null,
  points integer not null,
  created_at timestamptz not null default now(),
  unique (room_id, round, voter_name)
);

create index if not exists votes_room_round_idx on votes (room_id, round);
