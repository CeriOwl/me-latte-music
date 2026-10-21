import { cn } from "@/lib/cn";

type Props = { children: React.ReactNode; tone?: "light" | "dark"; className?: string };

export function Badge({ children, tone = "light", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "light" ? "bg-blush text-wine" : "bg-wine text-cream",
        className,
      )}
    >
      {children}
    </span>
  );
}
