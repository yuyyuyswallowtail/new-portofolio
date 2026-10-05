import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "editor",
  "viewer",
]);
export const experienceTypeEnum = pgEnum("experience_type", [
  "work",
  "training",
]);
export const projectSourceEnum = pgEnum("project_source", ["manual", "github"]);
export const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "published",
]);
export const commentStatusEnum = pgEnum("comment_status", [
  "pending",
  "approved",
  "rejected",
  "spam",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password").notNull(),
  salt: text("salt").notNull(),
  role: roleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  birthday: date("birthday", { mode: "string" }),
  profileUrl: text("profile_url"),
  cvUrl: text("cv_url"),
  bio: text("bio"),
  phone: text("phone"),
  domicile: text("domicile"),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  linkedinUrl: text("linkedin_url"),
  githubUsername: text("github_username"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}).enableRLS();

export const education = pgTable("education", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  institution: text("institution").notNull(),
  degree: text("degree"),
  gpa: text("gpa"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  type: experienceTypeEnum("type").notNull().default("work"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  imageUrl: text("image_url"),
  verifyUrl: text("verify_url"),
  issuedAt: date("issued_at", { mode: "string" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const skillEntries = pgTable("skill_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category"),
  logoUrl: text("logo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  repoUrl: text("repo_url"),
  liveUrl: text("live_url"),
  imageUrl: text("image_url"),
  source: projectSourceEnum("source").notNull().default("manual"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  contentMd: text("content_md").notNull(),
  coverImageUrl: text("cover_image_url"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  status: articleStatusEnum("status").notNull().default("draft"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  body: text("body").notNull(),
  status: commentStatusEnum("status").notNull().default("approved"),
  flagReason: text("flag_reason"),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}).enableRLS();

export type Comment = typeof comments.$inferSelect;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Education = typeof education.$inferSelect;
export type Experience = typeof experiences.$inferSelect;
export type Certification = typeof certifications.$inferSelect;
export type SkillEntry = typeof skillEntries.$inferSelect;
