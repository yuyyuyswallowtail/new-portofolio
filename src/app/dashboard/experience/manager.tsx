"use client";

import { useState } from "react";
import {
  ContentManager,
  Field,
  FormShell,
  selectClass,
  useSubmit,
} from "@/components/dashboard/content-manager";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createExperienceAction,
  deleteExperienceAction,
  updateExperienceAction,
} from "@/modules/content/actions";

export type ExperienceItem = {
  id: string;
  title: string;
  organization: string;
  type: "work" | "training";
  startDate: string | null;
  endDate: string | null;
  description: string | null;
};

type FormState = {
  title: string;
  organization: string;
  type: "work" | "training";
  startDate: string;
  endDate: string;
  description: string;
};

const EMPTY: FormState = {
  title: "",
  organization: "",
  type: "work",
  startDate: "",
  endDate: "",
  description: "",
};

function toForm(item: ExperienceItem): FormState {
  return {
    title: item.title,
    organization: item.organization,
    type: item.type,
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    description: item.description ?? "",
  };
}

function ExperienceForm({
  item,
  onDone,
}: {
  item: ExperienceItem | null;
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
            ? updateExperienceAction({ id: item.id, ...form })
            : createExperienceAction(form),
        )
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title / role" htmlFor={`title-${p}`}>
          <Input
            id={`title-${p}`}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Organization" htmlFor={`org-${p}`}>
          <Input
            id={`org-${p}`}
            value={form.organization}
            onChange={(e) => set("organization", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Type" htmlFor={`type-${p}`}>
          <select
            id={`type-${p}`}
            className={selectClass}
            value={form.type}
            onChange={(e) => set("type", e.target.value as FormState["type"])}
          >
            <option value="work">Work</option>
            <option value="training">Training</option>
          </select>
        </Field>
        <Field label="Start date" htmlFor={`start-${p}`}>
          <Input
            id={`start-${p}`}
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Field>
        <Field label="End date (kosong = sekarang)" htmlFor={`end-${p}`}>
          <Input
            id={`end-${p}`}
            type="date"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Description" htmlFor={`desc-${p}`}>
        <Textarea
          id={`desc-${p}`}
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>
    </FormShell>
  );
}

export function ExperienceManager({ items }: { items: ExperienceItem[] }) {
  return (
    <ContentManager
      items={items}
      addLabel="Add experience"
      emptyText="Belum ada experience."
      confirmText="Hapus experience ini?"
      onDelete={deleteExperienceAction}
      renderForm={({ item, onDone }) => (
        <ExperienceForm item={item} onDone={onDone} />
      )}
      renderItem={(item) => (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title}</p>
            <Badge tone={item.type === "work" ? "accent" : "default"}>
              {item.type}
            </Badge>
          </div>
          <p className="text-sm text-accent">{item.organization}</p>
          <p className="font-data mt-1 text-xs text-ink-muted">
            {item.startDate ?? "?"} — {item.endDate ?? "now"}
          </p>
        </>
      )}
    />
  );
}
