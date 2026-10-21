import { useTranslations } from "next-intl";
import { Badge } from "./badge";
import { Cover } from "./cover";
import type { QueueItem } from "@/lib/queue-types";

type Props = { item: QueueItem; index: number; actions?: React.ReactNode };

export function QueueRow({ item, index, actions }: Props) {
  const t = useTranslations("common");
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-paper p-2 pr-3">
      <span className="w-6 text-center font-mono text-sm font-medium text-wine">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Cover
        src={item.album.thumbUrl}
        alt={t("coverAlt", { title: item.album.title, artist: item.album.artist })}
        seed={item.album.id}
        className="size-11 shrink-0 rounded-lg"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{item.album.title}</span>
        <span className="truncate text-xs text-muted">{item.album.artist}</span>
      </div>
      {item.isHouse ? (
        <Badge tone="dark">{t("fromHouse")}</Badge>
      ) : (
        <Badge>@{item.userName}</Badge>
      )}
      {actions}
    </li>
  );
}
