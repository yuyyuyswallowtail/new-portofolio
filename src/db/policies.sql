-- Row-Level Security baseline for portofolio.
-- These policies are the *backstop* layer described in SECURITY.md §2 — the
-- application (lib/rbac.ts#can) is still the primary check. Policies here
-- assume the app sets a session variable per request identifying the caller:
--
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.current_role = 'admin';
--
-- (see src/db/with-context.ts). If neither is set, current_setting(...) below
-- returns '' and every policy denies by default — fail closed, not open.

-- Staff roles (admin/super_admin) bypass most content restrictions;
-- viewers/anonymous only ever see published, non-deleted rows.

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_role', true), '')
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_staff() RETURNS boolean AS $$
  SELECT app_current_role() IN ('admin', 'super_admin')
$$ LANGUAGE sql STABLE;

-- users: nobody can read other users' auth fields via RLS except staff;
-- public profile reads happen through a dedicated service query, not raw table access.
DROP POLICY IF EXISTS users_staff_all ON users;
CREATE POLICY users_staff_all ON users
  FOR ALL USING (app_is_staff() OR id = app_current_user_id())
  WITH CHECK (app_is_staff() OR id = app_current_user_id());

-- content tables (education/experiences/certifications/skill_entries/projects):
-- staff can manage; everyone else (including anonymous) can only SELECT non-deleted rows.
DROP POLICY IF EXISTS education_read_public ON education;
CREATE POLICY education_read_public ON education
  FOR SELECT USING (deleted_at IS NULL OR app_is_staff());
DROP POLICY IF EXISTS education_write_staff ON education;
CREATE POLICY education_write_staff ON education
  FOR INSERT WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS education_update_staff ON education;
CREATE POLICY education_update_staff ON education
  FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS education_delete_staff ON education;
CREATE POLICY education_delete_staff ON education
  FOR DELETE USING (app_is_staff());

DROP POLICY IF EXISTS experiences_read_public ON experiences;
CREATE POLICY experiences_read_public ON experiences
  FOR SELECT USING (deleted_at IS NULL OR app_is_staff());
DROP POLICY IF EXISTS experiences_write_staff ON experiences;
CREATE POLICY experiences_write_staff ON experiences
  FOR INSERT WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS experiences_update_staff ON experiences;
CREATE POLICY experiences_update_staff ON experiences
  FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS experiences_delete_staff ON experiences;
CREATE POLICY experiences_delete_staff ON experiences
  FOR DELETE USING (app_is_staff());

DROP POLICY IF EXISTS certifications_read_public ON certifications;
CREATE POLICY certifications_read_public ON certifications
  FOR SELECT USING (deleted_at IS NULL OR app_is_staff());
DROP POLICY IF EXISTS certifications_write_staff ON certifications;
CREATE POLICY certifications_write_staff ON certifications
  FOR INSERT WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS certifications_update_staff ON certifications;
CREATE POLICY certifications_update_staff ON certifications
  FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS certifications_delete_staff ON certifications;
CREATE POLICY certifications_delete_staff ON certifications
  FOR DELETE USING (app_is_staff());

DROP POLICY IF EXISTS skill_entries_read_public ON skill_entries;
CREATE POLICY skill_entries_read_public ON skill_entries
  FOR SELECT USING (deleted_at IS NULL OR app_is_staff());
DROP POLICY IF EXISTS skill_entries_write_staff ON skill_entries;
CREATE POLICY skill_entries_write_staff ON skill_entries
  FOR INSERT WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS skill_entries_update_staff ON skill_entries;
CREATE POLICY skill_entries_update_staff ON skill_entries
  FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS skill_entries_delete_staff ON skill_entries;
CREATE POLICY skill_entries_delete_staff ON skill_entries
  FOR DELETE USING (app_is_staff());

DROP POLICY IF EXISTS projects_read_public ON projects;
CREATE POLICY projects_read_public ON projects
  FOR SELECT USING (deleted_at IS NULL OR app_is_staff());
DROP POLICY IF EXISTS projects_write_staff ON projects;
CREATE POLICY projects_write_staff ON projects
  FOR INSERT WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS projects_update_staff ON projects;
CREATE POLICY projects_update_staff ON projects
  FOR UPDATE USING (app_is_staff()) WITH CHECK (app_is_staff());
DROP POLICY IF EXISTS projects_delete_staff ON projects;
CREATE POLICY projects_delete_staff ON projects
  FOR DELETE USING (app_is_staff());

-- articles: published+non-deleted readable by anyone; drafts only by their
-- author or staff; only staff or the owning editor (on their own draft) may write.
DROP POLICY IF EXISTS articles_read ON articles;
CREATE POLICY articles_read ON articles
  FOR SELECT USING (
    (status = 'published' AND deleted_at IS NULL)
    OR app_is_staff()
    OR author_id = app_current_user_id()
  );

DROP POLICY IF EXISTS articles_insert ON articles;
CREATE POLICY articles_insert ON articles
  FOR INSERT WITH CHECK (
    app_is_staff() OR (app_current_role() = 'editor' AND author_id = app_current_user_id())
  );

DROP POLICY IF EXISTS articles_update ON articles;
CREATE POLICY articles_update ON articles
  FOR UPDATE USING (
    app_is_staff()
    OR (app_current_role() = 'editor' AND author_id = app_current_user_id() AND status = 'draft')
  ) WITH CHECK (
    app_is_staff()
    OR (app_current_role() = 'editor' AND author_id = app_current_user_id())
  );

DROP POLICY IF EXISTS articles_delete ON articles;
CREATE POLICY articles_delete ON articles
  FOR DELETE USING (
    app_is_staff()
    OR (app_current_role() = 'editor' AND author_id = app_current_user_id() AND status = 'draft')
  );

-- sessions: a user (or staff) can only see/delete their own session rows.
DROP POLICY IF EXISTS sessions_owner ON sessions;
CREATE POLICY sessions_owner ON sessions
  FOR ALL USING (app_is_staff() OR user_id = app_current_user_id())
  WITH CHECK (app_is_staff() OR user_id = app_current_user_id());
