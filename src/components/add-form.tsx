"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addToQueueAction, searchAction, type AddResult } from "@/actions/queue";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import type { AlbumInput } from "@/lib/queue";
import { Brand } from "./brand";
import { Cover } from "./cover";
import { Vinyl } from "./vinyl";

type Props = { queueCount: number };
type Done = Extract<AddResult, { ok: true }>;

const NICK_KEY = "melatte:nickname";

export function AddForm({ queueCount }: Props) {
  const t = useTranslations("add");
  const c = useTranslations("common");
  const { data: session, isPending } = authClient.useSession();

  const [query, setQuery] = useState("");
  // The last finished search. "Loading" is derived: the query moved on since.
  const [result, setResult] = useState<{ q: string; albums: AlbumInput[]; failed: boolean } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [typedNickname, setTypedNickname] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [sending, startSending] = useTransition();

  // Customers have no account: give this phone an anonymous session.
  useEffect(() => {
    if (!isPending && !session) void authClient.signIn.anonymous();
  }, [isPending, session]);

  // The nickname saved on this phone (empty on the server, so hydration matches).
  const savedNickname = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(NICK_KEY) ?? "";
      } catch {
        return "";
      }
    },
    () => "",
  );
  const nickname = typedNickname ?? savedNickname;

  // Debounced Discogs search.
  const q = query.trim();
  const canSearch = q.length >= 2 && !!session;
  useEffect(() => {
    if (!canSearch) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await searchAction(q);
      if (cancelled) return; // a newer search replaced this one
      setResult(res.ok ? { q, albums: res.albums, failed: false } : { q, albums: [], failed: true });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, canSearch]);

  const current = canSearch && result?.q === q ? result : null;
  const albums = current?.albums ?? [];
  const searchState = !canSearch ? "idle" : !current ? "loading" : current.failed ? "error" : "idle";

  const ready = picked !== null && nickname.trim().length > 0 && !!session;

  function submit() {
    if (!ready || picked === null) return;
    setError(null);
    startSending(async () => {
      const res = await addToQueueAction({ discogsId: picked, nickname });
      if (res.ok) {
        try {
          localStorage.setItem(NICK_KEY, res.nickname);
        } catch {}
        setDone(res);
      } else {
        setError(res.error === "rateLimited" ? t("rateLimited") : t("genericError"));
      }
    });
  }

  function reset() {
    setDone(null);
    setQuery("");
    setResult(null);
    setPicked(null);
    setError(null);
  }

  if (done) {
    return (
      <Shell queueCount={queueCount} t={t}>
        <div className="relative mt-4 flex animate-pop flex-col items-center gap-3.5 rounded-[30px] bg-wine px-5 py-7 text-center text-cream">
          <span className="absolute -top-3.5 left-4 -rotate-6 rounded-full border-[1.5px] border-wine bg-blush px-3 py-1.5 font-mono text-[11px] font-medium text-wine">
            {t("doneBadge")}
          </span>
          <Vinyl className="size-36" />
          <p className="font-display text-[clamp(1.75rem,9vw,2.125rem)] font-extrabold leading-none tracking-tight">
            {t.rich("donePosition", { position: done.position, br: () => <br /> })}
          </p>
          <p className="text-[15px] text-blush">
            {t.rich("doneRecord", {
              title: done.title,
              name: done.nickname,
              strong: (chunks) => <strong className="text-cream">{chunks}</strong>,
            })}
          </p>
          <p className="rounded-full bg-cream/15 px-3.5 py-1.5 font-mono text-xs">
            {t("doneEta", { minutes: done.etaMinutes })}
          </p>
        </div>
        <p className="px-2 text-center text-sm leading-relaxed text-muted">{t("doneNote")}</p>
        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/"
            className="flex h-14 items-center justify-center rounded-full bg-wine font-bold text-cream shadow-[0_6px_0_#3e0a14]"
          >
            {t("seeQueue")}
          </Link>
          <button
            type="button"
            onClick={reset}
            className="h-12 rounded-full border-2 border-wine font-bold text-wine"
          >
            {t("addAnother")}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell queueCount={queueCount} t={t}>
      <h1 className="font-display text-[clamp(2rem,10vw,2.375rem)] font-extrabold leading-[0.95] tracking-tight text-wine">
        {t.rich("title", { br: () => <br /> })}
      </h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="search" className="font-mono text-[11px] font-medium tracking-wide text-wine">
          {t("searchLabel")}
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPicked(null);
          }}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          className="h-12 rounded-2xl border-2 border-wine bg-paper px-3.5 text-[15px]"
        />
      </div>

      <div className="flex flex-col gap-2" aria-live="polite">
        {searchState === "loading" && <p className="px-1 text-sm text-muted">{t("searching")}</p>}
        {searchState === "error" && (
          <p className="rounded-2xl bg-paper p-4 text-center text-sm text-muted">{t("searchError")}</p>
        )}
        {searchState === "idle" && canSearch && albums.length === 0 && (
          <p className="rounded-2xl bg-paper p-4 text-center text-sm text-muted">{t("noResults")}</p>
        )}
        {albums.map((a) => {
          const selected = a.discogsId === picked;
          return (
            <button
              key={a.discogsId}
              type="button"
              aria-pressed={selected}
              onClick={() => setPicked(a.discogsId)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border-[2.5px] bg-paper p-2 pr-3 text-left transition-transform hover:-translate-y-0.5",
                selected ? "border-wine" : "border-transparent",
              )}
            >
              <Cover
                src={a.thumbUrl}
                alt={c("coverAlt", { title: a.title, artist: a.artist })}
                seed={a.discogsId}
                className="size-12 shrink-0 rounded-[10px]"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-bold">{a.title}</span>
                <span className="truncate text-xs text-muted">
                  {[a.artist, a.year, a.format].filter(Boolean).join(" · ")}
                </span>
              </span>
              {selected && (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-wine text-cream">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nickname" className="font-mono text-[11px] font-medium tracking-wide text-wine">
          {t("nicknameLabel")}
        </label>
        <input
          id="nickname"
          type="text"
          maxLength={24}
          value={nickname}
          onChange={(e) => setTypedNickname(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          className="h-12 rounded-2xl border-2 border-wine bg-paper px-3.5 text-[15px]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-paper p-3 text-center text-sm text-wine-mid">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!ready || sending}
        className={cn(
          "mt-auto h-14 rounded-full text-base font-bold text-cream shadow-[0_6px_0_#3e0a14]",
          ready && !sending ? "bg-wine" : "cursor-not-allowed bg-[#7d5f64]",
        )}
      >
        {sending ? t("ctaSending") : ready ? t("ctaReady") : t("ctaNotReady")}
      </button>
    </Shell>
  );
}

function Shell({
  children,
  queueCount,
  t,
}: {
  children: React.ReactNode;
  queueCount: number;
  t: ReturnType<typeof useTranslations<"add">>;
}) {
  const common = useTranslations("common");
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 pb-6 pt-5">
      <Brand
        right={
          <Link
            href="/"
            className="flex h-9 items-center rounded-full bg-paper px-3 text-xs font-semibold text-wine"
          >
            {common("back")}
          </Link>
        }
      />
      <p className="font-mono text-[11px] tracking-wide text-muted">
        {t("queueCount", { count: queueCount })}
      </p>
      {children}
    </div>
  );
}
