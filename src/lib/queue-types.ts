/** Client-safe types and constants for the queue (no server imports here). */

export const MINUTES_PER_RECORD = 20;

export type QueueItem = {
  id: number;
  position: number;
  userName: string;
  side: string | null;
  /** true when the album belongs to the café's own collection */
  isHouse: boolean;
  startedAt: string | null;
  album: {
    id: number;
    discogsId: number;
    title: string;
    artist: string;
    year: number | null;
    coverUrl: string | null;
    thumbUrl: string | null;
  };
};

export type QueueSnapshot = {
  now: QueueItem | null;
  upcoming: QueueItem[];
  playedToday: number;
  generatedAt: string;
};
