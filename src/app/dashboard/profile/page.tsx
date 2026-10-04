import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { ProfileForm } from "./form";

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return null;

  const [full] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);
  if (!full) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Data ini tampil di halaman public (About, Contact). Foto/CV masih lewat
        file statis di <code className="font-data">public/</code> — belum ada
        upload UI.
      </p>
      <ProfileForm
        initial={{
          email: full.email,
          name: full.name ?? "",
          bio: full.bio ?? "",
          phone: full.phone ?? "",
          domicile: full.domicile ?? "",
          linkedinUrl: full.linkedinUrl ?? "",
          githubUsername: full.githubUsername ?? "",
        }}
      />
    </div>
  );
}
