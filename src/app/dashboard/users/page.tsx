import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as service from "@/modules/users/service";
import { CreateStaffForm } from "./create-form";
import { UsersTable } from "./table";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (user?.role !== "super_admin") redirect("/dashboard");

  const allUsers = await service.listAll(user);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Hanya <code className="font-data">super_admin</code> yang bisa membuat
        akun staff, mengubah role, atau menonaktifkan akun. Lihat PRD.md §4
        untuk permission matrix.
      </p>

      <div className="mt-8">
        <CreateStaffForm />
      </div>

      <div className="mt-10">
        <UsersTable users={allUsers} currentUserId={user.id} />
      </div>
    </div>
  );
}
