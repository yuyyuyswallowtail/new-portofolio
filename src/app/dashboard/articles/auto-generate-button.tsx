"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runAutoGenerateAction } from "@/modules/articles/actions";

export function AutoGenerateButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const res = await runAutoGenerateAction(false);
            setMessage(
              res.ok
                ? `Generated from trend: "${res.data.topic}" (draft)`
                : res.error,
            );
            if (res.ok) router.refresh();
          })
        }
      >
        {pending ? "Running..." : "Run auto-generate now"}
      </Button>
      {message && <span className="text-xs text-ink-muted">{message}</span>}
    </div>
  );
}
