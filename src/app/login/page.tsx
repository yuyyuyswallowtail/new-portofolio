"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { RevealText } from "@/components/site/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/modules/auth/actions";

const initialState = { ok: false as const, error: "" };

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  // React 19 mengosongkan form setelah action selesai; email dijaga di state
  // supaya tidak perlu diketik ulang saat login gagal.
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.ok) router.push(state.data.redirectTo);
  }, [state, router]);

  const ToggleIcon = showPassword ? EyeOff : Eye;

  return (
    <main className="grid min-h-dvh md:grid-cols-[1.1fr_1fr] [--accent:#ffc21a] [--accent-strong:color-mix(in_srgb,#ffc21a_85%,black)]">
      <aside className="m-3 flex min-h-56 flex-col justify-between rounded-[28px] bg-block-yellow p-7 text-on-block md:m-4 md:min-h-0 md:p-10">
        <Link
          href="/"
          className="w-fit rounded-full border border-on-block px-4 py-2 text-sm font-medium transition-colors hover:bg-on-block hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-block"
        >
          ← Back to site
        </Link>
        <p
          aria-hidden="true"
          className="mt-10 select-none text-[15vw] font-extrabold uppercase leading-[0.82] tracking-tighter md:text-[8.5vw]"
        >
          <RevealText text="Bintang" />
          <br />
          <RevealText text="Mesir" delay={0.12} />
        </p>
      </aside>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Staff and admin access only.
          </p>

          <form
            action={formAction}
            aria-busy={pending}
            className="mt-8 space-y-5"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <ToggleIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {!state.ok && state.error && (
              <p
                role="alert"
                className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {state.error}
              </p>
            )}

            <Button type="submit" disabled={pending} className="h-11 w-full">
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
