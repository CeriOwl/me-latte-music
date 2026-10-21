"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { QueueSnapshot } from "@/lib/queue-types";
import { etaMinutes } from "@/lib/eta";
import { Badge } from "./badge";
import { Brand } from "./brand";
import { Cover } from "./cover";
import { Equalizer } from "./equalizer";
import { Marquee } from "./marquee";
import { QueueRow } from "./queue-row";
import { useNow, useQueueStream } from "./use-queue-stream";
import { Vinyl } from "./vinyl";

export function NowPlayingView({ initial }: { initial: QueueSnapshot }) {
  const t = useTranslations("nowPlaying");
  const c = useTranslations("common");
  const { now, upcoming } = useQueueStream(initial);
  const at = useNow();

  const totalMinutes = upcoming.length
    ? etaMinutes(upcoming.length, now?.startedAt ?? null, at)
    : 0;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pb-28 pt-5">
      <Brand
        right={
          <span className="flex items-center gap-1.5 rounded-full border-[1.5px] border-wine bg-paper px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-wine">
            <span className="size-2 animate-pulse-ring rounded-full bg-rose" />
            {c("live")}
          </span>
        }
      />

      <h1 className="font-display text-[clamp(2.25rem,11vw,2.75rem)] font-extrabold leading-[0.95] tracking-tight text-wine">
        {t("title")}
      </h1>

      <section className="relative rounded-[28px] bg-wine p-5 text-cream">
        {now ? (
          <>
            <Badge className="absolute -top-3 right-4 animate-bob border-[1.5px] border-wine font-mono text-[10px] tracking-wide">
              {now.isHouse ? t("houseBadge") : t("communityBadge")}
            </Badge>

            <div className="relative flex h-36 items-center">
              <Vinyl className="absolute left-[40%] size-32 animate-peek" />
              <Cover
                src={now.album.coverUrl}
                alt={c("coverAlt", { title: now.album.title, artist: now.album.artist })}
                seed={now.album.id}
                className="relative z-10 size-36 shadow-[0_10px_22px_rgba(30,5,9,0.35)]"
              />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-display text-3xl font-extrabold leading-none tracking-tight [overflow-wrap:anywhere]">
                  {now.album.title}
                </span>
                <span className="font-mono text-xs text-blush">
                  {[now.album.artist, now.album.year, now.side && t("side", { side: now.side })]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <Equalizer />
            </div>

            <div className="mt-3.5 flex w-fit max-w-full items-center gap-2.5 rounded-full bg-cream/10 py-1.5 pl-1.5 pr-3.5 text-sm">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blush text-[13px] font-bold text-wine">
                {(now.isHouse ? "M" : now.userName).charAt(0).toUpperCase()}
              </span>
              <span className="truncate">
                {now.isHouse
                  ? c("fromHouse")
                  : t.rich("broughtBy", { name: now.userName, strong: (chunks) => <strong>{chunks}</strong> })}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Vinyl className="size-28" spinning={false} />
            <p className="font-display text-xl font-bold">{t("nothingPlaying")}</p>
            <p className="text-sm text-blush">{t("nothingPlayingHint")}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight">{t("upNext")}</h2>
          {upcoming.length > 0 && (
            <span className="font-mono text-[11px] text-muted">
              {t("queueMeta", { count: upcoming.length, minutes: totalMinutes })}
            </span>
          )}
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-paper p-4 text-center text-sm text-muted">{t("emptyQueue")}</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {upcoming.slice(0, 5).map((item, i) => (
              <QueueRow key={item.id} item={item} index={i} />
            ))}
          </ol>
        )}
      </section>

      <Link
        href="/add"
        className="flex h-14 items-center justify-center gap-2 rounded-full bg-wine text-base font-bold text-cream shadow-[0_6px_0_#3e0a14] transition-transform hover:-translate-y-0.5"
      >
        {t("addCta")}
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>

      <Marquee text={t("marquee")} className="fixed inset-x-0 bottom-0 h-10 text-xs" />
    </div>
  );
}
