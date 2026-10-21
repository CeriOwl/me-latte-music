"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { moveUpAction, nextRecordAction, removeAction } from "@/actions/queue";
import { authClient } from "@/lib/auth-client";
import type { QueueSnapshot } from "@/lib/queue-types";
import { Cover } from "./cover";
import { LocaleSwitcher } from "./locale-switcher";
import { QueueRow } from "./queue-row";
import { useQueueStream } from "./use-queue-stream";
import { Vinyl } from "./vinyl";

export function StaffPanel({ initial }: { initial: QueueSnapshot }) {
  const t = useTranslations("staff");
  const c = useTranslations("common");
  const router = useRouter();
  const { now, upcoming, playedToday } = useQueueStream(initial);
  const [pending, run] = useTransition();

  async function signOut() {
    await authClient.signOut();
    router.push("/staff/login");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-wine md:text-3xl">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[13px] text-muted">{t("playedToday", { count: playedToday })}</span>
          <LocaleSwitcher />
          <button
            type="button"
            onClick={signOut}
            className="min-h-11 rounded-full bg-sand px-4 text-sm font-bold text-wine"
          >
            {t("signOut")}
          </button>
        </div>
      </header>

      <div className="grid flex-1 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="flex flex-col gap-4 rounded-[30px] bg-wine p-6 text-cream">
          <span className="font-mono text-xs tracking-[0.2em] text-blush">{t("nowPlaying")}</span>
          <div className="flex items-center gap-4">
            {now ? (
              <Cover
                src={now.album.thumbUrl}
                alt={c("coverAlt", { title: now.album.title, artist: now.album.artist })}
                seed={now.album.id}
                className="size-24 shrink-0"
              />
            ) : (
              <Vinyl className="size-24 shrink-0" spinning={false} />
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-display text-2xl font-extrabold leading-none tracking-tight [overflow-wrap:anywhere]">
                {now ? now.album.title : t("nothingPlaying")}
              </span>
              {now && (
                <>
                  <span className="text-[15px] text-blush">{now.album.artist}</span>
                  <span className="mt-1 w-fit rounded-full bg-cream/15 px-2.5 py-1 text-[13px]">
                    {now.isHouse ? c("fromHouse") : `@${now.userName}`}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-4">
            {upcoming[0] && (
              <span className="text-sm text-blush">
                {t.rich("after", { title: upcoming[0].album.title, strong: (chunks) => <strong className="text-cream">{chunks}</strong> })}
              </span>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => nextRecordAction())}
              className="flex h-24 items-center justify-center gap-3 rounded-[28px] bg-blush font-display text-3xl font-extrabold tracking-tight text-wine shadow-[0_6px_0_#3e0a14] transition-transform active:translate-y-1 active:shadow-[0_1px_0_#3e0a14] disabled:opacity-70"
            >
              {t("next")}
              <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5l9 7-9 7zM19 5v14" />
              </svg>
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">{t("inQueue")}</h2>
            <span className="font-mono text-xs text-muted">{c("records", { count: upcoming.length })}</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl bg-paper p-7 text-center text-[15px] text-muted">{t("emptyQueue")}</p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {upcoming.map((item, i) => (
                <QueueRow
                  key={item.id}
                  item={item}
                  index={i}
                  actions={
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-label={t("moveUp")}
                        disabled={pending || i === 0}
                        onClick={() => run(() => moveUpAction(item.id))}
                        className="grid size-11 place-items-center rounded-[14px] border-2 border-sand bg-cream text-wine disabled:opacity-40"
                      >
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19V5M6 11l6-6 6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => removeAction(item.id))}
                        className="min-h-11 rounded-[14px] border-2 border-wine px-3 text-sm font-bold text-wine"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  }
                />
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
