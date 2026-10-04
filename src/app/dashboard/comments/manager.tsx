"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import {
  deleteCommentsAction,
  moderateCommentsAction,
  updateCommentBodyAction,
} from "@/modules/comments/actions";

type Status = "pending" | "approved" | "rejected" | "spam";

export type ModerationItem = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: Status;
  flagReason: string | null;
  createdAt: Date;
  articleTitle: string;
  articleSlug: string;
};

type Result = { ok: boolean; error?: string };

const TONE = {
  pending: "warn",
  approved: "accent",
  rejected: "default",
  spam: "default",
} as const;

export function CommentsManager({ items }: { items: ModerationItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<Result>) {
    startTransition(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Gagal.");
        return;
      }
      setSelected(new Set());
      setEditing(null);
      router.refresh();
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = items.length > 0 && selected.size === items.length;
  const ids = (one?: string) => (one ? [one] : Array.from(selected));
  const setStatus = (status: Status, one?: string) =>
    run(() => moderateCommentsAction(ids(one), status));
  const remove = (one?: string) => {
    const n = ids(one).length;
    if (confirm(`Hapus ${n} komentar?`)) {
      run(() => deleteCommentsAction(ids(one)));
    }
  };

  return (
    <div className="mt-6 space-y-3">
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(
                  allSelected ? new Set() : new Set(items.map((i) => i.id)),
                )
              }
            />
            Pilih semua di halaman ini
          </label>
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-data text-xs text-ink-muted">
                {selected.size} dipilih
              </span>
              <Button
                size="sm"
                disabled={pending}
                onClick={() => setStatus("approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setStatus("rejected")}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setStatus("spam")}
              >
                Spam
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => remove()}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {items.map((c) => (
        <Card key={c.id} className="flex gap-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={selected.has(c.id)}
            onChange={() => toggle(c.id)}
            aria-label={`Pilih komentar dari ${c.authorName}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{c.authorName}</p>
              {c.authorEmail && (
                <span className="font-data text-xs text-ink-muted">
                  {c.authorEmail}
                </span>
              )}
              <Badge tone={TONE[c.status]}>{c.status}</Badge>
              <span className="font-data text-xs text-ink-muted">
                {formatDate(c.createdAt)}
              </span>
            </div>
            <p className="font-data mt-1 text-xs text-ink-muted">
              pada{" "}
              <a
                href={`/articles/${c.articleSlug}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {c.articleTitle}
              </a>
            </p>
            {c.flagReason && (
              <p className="font-data mt-1 text-xs text-warn">
                flag: {c.flagReason}
              </p>
            )}

            {editing === c.id ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() =>
                        updateCommentBodyAction({ id: c.id, body: draft }),
                      )
                    }
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                {c.body}
              </p>
            )}

            {editing !== c.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status !== "approved" && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => setStatus("approved", c.id)}
                  >
                    Approve
                  </Button>
                )}
                {c.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setStatus("rejected", c.id)}
                  >
                    Reject
                  </Button>
                )}
                {c.status !== "spam" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setStatus("spam", c.id)}
                  >
                    Spam
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    setEditing(c.id);
                    setDraft(c.body);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => remove(c.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-ink-muted">Tidak ada komentar di tab ini.</p>
      )}
    </div>
  );
}
