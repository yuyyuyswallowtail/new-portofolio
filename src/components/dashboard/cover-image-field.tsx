"use client";

import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";

export function CoverImageField({
  value,
  onChange,
  label = "Cover / thumbnail image",
}: {
  label?: string;
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upload failed");
      onChange(data.url);
    } catch (err) {
      alert(`Upload gagal: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">
        {value ? (
          <div className="relative w-full max-w-xs">
            {/* biome-ignore lint/performance/noImgElement: preview of an upload/data URL, next/image can't optimize either reliably */}
            <img
              src={value}
              alt="Cover preview"
              className="w-full rounded-[6px] border border-line"
            />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg/80 text-ink hover:text-danger"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-line text-ink-muted hover:border-accent hover:text-accent"
          >
            <ImageIcon size={20} />
            <span className="text-xs">
              {uploading ? "Uploading..." : "Upload cover image"}
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleSelected}
        />
      </div>
    </div>
  );
}
