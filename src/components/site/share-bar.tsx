"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";

export function ShareBar({ title, slug }: { title: string; slug: string }) {
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator.share === "function");
    return () => window.clearTimeout(timer.current);
  }, []);

  const url = `${origin}/articles/${slug}`;

  async function onCopy() {
    if (!(await copyText(url))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  async function onShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // pengguna membatalkan dialog share
    }
  }

  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${link}` },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
    },
  ];

  return (
    <div className="mt-12 border-t border-line pt-6">
      <p className="kicker">Share this article</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={!origin}
          aria-label={copied ? "Link copied" : "Copy article link"}
          className="pill pill-outline pill-sm disabled:opacity-50"
        >
          {copied ? <Check size={14} /> : <Link2 size={14} />}
          {copied ? "Link copied" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            className="pill pill-outline pill-sm"
          >
            <Share2 size={14} />
            Share
          </button>
        )}
        {origin &&
          targets.map((t) => (
            <a
              key={t.label}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="pill pill-outline pill-sm"
            >
              {t.label} ↗
            </a>
          ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? "Article link copied to clipboard" : ""}
      </span>
    </div>
  );
}
