"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/modules/profile/actions";

type Initial = {
  email: string;
  name: string;
  bio: string;
  phone: string;
  domicile: string;
  linkedinUrl: string;
  githubUsername: string;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwPending, startPwTransition] = useTransition();
  const [pwMessage, setPwMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  return (
    <div className="mt-6 space-y-10">
      <Card>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email (dipakai untuk login)</Label>
            <Input
              id="email"
              type="email"
              className="mt-1"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={6}
              className="mt-1"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                className="mt-1"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="domicile">Domicile</Label>
              <Input
                id="domicile"
                className="mt-1"
                value={form.domicile}
                onChange={(e) => setForm({ ...form, domicile: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                className="mt-1"
                value={form.linkedinUrl}
                onChange={(e) =>
                  setForm({ ...form, linkedinUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="githubUsername">GitHub username</Label>
              <Input
                id="githubUsername"
                className="mt-1"
                value={form.githubUsername}
                onChange={(e) =>
                  setForm({ ...form, githubUsername: e.target.value })
                }
              />
            </div>
          </div>
          {message && (
            <p
              className={`text-sm ${message.ok ? "text-accent" : "text-danger"}`}
            >
              {message.text}
            </p>
          )}
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await updateProfileAction(form);
                setMessage(
                  res.ok
                    ? { ok: true, text: "Tersimpan." }
                    : { ok: false, text: res.error },
                );
              })
            }
          >
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Change password</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              className="mt-1"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm({ ...pwForm, currentPassword: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                className="mt-1"
                value={pwForm.newPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, newPassword: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="mt-1"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          {pwMessage && (
            <p
              className={`text-sm ${pwMessage.ok ? "text-accent" : "text-danger"}`}
            >
              {pwMessage.text}
            </p>
          )}
          <Button
            variant="outline"
            disabled={pwPending}
            onClick={() =>
              startPwTransition(async () => {
                const res = await changePasswordAction(pwForm);
                setPwMessage(
                  res.ok
                    ? { ok: true, text: "Password berhasil diganti." }
                    : { ok: false, text: res.error },
                );
                if (res.ok) {
                  setPwForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }
              })
            }
          >
            {pwPending ? "Changing..." : "Change password"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
