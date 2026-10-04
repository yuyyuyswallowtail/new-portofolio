"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateArticleAction } from "@/modules/articles/actions";
import { ArticleEditorForm } from "../editor-form";

export function NewArticleForm({
  mode,
  textModel,
  imageModel,
}: {
  mode: "ai" | "manual";
  textModel: string;
  imageModel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [withImage, setWithImage] = useState(true);

  if (mode === "ai") {
    return (
      <div className="mt-6 max-w-xl space-y-4">
        <p className="text-sm text-ink-muted">
          Menulis artikel otomatis (AI/web dev/networking) pakai{" "}
          <span className="font-data">{textModel}</span>, plus cover image dari{" "}
          <span className="font-data">{imageModel}</span> kalau dicentang.
          Hasilnya selalu jadi <span className="font-data">draft</span> — kamu
          akan diarahkan ke editor buat review/edit sebelum publish.
        </p>
        <div>
          <Label htmlFor="topic">
            Topik (opsional — kosongkan untuk acak AI/web dev/networking)
          </Label>
          <Input
            id="topic"
            className="mt-1"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="mis. optimizing llama.cpp for constrained hardware"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={withImage}
            onChange={(e) => setWithImage(e.target.checked)}
          />
          Generate cover image ({imageModel})
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const res = await generateArticleAction({
                topic: topic || undefined,
                withImage,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.push(`/dashboard/articles/${res.data.id}/edit`);
            })
          }
        >
          {pending ? "Generating... (bisa 10-30 detik)" : "Generate article"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <ArticleEditorForm
        mode="create"
        initial={{
          title: "",
          excerpt: "",
          contentMd: "",
          tags: [],
          coverImageUrl: undefined,
        }}
      />
    </div>
  );
}
