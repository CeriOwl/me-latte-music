"use client";

import { useTranslations } from "next-intl";
import type { QueueSnapshot } from "@/lib/queue-types";
import { Badge } from "./badge";
import { Cover } from "./cover";
import { Equalizer } from "./equalizer";
import { LocaleSwitcher } from "./locale-switcher";
import { Marquee } from "./marquee";
import { useQueueStream } from "./use-queue-stream";
import { Vinyl } from "./vinyl";

/** Café TV. Sizes use clamp()/vw so it fills any screen without a fixed stage. */
export function ScreenView({ initial, qrSvg }: { initial: QueueSnapshot; qrSvg: string }) {
  const t = useTranslations("screen");
  const n = useTranslations("nowPlaying");
  const c = useTranslations("common");
  const { now, upcoming, playedToday } = useQueueStream(initial);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-wine text-cream">
      <LocaleSwitcher className="absolute right-4 top-4 z-20 opacity-60 hover:opacity-100" />

      <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-[3vw] p-[clamp(1rem,4vw,4rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative mx-auto aspect-[5/4] w-full max-w-[min(40vw,60vh)] min-w-48">
          {now ? (
            <>
              <Vinyl className="absolute left-[38%] top-[8%] size-[76%] animate-peek" />
              <Cover
                src={now.album.coverUrl}
                alt={c("coverAlt", { title: now.album.title, artist: now.album.artist })}
                seed={now.album.id}
                className="absolute left-0 top-0 size-4/5 rounded-[6%] shadow-[0_24px_50px_rgba(30,5,9,0.45)]"
              />
              <Badge className="absolute -left-2 bottom-0 animate-bob border-2 border-wine-deep font-mono text-[clamp(0.6rem,1.2vw,0.95rem)] tracking-wide">
                {now.isHouse ? n("houseBadge") : n("communityBadge")}
              </Badge>
            </>
          ) : (
            <Vinyl className="mx-auto size-4/5" spinning={false} />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-[clamp(0.75rem,1.6vw,1.25rem)]">
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[clamp(0.75rem,1.3vw,1rem)] tracking-[0.2em] text-blush">
              {t("nowPlaying")}
            </span>
            {now && <Equalizer bars={5} />}
          </div>

          {now ? (
            <>
              <h1 className="font-display text-[clamp(2.5rem,7.5vw,6.5rem)] font-extrabold leading-[0.9] tracking-tight [overflow-wrap:anywhere]">
                {now.album.title}
              </h1>
              <p className="text-[clamp(1rem,2vw,1.625rem)] text-blush">
                {[now.album.artist, now.album.year, now.side && n("side", { side: now.side })]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="flex w-fit max-w-full items-center gap-3.5 rounded-full bg-cream/10 py-2 pl-2 pr-5 text-[clamp(0.9rem,1.7vw,1.375rem)]">
                <span className="grid size-[2.2em] shrink-0 place-items-center rounded-full bg-blush font-display font-extrabold text-wine">
                  {(now.isHouse ? "M" : now.userName).charAt(0).toUpperCase()}
                </span>
                <span className="truncate">
                  {now.isHouse
                    ? c("fromHouse")
                    : n.rich("broughtBy", { name: now.userName, strong: (chunks) => <strong>{chunks}</strong> })}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-[clamp(2.5rem,7vw,6rem)] font-extrabold leading-[0.9] tracking-tight">
                {t("nothingPlaying")}
              </h1>
              <p className="text-[clamp(1rem,2vw,1.625rem)] text-blush">{t("nothingPlayingHint")}</p>
            </>
          )}

          <div className="mt-2 flex flex-col gap-4 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-3xl bg-wine-deep p-5">
              <span className="font-mono text-xs tracking-[0.2em] text-blush">{t("next")}</span>
              {upcoming.length === 0 && <p className="text-sm text-blush">{n("emptyQueue")}</p>}
              {upcoming.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Cover
                    src={item.album.thumbUrl}
                    alt={c("coverAlt", { title: item.album.title, artist: item.album.artist })}
                    seed={item.album.id}
                    className="size-11 shrink-0 rounded-lg"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-lg font-bold">{item.album.title}</span>
                    <span className="truncate text-sm text-blush">
                      {item.album.artist} · {item.isHouse ? c("fromHouse").toLowerCase() : `@${item.userName}`}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 flex-col items-center gap-2.5 rounded-3xl bg-cream p-4 text-wine sm:w-48">
              <div
                role="img"
                aria-label={t("qrAlt")}
                className="size-28 [&>svg]:size-full"
                // Generated on the server from our own URL, not user input.
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <span className="text-center text-[15px] font-bold leading-tight">{t("scan")}</span>
            </div>
          </div>
        </div>
      </div>

      <Marquee
        text={t("marquee", { played: playedToday })}
        className="h-[clamp(2.5rem,5vw,4rem)] text-[clamp(0.9rem,1.8vw,1.625rem)]"
      />
    </div>
  );
}
