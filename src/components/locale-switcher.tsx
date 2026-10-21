"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/actions/locale";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const t = useTranslations("common");
  const router = useRouter();

  async function choose(locale: string) {
    await setLocaleAction(locale);
    router.refresh();
  }

  return (
    <div role="group" aria-label={t("language")} className={cn("flex rounded-full bg-paper p-0.5", className)}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={l === current}
          className={cn(
            "min-h-9 min-w-9 rounded-full px-2 font-mono text-xs font-medium uppercase",
            l === current ? "bg-wine text-cream" : "text-wine",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
