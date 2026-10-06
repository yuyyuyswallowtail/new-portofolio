import { cn } from "@/lib/utils";

type MarqueeProps = {
  items: string[];
  /** Derajat. Negatif = sisi kanan naik (menukik ke atas dari kiri ke kanan). */
  tilt?: number;
  reverse?: boolean;
  slow?: boolean;
  /** Letakkan absolut di belakang elemen induk (induk harus `relative`). */
  behind?: boolean;
  size?: "md" | "lg";
};

export function Marquee({
  items,
  tilt = -3,
  reverse = false,
  slow = false,
  behind = false,
  size = "lg",
}: MarqueeProps) {
  if (items.length === 0) return null;
  const repeats = Math.max(1, Math.ceil(12 / items.length));
  const row = Array.from({ length: repeats }, () => items)
    .flat()
    .map((name, i) => ({ id: `${i}-${name}`, name }));

  const band = (
    <div
      className={cn(
        "marquee overflow-hidden border-y-2 border-on-block bg-block-yellow text-on-block shadow-[0_20px_40px_-18px_rgb(0_0_0_/_0.55),0_8px_40px_-18px_var(--block-yellow)]",
        size === "lg" ? "py-4 md:py-5" : "py-2.5 md:py-3",
        behind ? "w-full" : "-mx-[12%] w-[124%]",
      )}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className={cn(
          "marquee-track",
          reverse && "is-reverse",
          slow && "is-slow",
        )}
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {row.map((item) => (
              <li
                key={`${copy}-${item.id}`}
                className={cn(
                  "flex items-center whitespace-nowrap font-semibold tracking-tight",
                  size === "lg" ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl",
                )}
              >
                <span className="px-6 md:px-10">{item.name}</span>
                <span>✦</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );

  if (behind) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[140vw] -translate-x-1/2 -translate-y-1/2"
      >
        {band}
      </div>
    );
  }

  // Padding vertikal menyediakan ruang untuk ujung pita yang miring.
  return (
    <div aria-hidden="true" className="relative z-10 pb-16 pt-9 [overflow-x:clip] md:pb-[4.5rem] md:pt-12">
      {band}
    </div>
  );
}
