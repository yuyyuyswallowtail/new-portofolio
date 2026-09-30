"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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

  useEffect(() => {
    if (state.ok) router.push(state.data.redirectTo);
  }, [state, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Staff/admin access only.</p>
      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1"
          />
        </div>
        {!state.ok && state.error && (
          <p className="text-sm text-danger">{state.error}</p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
