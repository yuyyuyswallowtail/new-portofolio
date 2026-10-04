"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CoverImageField } from "@/components/dashboard/cover-image-field";
import { RichEditor } from "@/components/dashboard/rich-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createArticleAction,
  deleteArticleAction,
  publishArticleAction,
  regenerateArticleAction,
  updateArticleAction,
} from "@/modules/articles/actions";

type Initial = {
  id?: string;
  title: string;
  excerpt: string;
  contentMd: string;
  tags: string[];
  coverImageUrl?: string;
  status?: "draft" | "published";
  aiGenerated?: boolean;
};

export function ArticleEditorForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    initial.coverImageUrl,
  );
  const [content, setContent] = useState(initial.contentMd);

  const [showRegenerate, setShowRegenerate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [regenerating, startRegenerate] = useTransition();

  function save() {
    startTransition(async () => {
      setError(null);
      const payload = {
        title,
        excerpt: excerpt || undefined,
        contentMd: content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        coverImageUrl,
      };
      const res =
        mode === "create"
          ? await createArticleAction(payload)
          : await updateArticleAction({ id: initial.id, ...payload });

      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (mode === "create") {
        router.push(`/dashboard/articles/${res.data.id}/edit`);
      } else {
        setMessage("Tersimpan.");
        router.refresh();
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            className="mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        {initial.status && (
          <Badge tone={initial.status === "published" ? "accent" : "warn"}>
            {initial.status}
          </Badge>
        )}
        {initial.aiGenerated && <Badge>ai-generated</Badge>}
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Input
          id="excerpt"
          className="mt-1"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
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

      <CoverImageField value={coverImageUrl} onChange={setCoverImageUrl} />

      <div>
        <Label>Content</Label>
        <div className="mt-1">
          <RichEditor content={content} onChange={setContent} />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending} onClick={save}>
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Save as draft"
              : "Save changes"}
        </Button>

        {mode === "edit" && initial.status === "draft" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!initial.id) return;
                const res = await publishArticleAction(initial.id);
                if (res.ok) router.push("/dashboard/articles");
                else setError(res.error);
              })
            }
          >
            Publish
          </Button>
        )}

        {mode === "edit" && initial.aiGenerated && (
          <Button
            variant="outline"
            onClick={() => setShowRegenerate((v) => !v)}
          >
            Regenerate with AI
          </Button>
        )}

        {mode === "edit" && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (!initial.id || !confirm("Hapus artikel ini?")) return;
              startTransition(async () => {
                if (!initial.id) return;
                const res = await deleteArticleAction(initial.id);
                if (res.ok) router.push("/dashboard/articles");
              });
            }}
          >
            Delete
          </Button>
        )}
      </div>

      {showRegenerate && (
        <div className="rounded-[6px] border border-line bg-surface p-4">
          <Label htmlFor="feedback">Apa yang perlu diperbaiki?</Label>
          <Textarea
            id="feedback"
            rows={3}
            className="mt-1"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="mis. terlalu teknis buat pemula, tambahkan contoh kode, perpendek jadi 600 kata..."
          />
          <Button
            className="mt-3"
            disabled={regenerating || feedback.trim().length < 3}
            onClick={() =>
              startRegenerate(async () => {
                if (!initial.id) return;
                setError(null);
                const res = await regenerateArticleAction({
                  id: initial.id,
                  feedback,
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                // Tiptap only reads `content` at mount — a plain state update
                // wouldn't refresh the editor's actual text, so reload for real.
                window.location.reload();
              })
            }
          >
            {regenerating ? "Regenerating... (bisa 10-30 detik)" : "Regenerate"}
          </Button>
          <p className="mt-2 text-xs text-ink-muted">
            Hasil regenerate langsung menimpa draft ini
            (title/excerpt/tags/content).
          </p>
        </div>
      )}
    </div>
  );
}
