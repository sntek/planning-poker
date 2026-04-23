create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number integer not null,
  title text not null default '',
  selected_score integer,
  created_at timestamptz not null default now(),
  unique (room_id, round_number)
);

create index if not exists rounds_room_idx on rounds (room_id, round_number);
