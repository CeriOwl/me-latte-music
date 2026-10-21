import { cn } from "@/lib/cn";

const FALLBACKS = [
  "bg-[repeating-linear-gradient(135deg,#8e2436_0_7px,#c7606c_7px_11px)]",
  "bg-[radial-gradient(circle_at_35%_40%,#f0d3cb_0_30%,#6b1424_31%)]",
  "bg-[linear-gradient(#eadbc6_0_50%,#3e0a14_50%)]",
  "bg-[radial-gradient(circle,#3e0a14_0_22%,#eadbc6_23%_32%,#3e0a14_33%)]",
];

type Props = {
  src?: string | null;
  alt: string;
  seed: number;
  className?: string;
};

/** Album cover from Discogs, or a printed-pattern placeholder when there's none. */
export function Cover({ src, alt, seed, className }: Props) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("aspect-square rounded-xl", FALLBACKS[seed % FALLBACKS.length], className)}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote Discogs covers, no optimizer needed
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("aspect-square rounded-xl bg-sand object-cover", className)}
    />
  );
}
