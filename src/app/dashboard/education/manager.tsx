"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEducationAction,
  deleteEducationAction,
  moveEducationAction,
  updateEducationAction,
} from "@/modules/content/actions";
import { EducationImageControl } from "./image-control";

export type EducationItem = {
  id: string;
  institution: string;
  degree: string | null;
  gpa: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  imageUrl: string | null;
};

type FormState = {
  institution: string;
  degree: string;
  gpa: string;
  startDate: string;
  endDate: string;
  notes: string;
};

const EMPTY: FormState = {
  institution: "",
  degree: "",
  gpa: "",
  startDate: "",
  endDate: "",
  notes: "",
};

function toForm(item: EducationItem): FormState {
  return {
    institution: item.institution,
    degree: item.degree ?? "",
    gpa: item.gpa ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    notes: item.notes ?? "",
  };
}

function EducationForm({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial: FormState;
  onDone: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const prefix = id ?? "new";

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <Label htmlFor={`institution-${prefix}`}>Institution</Label>
          <Input
            id={`institution-${prefix}`}
            className="mt-1"
            value={form.institution}
            onChange={(e) => set("institution", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`degree-${prefix}`}>Degree / program</Label>
            <Input
              id={`degree-${prefix}`}
              className="mt-1"
              value={form.degree}
              onChange={(e) => set("degree", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`gpa-${prefix}`}>GPA</Label>
            <Input
              id={`gpa-${prefix}`}
              className="mt-1"
              value={form.gpa}
              onChange={(e) => set("gpa", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`start-${prefix}`}>Start date</Label>
            <Input
              id={`start-${prefix}`}
              type="date"
              className="mt-1"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`end-${prefix}`}>
              End date (kosong = sekarang)
            </Label>
            <Input
              id={`end-${prefix}`}
              type="date"
              className="mt-1"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor={`notes-${prefix}`}>Notes</Label>
          <Textarea
            id={`notes-${prefix}`}
            rows={3}
            className="mt-1"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const res = id
                  ? await updateEducationAction({ id, ...form })
                  : await createEducationAction(form);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                router.refresh();
                onDone();
              })
            }
          >
            {pending ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" disabled={pending} onClick={onDone}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function EducationManager({ items }: { items: EducationItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | "new"
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      setError(null);
      const res = await moveEducationAction(id, direction);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Hapus data pendidikan ini?")) return;
    startTransition(async () => {
      setError(null);
      const res = await deleteEducationAction(id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {editing === "new" ? (
        <EducationForm initial={EMPTY} onDone={() => setEditing(null)} />
      ) : (
        <Button onClick={() => setEditing("new")}>Add education</Button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {items.map((item, i) =>
        editing === item.id ? (
          <EducationForm
            key={item.id}
            id={item.id}
            initial={toForm(item)}
            onDone={() => setEditing(null)}
          />
        ) : (
          <Card
            key={item.id}
            className="flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{item.degree ?? item.institution}</p>
              <p className="text-sm text-ink-muted">{item.institution}</p>
              <p className="font-data mt-1 text-xs text-ink-muted">
                {item.startDate ?? "?"} — {item.endDate ?? "now"}
                {item.gpa ? ` · GPA ${item.gpa}` : ""}
              </p>
              <div className="mt-3">
                <EducationImageControl
                  id={item.id}
                  name={item.institution}
                  imageUrl={item.imageUrl}
                />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={pending || i === 0}
                onClick={() => move(item.id, "up")}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending || i === items.length - 1}
                onClick={() => move(item.id, "down")}
              >
                ↓
              </Button>
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
                onClick={() => remove(item.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ),
      )}
      {items.length === 0 && (
        <p className="text-sm text-ink-muted">Belum ada data pendidikan.</p>
      )}
    </div>
  );
}
