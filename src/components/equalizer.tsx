import { cn } from "@/lib/cn";

export function Equalizer({ bars = 4, className }: { bars?: number; className?: string }) {
  const delays = ["0s", "-0.3s", "-0.6s", "-0.15s", "-0.45s"];
  return (
    <div aria-hidden="true" className={cn("flex h-7 items-end gap-1", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="h-full w-1.5 origin-bottom animate-eq rounded-sm bg-blush"
          style={{ animationDelay: delays[i % delays.length] }}
        />
      ))}
    </div>
  );
}
