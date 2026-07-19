import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot, Plus, Play, Trash2, X, Loader2, CheckCircle2, XCircle,
  Clock, ChevronRight, Crown, Sparkles, Copy, Check, StopCircle, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runCustomAgent } from '../services/groqService';

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
}

interface AgentTask {
  id: string;
  agent_id: string;
  title: string;
  instructions: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result: string | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

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

const AGENT_PRESETS = [
  {
    emoji: '🎨',
    name: 'Brand Critic',
    description: 'Reviews brand decisions with strong opinions',
    system_prompt: 'You are a senior brand director with 20 years of experience. You review brand and design decisions with strong, specific, actionable opinions. Always structure your responses: verdict first, then reasoning, then concrete next steps.',
  },
  {
    emoji: '📝',
    name: 'Copy Doctor',
    description: 'Rewrites and sharpens marketing copy',
    system_prompt: 'You are an expert copywriter. When given copy, produce three rewrites: one punchy, one professional, one playful. Then explain which you would choose and why. Keep everything tight - no filler words.',
  },
  {
    emoji: '💻',
    name: 'Code Reviewer',
    description: 'Reviews code snippets like a staff engineer',
    system_prompt: 'You are a staff software engineer doing a code review. Identify correctness bugs first, then design issues, then style nits - clearly separated. Suggest concrete fixes with code. Be direct but constructive.',
  },
];

const statusStyles: Record<AgentTask['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  queued: { color: 'text-gray-300', bg: 'bg-gray-500/15 border-gray-500/30', icon: <Clock size={12} /> },
  running: { color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', icon: <Loader2 size={12} className="animate-spin" /> },
  completed: { color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: <CheckCircle2 size={12} /> },
  failed: { color: 'text-red-300', bg: 'bg-red-500/15 border-red-500/30', icon: <XCircle size={12} /> },
  cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/15 border-gray-500/30', icon: <StopCircle size={12} /> },
};

export function GradiAgents({ userId, isPro, onUpgrade }: GradiAgentsProps) {
  const [agents, setAgents] = useState<GradiAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<GradiAgent | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const runningRef = useRef(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || null;
  const agentTasks = tasks.filter(t => !selectedAgentId || t.agent_id === selectedAgentId);

  const loadAll = useCallback(async () => {
    const [{ data: agentData }, { data: taskData }] = await Promise.all([
      supabase.from('gradi_agents').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('gradi_agent_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    ]);
    setAgents((agentData || []) as unknown as GradiAgent[]);
    setTasks((taskData || []) as unknown as AgentTask[]);
    setLoading(false);
    if (agentData && agentData.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agentData[0].id);
    }
  }, [userId, selectedAgentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Client-side task runner: picks up queued tasks one at a time
  const runQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    try {
      // Re-read queue state each pass
      for (;;) {
        const { data: queued } = await supabase
          .from('gradi_agent_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(1);

        const task = (queued || [])[0] as unknown as AgentTask | undefined;
        if (!task) break;

        const { data: agentRow } = await supabase
          .from('gradi_agents')
          .select('*')
          .eq('id', task.agent_id)
          .maybeSingle();
        const agent = agentRow as unknown as GradiAgent | null;

        await supabase.from('gradi_agent_tasks')
          .update({ status: 'running', started_at: new Date().toISOString() })
          .eq('id', task.id);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' } : t));

        try {
          if (!agent) throw new Error('Agent no longer exists');
          const result = await runCustomAgent(
            agent.system_prompt,
            `Task: ${task.title}\n\n${task.instructions}`,
            { model: agent.model, temperature: Number(agent.temperature) }
          );
          await supabase.from('gradi_agent_tasks')
            .update({ status: 'completed', result, completed_at: new Date().toISOString() })
            .eq('id', task.id);
          setTasks(prev => prev.map(t => t.id === task.id
            ? { ...t, status: 'completed', result, completed_at: new Date().toISOString() } : t));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          await supabase.from('gradi_agent_tasks')
            .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
            .eq('id', task.id);
          setTasks(prev => prev.map(t => t.id === task.id
            ? { ...t, status: 'failed', error: message } : t));
        }
      }
    } finally {
      runningRef.current = false;
    }
  }, [userId]);

  const queueTask = async () => {
    if (!selectedAgent || !newTaskTitle.trim() || !newTaskInstructions.trim()) return;
    const { data, error } = await supabase
      .from('gradi_agent_tasks')
      .insert({
        agent_id: selectedAgent.id,
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
      runQueue();
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
    if (!confirm('Delete this agent and all its tasks?')) return;
    await supabase.from('gradi_agents').delete().eq('id', agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));
    setTasks(prev => prev.filter(t => t.agent_id !== agentId));
    if (selectedAgentId === agentId) setSelectedAgentId(null);
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
            Build your own agents with custom instructions and queue tasks for them to run —
            a brand critic, a copy doctor, a code reviewer, anything you can describe.
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
    <div className="flex-1 flex overflow-hidden">
      {/* Agent roster */}
      <div className="w-72 border-r border-white/[0.07] flex flex-col bg-black/20">
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
              onClick={() => setSelectedAgentId(agent.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors group ${
                selectedAgentId === agent.id
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
        </div>
      </div>

      {/* Task console */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedAgent ? (
          <>
            <div className="p-4 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{selectedAgent.emoji}</span>
                <div className="min-w-0">
                  <h2 className="font-display font-semibold text-white truncate">{selectedAgent.name}</h2>
                  <p className="text-xs text-gray-500 font-mono truncate">{selectedAgent.model} · temp {Number(selectedAgent.temperature).toFixed(1)}</p>
                </div>
              </div>
              <button
                onClick={() => deleteAgent(selectedAgent.id)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Delete agent"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* New task composer */}
            <div className="p-4 border-b border-white/[0.07] bg-white/[0.02]">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task title — e.g. Review my pricing page copy"
                className="w-full mb-2 px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
              <textarea
                value={newTaskInstructions}
                onChange={e => setNewTaskInstructions(e.target.value)}
                placeholder="Paste the content or describe exactly what the agent should do…"
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
                  Queue task
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {agentTasks.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No tasks yet. Queue one above — the agent runs them in order.
                </div>
              )}
              {agentTasks.map(task => {
                const style = statusStyles[task.status];
                const expanded = expandedTaskId === task.id;
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
    </div>
  );
}

function AgentModal({ userId, agent, onClose, onSaved }: {
  userId: string;
  agent: GradiAgent | null;
  onClose: () => void;
  onSaved: (agent: GradiAgent) => void;
}) {
  const [name, setName] = useState(agent?.name || '');
  const [emoji, setEmoji] = useState(agent?.emoji || '🤖');
  const [description, setDescription] = useState(agent?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || '');
  const [model, setModel] = useState(agent?.model || 'llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
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
                placeholder="e.g. Brand Critic"
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
              rows={6}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
            />
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
