"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteArticleAction,
  publishArticleAction,
} from "@/modules/articles/actions";

export function PublishButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await publishArticleAction(id);
          router.refresh();
        })
      }
    >
      {pending ? "Publishing..." : "Publish"}
    </Button>
  );
}

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm("Hapus artikel ini?")) return;
          await deleteArticleAction(id);
          router.refresh();
        })
      }
    >
      Delete
    </Button>
  );
}
