/*
  # Collaboration platform: Teams, Projects, Sharing, and Gradi Agents

  - teams / team_members / team_invites: shared workspaces with roles
  - projects / project_items: a hub that groups designs, analyses, palettes,
    assets, mockups, code notes, and links into one body of work
  - share_links: tokenized read-only sharing of any resource
  - gradi_agents / gradi_agent_tasks: Pro users can create custom Gradi
    agents with their own instructions and queue tasks for them
  - team_id columns on shareable resources so teams can see shared work

  Security:
  - is_team_member/is_team_admin SECURITY DEFINER helpers avoid recursive
    RLS on team_members
  - invite acceptance goes through an RPC that validates the token
  - gradi agents are Pro-gated at the database level, not just the UI
*/

-- ============ Teams ============

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#8b5cf6',
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now()
);

-- ============ Helper functions ============

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pro_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = p_user_id
      AND u.is_pro_subscriber
      AND (u.pro_subscription_expires_at IS NULL OR u.pro_subscription_expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = p_user_id
  );
$$;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their teams" ON public.teams
  FOR SELECT TO authenticated
  USING (public.is_team_member(id, auth.uid()));
CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can update teams" ON public.teams
  FOR UPDATE TO authenticated
  USING (public.is_team_admin(id, auth.uid()))
  WITH CHECK (public.is_team_admin(id, auth.uid()));
CREATE POLICY "Owners can delete teams" ON public.teams
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Members can view team roster" ON public.team_members
  FOR SELECT TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Admins can add members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_admin(team_id, auth.uid()) OR (
    -- team creator bootstraps their own owner row
    user_id = auth.uid() AND role = 'owner'
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
  ));
CREATE POLICY "Admins can update member roles" ON public.team_members
  FOR UPDATE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()))
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));
CREATE POLICY "Admins can remove members, members can leave" ON public.team_members
  FOR DELETE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Admins can view team invites" ON public.team_invites
  FOR SELECT TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));
CREATE POLICY "Admins can create invites" ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_team_admin(team_id, auth.uid()) AND invited_by = auth.uid());
CREATE POLICY "Admins can revoke invites" ON public.team_invites
  FOR DELETE TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- Accepting an invite is done by token through a definer RPC
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite public.team_invites%ROWTYPE;
  v_user_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT email INTO v_user_email FROM public.users WHERE id = auth.uid();

  SELECT * INTO v_invite FROM public.team_invites
  WHERE token = p_token AND accepted_at IS NULL AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite not found or expired');
  END IF;

  IF lower(v_invite.email) <> lower(coalesce(v_user_email, '')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invite was sent to a different email address');
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_invite.team_id, auth.uid(), v_invite.role)
  ON CONFLICT (team_id, user_id) DO NOTHING;

  UPDATE public.team_invites SET accepted_at = now() WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'team_id', v_invite.team_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_team_invite(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(uuid) TO authenticated;

-- ============ Projects hub ============

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#8b5cf6',
  icon text DEFAULT 'folder',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN (
    'analysis', 'boxt_design', 'palette', 'asset', 'mockup', 'code_note', 'link'
  )),
  item_id uuid,
  title text NOT NULL DEFAULT '',
  content jsonb DEFAULT '{}'::jsonb,
  added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project access for owner and team" ON public.projects
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())));
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.is_team_member(team_id, auth.uid())));
CREATE POLICY "Owner and team admins can update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR (team_id IS NOT NULL AND public.is_team_admin(team_id, auth.uid())))
  WITH CHECK (owner_id = auth.uid() OR (team_id IS NOT NULL AND public.is_team_admin(team_id, auth.uid())));
CREATE POLICY "Owner can delete projects" ON public.projects
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Project items follow project access" ON public.project_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(p.team_id, auth.uid())))
  ));
CREATE POLICY "Project members can add items" ON public.project_items
  FOR INSERT TO authenticated
  WITH CHECK (added_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(p.team_id, auth.uid())))
  ));
CREATE POLICY "Project members can update items" ON public.project_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(p.team_id, auth.uid())))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(p.team_id, auth.uid())))
  ));
CREATE POLICY "Project members can remove items" ON public.project_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_id
      AND (p.owner_id = auth.uid() OR (p.team_id IS NOT NULL AND public.is_team_member(p.team_id, auth.uid())))
  ));

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_team ON public.projects(team_id);
CREATE INDEX IF NOT EXISTS idx_project_items_project ON public.project_items(project_id);

-- ============ Share links ============

CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN (
    'analysis', 'boxt_design', 'palette', 'asset', 'mockup', 'project'
  )),
  resource_id uuid NOT NULL,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own share links" ON public.share_links
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_resource ON public.share_links(resource_type, resource_id);

-- Public resolution of a share token (anon-friendly, read-only)
CREATE OR REPLACE FUNCTION public.get_shared_resource(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_link public.share_links%ROWTYPE;
  v_payload jsonb;
BEGIN
  SELECT * INTO v_link FROM public.share_links
  WHERE token = p_token AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > now());

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Link not found, expired, or revoked');
  END IF;

  CASE v_link.resource_type
    WHEN 'analysis' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT id, file_name, analysis_data, image_url, created_at
        FROM public.design_analyses WHERE id = v_link.resource_id
      ) t;
    WHEN 'boxt_design' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT id, title, data, width, height, thumbnail, created_at
        FROM public.boxt_designs WHERE id = v_link.resource_id
      ) t;
    WHEN 'palette' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT id, name, colors, tags, created_at
        FROM public.color_palettes WHERE id = v_link.resource_id
      ) t;
    WHEN 'asset' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT id, name, asset_type, file_url, thumbnail_url, file_format, file_size, created_at
        FROM public.design_assets WHERE id = v_link.resource_id
      ) t;
    WHEN 'mockup' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT id, title, design_url, preview_url, rendered_url, mockup_type, created_at
        FROM public.mockup_projects WHERE id = v_link.resource_id
      ) t;
    WHEN 'project' THEN
      SELECT to_jsonb(t) INTO v_payload FROM (
        SELECT p.id, p.name, p.description, p.color, p.icon, p.created_at,
               (SELECT jsonb_agg(to_jsonb(i) ORDER BY i.sort_order, i.created_at)
                  FROM (SELECT id, item_type, item_id, title, content, created_at, sort_order
                          FROM public.project_items WHERE project_id = p.id) i) AS items
        FROM public.projects p WHERE p.id = v_link.resource_id
      ) t;
  END CASE;

  IF v_payload IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shared resource no longer exists');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'resource_type', v_link.resource_type,
    'resource', v_payload
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_resource(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_resource(uuid) TO anon, authenticated;

-- ============ Gradi custom agents (Pro) ============

CREATE TABLE IF NOT EXISTS public.gradi_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  emoji text DEFAULT '🤖',
  system_prompt text NOT NULL,
  model text NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  temperature numeric(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gradi_agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.gradi_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  result text,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gradi_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradi_agent_tasks ENABLE ROW LEVEL SECURITY;

-- Pro-gated at the database level
CREATE POLICY "Pro users can view own agents" ON public.gradi_agents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pro users can create agents" ON public.gradi_agents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_pro_user(auth.uid()));
CREATE POLICY "Pro users can update own agents" ON public.gradi_agents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own agents" ON public.gradi_agents
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own agent tasks" ON public.gradi_agent_tasks
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pro users can queue tasks" ON public.gradi_agent_tasks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_pro_user(auth.uid()));
CREATE POLICY "Users can update own tasks" ON public.gradi_agent_tasks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own tasks" ON public.gradi_agent_tasks
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_gradi_agents_user ON public.gradi_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_gradi_agent_tasks_user ON public.gradi_agent_tasks(user_id, status);

-- ============ Team visibility on shareable resources ============

ALTER TABLE public.design_analyses ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.boxt_designs ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.color_palettes ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.design_assets ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.mockup_projects ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE POLICY "Team members can view shared analyses" ON public.design_analyses
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can view shared boxt designs" ON public.boxt_designs
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can edit shared boxt designs" ON public.boxt_designs
  FOR UPDATE TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid())
         AND NOT EXISTS (SELECT 1 FROM public.team_members tm
                         WHERE tm.team_id = boxt_designs.team_id
                           AND tm.user_id = auth.uid() AND tm.role = 'viewer'))
  WITH CHECK (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can view shared palettes" ON public.color_palettes
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can view shared assets" ON public.design_assets
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));
CREATE POLICY "Team members can view shared mockups" ON public.mockup_projects
  FOR SELECT TO authenticated
  USING (team_id IS NOT NULL AND public.is_team_member(team_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_design_analyses_team ON public.design_analyses(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_boxt_designs_team ON public.boxt_designs(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_color_palettes_team ON public.color_palettes(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_design_assets_team ON public.design_assets(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mockup_projects_team ON public.mockup_projects(team_id) WHERE team_id IS NOT NULL;

-- Storage usage for the vault quota meter
CREATE OR REPLACE FUNCTION public.get_storage_usage()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
  SELECT jsonb_build_object(
    'total_bytes', COALESCE(SUM((o.metadata->>'size')::bigint), 0),
    'file_count', COUNT(*)
  )
  FROM storage.objects o
  WHERE o.bucket_id IN ('design-assets', 'design-images')
    AND (storage.foldername(o.name))[1] = auth.uid()::text;
$$;

REVOKE EXECUTE ON FUNCTION public.get_storage_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_storage_usage() TO authenticated;

-- Lock down helper/trigger functions (applied as follow-up)
REVOKE EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_admin(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_pro_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro_user(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.profiles_view_insert() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.profiles_view_update() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.profiles_view_delete() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.oauth_clients_guard_verification() FROM PUBLIC, anon;
