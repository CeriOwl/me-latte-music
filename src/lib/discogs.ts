import "server-only";
import type { AlbumInput } from "./queue";
import { redis } from "./redis";

const SEARCH_TTL = 60 * 60 * 24;

type DiscogsResult = {
  id: number;
  master_id?: number;
  title: string; // "Artist - Title"
  year?: string;
  thumb?: string;
  cover_image?: string;
  format?: string[];
};

function toAlbum(r: DiscogsResult): AlbumInput {
  // Discogs joins artist and title as "Artist - Title".
  const [artist, ...rest] = r.title.split(" - ");
  const hasArtist = rest.length > 0;
  const year = Number.parseInt(r.year ?? "", 10);
  return {
    discogsId: r.id,
    artist: hasArtist ? artist : "Unknown artist",
    title: hasArtist ? rest.join(" - ") : r.title,
    year: Number.isFinite(year) ? year : null,
    coverUrl: r.cover_image || null,
    thumbUrl: r.thumb || null,
    format: r.format?.join(", ") ?? null,
  };
}

const normalize = (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ");

/** Search vinyl releases on Discogs. Results are cached in Redis for 24 h. */
export async function searchAlbums(query: string): Promise<AlbumInput[]> {
  const q = normalize(query);
  const key = `discogs:q:${q}`;

  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as AlbumInput[];
  } catch (error) {
    console.error("discogs cache read failed", error);
  }

  const url = new URL("https://api.discogs.com/database/search");
  url.searchParams.set("q", q);
  url.searchParams.set("type", "release");
  url.searchParams.set("format", "Vinyl");
  url.searchParams.set("per_page", "25");

  const headers: Record<string, string> = {
    "User-Agent": "MeLatteRecords/1.0",
  };
  if (process.env.DISCOGS_TOKEN && process.env.DISCOGS_TOKEN_SECRET) {
    headers.Authorization = `Discogs key=${process.env.DISCOGS_TOKEN}, secret=${process.env.DISCOGS_TOKEN_SECRET}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Discogs responded ${res.status}`);
  const data = (await res.json()) as { results: DiscogsResult[] };

  // One entry per master release, so the list isn't 15 pressings of the same album.
  const seen = new Set<string>();
  const albums: AlbumInput[] = [];
  for (const r of data.results) {
    const dedupe = r.master_id ? `m${r.master_id}` : `r${r.id}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    albums.push(toAlbum(r));
    if (albums.length === 8) break;
  }

  try {
    await redis.set(key, JSON.stringify(albums), "EX", SEARCH_TTL);
    // Remember each result so "add to queue" can trust the server's copy,
    // not whatever the browser sends back.
    const pipe = redis.pipeline();
    for (const a of albums) {
      pipe.set(`discogs:release:${a.discogsId}`, JSON.stringify(a), "EX", SEARCH_TTL);
    }
    await pipe.exec();
  } catch (error) {
    console.error("discogs cache write failed", error);
  }
  return albums;
}

export async function getSearchedAlbum(discogsId: number): Promise<AlbumInput | null> {
  const cached = await redis.get(`discogs:release:${discogsId}`);
  return cached ? (JSON.parse(cached) as AlbumInput) : null;
}
