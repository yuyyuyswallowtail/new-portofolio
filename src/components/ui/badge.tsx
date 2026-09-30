import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "accent" | "warn";
}) {
  const dot =
    tone === "accent"
      ? "bg-accent"
      : tone === "warn"
        ? "bg-warn"
        : "bg-ink-muted";
  return (
    <span
      className={cn(
        "font-data inline-flex items-center gap-1.5 text-xs text-ink-muted",
        className,
      )}
      {...props}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {props.children}
    </span>
  );
}
