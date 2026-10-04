"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { setActiveAction, updateRoleAction } from "@/modules/users/actions";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "super_admin" | "admin" | "editor" | "viewer";
  isActive: boolean;
  createdAt: Date;
};

const ROLES = ["super_admin", "admin", "editor", "viewer"] as const;

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            <th className="pb-2 font-normal">Email</th>
            <th className="pb-2 font-normal">Name</th>
            <th className="pb-2 font-normal">Role</th>
            <th className="pb-2 font-normal">Status</th>
            <th className="pb-2 font-normal">Joined</th>
            <th className="pb-2 font-normal" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-b border-line">
                <td className="py-3">{u.email}</td>
                <td className="py-3">{u.name}</td>
                <td className="py-3">
                  <select
                    className="font-data rounded-[4px] border border-line bg-surface px-2 py-1 text-xs disabled:opacity-50"
                    defaultValue={u.role}
                    disabled={isSelf || pending}
                    onChange={(e) =>
                      startTransition(async () => {
                        await updateRoleAction({
                          userId: u.id,
                          role: e.target.value,
                        });
                        router.refresh();
                      })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3">
                  <Badge tone={u.isActive ? "accent" : "warn"}>
                    {u.isActive ? "active" : "disabled"}
                  </Badge>
                </td>
                <td className="font-data py-3 text-xs text-ink-muted">
                  {formatDate(u.createdAt)}
                </td>
                <td className="py-3 text-right">
                  {!isSelf && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await setActiveAction({
                            userId: u.id,
                            isActive: !u.isActive,
                          });
                          router.refresh();
                        })
                      }
                    >
                      {u.isActive ? "Disable" : "Enable"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
