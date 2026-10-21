import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./locale-switcher";

export function Brand({ right }: { right?: React.ReactNode }) {
  const t = useTranslations("common");
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-wine font-display font-extrabold leading-none text-cream shadow-[0_0_0_3px_#f6eee2,0_0_0_5px_#6b1424]">
          <span className="text-center text-[9px] tracking-wide">
            ME LATTE
            <br />
            <span className="text-[6px] tracking-widest">RECORDS</span>
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold">{t("brand")}</span>
          <span className="text-xs text-muted">{t("location")}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <LocaleSwitcher />
      </div>
    </header>
  );
}
