import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getById } from "@/modules/articles/service";
import { ArticleEditorForm } from "../../editor-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const article = await getById(user, id);
  if (!article) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit article</h1>
      <div className="mt-6">
        <ArticleEditorForm
          mode="edit"
          initial={{
            id: article.id,
            title: article.title,
            excerpt: article.excerpt ?? "",
            contentMd: article.contentMd,
            tags: article.tags,
            coverImageUrl: article.coverImageUrl ?? undefined,
            status: article.status,
            aiGenerated: article.aiGenerated,
          }}
        />
      </div>
    </div>
  );
}
