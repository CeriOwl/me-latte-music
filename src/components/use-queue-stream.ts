"use client";

import { useEffect, useState } from "react";
import type { QueueSnapshot } from "@/lib/queue-types";

/**
 * Live queue. Starts from the snapshot the server rendered, then listens to
 * /api/queue/stream. EventSource reconnects by itself if the connection drops.
 * To swap SSE for polling, only this function needs to change.
 */
export function useQueueStream(initial: QueueSnapshot): QueueSnapshot {
  const [snapshot, setSnapshot] = useState(initial);

  useEffect(() => {
    const source = new EventSource("/api/queue/stream");
    source.onmessage = (event) => setSnapshot(JSON.parse(event.data) as QueueSnapshot);
    return () => source.close();
  }, []);

  return snapshot;
}

/** Re-renders every `ms` so "~X min" labels keep counting down. */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
