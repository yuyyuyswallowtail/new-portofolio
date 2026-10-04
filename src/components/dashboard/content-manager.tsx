"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Result = { ok: boolean; error?: string };

export const selectClass =
  "w-full rounded-[6px] border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

/** Jalankan aksi simpan: tampilkan error, refresh data, lalu tutup form. */
export function useSubmit(onDone: () => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(run: () => Promise<Result>) {
    startTransition(async () => {
      setError(null);
      const res = await run();
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.refresh();
      onDone();
    });
  }
  return { pending, error, submit };
}

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function FormShell({
  pending,
  error,
  onSave,
  onCancel,
  children,
}: {
  pending: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="space-y-4">
        {children}
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button disabled={pending} onClick={onSave}>
            {pending ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ContentManager<T extends { id: string }>({
  items,
  addLabel,
  emptyText,
  confirmText,
  renderItem,
  renderForm,
  onMove,
  onDelete,
}: {
  items: T[];
  addLabel: string;
  emptyText: string;
  confirmText: string;
  renderItem: (item: T) => ReactNode;
  renderForm: (args: { item: T | null; onDone: () => void }) => ReactNode;
  onMove?: (id: string, direction: "up" | "down") => Promise<Result>;
  onDelete: (id: string) => Promise<Result>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | "new"
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const close = () => setEditing(null);

  function run(action: () => Promise<Result>) {
    startTransition(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Gagal.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {editing === "new" ? (
        renderForm({ item: null, onDone: close })
      ) : (
        <Button onClick={() => setEditing("new")}>{addLabel}</Button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {items.map((item, i) =>
        editing === item.id ? (
          <div key={item.id}>{renderForm({ item, onDone: close })}</div>
        ) : (
          <Card
            key={item.id}
            className="flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
            <div className="flex shrink-0 gap-2">
              {onMove && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || i === 0}
                    onClick={() => run(() => onMove(item.id, "up"))}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || i === items.length - 1}
                    onClick={() => run(() => onMove(item.id, "down"))}
                  >
                    ↓
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => setEditing(item.id)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  if (confirm(confirmText)) run(() => onDelete(item.id));
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ),
      )}
      {items.length === 0 && (
        <p className="text-sm text-ink-muted">{emptyText}</p>
      )}
    </div>
  );
}
