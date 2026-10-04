"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/use-debounce";

export function PublicFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const debouncedQ = useDebounce(q, 350);
  const debouncedTag = useDebounce(tag, 350);
  const isFirstRun = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: router/pathname/searchParams are stable per navigation
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    if (debouncedTag) params.set("tag", debouncedTag);
    else params.delete("tag");
    params.set("page", "1");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }, [debouncedQ, debouncedTag]);

  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <Input
        placeholder="Search articles..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
      />
      <Input
        placeholder="Filter by tag..."
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="max-w-[180px]"
      />
    </div>
  );
}
