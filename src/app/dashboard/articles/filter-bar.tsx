"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/use-debounce";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [tag, setTag] = useState(searchParams.get("tag") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  const debouncedQ = useDebounce(q, 350);
  const debouncedTag = useDebounce(tag, 350);
  const isFirstRun = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: router/pathname/searchParams are stable per navigation, re-running on them would loop
  useEffect(() => {
    // Skip on mount — otherwise a direct link to ?page=2 gets its page reset
    // to 1 the instant this component mounts, before the user touches anything.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQ) params.set("q", debouncedQ);
    else params.delete("q");
    if (debouncedTag) params.set("tag", debouncedTag);
    else params.delete("tag");
    if (status) params.set("status", status);
    else params.delete("status");
    params.set("page", "1"); // an actual filter change resets pagination
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }, [debouncedQ, debouncedTag, status]);

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Input
        placeholder="Search title/excerpt..."
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
      <select
        className="h-10 rounded-[6px] border border-line bg-surface px-3 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All status</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>
  );
}
