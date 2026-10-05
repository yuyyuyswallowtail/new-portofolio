"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { selectClass } from "@/components/dashboard/content-manager";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runAutoGenerateAction } from "@/modules/articles/actions";
import {
  getAutoGenerateStateAction,
  startAutoGenerateAction,
  stopAutoGenerateAction,
  updateAutoGenerateAction,
} from "@/modules/autogen/actions";
import {
  type AutoGenerateState,
  INTERVAL_OPTIONS,
  TEST_INTERVAL_MINUTES,
  TEST_RUNS,
} from "@/modules/autogen/options";

function formatCountdown(ms: number) {
  if (ms <= 0) return "sebentar lagi";
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} jam ${m} mnt`;
  if (m > 0) return `${m} mnt ${s} dtk`;
  return `${s} dtk`;
}

export function AutoGenerateButton() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [permitted, setPermitted] = useState(true);
  const [state, setState] = useState<AutoGenerateState | null>(null);
  const [skew, setSkew] = useState(0); // selisih jam server dan browser
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await getAutoGenerateStateAction();
    if (!res.ok) {
      setPermitted(false);
      return;
    }
    setState(res.data);
    setSkew(Date.parse(res.data.serverNow) - Date.now());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Panel terbuka: hitung mundur tiap detik, sinkron ke server tiap 15 detik.
  useEffect(() => {
    if (!open) return;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(load, 15_000);
    return () => {
      clearInterval(clock);
      clearInterval(poll);
    };
  }, [open, load]);

  // Klik di luar atau Escape menutup panel.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function change(input: { intervalMinutes?: number; autoPublish?: boolean }) {
    startTransition(async () => {
      setMessage(null);
      const res = await updateAutoGenerateAction(input);
      if (!res.ok) setMessage(res.error);
      await load();
    });
  }

  function start() {
    startTransition(async () => {
      setMessage(null);
      const res = await startAutoGenerateAction();
      setMessage(res.ok ? `Artikel dibuat: "${res.data.topic}"` : res.error);
      await load();
      router.refresh();
    });
  }

  function stop() {
    startTransition(async () => {
      setMessage(null);
      const res = await stopAutoGenerateAction();
      if (!res.ok) setMessage(res.error);
      await load();
    });
  }

  function runOnce() {
    startTransition(async () => {
      setMessage(null);
      const res = await runAutoGenerateAction(state?.autoPublish ?? false);
      setMessage(
        res.ok
          ? `Artikel dibuat: "${res.data.topic}"${state?.autoPublish ? " (published)" : " (draft)"}`
          : res.error,
      );
      if (res.ok) router.refresh();
    });
  }

  if (!permitted) return null;

  const running = pending || !!state?.running;
  const nextMs = state?.nextRunAt
    ? Date.parse(state.nextRunAt) - (now + skew)
    : 0;
  const status = !state
    ? "Memuat…"
    : running
      ? "Sedang membuat artikel…"
      : state.enabled
        ? `Aktif · berikutnya dalam ${formatCountdown(nextMs)}`
        : "Nonaktif";

  return (
    <div ref={wrapRef} className="relative">
      <Button
        variant="outline"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            state?.enabled ? "bg-accent" : "bg-ink-muted",
          )}
        />
        Auto-generate
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Pengaturan auto-generate"
          className="absolute right-0 top-full z-20 mt-2 w-[22rem] max-w-[90vw] space-y-4 rounded-[6px] border border-line bg-surface p-4 shadow-lg"
        >
          <div>
            <p className="text-sm font-medium">{status}</p>
            {state?.lastRunAt && (
              <p className="font-data mt-1 text-xs text-ink-muted">
                terakhir {new Date(state.lastRunAt).toLocaleString("id-ID")} ·{" "}
                {state.lastStatus}
              </p>
            )}
            {state?.lastMessage && (
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                {state.lastMessage}
              </p>
            )}
          </div>

          {state && (
            <>
              <div>
                <label
                  htmlFor="autogen-interval"
                  className="text-sm font-medium"
                >
                  Interval
                </label>
                <select
                  id="autogen-interval"
                  className={cn(selectClass, "mt-1")}
                  value={state.intervalMinutes}
                  disabled={pending}
                  onChange={(e) =>
                    change({ intervalMinutes: Number(e.target.value) })
                  }
                >
                  {INTERVAL_OPTIONS.map((o) => (
                    <option key={o.minutes} value={o.minutes}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {state.intervalMinutes === TEST_INTERVAL_MINUTES && (
                  <p className="mt-1 text-xs text-warn">
                    Mode uji: hitungan 1 menit dimulai setelah artikel
                    sebelumnya selesai. Berhenti otomatis setelah {TEST_RUNS}{" "}
                    artikel, lalu kembali ke 8 jam.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={state.autoPublish}
                  disabled={pending}
                  onChange={(e) => change({ autoPublish: e.target.checked })}
                />
                <span>
                  Publish langsung
                  <span className="block text-xs text-ink-muted">
                    Mati = hasil jadi draft untuk kamu review.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {state.enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={stop}
                  >
                    Matikan
                  </Button>
                ) : (
                  <Button size="sm" disabled={pending} onClick={start}>
                    {pending
                      ? "Membuat artikel… (3–4 menit)"
                      : "Mulai sekarang"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={runOnce}
                >
                  Generate sekali saja
                </Button>
              </div>
            </>
          )}

          {message && <p className="text-xs text-ink-muted">{message}</p>}
        </div>
      )}
    </div>
  );
}
