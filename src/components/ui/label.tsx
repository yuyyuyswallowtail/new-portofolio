import type * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: htmlFor/children are passed through {...props} at call sites
    <label
      className={cn("text-sm font-medium text-ink", className)}
      {...props}
    />
  );
}
