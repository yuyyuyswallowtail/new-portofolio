"use client";

import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { setSkillLogoAction } from "@/modules/content/skill-logo-actions";

// Sisi terpanjang logo setelah diperkecil di browser (px).
const MAX_SIDE = 128;

/** Perkecil gambar ke maksimal MAX_SIDE px dan simpan sebagai PNG (transparansi tetap). */
async function shrinkToPng(file: File): Promise<File> {
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
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Gagal memproses gambar");
  return new File([blob], "logo.png", { type: "image/png" });
}

export function SkillLogoControl({
  id,
  name,
  logoUrl,
}: {
  id: string;
  name: string;
  logoUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(logoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: string | null) {
    const res = await setSkillLogoAction(id, next);
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
      const small = await shrinkToPng(file);
      const formData = new FormData();
      formData.append("file", small);
      formData.append("folder", "skills");
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
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-[#f4f3ea]">
        {url ? (
          // biome-ignore lint/performance/noImgElement: logo kecil (maks 128px), optimasi next/image tidak perlu
          <img
            src={url}
            alt={`${name} logo`}
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        ) : (
          <ImageIcon size={14} className="text-[#16181d]/40" />
        )}
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="font-data text-xs text-accent hover:underline disabled:opacity-50"
      >
        {busy ? "memproses..." : url ? "ganti logo" : "upload logo"}
      </button>
      {url && !busy && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Hapus logo ${name}`}
          className="text-ink-muted hover:text-danger"
        >
          <X size={12} />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/webp"
        className="hidden"
        onChange={onSelected}
      />
      {error && <span className="font-data text-xs text-danger">{error}</span>}
    </div>
  );
}
