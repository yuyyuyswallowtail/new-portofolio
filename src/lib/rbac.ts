export type Role = "super_admin" | "admin" | "editor" | "viewer";

export type Action =
  | "content.manage" // education / experiences / certifications / skills / projects
  | "articles.create"
  | "articles.publish"
  | "articles.manage_any" // edit/delete any article regardless of author
  | "comments.moderate"
  | "users.manage";

const RULES: Record<Role, Action[]> = {
  super_admin: [
    "content.manage",
    "articles.create",
    "articles.publish",
    "articles.manage_any",
    "comments.moderate",
    "users.manage",
  ],
  admin: [
    "content.manage",
    "articles.create",
    "articles.publish",
    "articles.manage_any",
    "comments.moderate",
  ],
  editor: ["articles.create"],
  viewer: [],
};

/**
 * Single source of truth for permission checks — see PRD.md §4 (permission
 * matrix) and AGENTS.md §6 ("always go through lib/rbac.ts#can()"). Every
 * server action must call this before touching the repository layer.
 */
export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return RULES[role]?.includes(action) ?? false;
}

export function canEditArticle(
  user: { id: string; role: Role } | null,
  article: { authorId: string; status: "draft" | "published" },
): boolean {
  if (!user) return false;
  if (can(user.role, "articles.manage_any")) return true;
  return (
    user.role === "editor" &&
    article.authorId === user.id &&
    article.status === "draft"
  );
}

export function isStaff(role: Role | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}
