import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="font-data mt-6 flex items-center justify-between text-xs text-ink-muted">
      <span>
        {total} total · page {page} / {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: page <= 1 ? "pointer-events-none opacity-40" : "",
          })}
        >
          Prev
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className:
              page >= totalPages ? "pointer-events-none opacity-40" : "",
          })}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
