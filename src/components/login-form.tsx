"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { LocaleSwitcher } from "./locale-switcher";

export function LoginForm() {
  const t = useTranslations("staff.login");
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(false);
    const { error } = await authClient.signIn.username({
      username: String(form.get("username")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return setError(true);
    router.push("/staff");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-wine">{t("title")}</h1>
        <LocaleSwitcher />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-wine">
          {t("username")}
          <input
            name="username"
            autoComplete="username"
            required
            className="h-12 rounded-2xl border-2 border-wine bg-paper px-3.5 text-[15px] font-normal text-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-wine">
          {t("password")}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 rounded-2xl border-2 border-wine bg-paper px-3.5 text-[15px] font-normal text-ink"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-wine-mid">
            {t("invalid")}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-14 rounded-full bg-wine font-bold text-cream shadow-[0_6px_0_#3e0a14] disabled:opacity-70"
        >
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>
    </main>
  );
}
