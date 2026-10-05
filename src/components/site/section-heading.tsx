import { cn } from "@/lib/utils";
import { RevealText } from "./motion";
import { Reveal } from "./reveal";

/**
 * Penanda section: label mono bernomor ("02 / ABOUT") muncul dulu, lalu judul
 * besar naik kata demi kata dari balik mask.
 */
export function SectionHeading({
  index,
  title,
  kicker,
  className,
}: {
  index: number;
  title: string;
  kicker?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 md:mb-14", className)}>
      <Reveal>
        <p className="kicker">
          {String(index).padStart(2, "0")} / {kicker ?? title}
        </p>
      </Reveal>
      <h2 className="display-lg mt-3">
        <RevealText text={title} delay={0.1} />
      </h2>
    </div>
  );
}
