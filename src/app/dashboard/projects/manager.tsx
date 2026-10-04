"use client";

import { useState } from "react";
import {
  ContentManager,
  Field,
  FormShell,
  useSubmit,
} from "@/components/dashboard/content-manager";
import { CoverImageField } from "@/components/dashboard/cover-image-field";
import { ArticleCover } from "@/components/site/article-cover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createProjectAction,
  deleteProjectAction,
  moveProjectAction,
  updateProjectAction,
} from "@/modules/content/actions";

export type ProjectItem = {
  id: string;
  title: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  source: "manual" | "github";
  featured: boolean;
};

type FormState = {
  title: string;
  description: string;
  repoUrl: string;
  liveUrl: string;
  imageUrl: string;
  featured: boolean;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  repoUrl: "",
  liveUrl: "",
  imageUrl: "",
  featured: false,
};

function toForm(item: ProjectItem): FormState {
  return {
    title: item.title,
    description: item.description ?? "",
    repoUrl: item.repoUrl ?? "",
    liveUrl: item.liveUrl ?? "",
    imageUrl: item.imageUrl ?? "",
    featured: item.featured,
  };
}

function ProjectForm({
  item,
  onDone,
}: {
  item: ProjectItem | null;
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>(item ? toForm(item) : EMPTY);
  const { pending, error, submit } = useSubmit(onDone);
  const p = item?.id ?? "new";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <FormShell
      pending={pending}
      error={error}
      onCancel={onDone}
      onSave={() =>
        submit(() =>
          item
            ? updateProjectAction({ id: item.id, ...form })
            : createProjectAction(form),
        )
      }
    >
      <Field label="Title" htmlFor={`title-${p}`}>
        <Input
          id={`title-${p}`}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </Field>
      <Field label="Description" htmlFor={`desc-${p}`}>
        <Textarea
          id={`desc-${p}`}
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Repo URL" htmlFor={`repo-${p}`}>
          <Input
            id={`repo-${p}`}
            value={form.repoUrl}
            onChange={(e) => set("repoUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
        </Field>
        <Field label="Live URL" htmlFor={`live-${p}`}>
          <Input
            id={`live-${p}`}
            value={form.liveUrl}
            onChange={(e) => set("liveUrl", e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>
      <CoverImageField
        label="Project image"
        value={form.imageUrl || undefined}
        onChange={(url) => set("imageUrl", url ?? "")}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)}
        />
        Featured
      </label>
    </FormShell>
  );
}

export function ProjectManager({ items }: { items: ProjectItem[] }) {
  return (
    <ContentManager
      items={items}
      addLabel="Add project"
      emptyText="Belum ada project."
      confirmText="Hapus project ini?"
      onDelete={deleteProjectAction}
      onMove={moveProjectAction}
      renderForm={({ item, onDone }) => (
        <ProjectForm item={item} onDone={onDone} />
      )}
      renderItem={(item) => (
        <div className="flex items-start gap-4">
          <ArticleCover src={item.imageUrl} className="w-28 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{item.title}</p>
              <Badge tone={item.source === "github" ? "accent" : "default"}>
                {item.source}
              </Badge>
              {item.featured && <Badge tone="accent">featured</Badge>}
            </div>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {item.description}
              </p>
            )}
            <p className="font-data mt-1 text-xs text-accent">
              {item.repoUrl && "repo ↗ "}
              {item.liveUrl && "live ↗"}
            </p>
          </div>
        </div>
      )}
    />
  );
}
