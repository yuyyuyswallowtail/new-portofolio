import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { getOwnerProfile } from "@/modules/content/repository";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const owner = await getOwnerProfile();
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Contact</h1>
        <div className="font-data mt-6 space-y-2 text-ink-muted">
          {owner?.email && <p>email: {owner.email}</p>}
          {owner?.phone && <p>phone: {owner.phone}</p>}
          {owner?.linkedinUrl && <p>linkedin: {owner.linkedinUrl}</p>}
          {owner?.githubUsername && <p>github: @{owner.githubUsername}</p>}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
