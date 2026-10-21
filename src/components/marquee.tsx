import { cn } from "@/lib/cn";

/** Scrolling ticker. The text is repeated twice so the loop is seamless. */
export function Marquee({ text, className }: { text: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex items-center overflow-hidden bg-wine-deep text-blush", className)}>
      <div className="flex animate-marquee whitespace-nowrap font-mono tracking-widest">
        <span className="pr-10">{text}</span>
        <span className="pr-10">{text}</span>
      </div>
    </div>
  );
}
