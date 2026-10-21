import { cn } from "@/lib/cn";

/** A spinning record. Size it with a className (e.g. "size-32"). */
export function Vinyl({ className, spinning = true }: { className?: string; spinning?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "grid aspect-square place-items-center rounded-full shadow-[0_8px_18px_rgba(30,5,9,0.45)]",
        "bg-[repeating-radial-gradient(circle,#1e0509_0_2px,#2e0b12_2px_4px)]",
        spinning && "animate-spin-slow",
        className,
      )}
    >
      <div className="grid size-[34%] place-items-center rounded-full bg-[conic-gradient(#f0d3cb_0_25%,#c7606c_25%_50%,#f0d3cb_50%_75%,#c7606c_75%)]">
        <div className="size-[16%] rounded-full bg-[#1e0509]" />
      </div>
    </div>
  );
}
