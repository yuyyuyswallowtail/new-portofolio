import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { ArticleCover } from "./article-cover";
import { blockClass } from "./blocks";

type ArticleLike = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  tags: string[];
  aiGenerated: boolean;
};

export function ArticleCard({ a, index }: { a: ArticleLike; index: number }) {
  return (
    <Link href={`/articles/${a.slug}`} className="group block">
      <div className="overflow-hidden rounded-[24px]">
        {a.coverImageUrl ? (
          <ArticleCover
            src={a.coverImageUrl}
            alt={a.title}
            className="w-full rounded-none border-0 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={cn(
              "grid aspect-video place-items-center text-on-block",
              blockClass(index),
            )}
          >
            <span className="text-7xl font-extrabold tracking-tighter">
              {a.title.slice(0, 1)}
            </span>
          </div>
        )}
      </div>
      <div className="font-data mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <span>{formatDate(a.publishedAt)}</span>
        {a.aiGenerated && <span className="chip">ai-generated</span>}
        {a.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight group-hover:underline md:text-2xl">
        {a.title}
      </h3>
      {a.excerpt && (
        <p className="mt-2 line-clamp-2 text-ink-muted">{a.excerpt}</p>
      )}
    </Link>
  );
}
