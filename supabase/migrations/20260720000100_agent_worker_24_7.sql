/*
  # 24/7 agent infrastructure

  - Agents gain capabilities (email / web search / project access) and an
    optional project link
  - Tasks gain a steps trace so the UI can show what the agent did
  - gradi_agent_schedules: recurring tasks (every N minutes, min 15)
  - claim_next_agent_task(): atomic queue claim for the server-side worker
    (service-role only, FOR UPDATE SKIP LOCKED)
  - pg_cron job ticks the agent-worker edge function every minute via
    pg_net, so queued + scheduled tasks run with no browser open

  The cron call authenticates with x-worker-secret; the same value must be
  set as the WORKER_SECRET secret on the agent-worker edge function.
*/

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agent capabilities + project link
ALTER TABLE public.gradi_agents
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS can_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_search boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_use_project boolean DEFAULT true;

-- Step-by-step trace of what the agent did while running a task
ALTER TABLE public.gradi_agent_tasks
  ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT '[]'::jsonb;

-- Recurring schedules
CREATE TABLE IF NOT EXISTS public.gradi_agent_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.gradi_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text NOT NULL,
  interval_minutes integer NOT NULL CHECK (interval_minutes >= 15),
  is_active boolean DEFAULT true,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gradi_agent_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedules" ON public.gradi_agent_schedules
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pro users can create schedules" ON public.gradi_agent_schedules
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_pro_user(auth.uid()));
CREATE POLICY "Users can update own schedules" ON public.gradi_agent_schedules
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own schedules" ON public.gradi_agent_schedules
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_agent_schedules_due
  ON public.gradi_agent_schedules(next_run_at) WHERE is_active;

-- Atomic queue claim for the worker (service-role only)
CREATE OR REPLACE FUNCTION public.claim_next_agent_task()
RETURNS SETOF public.gradi_agent_tasks
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.gradi_agent_tasks t
  SET status = 'running', started_at = now()
  WHERE t.id = (
    SELECT id FROM public.gradi_agent_tasks
    WHERE status = 'queued'
    ORDER BY created_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING t.*;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_next_agent_task() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_agent_task() TO service_role;

-- Requeue tasks stuck in 'running' (worker crashed / timed out)
CREATE OR REPLACE FUNCTION public.requeue_stuck_agent_tasks()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.gradi_agent_tasks
  SET status = 'queued', started_at = NULL
  WHERE status = 'running' AND started_at < now() - interval '10 minutes';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.requeue_stuck_agent_tasks() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.requeue_stuck_agent_tasks() TO service_role;

-- Tick the worker every minute so agents run 24/7 without a browser open.
-- The x-worker-secret below must match the WORKER_SECRET function secret.
SELECT cron.unschedule('agent-worker-tick')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agent-worker-tick');

SELECT cron.schedule(
  'agent-worker-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://snqpircwrkwadzceqjuc.supabase.co/functions/v1/agent-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-secret', '9972e03add95ee64be2837ba4a5fb4997c6cfc22c69e28dd'
    ),
    body := '{"source":"cron"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
