import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Loader2, Check, AlertCircle, Inbox, Star, PenSquare,
  Trash2, RefreshCw, X, ChevronLeft, CornerUpLeft, Users, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MailRecord {
  id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  subject: string;
  html: string | null;
  text_body: string | null;
  status: string;
  error: string | null;
  is_read: boolean;
  is_starred: boolean;
  created_at: string;
}

type FolderId = 'inbox' | 'sent' | 'starred';

const FOLDERS: { id: FolderId; label: string; icon: React.ReactNode }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} /> },
  { id: 'sent', label: 'Sent', icon: <Send size={15} /> },
  { id: 'starred', label: 'Starred', icon: <Star size={15} /> },
];

export function AdminEmailClient() {
  const [emails, setEmails] = useState<MailRecord[]>([]);
  const [folder, setFolder] = useState<FolderId>('inbox');
  const [selected, setSelected] = useState<MailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<MailRecord | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const loadEmails = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    const { data } = await supabase
      .from('admin_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setEmails((data || []) as unknown as MailRecord[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadEmails(); }, [loadEmails]);

  const visible = emails.filter(e => {
    if (folder === 'inbox') return e.direction === 'inbound';
    if (folder === 'sent') return e.direction === 'outbound';
    return e.is_starred;
  });

  const unreadCount = emails.filter(e => e.direction === 'inbound' && !e.is_read).length;

  const openEmail = async (email: MailRecord) => {
    setSelected(email);
    if (!email.is_read) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      await supabase.from('admin_emails').update({ is_read: true }).eq('id', email.id);
    }
  };

  const toggleStar = async (email: MailRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !email.is_starred;
    setEmails(prev => prev.map(m => m.id === email.id ? { ...m, is_starred: next } : m));
    if (selected?.id === email.id) setSelected({ ...email, is_starred: next });
    await supabase.from('admin_emails').update({ is_starred: next }).eq('id', email.id);
  };

  const deleteEmail = async (email: MailRecord) => {
    if (!confirm('Delete this email?')) return;
    await supabase.from('admin_emails').delete().eq('id', email.id);
    setEmails(prev => prev.filter(m => m.id !== email.id));
    if (selected?.id === email.id) setSelected(null);
  };

  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/30 rounded-xl flex items-center justify-center">
            <Mail className="text-blue-300" size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Mail</h2>
            <p className="text-xs text-gray-500">noreply@grraphic.xyz via Resend</p>
          </div>
        </div>
        <button
          onClick={() => { setReplyTo(null); setShowCompose(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all"
        >
          <PenSquare size={15} />
          Compose
        </button>
      </div>

      <div className="flex flex-col sm:flex-row rounded-2xl bg-[#12121a] border border-white/[0.08] overflow-hidden" style={{ height: '640px' }}>
        {/* Folders */}
        <div className="w-full sm:w-44 border-b sm:border-b-0 sm:border-r border-white/[0.07] p-2 sm:p-3 flex sm:flex-col gap-1 sm:space-y-1 flex-shrink-0 overflow-x-auto">
          {FOLDERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setFolder(f.id); setSelected(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                folder === f.id ? 'bg-violet-500/15 text-violet-200' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {f.icon}
              <span className="flex-1 text-left">{f.label}</span>
              {f.id === 'inbox' && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-violet-500/25 text-violet-200 text-[10px] font-mono">{unreadCount}</span>
              )}
            </button>
          ))}
          <div className="sm:pt-2 sm:mt-2 sm:border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={() => loadEmails(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Message list */}
        <div className={`${selected ? 'hidden lg:block lg:w-80' : 'flex-1'} border-r border-white/[0.07] overflow-y-auto sm:flex-shrink-0 min-h-0`}>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-violet-400" size={22} /></div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">
              {folder === 'inbox' ? (
                <>
                  <Inbox size={28} className="mx-auto mb-3 text-gray-600" />
                  Inbox is empty. Inbound mail arrives here once the Resend
                  inbound webhook is configured.
                </>
              ) : folder === 'sent' ? 'Nothing sent yet.' : 'No starred mail.'}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {visible.map(email => (
                <button
                  key={email.id}
                  onClick={() => openEmail(email)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/[0.04] ${
                    selected?.id === email.id ? 'bg-violet-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <button onClick={(e) => toggleStar(email, e)} className="flex-shrink-0">
                      <Star size={13} className={email.is_starred ? 'text-amber-400 fill-amber-400' : 'text-gray-600 hover:text-gray-400'} />
                    </button>
                    <span className={`flex-1 text-sm truncate ${email.direction === 'inbound' && !email.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {email.direction === 'inbound'
                        ? (email.from_name || email.from_email)
                        : `To: ${email.to_emails.slice(0, 2).join(', ')}${email.to_emails.length > 2 ? ` +${email.to_emails.length - 2}` : ''}`}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono flex-shrink-0">{timeLabel(email.created_at)}</span>
                  </div>
                  <div className={`text-sm truncate pl-5 ${email.direction === 'inbound' && !email.is_read ? 'text-gray-200' : 'text-gray-500'}`}>
                    {email.subject || '(no subject)'}
                  </div>
                  {email.status === 'failed' && (
                    <div className="pl-5 mt-0.5 text-[11px] text-red-400">failed to send</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reading pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {selected ? (
            <>
              <div className="p-4 border-b border-white/[0.07] flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button onClick={() => setSelected(null)} className="lg:hidden mb-2 text-gray-400 hover:text-white">
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-display font-semibold text-white text-lg leading-snug">{selected.subject || '(no subject)'}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selected.direction === 'inbound'
                      ? <>From <span className="text-gray-300">{selected.from_name ? `${selected.from_name} <${selected.from_email}>` : selected.from_email}</span></>
                      : <>To <span className="text-gray-300">{selected.to_emails.join(', ')}</span></>}
                    {' · '}{new Date(selected.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {selected.direction === 'inbound' && (
                    <button
                      onClick={() => { setReplyTo(selected); setShowCompose(true); }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                      title="Reply"
                    >
                      <CornerUpLeft size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleStar(selected)}
                    className="p-2 text-gray-400 hover:text-amber-300 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Star size={16} className={selected.is_starred ? 'text-amber-400 fill-amber-400' : ''} />
                  </button>
                  <button
                    onClick={() => deleteEmail(selected)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {selected.html ? (
                  <div className="bg-white rounded-xl overflow-hidden">
                    <iframe
                      title="email"
                      sandbox=""
                      srcDoc={selected.html}
                      className="w-full h-[480px] border-0"
                    />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-gray-200 font-sans leading-relaxed">
                    {selected.text_body || '(empty message)'}
                  </pre>
                )}
                {selected.error && (
                  <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                    {selected.error}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <Mail size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a message to read it</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          replyTo={replyTo}
          onClose={() => setShowCompose(false)}
          onSent={(record) => {
            setEmails(prev => [record, ...prev]);
            setShowCompose(false);
            showToast('success', `Sent to ${record.to_emails.length} recipient${record.to_emails.length !== 1 ? 's' : ''}`);
          }}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm backdrop-blur-md animate-slide-up ${
          toast.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-500/15 border border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
          {toast.text}
        </div>
      )}
    </div>
  );
}

function ComposeModal({ replyTo, onClose, onSent, onError }: {
  replyTo: MailRecord | null;
  onClose: () => void;
  onSent: (record: MailRecord) => void;
  onError: (msg: string) => void;
}) {
  const [recipientType, setRecipientType] = useState<'manual' | 'all-users' | 'verified-only'>('manual');
  const [recipients, setRecipients] = useState(replyTo ? replyTo.from_email : '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      onError('Subject and message are required');
      return;
    }

    let emailList: string[] = [];
    if (recipientType === 'manual') {
      emailList = recipients.split(/[\n,]/).map(e => e.trim()).filter(e => e.includes('@'));
      if (emailList.length === 0) {
        onError('Enter at least one valid email address');
        return;
      }
    } else {
      let query = supabase.from('profiles').select('email').not('email', 'is', null);
      if (recipientType === 'verified-only') query = query.eq('is_verified', true);
      const { data: profiles, error } = await query;
      if (error) {
        onError('Failed to fetch users');
        return;
      }
      emailList = (profiles?.map(p => p.email) || []).filter((e): e is string => !!e);
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const html = body.includes('<') ? body : body.replace(/\n/g, '<br/>');

      const response = await fetch('/api/request.bot/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ to: emailList, subject, body: html, fromName: 'Grraphic' }),
      });

      const result = await response.json();
      const ok = response.ok;

      // Record in the mailbox either way so failures are visible
      const { data: record } = await supabase
        .from('admin_emails')
        .insert({
          direction: 'outbound',
          from_email: 'noreply@grraphic.xyz',
          from_name: 'Grraphic',
          to_emails: emailList,
          subject,
          html,
          status: ok ? 'sent' : 'failed',
          error: ok ? null : (result.error || 'Send failed'),
          resend_id: result.id || null,
          is_read: true,
        })
        .select()
        .single();

      if (ok && record) {
        onSent(record as unknown as MailRecord);
      } else {
        onError(result.error || 'Failed to send email');
        if (record) onSent(record as unknown as MailRecord);
      }
    } catch {
      onError('Error sending email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h3 className="font-display font-semibold text-white">{replyTo ? 'Reply' : 'New message'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          {!replyTo && (
            <div className="flex gap-2">
              {([
                ['manual', 'Manual', <Mail key="m" size={13} />],
                ['all-users', 'All users', <Users key="a" size={13} />],
                ['verified-only', 'Verified', <ShieldCheck key="v" size={13} />],
              ] as const).map(([id, label, icon]) => (
                <button
                  key={id}
                  onClick={() => setRecipientType(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    recipientType === id
                      ? 'bg-violet-500/25 text-violet-200 border border-violet-500/40'
                      : 'bg-white/[0.05] text-gray-400 border border-white/[0.08] hover:text-white'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          )}

          {recipientType === 'manual' && (
            <input
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              placeholder="To — comma or newline separated"
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
            />
          )}

          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50"
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message… (plain text or HTML)"
            rows={12}
            className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/[0.08]">
          <button onClick={onClose} className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors">
            Discard
          </button>
          <button
            onClick={send}
            disabled={sending || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-lg text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
