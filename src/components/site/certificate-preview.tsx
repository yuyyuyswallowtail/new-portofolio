"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
};

export default function CertificatePreview({
  src,
  alt,
  title,
  subtitle,
  onClose,
}: Props) {
  const [zoomed, setZoomed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? alt}
      onClick={onClose}
      className={`fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="flex items-start justify-between gap-4 px-5 py-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          {title && <p className="truncate text-base font-medium">{title}</p>}
          {subtitle && (
            <p className="truncate font-mono text-xs text-white/60">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup preview"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none transition hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <div
        data-lenis-prevent
        className={`flex-1 overflow-auto px-4 pb-6 ${
          zoomed ? "" : "flex items-center justify-center"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          draggable={false}
          className={`mx-auto rounded-lg bg-white shadow-2xl transition-transform duration-200 ${
            visible ? "scale-100" : "scale-95"
          } ${
            zoomed
              ? "w-[min(1600px,200vw)] max-w-none cursor-zoom-out"
              : "max-h-[82vh] max-w-full cursor-zoom-in object-contain"
          }`}
        />
      </div>

      <p
        className="pb-4 text-center font-mono text-[11px] text-white/50"
        onClick={(e) => e.stopPropagation()}
      >
        klik gambar untuk zoom · Esc untuk menutup
      </p>
    </div>,
    document.body,
  );
}
