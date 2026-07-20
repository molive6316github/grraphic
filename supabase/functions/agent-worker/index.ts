// 24/7 Gradi agent worker.
//
// Runs queued agent tasks server-side with tool calling (web search, page
// fetch, email-the-owner, project read/write). Invoked two ways:
//   1. pg_cron every minute with the x-worker-secret header (24/7 loop)
//   2. the app right after queueing a task, with the user's JWT (instant run)
//
// Required function secrets:
//   WORKER_SECRET   - must match the value in the pg_cron job
//   GROQ_API_KEY    - server-side Groq key for the agent LLM
//   RESEND_API_KEY  - only needed for the email tool
//   TAVILY_API_KEY  - optional, better web search (falls back to DuckDuckGo)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const MAX_TASKS_PER_INVOCATION = 3;
const MAX_TOOL_ROUNDS = 6;
const TIME_BUDGET_MS = 110_000;

type Step = { at: string; tool: string; input: unknown; output: string };

const service = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ---------- tools ----------

async function webSearch(query: string): Promise<string> {
  const tavilyKey = Deno.env.get('TAVILY_API_KEY');
  if (tavilyKey) {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: tavilyKey, query, max_results: 5, include_answer: true }),
    });
    if (res.ok) {
      const data = await res.json();
      const results = (data.results || []).map((r: { title: string; url: string; content: string }) =>
        `- ${r.title} (${r.url})\n  ${r.content?.slice(0, 300)}`).join('\n');
      return `${data.answer ? `Answer: ${data.answer}\n\n` : ''}Results:\n${results}`.slice(0, 4000);
    }
  }
  // Keyless fallback: DuckDuckGo lite HTML
  const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrraphicAgent/1.0)' },
  });
  const html = await res.text();
  const results: string[] = [];
  const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null && results.length < 6) {
    const title = m[2].replace(/<[^>]+>/g, '').trim();
    let url = m[1];
    const uddg = url.match(/uddg=([^&]+)/);
    if (uddg) url = decodeURIComponent(uddg[1]);
    if (title) results.push(`- ${title} (${url})`);
  }
  return results.length ? `Results:\n${results.join('\n')}` : 'No results found.';
}

async function fetchUrl(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) return 'Error: only http(s) URLs are supported.';
  // Proxy through r.jina.ai so we get readable text and never touch
  // internal networks directly (SSRF guard)
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrraphicAgent/1.0)' },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  return text.slice(0, 8000);
}

async function sendOwnerEmail(ownerEmail: string, subject: string, bodyHtml: string): Promise<string> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return 'Error: email is not configured on the server (RESEND_API_KEY missing).';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Gradi Agent <noreply@grraphic.xyz>',
      to: [ownerEmail],
      subject: `[Agent] ${subject}`,
      html: bodyHtml,
    }),
  });
  const data = await res.json();
  return res.ok ? `Email sent to ${ownerEmail} (id ${data.id}).` : `Email failed: ${data.message || res.status}`;
}

// ---------- agent loop ----------

interface AgentRow {
  id: string; user_id: string; name: string; system_prompt: string; model: string;
  temperature: number; project_id: string | null;
  can_email: boolean | null; can_search: boolean | null; can_use_project: boolean | null;
}
interface TaskRow { id: string; agent_id: string; user_id: string; title: string; instructions: string; steps: Step[] | null }

function buildTools(agent: AgentRow) {
  const tools: Record<string, unknown>[] = [];
  if (agent.can_search !== false) {
    tools.push({
      type: 'function',
      function: {
        name: 'web_search',
        description: 'Search the web for current information. Returns titles, URLs, and snippets.',
        parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    }, {
      type: 'function',
      function: {
        name: 'fetch_url',
        description: 'Fetch a web page and return its readable text content (truncated).',
        parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      },
    });
  }
  if (agent.can_email) {
    tools.push({
      type: 'function',
      function: {
        name: 'send_email',
        description: "Send an email to the agent's owner (and only the owner). Use for reports, alerts, and digests.",
        parameters: {
          type: 'object',
          properties: { subject: { type: 'string' }, body_html: { type: 'string', description: 'HTML body' } },
          required: ['subject', 'body_html'],
        },
      },
    });
  }
  if (agent.project_id && agent.can_use_project !== false) {
    tools.push({
      type: 'function',
      function: {
        name: 'list_project_items',
        description: 'List the items (analyses, designs, palettes, code notes, links) in the linked project.',
        parameters: { type: 'object', properties: {} },
      },
    }, {
      type: 'function',
      function: {
        name: 'add_project_note',
        description: 'Save a note into the linked project so the owner and team can see it.',
        parameters: {
          type: 'object',
          properties: { title: { type: 'string' }, content: { type: 'string' } },
          required: ['title', 'content'],
        },
      },
    });
  }
  return tools;
}

async function execTool(name: string, args: Record<string, unknown>, agent: AgentRow, task: TaskRow): Promise<string> {
  const db = service();
  switch (name) {
    case 'web_search':
      return await webSearch(String(args.query ?? ''));
    case 'fetch_url':
      return await fetchUrl(String(args.url ?? ''));
    case 'send_email': {
      if (!agent.can_email) return 'Error: this agent is not allowed to send email.';
      const { data: owner } = await db.from('users').select('email').eq('id', agent.user_id).maybeSingle();
      if (!owner?.email) return 'Error: owner has no email on file.';
      return await sendOwnerEmail(owner.email, String(args.subject ?? 'Agent report'), String(args.body_html ?? ''));
    }
    case 'list_project_items': {
      if (!agent.project_id) return 'Error: no project linked.';
      const { data } = await db.from('project_items')
        .select('item_type, title, content')
        .eq('project_id', agent.project_id)
        .order('created_at')
        .limit(50);
      if (!data || data.length === 0) return 'The project is empty.';
      return data.map(i => {
        const extra = i.item_type === 'link' ? ` -> ${(i.content as { url?: string })?.url ?? ''}`
          : i.item_type === 'code_note' ? `\n${String((i.content as { code?: string })?.code ?? '').slice(0, 500)}`
          : '';
        return `[${i.item_type}] ${i.title}${extra}`;
      }).join('\n').slice(0, 6000);
    }
    case 'add_project_note': {
      if (!agent.project_id) return 'Error: no project linked.';
      const { error } = await db.from('project_items').insert({
        project_id: agent.project_id,
        item_type: 'code_note',
        title: String(args.title ?? 'Agent note'),
        content: { code: String(args.content ?? ''), language: 'markdown', by_agent: agent.name },
        added_by: task.user_id,
      });
      return error ? `Failed to save note: ${error.message}` : 'Note saved to project.';
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

async function runTask(task: TaskRow, deadline: number): Promise<void> {
  const db = service();
  const steps: Step[] = [];

  const recordStep = async (tool: string, input: unknown, output: string) => {
    steps.push({ at: new Date().toISOString(), tool, input, output: output.slice(0, 500) });
    await db.from('gradi_agent_tasks').update({ steps }).eq('id', task.id);
  };

  const fail = (message: string) =>
    db.from('gradi_agent_tasks')
      .update({ status: 'failed', error: message, steps, completed_at: new Date().toISOString() })
      .eq('id', task.id);

  const { data: agentRow } = await db.from('gradi_agents').select('*').eq('id', task.agent_id).maybeSingle();
  const agent = agentRow as unknown as AgentRow | null;
  if (!agent) { await fail('Agent no longer exists'); return; }

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) { await fail('GROQ_API_KEY is not configured on the agent-worker function'); return; }

  const tools = buildTools(agent);
  const messages: Record<string, unknown>[] = [
    {
      role: 'system',
      content: `${agent.system_prompt}\n\nYou are running as an autonomous background agent. Use your tools when they help. When you are done, reply with your final result as plain text/markdown - it will be saved for the owner.`,
    },
    { role: 'user', content: `Task: ${task.title}\n\n${task.instructions}` },
  ];

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      if (Date.now() > deadline) { await fail('Ran out of time budget; task requeued work may be incomplete'); return; }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: agent.model || 'llama-3.3-70b-versatile',
          messages,
          temperature: Number(agent.temperature ?? 0.7),
          max_tokens: 4000,
          ...(tools.length > 0 && round < MAX_TOOL_ROUNDS ? { tools, tool_choice: 'auto' } : {}),
        }),
      });

      if (!res.ok) { await fail(`Groq API error ${res.status}: ${(await res.text()).slice(0, 300)}`); return; }

      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) { await fail('Empty model response'); return; }

      const toolCalls = msg.tool_calls as { id: string; function: { name: string; arguments: string } }[] | undefined;

      if (toolCalls && toolCalls.length > 0) {
        messages.push(msg);
        for (const call of toolCalls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* keep empty */ }
          const output = await execTool(call.function.name, args, agent, task);
          await recordStep(call.function.name, args, output);
          messages.push({ role: 'tool', tool_call_id: call.id, content: output });
        }
        continue;
      }

      // Final answer
      await db.from('gradi_agent_tasks')
        .update({
          status: 'completed',
          result: String(msg.content ?? '').trim() || '(empty result)',
          steps,
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id);
      return;
    }
    await fail('Exceeded maximum tool rounds without a final answer');
  } catch (err) {
    await fail(err instanceof Error ? err.message : 'Unknown worker error');
  }
}

// ---------- entrypoint ----------

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Auth: cron secret OR a valid user JWT
  const workerSecret = Deno.env.get('WORKER_SECRET');
  const providedSecret = req.headers.get('x-worker-secret');
  let authorized = !!workerSecret && providedSecret === workerSecret;

  if (!authorized) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await service().auth.getUser(authHeader.replace('Bearer ', ''));
      authorized = !!user;
    }
  }
  if (!authorized) return new Response('Unauthorized', { status: 401 });

  const started = Date.now();
  const deadline = started + TIME_BUDGET_MS;
  const db = service();

  // 1) Recover tasks stuck by a crashed/timed-out worker
  await db.rpc('requeue_stuck_agent_tasks');

  // 2) Enqueue due recurring schedules
  const { data: due } = await db.from('gradi_agent_schedules')
    .select('*')
    .eq('is_active', true)
    .lte('next_run_at', new Date().toISOString())
    .limit(20);

  for (const s of due || []) {
    await db.from('gradi_agent_tasks').insert({
      agent_id: s.agent_id,
      user_id: s.user_id,
      title: s.title,
      instructions: s.instructions,
    });
    await db.from('gradi_agent_schedules').update({
      last_run_at: new Date().toISOString(),
      next_run_at: new Date(Date.now() + s.interval_minutes * 60_000).toISOString(),
    }).eq('id', s.id);
  }

  // 3) Work the queue
  let processed = 0;
  while (processed < MAX_TASKS_PER_INVOCATION && Date.now() < deadline - 15_000) {
    const { data: claimed } = await db.rpc('claim_next_agent_task');
    const task = (Array.isArray(claimed) ? claimed[0] : claimed) as TaskRow | undefined;
    if (!task) break;
    await runTask(task, deadline);
    processed++;
  }

  return new Response(
    JSON.stringify({ processed, schedules_enqueued: (due || []).length, ms: Date.now() - started }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
