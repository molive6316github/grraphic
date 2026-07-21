/*
  # Autonomous agents

  An autonomous agent has a standing mission instead of needing a prompt
  each time. The worker wakes it on its own interval, and every run it
  produces a NEW deliverable (e.g. a Boxt poster) until an optional cap is
  reached. Come back in a week to a stack of finished designs.

  - is_autonomous / mission / autonomy_interval_minutes / next_run_at
  - run_count: deliverables produced so far (also drives variation)
  - max_runs: optional safety cap (NULL = run forever)
  - can_design: may create real Boxt designs via the create_design tool
*/

ALTER TABLE public.gradi_agents
  ADD COLUMN IF NOT EXISTS is_autonomous boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mission text,
  ADD COLUMN IF NOT EXISTS autonomy_interval_minutes integer DEFAULT 360,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS run_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_runs integer,
  ADD COLUMN IF NOT EXISTS can_design boolean DEFAULT true;

-- Link deliverables back to the agent that made them (for the UI counter
-- and to vary future output)
ALTER TABLE public.boxt_designs
  ADD COLUMN IF NOT EXISTS created_by_agent uuid REFERENCES public.gradi_agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_autonomous_due
  ON public.gradi_agents(next_run_at) WHERE is_autonomous;

CREATE INDEX IF NOT EXISTS idx_boxt_designs_agent
  ON public.boxt_designs(created_by_agent) WHERE created_by_agent IS NOT NULL;
