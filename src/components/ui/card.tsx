import type * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[6px] border border-line bg-surface p-5 transition-colors hover:border-accent",
        className,
      )}
      {...props}
    />
  );
}
