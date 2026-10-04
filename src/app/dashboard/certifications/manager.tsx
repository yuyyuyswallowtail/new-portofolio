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
import { Input } from "@/components/ui/input";
import {
  createCertificationAction,
  deleteCertificationAction,
  moveCertificationAction,
  updateCertificationAction,
} from "@/modules/content/actions";

export type CertificationItem = {
  id: string;
  title: string;
  issuer: string;
  imageUrl: string | null;
  verifyUrl: string | null;
  issuedAt: string | null;
};

type FormState = {
  title: string;
  issuer: string;
  issuedAt: string;
  verifyUrl: string;
  imageUrl: string;
};

const EMPTY: FormState = {
  title: "",
  issuer: "",
  issuedAt: "",
  verifyUrl: "",
  imageUrl: "",
};

function toForm(item: CertificationItem): FormState {
  return {
    title: item.title,
    issuer: item.issuer,
    issuedAt: item.issuedAt ?? "",
    verifyUrl: item.verifyUrl ?? "",
    imageUrl: item.imageUrl ?? "",
  };
}

function CertificationForm({
  item,
  onDone,
}: {
  item: CertificationItem | null;
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
            ? updateCertificationAction({ id: item.id, ...form })
            : createCertificationAction(form),
        )
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title" htmlFor={`title-${p}`}>
          <Input
            id={`title-${p}`}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
        <Field label="Issuer" htmlFor={`issuer-${p}`}>
          <Input
            id={`issuer-${p}`}
            value={form.issuer}
            onChange={(e) => set("issuer", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Issued at" htmlFor={`issued-${p}`}>
          <Input
            id={`issued-${p}`}
            type="date"
            value={form.issuedAt}
            onChange={(e) => set("issuedAt", e.target.value)}
          />
        </Field>
        <Field label="Verify URL" htmlFor={`verify-${p}`}>
          <Input
            id={`verify-${p}`}
            value={form.verifyUrl}
            onChange={(e) => set("verifyUrl", e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </div>
      <CoverImageField
        label="Certificate image"
        value={form.imageUrl || undefined}
        onChange={(url) => set("imageUrl", url ?? "")}
      />
    </FormShell>
  );
}

export function CertificationManager({
  items,
}: {
  items: CertificationItem[];
}) {
  return (
    <ContentManager
      items={items}
      addLabel="Add certification"
      emptyText="Belum ada sertifikat."
      confirmText="Hapus sertifikat ini?"
      onDelete={deleteCertificationAction}
      onMove={moveCertificationAction}
      renderForm={({ item, onDone }) => (
        <CertificationForm item={item} onDone={onDone} />
      )}
      renderItem={(item) => (
        <div className="flex items-start gap-4">
          <ArticleCover src={item.imageUrl} className="w-28 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-ink-muted">{item.issuer}</p>
            <p className="font-data mt-1 text-xs text-ink-muted">
              {item.issuedAt ?? "—"}
            </p>
          </div>
        </div>
      )}
    />
  );
}
