"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction } from "@/modules/users/actions";

export function CreateStaffForm() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "editor" as "admin" | "editor",
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  return (
    <Card>
      <h2 className="text-lg font-medium">Create staff account</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="new-email">Email</Label>
          <Input
            id="new-email"
            type="email"
            className="mt-1"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-name">Name</Label>
          <Input
            id="new-name"
            className="mt-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-password">Temporary password</Label>
          <Input
            id="new-password"
            type="password"
            className="mt-1"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="new-role">Role</Label>
          <select
            id="new-role"
            className="mt-1 h-10 w-full rounded-[6px] border border-line bg-surface px-3 text-sm"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as "admin" | "editor" })
            }
          >
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${message.ok ? "text-accent" : "text-danger"}`}
        >
          {message.text}
        </p>
      )}
      <Button
        className="mt-4"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createStaffAction(form);
            if (res.ok) {
              setMessage({ ok: true, text: "Akun dibuat." });
              setForm({ email: "", name: "", password: "", role: "editor" });
            } else {
              setMessage({ ok: false, text: res.error });
            }
          })
        }
      >
        {pending ? "Creating..." : "Create account"}
      </Button>
    </Card>
  );
}
