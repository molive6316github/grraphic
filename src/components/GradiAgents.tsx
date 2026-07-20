import { useState, useEffect, useCallback } from 'react';
import {
  Bot, Plus, Play, Trash2, X, Loader2, CheckCircle2, XCircle,
  Clock, ChevronRight, Crown, Sparkles, Copy, Check, StopCircle, Pencil,
  Mail, Globe, Folder, CalendarClock, Pause, Search, Wrench, Users, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOAuthConnection, removeOAuthConnection } from '../lib/oauthConnections';

interface GradiAgent {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  system_prompt: string;
  model: string;
  temperature: number;
  is_active: boolean;
  created_at: string;
  project_id: string | null;
  can_email: boolean;
  can_search: boolean;
  can_use_project: boolean;
  can_slack: boolean;
}

interface AgentTeam {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
}

interface TeamMemberRow {
  team_id: string;
  agent_id: string;
  position: number;
  role_hint: string | null;
}

interface AgentStep {
  at: string;
  tool: string;
  input: unknown;
  output: string;
}

interface AgentTask {
  id: string;
  agent_id: string;
  team_id: string | null;
  title: string;
  instructions: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result: string | null;
  error: string | null;
  steps: AgentStep[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface AgentSchedule {
  id: string;
  agent_id: string;
  title: string;
  instructions: string;
  interval_minutes: number;
  is_active: boolean;
  next_run_at: string;
  last_run_at: string | null;
}

interface ProjectOption { id: string; name: string }

interface GradiAgentsProps {
  userId: string;
  isPro: boolean;
  onUpgrade?: () => void;
}

const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (best)' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (fast)' },
  { id: 'gemma2-9b-it', label: 'Gemma2 9B' },
];

const INTERVALS = [
  { minutes: 60, label: 'Every hour' },
  { minutes: 360, label: 'Every 6 hours' },
  { minutes: 720, label: 'Every 12 hours' },
  { minutes: 1440, label: 'Every day' },
  { minutes: 10080, label: 'Every week' },
];

const AGENT_PRESETS = [
  {
    emoji: '🎨',
    name: 'Brand Critic',
    description: 'Reviews brand decisions with strong opinions',
    system_prompt: 'You are a senior brand director with 20 years of experience. You review brand and design decisions with strong, specific, actionable opinions. Always structure your responses: verdict first, then reasoning, then concrete next steps.',
  },
  {
    emoji: '📰',
    name: 'Design Scout',
    description: 'Searches the web for trends and reports back',
    system_prompt: 'You are a design trend researcher. Use web search to find current, real information before answering. Cite the sources you used with their URLs. Summarize findings as a short, punchy briefing.',
  },
  {
    emoji: '💻',
    name: 'Code Reviewer',
    description: 'Reviews code snippets like a staff engineer',
    system_prompt: 'You are a staff software engineer doing a code review. Identify correctness bugs first, then design issues, then style nits - clearly separated. Suggest concrete fixes with code. Be direct but constructive.',
  },
];

const TOOL_ICONS: Record<string, React.ReactNode> = {
  web_search: <Search size={11} />,
  fetch_url: <Globe size={11} />,
  send_email: <Mail size={11} />,
  send_slack: <MessageSquare size={11} />,
  list_project_items: <Folder size={11} />,
  add_project_note: <Folder size={11} />,
  agent_result: <Bot size={11} />,
};

const statusStyles: Record<AgentTask['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  queued: { color: 'text-gray-300', bg: 'bg-gray-500/15 border-gray-500/30', icon: <Clock size={12} /> },
  running: { color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', icon: <Loader2 size={12} className="animate-spin" /> },
  completed: { color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: <CheckCircle2 size={12} /> },
  failed: { color: 'text-red-300', bg: 'bg-red-500/15 border-red-500/30', icon: <XCircle size={12} /> },
  cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30', icon: <StopCircle size={12} /> },
};

// Kick the server-side worker (fire and forget). Even if this fails, the
// pg_cron tick picks the task up within a minute.
async function pokeWorker() {
  try {
    await supabase.functions.invoke('agent-worker', { body: { source: 'app' } });
  } catch {
    /* cron will get it */
  }
}

export function GradiAgents({ userId, isPro, onUpgrade }: GradiAgentsProps) {
  const [agents, setAgents] = useState<GradiAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [schedules, setSchedules] = useState<AgentSchedule[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [teams, setTeams] = useState<AgentTeam[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<GradiAgent | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [slackWebhookInput, setSlackWebhookInput] = useState('');
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackSaving, setSlackSaving] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;
  const selectedTeam = teams.find(t => t.id === selectedTeamId) || null;
  const selectedTeamAgents = selectedTeamId
    ? teamMembers
        .filter(m => m.team_id === selectedTeamId)
        .sort((a, b) => a.position - b.position)
        .map(m => agents.find(a => a.id === m.agent_id))
        .filter((a): a is GradiAgent => !!a)
    : [];
  const agentTasks = tasks.filter(t =>
    selectedTeamId ? t.team_id === selectedTeamId : (!selectedAgentId || (t.agent_id === selectedAgentId && !t.team_id))
  );
  const agentSchedules = schedules.filter(s => !selectedTeamId && (!selectedAgentId || s.agent_id === selectedAgentId));
  const hasActiveWork = tasks.some(t => t.status === 'queued' || t.status === 'running');

  const loadAll = useCallback(async () => {
    const [{ data: agentData }, { data: taskData }, { data: scheduleData }, { data: projectData }, { data: teamData }, { data: memberData }] = await Promise.all([
      supabase.from('gradi_agents').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('gradi_agent_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      supabase.from('gradi_agent_schedules').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('projects').select('id, name').order('created_at', { ascending: false }),
      supabase.from('gradi_agent_teams').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('gradi_agent_team_members').select('*'),
    ]);
    setAgents((agentData || []) as unknown as GradiAgent[]);
    setTasks((taskData || []) as unknown as AgentTask[]);
    setSchedules((scheduleData || []) as unknown as AgentSchedule[]);
    setProjects((projectData || []) as ProjectOption[]);
    setTeams((teamData || []) as unknown as AgentTeam[]);
    setTeamMembers((memberData || []) as unknown as TeamMemberRow[]);
    setLoading(false);
    if (agentData && agentData.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agentData[0].id);
    }
  }, [userId, selectedAgentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Slack connection status (stored like other provider connections)
  useEffect(() => {
    getOAuthConnection(userId, 'slack').then(conn => {
      setSlackConnected(!!conn?.provider_token);
    });
  }, [userId]);

  const saveSlackWebhook = async () => {
    const url = slackWebhookInput.trim();
    if (!/^https:\/\/hooks\.slack\.com\//.test(url)) return;
    setSlackSaving(true);
    await supabase.from('user_oauth_connections').upsert({
      user_id: userId,
      provider: 'slack',
      provider_token: url,
      connected_at: new Date().toISOString(),
    });
    setSlackSaving(false);
    setSlackConnected(true);
    setSlackWebhookInput('');
  };

  const disconnectSlack = async () => {
    await removeOAuthConnection(userId, 'slack');
    setSlackConnected(false);
  };

  // Live-poll task state while the server works the queue
  useEffect(() => {
    if (!hasActiveWork) return;
    const timer = setInterval(async () => {
      const { data } = await supabase
        .from('gradi_agent_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setTasks(data as unknown as AgentTask[]);
    }, 4000);
    return () => clearInterval(timer);
  }, [hasActiveWork, userId]);

  const queueTask = async () => {
    if (!newTaskTitle.trim() || !newTaskInstructions.trim()) return;
    // Team tasks still need an agent_id (NOT NULL) - use the first member
    const anchorAgent = selectedTeam ? selectedTeamAgents[0] : selectedAgent;
    if (!anchorAgent) return;
    const { data, error } = await supabase
      .from('gradi_agent_tasks')
      .insert({
        agent_id: anchorAgent.id,
        team_id: selectedTeam?.id || null,
        user_id: userId,
        title: newTaskTitle.trim(),
        instructions: newTaskInstructions.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [data as unknown as AgentTask, ...prev]);
      setNewTaskTitle('');
      setNewTaskInstructions('');
      pokeWorker();
    }
  };

  const cancelTask = async (taskId: string) => {
    await supabase.from('gradi_agent_tasks')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('status', 'queued');
    setTasks(prev => prev.map(t => t.id === taskId && t.status === 'queued' ? { ...t, status: 'cancelled' } : t));
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('gradi_agent_tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Delete this agent, its tasks, and its schedules?')) return;
    await supabase.from('gradi_agents').delete().eq('id', agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
    setTasks(prev => prev.filter(t => t.agent_id !== agentId));
    setSchedules(prev => prev.filter(s => s.agent_id !== agentId));
    setTeamMembers(prev => prev.filter(m => m.agent_id !== agentId));
    if (selectedAgentId === agentId) setSelectedAgentId(null);
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team? Its agents are kept; team task history is unlinked.')) return;
    await supabase.from('gradi_agent_teams').delete().eq('id', teamId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setTeamMembers(prev => prev.filter(m => m.team_id !== teamId));
    if (selectedTeamId === teamId) setSelectedTeamId(null);
  };

  const toggleSchedule = async (schedule: AgentSchedule) => {
    const next = !schedule.is_active;
    setSchedules(prev => prev.map(s => s.id === schedule.id ? { ...s, is_active: next } : s));
    await supabase.from('gradi_agent_schedules').update({ is_active: next }).eq('id', schedule.id);
  };

  const deleteSchedule = async (scheduleId: string) => {
    await supabase.from('gradi_agent_schedules').delete().eq('id', scheduleId);
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  };

  const copyResult = async (taskId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 1500);
  };

  if (!isPro) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 mb-5 shadow-lg shadow-violet-500/25">
            <Bot size={26} className="text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Custom Gradi Agents</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Build agents that run 24/7 on our servers — they can search the web, email you
            reports, work inside your projects, and run on a schedule while you sleep.
          </p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all"
          >
            <Crown size={16} />
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Agent roster */}
      <div className="w-full md:w-72 max-h-52 md:max-h-none border-b md:border-b-0 md:border-r border-white/[0.07] flex flex-col bg-black/20 flex-shrink-0">
        <div className="p-4 flex items-center justify-between border-b border-white/[0.07]">
          <h3 className="font-display font-semibold text-white text-sm">Your agents</h3>
          <button
            onClick={() => { setEditingAgent(null); setShowAgentModal(true); }}
            className="p-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors"
            title="New agent"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.length === 0 && (
            <div className="p-4 text-sm text-gray-500">
              No agents yet. Create one, or start from a preset below.
            </div>
          )}
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => { setSelectedAgentId(agent.id); setSelectedTeamId(null); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors group ${
                selectedAgentId === agent.id && !selectedTeamId
                  ? 'bg-violet-500/15 border border-violet-500/30'
                  : 'hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <span className="text-xl">{agent.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{agent.name}</div>
                <div className="text-xs text-gray-500 truncate">{agent.description || agent.model}</div>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setEditingAgent(agent); setShowAgentModal(true); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setEditingAgent(agent); setShowAgentModal(true); } }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all"
              >
                <Pencil size={13} />
              </span>
            </button>
          ))}

          {agents.length === 0 && AGENT_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={async () => {
                const { data } = await supabase.from('gradi_agents').insert({
                  user_id: userId,
                  name: preset.name,
                  emoji: preset.emoji,
                  description: preset.description,
                  system_prompt: preset.system_prompt,
                }).select().single();
                if (data) {
                  setAgents(prev => [...prev, data as unknown as GradiAgent]);
                  setSelectedAgentId(data.id);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left border border-dashed border-white/[0.1] hover:border-violet-400/40 hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-xl">{preset.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 truncate">{preset.name}</div>
                <div className="text-xs text-gray-500 truncate">{preset.description}</div>
              </div>
              <Plus size={14} className="text-gray-500" />
            </button>
          ))}

          {/* Agent teams */}
          <div className="pt-3 mt-2 border-t border-white/[0.07]">
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Teams</span>
              <button
                onClick={() => setShowTeamModal(true)}
                disabled={agents.length < 2}
                className="p-1 rounded-md text-gray-400 hover:text-violet-300 disabled:opacity-30 transition-colors"
                title={agents.length < 2 ? 'Create at least 2 agents first' : 'New team'}
              >
                <Plus size={13} />
              </button>
            </div>
            {teams.length === 0 && (
              <div className="px-3 pb-2 text-xs text-gray-600">
                Team up agents to work a task as a relay — each builds on the last.
              </div>
            )}
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => { setSelectedTeamId(team.id); setSelectedAgentId(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  selectedTeamId === team.id
                    ? 'bg-fuchsia-500/15 border border-fuchsia-500/30'
                    : 'hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <span className="text-xl">{team.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{team.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {teamMembers.filter(m => m.team_id === team.id).length} agents
                  </div>
                </div>
                <Users size={13} className="text-gray-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Slack connection */}
        <div className="p-3 border-t border-white/[0.07]">
          {slackConnected ? (
            <div className="flex items-center gap-2 text-xs">
              <MessageSquare size={13} className="text-emerald-300" />
              <span className="text-gray-300 flex-1">Slack connected</span>
              <button onClick={disconnectSlack} className="text-gray-500 hover:text-red-400 transition-colors">
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                <MessageSquare size={13} />
                <span>Slack — agents can post to your channel</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  value={slackWebhookInput}
                  onChange={e => setSlackWebhookInput(e.target.value)}
                  placeholder="https://hooks.slack.com/services/…"
                  className="flex-1 min-w-0 px-2 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                />
                <button
                  onClick={saveSlackWebhook}
                  disabled={slackSaving || !/^https:\/\/hooks\.slack\.com\//.test(slackWebhookInput.trim())}
                  className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  {slackSaving ? '…' : 'Save'}
                </button>
              </div>
              <div className="text-[10px] text-gray-600 mt-1">
                Slack → Apps → Incoming Webhooks → paste the URL here
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task console */}
      <div className="flex-1 flex flex-col min-w-0">
        {(selectedAgent || selectedTeam) ? (
          <>
            {selectedTeam ? (
              <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{selectedTeam.emoji}</span>
                  <div className="min-w-0">
                    <h2 className="font-display font-semibold text-white truncate">{selectedTeam.name}</h2>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono flex-wrap">
                      {selectedTeamAgents.map((a, i) => (
                        <span key={a.id} className="inline-flex items-center gap-0.5 text-fuchsia-300/80">
                          {i > 0 && <ChevronRight size={9} className="text-gray-600" />}
                          {a.emoji} {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteTeam(selectedTeam.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete team"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : selectedAgent && (
            <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{selectedAgent.emoji}</span>
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-white truncate">{selectedAgent.name}</h2>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                    <span className="truncate">{selectedAgent.model}</span>
                    {selectedAgent.can_search !== false && <span className="inline-flex items-center gap-0.5 text-sky-300/80"><Search size={10} />web</span>}
                    {selectedAgent.can_slack !== false && slackConnected && <span className="inline-flex items-center gap-0.5 text-emerald-300/80"><MessageSquare size={10} />slack</span>}
                    {selectedAgent.can_email && <span className="inline-flex items-center gap-0.5 text-emerald-300/80"><Mail size={10} />email</span>}
                    {selectedAgent.project_id && <span className="inline-flex items-center gap-0.5 text-violet-300/80"><Folder size={10} />{projects.find(p => p.id === selectedAgent.project_id)?.name || 'project'}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="p-2 text-gray-400 hover:text-violet-300 transition-colors"
                  title="Add schedule"
                >
                  <CalendarClock size={16} />
                </button>
                <button
                  onClick={() => deleteAgent(selectedAgent.id)}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Delete agent"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            )}

            {/* Schedules strip */}
            {agentSchedules.length > 0 && (
              <div className="px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02] flex flex-wrap gap-2">
                {agentSchedules.map(s => (
                  <div key={s.id} className={`inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg border text-xs ${
                    s.is_active ? 'bg-violet-500/10 border-violet-500/30 text-violet-200' : 'bg-white/[0.04] border-white/[0.08] text-gray-500'
                  }`}>
                    <CalendarClock size={11} />
                    <span className="truncate max-w-[160px]">{s.title}</span>
                    <span className="font-mono text-[10px] opacity-70">
                      {INTERVALS.find(i => i.minutes === s.interval_minutes)?.label.replace('Every ', '/') || `/${s.interval_minutes}m`}
                    </span>
                    <button onClick={() => toggleSchedule(s)} className="p-0.5 hover:text-white" title={s.is_active ? 'Pause' : 'Resume'}>
                      {s.is_active ? <Pause size={11} /> : <Play size={11} />}
                    </button>
                    <button onClick={() => deleteSchedule(s.id)} className="p-0.5 hover:text-red-400" title="Delete schedule">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New task composer */}
            <div className="p-4 border-b border-white/[0.07] bg-white/[0.02]">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task title — e.g. Research pricing page trends"
                className="w-full mb-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
              <textarea
                value={newTaskInstructions}
                onChange={e => setNewTaskInstructions(e.target.value)}
                placeholder={selectedTeam
                  ? 'Describe the mission. Each agent works in order, building on the previous one — the full relay is saved as the result.'
                  : 'Describe exactly what the agent should do. It runs on our servers — you can close the tab.'}
                rows={3}
                className="w-full mb-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={queueTask}
                  disabled={!newTaskTitle.trim() || !newTaskInstructions.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:translate-y-0"
                >
                  <Play size={14} />
                  Run task
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {agentTasks.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No tasks yet. Run one above, or add a schedule with the calendar button —
                  scheduled tasks run 24/7 even when you're offline.
                </div>
              )}
              {agentTasks.map(task => {
                const style = statusStyles[task.status];
                const expanded = expandedTaskId === task.id;
                const steps = task.steps || [];
                return (
                  <div key={task.id} className="rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
                    <button
                      onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-mono uppercase tracking-wide ${style.bg} ${style.color}`}>
                        {style.icon}
                        {task.status}
                      </span>
                      <span className="flex-1 text-sm text-white truncate">{task.title}</span>
                      {steps.length > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-gray-500">
                          <Wrench size={10} />{steps.length}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 font-mono hidden sm:block">
                        {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <ChevronRight size={14} className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                    {expanded && (
                      <div className="border-t border-white/[0.07] p-4 space-y-3">
                        <div>
                          <div className="font-mono text-[10px] tracking-widest text-violet-300/80 uppercase mb-1">Instructions</div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.instructions}</p>
                        </div>
                        {steps.length > 0 && (
                          <div>
                            <div className="font-mono text-[10px] tracking-widest text-sky-300/80 uppercase mb-1.5">Steps</div>
                            <div className="space-y-1.5">
                              {steps.map((step, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/25 text-sky-300 font-mono flex-shrink-0">
                                    {TOOL_ICONS[step.tool] || <Wrench size={11} />}
                                    {step.tool}
                                  </span>
                                  <span className="text-gray-500 truncate pt-0.5">
                                    {typeof step.input === 'object' && step.input !== null
                                      ? Object.values(step.input as Record<string, unknown>).map(String).join(' · ').slice(0, 120)
                                      : String(step.input ?? '')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {task.result && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-mono text-[10px] tracking-widest text-emerald-300/80 uppercase">Result</div>
                              <button
                                onClick={() => copyResult(task.id, task.result!)}
                                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                              >
                                {copiedTaskId === task.id ? <Check size={12} /> : <Copy size={12} />}
                                {copiedTaskId === task.id ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-sm text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                              {task.result}
                            </div>
                          </div>
                        )}
                        {task.error && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                            {task.error}
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          {task.status === 'queued' && (
                            <button
                              onClick={() => cancelTask(task.id)}
                              className="text-xs text-gray-400 hover:text-amber-300 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Sparkles size={28} className="mx-auto mb-3 text-violet-400/60" />
              <p className="text-sm">Select or create an agent to get started</p>
            </div>
          </div>
        )}
      </div>

      {showAgentModal && (
        <AgentModal
          userId={userId}
          agent={editingAgent}
          projects={projects}
          onClose={() => setShowAgentModal(false)}
          onSaved={(agent) => {
            setAgents(prev => {
              const exists = prev.some(a => a.id === agent.id);
              return exists ? prev.map(a => a.id === agent.id ? agent : a) : [...prev, agent];
            });
            setSelectedAgentId(agent.id);
            setShowAgentModal(false);
          }}
        />
      )}

      {showScheduleModal && selectedAgent && (
        <ScheduleModal
          userId={userId}
          agent={selectedAgent}
          onClose={() => setShowScheduleModal(false)}
          onSaved={(schedule) => {
            setSchedules(prev => [...prev, schedule]);
            setShowScheduleModal(false);
          }}
        />
      )}

      {showTeamModal && (
        <TeamModal
          userId={userId}
          agents={agents}
          onClose={() => setShowTeamModal(false)}
          onSaved={(team, members) => {
            setTeams(prev => [...prev, team]);
            setTeamMembers(prev => [...prev, ...members]);
            setSelectedTeamId(team.id);
            setSelectedAgentId(null);
            setShowTeamModal(false);
          }}
        />
      )}
    </div>
  );
}

function TeamModal({ userId, agents, onClose, onSaved }: {
  userId: string;
  agents: GradiAgent[];
  onClose: () => void;
  onSaved: (team: AgentTeam, members: TeamMemberRow[]) => void;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🤝');
  const [description, setDescription] = useState('');
  // Click order defines relay order
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMember = (agentId: string) => {
    setMemberIds(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);
  };

  const save = async () => {
    if (!name.trim() || memberIds.length < 2) return;
    setSaving(true);
    setError(null);

    const { data: team, error: teamError } = await supabase
      .from('gradi_agent_teams')
      .insert({ user_id: userId, name: name.trim(), emoji, description: description.trim() || null })
      .select()
      .single();

    if (teamError || !team) {
      setSaving(false);
      setError(teamError?.message || 'Could not create the team.');
      return;
    }

    const rows = memberIds.map((agentId, i) => ({ team_id: team.id, agent_id: agentId, position: i }));
    const { error: memberError } = await supabase.from('gradi_agent_team_members').insert(rows);
    setSaving(false);

    if (memberError) {
      setError(memberError.message);
      return;
    }
    onSaved(team as unknown as AgentTeam, rows.map(r => ({ ...r, role_hint: null })));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">New agent team</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Emoji</label>
              <input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-16 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-center focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Team name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Launch squad"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this team handle?"
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Members — click in the order they should work (min 2)
            </label>
            <div className="space-y-1.5">
              {agents.map(agent => {
                const order = memberIds.indexOf(agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleMember(agent.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left border transition-colors ${
                      order >= 0
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/30'
                        : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono flex-shrink-0 ${
                      order >= 0 ? 'bg-fuchsia-500/30 text-fuchsia-200' : 'bg-white/[0.06] text-gray-500'
                    }`}>
                      {order >= 0 ? order + 1 : '·'}
                    </span>
                    <span className="text-lg">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{agent.name}</div>
                      <div className="text-xs text-gray-500 truncate">{agent.description || agent.model}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors">Cancel</button>
            <button
              onClick={save}
              disabled={saving || !name.trim() || memberIds.length < 2}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              Create team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentModal({ userId, agent, projects, onClose, onSaved }: {
  userId: string;
  agent: GradiAgent | null;
  projects: ProjectOption[];
  onClose: () => void;
  onSaved: (agent: GradiAgent) => void;
}) {
  const [name, setName] = useState(agent?.name || '');
  const [emoji, setEmoji] = useState(agent?.emoji || '🤖');
  const [description, setDescription] = useState(agent?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || '');
  const [model, setModel] = useState(agent?.model || 'llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [projectId, setProjectId] = useState<string>(agent?.project_id || '');
  const [canEmail, setCanEmail] = useState(agent?.can_email ?? false);
  const [canSearch, setCanSearch] = useState(agent?.can_search ?? true);
  const [canSlack, setCanSlack] = useState(agent?.can_slack ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      emoji,
      description: description.trim() || null,
      system_prompt: systemPrompt.trim(),
      model,
      temperature,
      project_id: projectId || null,
      can_email: canEmail,
      can_search: canSearch,
      can_slack: canSlack,
      can_use_project: true,
    };

    const query = agent
      ? supabase.from('gradi_agents').update(payload).eq('id', agent.id).select().single()
      : supabase.from('gradi_agents').insert({ ...payload, user_id: userId }).select().single();

    const { data, error: dbError } = await query;
    setSaving(false);

    if (dbError) {
      setError(dbError.message.includes('row-level security')
        ? 'Creating custom agents requires an active Pro subscription.'
        : dbError.message);
      return;
    }
    if (data) onSaved(data as unknown as GradiAgent);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">{agent ? 'Edit agent' : 'New agent'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Emoji</label>
              <input
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                className="w-16 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-center focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Design Scout"
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Instructions (system prompt)</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are… Describe the agent's role, tone, and exactly how it should respond."
              rows={5}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Abilities</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input type="checkbox" checked={canSearch} onChange={e => setCanSearch(e.target.checked)} className="accent-violet-500" />
                <Search size={15} className="text-sky-300" />
                <div className="flex-1">
                  <div className="text-sm text-white">Web search & page reading</div>
                  <div className="text-xs text-gray-500">Search the internet and read pages for current info</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input type="checkbox" checked={canEmail} onChange={e => setCanEmail(e.target.checked)} className="accent-violet-500" />
                <Mail size={15} className="text-emerald-300" />
                <div className="flex-1">
                  <div className="text-sm text-white">Email you</div>
                  <div className="text-xs text-gray-500">Send reports and alerts to your account email (only yours)</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors">
                <input type="checkbox" checked={canSlack} onChange={e => setCanSlack(e.target.checked)} className="accent-violet-500" />
                <MessageSquare size={15} className="text-emerald-300" />
                <div className="flex-1">
                  <div className="text-sm text-white">Post to Slack</div>
                  <div className="text-xs text-gray-500">Post updates to your connected Slack channel</div>
                </div>
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <Folder size={15} className="text-violet-300 ml-6" />
                <div className="flex-1">
                  <div className="text-sm text-white mb-1">Linked project</div>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none"
                  >
                    <option value="" className="bg-[#12121a]">None</option>
                    {projects.map(p => <option key={p.id} value={p.id} className="bg-[#12121a]">{p.name}</option>)}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">The agent can read this project and save notes into it</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#12121a]">{m.label}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs text-gray-400 mb-1">Creativity: {temperature.toFixed(1)}</label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.1}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-violet-500 mt-2.5"
              />
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !name.trim() || !systemPrompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {agent ? 'Save changes' : 'Create agent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ userId, agent, onClose, onSaved }: {
  userId: string;
  agent: GradiAgent;
  onClose: () => void;
  onSaved: (schedule: AgentSchedule) => void;
}) {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [intervalMinutes, setIntervalMinutes] = useState(1440);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim() || !instructions.trim()) return;
    setSaving(true);
    setError(null);
    const { data, error: dbError } = await supabase
      .from('gradi_agent_schedules')
      .insert({
        agent_id: agent.id,
        user_id: userId,
        title: title.trim(),
        instructions: instructions.trim(),
        interval_minutes: intervalMinutes,
      })
      .select()
      .single();
    setSaving(false);
    if (dbError) {
      setError(dbError.message.includes('row-level security')
        ? 'Schedules require an active Pro subscription.'
        : dbError.message);
      return;
    }
    if (data) onSaved(data as unknown as AgentSchedule);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">Schedule for {agent.emoji} {agent.name}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500 -mt-1">
            Runs on our servers around the clock — the first run happens within a minute of saving.
          </p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Morning design trends briefing"
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
          />
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder="What should the agent do each time? e.g. Search for today's top design news and email me a 5-bullet digest."
            rows={4}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <div>
            <label className="block text-xs text-gray-400 mb-1">Repeat</label>
            <select
              value={intervalMinutes}
              onChange={e => setIntervalMinutes(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none"
            >
              {INTERVALS.map(i => <option key={i.minutes} value={i.minutes} className="bg-[#12121a]">{i.label}</option>)}
            </select>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors">Cancel</button>
            <button
              onClick={save}
              disabled={saving || !title.trim() || !instructions.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
              Create schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
