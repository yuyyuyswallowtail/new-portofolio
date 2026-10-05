"use client";

import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { setEducationImageAction } from "@/modules/content/education-image-actions";

// Sisi terpanjang gambar setelah diperkecil di browser (px).
const MAX_SIDE = 640;

/** Perkecil gambar ke maksimal MAX_SIDE px. PNG tetap PNG, selain itu JPEG. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const isPng = file.type === "image/png";
  const type = isPng ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, 0.85),
  );
  if (!blob) throw new Error("Gagal memproses gambar");
  return new File([blob], isPng ? "education.png" : "education.jpg", { type });
}

export function EducationImageControl({
  id,
  name,
  imageUrl,
}: {
  id: string;
  name: string;
  imageUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(imageUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: string | null) {
    const res = await setEducationImageAction(id, next);
    if (!res.ok) throw new Error(res.error);
    setUrl(next);
  }

  async function onSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const small = await shrink(file);
      const formData = new FormData();
      formData.append("file", small);
      formData.append("folder", "education");
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upload gagal");
      await persist(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    setError(null);
    try {
      await persist(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
        {url ? (
          // biome-ignore lint/performance/noImgElement: thumbnail kecil, optimasi next/image tidak perlu
          <img
            src={url}
            alt={`${name} gambar`}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon size={16} className="text-ink-muted" />
        )}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="font-data text-xs text-accent hover:underline disabled:opacity-50"
      >
        {busy ? "memproses..." : url ? "ganti gambar" : "upload gambar"}
      </button>
      {url && !busy && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus gambar ${name}`}
          className="text-ink-muted hover:text-danger"
        >
          <X size={12} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onSelected}
      />
      {error && <span className="font-data text-xs text-danger">{error}</span>}
    </div>
  );
}
