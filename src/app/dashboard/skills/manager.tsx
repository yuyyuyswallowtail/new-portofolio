"use client";

import { useState } from "react";
import {
  ContentManager,
  Field,
  FormShell,
  useSubmit,
} from "@/components/dashboard/content-manager";
import { Input } from "@/components/ui/input";
import {
  createSkillAction,
  deleteSkillAction,
  moveSkillAction,
  updateSkillAction,
} from "@/modules/content/actions";
import { SkillLogoControl } from "./logo-control";

export type SkillItem = {
  id: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
};

type FormState = { name: string; category: string };

function SkillForm({
  item,
  categories,
  onDone,
}: {
  item: SkillItem | null;
  categories: string[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: item?.name ?? "",
    category: item?.category ?? "",
  });
  const { pending, error, submit } = useSubmit(onDone);
  const p = item?.id ?? "new";

  return (
    <FormShell
      pending={pending}
      error={error}
      onCancel={onDone}
      onSave={() =>
        submit(() =>
          item
            ? updateSkillAction({ id: item.id, ...form })
            : createSkillAction(form),
        )
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Skill" htmlFor={`name-${p}`}>
          <Input
            id={`name-${p}`}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Category" htmlFor={`category-${p}`}>
          <Input
            id={`category-${p}`}
            list={`skill-categories-${p}`}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <datalist id={`skill-categories-${p}`}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
    </FormShell>
  );
}

export function SkillManager({ items }: { items: SkillItem[] }) {
  const categories = Array.from(
    new Set(items.map((i) => i.category).filter((c): c is string => !!c)),
  );

  return (
    <ContentManager
      items={items}
      addLabel="Add skill"
      emptyText="Belum ada skill."
      confirmText="Hapus skill ini?"
      onDelete={deleteSkillAction}
      onMove={moveSkillAction}
      renderForm={({ item, onDone }) => (
        <SkillForm item={item} categories={categories} onDone={onDone} />
      )}
      renderItem={(item) => (
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-medium">{item.name}</p>
          <span className="font-data text-xs text-ink-muted">
            {item.category ?? "Other"}
          </span>
          <SkillLogoControl
            id={item.id}
            name={item.name}
            logoUrl={item.logoUrl}
          />
        </div>
      )}
    />
  );
}
