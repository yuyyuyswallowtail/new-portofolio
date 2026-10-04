import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/**
 * Editorial-grid section marker: a large index number + title, per
 * DESIGN_SYSTEM.md's "numbered section" convention. index is zero-padded
 * (01, 02, ...) and rendered in the data/mono face.
 */
export function SectionHeading({
  index,
  title,
  className,
}: {
  index: number;
  title: string;
  className?: string;
}) {
  return (
    <Reveal
      className={cn("mb-10 flex items-baseline gap-4 md:mb-14", className)}
    >
      <span className="font-data text-sm text-accent">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
        {title}
      </h2>
      <span className="h-px flex-1 bg-line" />
    </Reveal>
  );
}
