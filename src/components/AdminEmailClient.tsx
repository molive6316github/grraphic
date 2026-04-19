import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Loader2, Check, AlertCircle, Star, Inbox,
  RefreshCw, Search, Pencil, X, ChevronLeft, Users, UserCheck,
  Trash2, CornerUpLeft, Megaphone, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Folder = 'sent' | 'starred' | 'broadcast';

interface EmailSummary {
  id: string;
  folder: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  subject: string;
  is_read: boolean;
  is_starred: boolean;
  sent_at: string;
  resend_id: string | null;
}

interface EmailFull extends EmailSummary {
  body_html: string;
  body_text: string | null;
  reply_to_id: string | null;
}

interface ComposeData {
  to: string;
  subject: string;
  body: string;
  replyToId?: string;
  recipientType: 'manual' | 'all-users' | 'verified-only';
}

const FOLDERS: { key: Folder; label: string; icon: React.ReactNode }[] = [
  { key: 'sent', label: 'Sent', icon: <Send size={16} /> },
  { key: 'starred', label: 'Starred', icon: <Star size={16} /> },
  { key: 'broadcast', label: 'Broadcast', icon: <Megaphone size={16} /> },
];

export function AdminEmailClient() {
  const [activeFolder, setActiveFolder] = useState<Folder>('sent');
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeData>({
    to: '', subject: '', body: '', recipientType: 'manual'
  });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [total, setTotal] = useState(0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({ folder: activeFolder, search });
      const res = await fetch(`/api/request.bot/email/list?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeFolder, search]);

  useEffect(() => {
    fetchEmails();
    setSelectedEmail(null);
  }, [fetchEmails]);

  const openEmail = async (summary: EmailSummary) => {
    // Fetch full email body from DB
    const { data } = await supabase
      .from('admin_emails')
      .select('*')
      .eq('id', summary.id)
      .single();
    if (data) setSelectedEmail(data as EmailFull);
  };

  const toggleStar = async (e: React.MouseEvent, email: EmailSummary) => {
    e.stopPropagation();
    await supabase
      .from('admin_emails')
      .update({ is_starred: !email.is_starred })
      .eq('id', email.id);
    setEmails(prev => prev.map(em =>
      em.id === email.id ? { ...em, is_starred: !em.is_starred } : em
    ));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => prev ? { ...prev, is_starred: !prev.is_starred } : null);
    }
  };

  const deleteEmail = async (id: string) => {
    await supabase.from('admin_emails').delete().eq('id', id);
    setEmails(prev => prev.filter(em => em.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    showToast('success', 'Email deleted');
  };

  const handleSend = async () => {
    if (!compose.subject.trim() || !compose.body.trim()) {
      showToast('error', 'Please fill in subject and body');
      return;
    }

    let toEmails: string[] = [];

    if (compose.recipientType === 'manual') {
      if (!compose.to.trim()) { showToast('error', 'Enter at least one recipient'); return; }
      toEmails = compose.to.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    } else if (compose.recipientType === 'all-users') {
      const { data } = await supabase.from('profiles').select('email').not('email', 'is', null);
      toEmails = data?.map(p => p.email).filter(Boolean) || [];
    } else {
      const { data } = await supabase.from('profiles').select('email').eq('is_verified', true).not('email', 'is', null);
      toEmails = data?.map(p => p.email).filter(Boolean) || [];
    }

    if (toEmails.length === 0) { showToast('error', 'No recipients found'); return; }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isBroadcast = compose.recipientType !== 'manual';

      const res = await fetch('/api/request.bot/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          to: toEmails,
          subject: compose.subject,
          body: compose.body,
          fromName: 'Grraphic',
          folder: isBroadcast ? 'broadcast' : 'sent',
          replyToId: compose.replyToId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', `Sent to ${toEmails.length} recipient${toEmails.length !== 1 ? 's' : ''}`);
        setComposing(false);
        setCompose({ to: '', subject: '', body: '', recipientType: 'manual' });
        fetchEmails();
      } else {
        showToast('error', data.error || 'Failed to send');
      }
    } catch {
      showToast('error', 'Error sending email');
    } finally {
      setSending(false);
    }
  };

  const startReply = (email: EmailFull) => {
    setCompose({
      to: email.from_address === 'noreply@grraphic.xyz'
        ? email.to_addresses[0] || ''
        : email.from_address,
      subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
      body: `\n\n---\nOn ${new Date(email.sent_at).toLocaleString()}, ${email.from_address} wrote:\n${email.body_text || ''}`,
      replyToId: email.id,
      recipientType: 'manual'
    });
    setComposing(true);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] bg-[#0d0d14] rounded-2xl border border-white/[0.08] overflow-hidden">

      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0a0a10]">
        <div className="p-4">
          <button
            onClick={() => { setComposing(true); setSelectedEmail(null); setCompose({ to: '', subject: '', body: '', recipientType: 'manual' }); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl text-white font-medium transition-all"
          >
            <Pencil size={16} />
            Compose
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {FOLDERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); setComposing(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFolder === f.key
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
              }`}
            >
              <span className={activeFolder === f.key ? 'text-violet-400' : 'text-gray-500'}>
                {f.icon}
              </span>
              {f.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.05]">
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-500 mb-1">Sending from</p>
            <p className="text-gray-400 break-all">noreply@grraphic.xyz</p>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className={`${selectedEmail || composing ? 'w-72 flex-shrink-0' : 'flex-1'} border-r border-white/[0.08] flex flex-col`}>
        {/* Toolbar */}
        <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <Search size={14} className="text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search emails..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
            />
          </div>
          <button onClick={fetchEmails} className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Folder title */}
        <div className="px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {FOLDERS.find(f => f.key === activeFolder)?.label}
          </span>
          <span className="text-xs text-gray-600">{total}</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="animate-spin text-gray-600" size={20} />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600">
              <Mail size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No emails</p>
            </div>
          ) : (
            emails.map(email => (
              <button
                key={email.id}
                onClick={() => { openEmail(email); setComposing(false); }}
                className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                  selectedEmail?.id === email.id ? 'bg-violet-600/10 border-l-2 border-l-violet-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
                    {email.to_addresses.length > 1
                      ? `${email.to_addresses[0]} +${email.to_addresses.length - 1}`
                      : email.to_addresses[0]}
                  </span>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={e => toggleStar(e, email)}
                      className={`transition-colors ${email.is_starred ? 'text-amber-400' : 'text-gray-700 hover:text-gray-400'}`}
                    >
                      <Star size={13} fill={email.is_starred ? 'currentColor' : 'none'} />
                    </button>
                    <span className="text-xs text-gray-600">{formatDate(email.sent_at)}</span>
                  </div>
                </div>
                <p className={`text-xs truncate ${!email.is_read ? 'text-gray-300' : 'text-gray-500'}`}>
                  {email.subject}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email detail / Compose */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {composing ? (
          /* Compose panel */
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-white font-semibold">New Message</h3>
              <button onClick={() => setComposing(false)} className="text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Recipient type */}
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Send to</label>
                <div className="flex gap-2">
                  {[
                    { v: 'manual', icon: <Mail size={14} />, label: 'Manual' },
                    { v: 'all-users', icon: <Users size={14} />, label: 'All Users' },
                    { v: 'verified-only', icon: <UserCheck size={14} />, label: 'Verified' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setCompose(c => ({ ...c, recipientType: opt.v as ComposeData['recipientType'] }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        compose.recipientType === opt.v
                          ? 'bg-violet-600 text-white'
                          : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08]'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {compose.recipientType === 'manual' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">To</label>
                  <textarea
                    value={compose.to}
                    onChange={e => setCompose(c => ({ ...c, to: e.target.value }))}
                    placeholder="Emails separated by comma or new line..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  value={compose.subject}
                  onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))}
                  placeholder="Subject line..."
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Body (HTML supported)</label>
                <textarea
                  value={compose.body}
                  onChange={e => setCompose(c => ({ ...c, body: e.target.value }))}
                  placeholder="Write your message here... HTML is supported."
                  rows={14}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 resize-none font-mono"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
              <p className="text-xs text-gray-600">From: noreply@grraphic.xyz</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setComposing(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg text-gray-300 text-sm transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        ) : selectedEmail ? (
          /* Email detail */
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h3 className="flex-1 text-white font-semibold truncate">{selectedEmail.subject}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => toggleStar(e, selectedEmail)}
                  className={`p-1.5 transition-colors ${selectedEmail.is_starred ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
                >
                  <Star size={16} fill={selectedEmail.is_starred ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => startReply(selectedEmail)}
                  className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Reply"
                >
                  <CornerUpLeft size={16} />
                </button>
                <button
                  onClick={() => deleteEmail(selectedEmail.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-white/[0.04] space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(selectedEmail.from_name || selectedEmail.from_address).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">
                    {selectedEmail.from_name || selectedEmail.from_address}
                  </p>
                  <p className="text-xs text-gray-500">
                    to {selectedEmail.to_addresses.length > 3
                      ? `${selectedEmail.to_addresses.slice(0, 3).join(', ')} +${selectedEmail.to_addresses.length - 3} more`
                      : selectedEmail.to_addresses.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock size={12} />
                  {new Date(selectedEmail.sent_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
              />
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => startReply(selectedEmail)}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] rounded-lg text-gray-300 text-sm transition-colors"
              >
                <CornerUpLeft size={15} />
                Reply
              </button>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <Mail size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">Select an email to read</p>
            <p className="text-sm mt-1">or compose a new message</p>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg z-50 ${
          toast.type === 'success'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span className="text-sm">{toast.text}</span>
        </div>
      )}
    </div>
  );
}
