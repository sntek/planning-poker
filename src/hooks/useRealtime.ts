import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Channel, Event, Room, RoundData, RoundRecord, Vote, VoteStats } from "../api";

function useLiveFetch<T>(
  channels: Channel[] | null,
  matches: (event: Event) => boolean,
  fetcher: () => Promise<T>,
  deps: unknown[],
): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!channels) {
      setData(undefined);
      return;
    }

    const client = api();
    let cancelled = false;

    const load = () => {
      const id = ++reqIdRef.current;
      fetcher().then(
        (value) => {
          if (!cancelled && id === reqIdRef.current) setData(value);
        },
        (err) => {
          console.error("[useLiveFetch]", err);
        },
      );
    };

    load();

    const unsubs = channels.map((ch) =>
      client.subscribe(ch, (event) => {
        if (matches(event)) load();
      }),
    );

    return () => {
      cancelled = true;
      for (const u of unsubs) u();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}

export function useRooms(): Room[] | undefined {
  return useLiveFetch<Room[]>(
    ["rooms"],
    (e) => e.type === "rooms",
    () => api().listRooms(),
    [],
  );
}

export function useRoom(roomId: string | null): Room | null | undefined {
  return useLiveFetch<Room | null>(
    roomId ? [`room:${roomId}`] : null,
    (e) => e.type === "room" && e.roomId === roomId,
    () => (roomId ? api().getRoom(roomId) : Promise.resolve(null)),
    [roomId],
  );
}

export function useVotes(
  roomId: string | null,
  round: number | null,
): Vote[] | undefined {
  return useLiveFetch<Vote[]>(
    roomId ? [`room:${roomId}`] : null,
    (e) => (e.type === "votes" || e.type === "room") && e.roomId === roomId,
    () =>
      roomId && round != null ? api().getVotes(roomId, round) : Promise.resolve([]),
    [roomId, round],
  );
}

export function useStats(
  roomId: string | null,
  round: number | null,
): VoteStats | null | undefined {
  return useLiveFetch<VoteStats | null>(
    roomId ? [`room:${roomId}`] : null,
    (e) => (e.type === "votes" || e.type === "room") && e.roomId === roomId,
    () =>
      roomId && round != null ? api().getStats(roomId, round) : Promise.resolve(null),
    [roomId, round],
  );
}

export function useRoundData(
  roomId: string | null,
  round: number | null,
): RoundData | undefined {
  return useLiveFetch<RoundData>(
    roomId ? [`room:${roomId}`] : null,
    (e) => e.type === "room" && e.roomId === roomId,
    () =>
      roomId && round != null
        ? api().getRoundData(roomId, round)
        : Promise.resolve({ title: "", selectedScore: null }),
    [roomId, round],
  );
}

export function useHistory(roomId: string | null): RoundRecord[] | undefined {
  return useLiveFetch<RoundRecord[]>(
    roomId ? [`room:${roomId}`] : null,
    (e) => (e.type === "room" || e.type === "votes") && e.roomId === roomId,
    () => (roomId ? api().getHistory(roomId) : Promise.resolve([])),
    [roomId],
  );
}
