import { NewArticleForm } from "./form";

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ ai?: string }>;
}) {
  const { ai } = await searchParams;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">
        {ai ? "Generate article with AI" : "Write article"}
      </h1>
      <NewArticleForm mode={ai ? "ai" : "manual"} />
    </div>
  );
}
