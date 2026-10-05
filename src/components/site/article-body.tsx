"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

type Block = { id: string; host: HTMLElement; getText: () => string };

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    const ok = await copyText(getText());
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Code copied" : "Copy code"}
        className={cn(
          "font-data inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-line bg-bg/90 px-2 text-xs backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          copied
            ? "border-accent text-accent-strong"
            : "text-ink-muted hover:text-ink",
        )}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Code copied to clipboard" : ""}
      </span>
    </>
  );
}

/**
 * Isi artikel (HTML yang sudah disanitasi di server) dengan tombol Copy di
 * setiap blok kode. Tombol dipasang setelah hidrasi: tiap <pre> dibungkus div
 * relatif (supaya tombol tidak ikut bergeser saat kode di-scroll horizontal),
 * dan DOM dikembalikan seperti semula saat cleanup.
 */
export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const root = ref.current;
    if (!root || html.length === 0) return;

    const undo: (() => void)[] = [];
    const found: Block[] = [];

    for (const pre of Array.from(root.querySelectorAll("pre"))) {
      const parent = pre.parentNode;
      if (!parent) continue;

      const wrapper = document.createElement("div");
      wrapper.className = "relative";
      parent.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const host = document.createElement("div");
      host.className = "absolute right-2 top-2 z-10";
      wrapper.appendChild(host);

      found.push({
        id: `code-${found.length}`,
        host,
        getText: () =>
          (
            pre.querySelector("code")?.textContent ??
            pre.textContent ??
            ""
          ).replace(/\n$/, ""),
      });
      undo.push(() => {
        parent.insertBefore(pre, wrapper);
        wrapper.remove();
      });
    }

    setBlocks(found);
    return () => {
      for (const fn of undo) fn();
      setBlocks([]);
    };
  }, [html]);

  return (
    <>
      <div
        ref={ref}
        className="prose break-words max-w-none"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: html sudah disanitasi DOMPurify lewat sanitizeArticleHtml() di server, lihat SECURITY.md §3
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {blocks.map((b) =>
        createPortal(<CopyButton getText={b.getText} />, b.host, b.id),
      )}
    </>
  );
}
