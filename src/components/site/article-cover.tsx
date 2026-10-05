import { cn } from "@/lib/utils";

export function ArticleCover({
  src,
  alt = "",
  className = "",
}: {
  src?: string | null;
  alt?: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // biome-ignore lint/performance/noImgElement: cover bisa berupa upload lokal, optimasi next/image tidak penting di sini
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "aspect-video rounded-[6px] border border-line object-cover",
        className,
      )}
    />
  );
}
