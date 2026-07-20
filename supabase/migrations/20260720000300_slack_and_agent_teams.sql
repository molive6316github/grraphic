/*
  # Slack capability + agent teams

  - gradi_agents.can_slack: lets an agent post to the owner's Slack.
    The webhook URL lives in user_oauth_connections (provider='slack',
    provider_token=webhook URL), with a global SLACK_WEBHOOK_URL function
    secret as fallback.
  - gradi_agent_teams / members: ordered groups of agents that work a task
    as a relay - each member sees the task plus prior members' output.
  - gradi_agent_tasks.team_id: a queued task addressed to a team instead
    of a single agent (agent_id then points at the first member).
*/

ALTER TABLE public.gradi_agents
  ADD COLUMN IF NOT EXISTS can_slack boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.gradi_agent_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '🤝',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gradi_agent_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent teams" ON public.gradi_agent_teams
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.gradi_agent_team_members (
  team_id uuid NOT NULL REFERENCES public.gradi_agent_teams(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.gradi_agents(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  role_hint text,
  PRIMARY KEY (team_id, agent_id)
);

ALTER TABLE public.gradi_agent_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own team members" ON public.gradi_agent_team_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.gradi_agent_teams t
    WHERE t.id = team_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.gradi_agent_teams t
    WHERE t.id = team_id AND t.user_id = auth.uid()
  ));

ALTER TABLE public.gradi_agent_tasks
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.gradi_agent_teams(id) ON DELETE SET NULL;
