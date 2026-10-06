"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import {
  createCommentAction,
  deleteCommentAction,
} from "@/modules/comments/actions";

type CommentRow = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

export function CommentsSection({
  articleId,
  articleSlug,
  comments,
  canModerate,
}: {
  articleId: string;
  articleSlug: string;
  comments: CommentRow[];
  canModerate: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"live" | "held" | null>(null);

  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>

      <div className="mt-6 space-y-6">
        {comments.map((c) => (
          <div key={c.id} className="border-b border-line pb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{c.authorName}</p>
              <div className="flex items-center gap-3">
                <span className="font-data text-xs text-ink-muted">
                  {formatDate(c.createdAt)}
                </span>
                {canModerate && (
                  <button
                    type="button"
                    className="text-xs text-danger hover:underline"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCommentAction(c.id, articleSlug);
                        router.refresh();
                      })
                    }
                  >
                    delete
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">
              {c.body}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-ink-muted">
            Belum ada komentar — jadi yang pertama.
          </p>
        )}
      </div>

      <div className="mt-8">
        {sent ? (
          <p className="text-sm text-accent">
            {sent === "held"
              ? "Komentar terkirim dan akan tampil setelah dimoderasi."
              : "Komentar terkirim."}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-name">Name</Label>
                <Input
                  id="c-name"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-email">
                  Email (opsional, tidak ditampilkan)
                </Label>
                <Input
                  id="c-email"
                  type="email"
                  className="mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="c-body">Comment</Label>
              <Textarea
                id="c-body"
                rows={3}
                className="mt-1"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            {/* Honeypot: di luar layar, tidak bisa difokus; bot cenderung mengisi semua input. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button
              variant="yellow"
              disabled={pending || !name.trim() || body.trim().length < 2}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await createCommentAction(
                    {
                      articleId,
                      authorName: name,
                      authorEmail: email,
                      body,
                      website,
                    },
                    articleSlug,
                  );
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setSent(res.data.held ? "held" : "live");
                  router.refresh();
                })
              }
            >
              {pending ? "Sending..." : "Post comment"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
