"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createArticleAction,
  generateArticleAction,
} from "@/modules/articles/actions";

export function NewArticleForm({ mode }: { mode: "ai" | "manual" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [withImage, setWithImage] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  if (mode === "ai") {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-sm text-ink-muted">
          Menulis artikel otomatis (AI/web dev/networking) pakai Gemini 2.5
          Flash, plus cover image dari Gemini 2.5 Flash Image ("Nano Banana")
          kalau dicentang. Hasilnya selalu jadi{" "}
          <span className="font-data">draft</span> — kamu yang publish manual.
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
          Generate cover image (Nano Banana)
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
              router.push("/dashboard/articles");
            })
          }
        >
          {pending ? "Generating... (bisa 10-30 detik)" : "Generate article"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          className="mt-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="tags">Tags (pisah koma)</Label>
        <Input
          id="tags"
          className="mt-1"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="content">Content (Markdown)</Label>
        <Textarea
          id="content"
          rows={16}
          className="mt-1 font-data"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await createArticleAction({
              title,
              contentMd: content,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            router.push("/dashboard/articles");
          })
        }
      >
        {pending ? "Saving..." : "Save as draft"}
      </Button>
    </div>
  );
}
