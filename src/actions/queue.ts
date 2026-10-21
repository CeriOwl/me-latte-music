"use server";

import { z } from "zod";
import type { AlbumInput } from "@/lib/queue";
import * as queue from "@/lib/queue";
import { getSearchedAlbum, searchAlbums } from "@/lib/discogs";
import { allow } from "@/lib/rate-limit";
import { getSession, requireAdmin } from "@/lib/session";

export type SearchResult =
  | { ok: true; albums: AlbumInput[] }
  | { ok: false; error: "rateLimited" | "unavailable" | "unauthorized" };

export async function searchAction(query: string): Promise<SearchResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };
  if (query.trim().length < 2) return { ok: true, albums: [] };

  if (!(await allow(`search:${session.user.id}`, 30, 60))) {
    return { ok: false, error: "rateLimited" };
  }
  try {
    return { ok: true, albums: await searchAlbums(query) };
  } catch (error) {
    console.error("discogs search failed", error);
    return { ok: false, error: "unavailable" };
  }
}

const addSchema = z.object({
  discogsId: z.number().int().positive(),
  nickname: z.string().trim().min(1).max(24),
});

export type AddResult =
  | { ok: true; position: number; etaMinutes: number; title: string; nickname: string }
  | { ok: false; error: "rateLimited" | "invalid" | "unauthorized" | "expired" | "failed" };

export async function addToQueueAction(input: {
  discogsId: number;
  nickname: string;
}): Promise<AddResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "unauthorized" };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const nickname = parsed.data.nickname.replace(/^@/, "");

  if (!(await allow(`add:${session.user.id}`, 5, 600))) {
    return { ok: false, error: "rateLimited" };
  }

  const found = await getSearchedAlbum(parsed.data.discogsId);
  if (!found) return { ok: false, error: "expired" };

  try {
    const result = await queue.enqueue({ album: found, userName: nickname });
    return {
      ok: true,
      position: result.position,
      etaMinutes: result.etaMinutes,
      title: found.title,
      nickname,
    };
  } catch (error) {
    console.error("enqueue failed", error);
    return { ok: false, error: "failed" };
  }
}

// ---- Staff ----

export async function nextRecordAction() {
  if (!(await requireAdmin())) return;
  await queue.next();
}

export async function moveUpAction(id: number) {
  if (!(await requireAdmin())) return;
  await queue.moveUp(id);
}

export async function removeAction(id: number) {
  const staff = await requireAdmin();
  if (!staff) return;
  await queue.remove(id, staff.id);
}
