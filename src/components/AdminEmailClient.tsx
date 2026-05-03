import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Loader2, Check, AlertCircle,
  Bold, Italic, Underline, List, ListOrdered,
  Link, X, Clock, Trash2, RefreshCw,
  Strikethrough, Users, UserCheck, PenSquare,
  Inbox, Star, Reply, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type View = 'inbox' | 'compose' | 'sent' | 'drafts';
type RecipientType = 'manual' | 'all-users' | 'verified-only';

const FROM_ADDRESSES = [
  'noreply@grraphic.xyz',
  'admin@grraphic.xyz',
  'support@grraphic.xyz',
  'info@grraphic.xyz',
  'hello@grraphic.xyz',
] as const;

type FromAddress = typeof FROM_ADDRESSES[number];

interface ReceivedEmail {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  reply_to: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  received_at: string;
  is_read: boolean;
  starred: boolean;
}

interface SentEmail {
  id: string;
  recipients: string[];
  subject: string;
  body: string;
  recipient_type: string;
  recipient_count: number;
  from_address: string;
  sent_at: string;
}

interface Draft {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  recipientType: RecipientType;
  fromAddress: FromAddress;
  savedAt: string;
}

const DRAFT_KEY = 'admin_email_drafts';

const stripHtml = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);

export function AdminEmailClient() {
  const [view, setView] = useState<View>('inbox');

  // List selection (derived from arrays for auto-sync)
  const [selectedInboxId, setSelectedInboxId] = useState<string | null>(null);
  const [selectedSentId, setSelectedSentId] = useState<string | null>(null);

  // Compose fields
  const [fromAddress, setFromAddress] = useState<FromAddress>(FROM_ADDRESSES[0]);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [toInput, setToInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('manual');
  const [bodyEmpty, setBodyEmpty] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);

  // Status
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);

  // Data
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Derived selections
  const selectedInbox = receivedEmails.find(e => e.id === selectedInboxId) ?? null;
  const selectedSent  = sentEmails.find(e => e.id === selectedSentId) ?? null;
  const unreadCount   = receivedEmails.filter(e => !e.is_read).length;

  const loadSentEmails = useCallback(async () => {
    setLoadingSent(true);
    const { data } = await supabase
      .from('sent_emails')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50);
    if (data) setSentEmails(data);
    setLoadingSent(false);
  }, []);

  const loadInbox = useCallback(async () => {
    setLoadingInbox(true);
    const { data } = await supabase
      .from('received_emails')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(100);
    if (data) setReceivedEmails(data);
    setLoadingInbox(false);
  }, []);

  const loadDrafts = useCallback(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setDrafts(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    loadInbox();
    loadSentEmails();
    loadDrafts();
  }, [loadInbox, loadSentEmails, loadDrafts]);

  const markAsRead = async (id: string) => {
    setReceivedEmails(prev => prev.map(e => e.id === id ? { ...e, is_read: true } : e));
    await supabase.from('received_emails').update({ is_read: true }).eq('id', id);
  };

  const toggleStar = async (id: string) => {
    const email = receivedEmails.find(e => e.id === id);
    if (!email) return;
    const starred = !email.starred;
    setReceivedEmails(prev => prev.map(e => e.id === id ? { ...e, starred } : e));
    await supabase.from('received_emails').update({ starred }).eq('id', id);
  };

  const openInboxEmail = (email: ReceivedEmail) => {
    setSelectedInboxId(email.id);
    if (!email.is_read) markAsRead(email.id);
  };

  const replyToEmail = (email: ReceivedEmail) => {
    const replyTo = email.reply_to || email.from_email;
    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    const quoted = email.body_html
      ? `<br><br><blockquote style="border-left:2px solid #444;padding-left:12px;color:#888;margin:0">${email.body_html}</blockquote>`
      : email.body_text
      ? `<br><br><blockquote style="border-left:2px solid #444;padding-left:12px;color:#888;margin:0">${email.body_text.replace(/\n/g, '<br>')}</blockquote>`
      : '';

    setToEmails([replyTo]);
    setToInput('');
    setCcEmails([]); setBccEmails([]);
    setSubject(replySubject);
    setRecipientType('manual');
    setShowCc(false); setShowBcc(false);
    const addr = (FROM_ADDRESSES as readonly string[]).includes(email.to_email)
      ? email.to_email as FromAddress
      : FROM_ADDRESSES[0];
    setFromAddress(addr);
    if (editorRef.current) {
      editorRef.current.innerHTML = quoted;
      setBodyEmpty(false);
    }
    setStatus(null);
    setView('compose');
  };

  // Rich text
  const applyFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) applyFormat('createLink', url);
  };

  // Chip helpers
  const addChip = (
    raw: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    const email = raw.trim().replace(/,+$/, '');
    if (email && !list.includes(email)) setList([...list, email]);
    setInput('');
  };

  const onChipKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void,
  ) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      addChip(input, setInput, list, setList);
    } else if (e.key === 'Backspace' && !input && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  // Draft save/load
  const saveDraft = useCallback(() => {
    const body = editorRef.current?.innerHTML || '';
    if (!subject && !body && toEmails.length === 0) return;
    const draft: Draft = {
      id: Date.now().toString(),
      to: toEmails, cc: ccEmails, bcc: bccEmails,
      subject, body, recipientType, fromAddress,
      savedAt: new Date().toISOString(),
    };
    const existing: Draft[] = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
    const updated = [draft, ...existing.slice(0, 9)];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    setDrafts(updated);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [toEmails, ccEmails, bccEmails, subject, recipientType, fromAddress]);

  const loadDraft = (draft: Draft) => {
    setToEmails(draft.to);
    setCcEmails(draft.cc);
    setBccEmails(draft.bcc);
    setSubject(draft.subject);
    setRecipientType(draft.recipientType);
    setFromAddress(draft.fromAddress ?? FROM_ADDRESSES[0]);
    setShowCc(draft.cc.length > 0);
    setShowBcc(draft.bcc.length > 0);
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.body;
      setBodyEmpty(!draft.body.trim());
    }
    setView('compose');
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
  };

  const clearCompose = () => {
    setSubject('');
    setToEmails([]); setCcEmails([]); setBccEmails([]);
    setToInput(''); setCcInput(''); setBccInput('');
    setShowCc(false); setShowBcc(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setBodyEmpty(true);
    setStatus(null);
  };

  const getRecipients = async (): Promise<string[]> => {
    if (recipientType === 'manual') return toEmails;
    const { data } = recipientType === 'verified-only'
      ? await supabase.from('profiles').select('email').eq('is_verified', true).not('email', 'is', null)
      : await supabase.from('profiles').select('email').not('email', 'is', null);
    return (data ?? []).map((p: { email: string }) => p.email).filter(Boolean);
  };

  const handleSend = async () => {
    const body = editorRef.current?.innerHTML || '';
    if (!subject.trim()) { setStatus({ type: 'error', text: 'Subject is required' }); return; }
    if (!body.trim() || body === '<br>') { setStatus({ type: 'error', text: 'Message is required' }); return; }

    const recipients = await getRecipients();
    if (recipients.length === 0) { setStatus({ type: 'error', text: 'No recipients found' }); return; }

    setSending(true);
    setStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const prefix = fromAddress.split('@')[0];
      const fromName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

      const response = await fetch('/api/request.bot/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ to: recipients, subject, body, fromAddress, fromName }),
      });

      const result = await response.json();

      if (response.ok) {
        await supabase.from('sent_emails').insert({
          recipients, subject, body, from_address: fromAddress,
          recipient_type: recipientType,
          recipient_count: recipients.length,
        });
        setStatus({ type: 'success', text: `Sent to ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''}` });
        clearCompose();
        loadSentEmails();
      } else {
        setStatus({ type: 'error', text: result.error || 'Failed to send' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Error sending email' });
    } finally {
      setSending(false);
    }
  };

  // ── Shared sub-components ───────────────────────────────────────────────────

  const EmailChip = ({ email, onRemove }: { email: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/25 border border-blue-500/40 rounded-full text-blue-200 text-xs">
      {email}
      <button onClick={onRemove} className="hover:text-white ml-0.5"><X size={11} /></button>
    </span>
  );

  const ChipRow = ({
    label, chips, input, setInput, setChips, right,
  }: {
    label: string; chips: string[]; input: string;
    setInput: (v: string) => void; setChips: (v: string[]) => void;
    right?: React.ReactNode;
  }) => (
    <div className="flex items-start gap-2 px-4 py-2 border-b border-white/[0.05] min-h-[40px]">
      <span className="text-gray-500 text-xs w-10 pt-1.5 flex-shrink-0">{label}</span>
      <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[24px]">
        {chips.map(e => (
          <EmailChip key={e} email={e} onRemove={() => setChips(chips.filter(c => c !== e))} />
        ))}
        <input
          value={input}
          onChange={ev => setInput(ev.target.value)}
          onKeyDown={ev => onChipKey(ev, input, setInput, chips, setChips)}
          onBlur={() => input.trim() && addChip(input, setInput, chips, setChips)}
          placeholder={chips.length === 0 ? 'Recipients...' : ''}
          className="flex-1 min-w-[100px] bg-transparent text-white text-sm outline-none placeholder-gray-600"
        />
      </div>
      {right}
    </div>
  );

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[580px] rounded-xl border border-white/[0.08] overflow-hidden bg-[#0c0c13]">

      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-white/[0.06] p-3 flex flex-col gap-0.5">
        <button
          onClick={() => { clearCompose(); setView('compose'); }}
          className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-[#1c1c2e] hover:bg-[#22223a] border border-white/[0.1] rounded-2xl text-white text-sm font-medium transition-colors w-full"
        >
          <PenSquare size={16} />
          Compose
        </button>

        {([
          { id: 'inbox'  as View, icon: Inbox, label: 'Inbox',  count: unreadCount,    countClass: 'text-blue-300 bg-blue-400/15 font-semibold' },
          { id: 'sent'   as View, icon: Send,  label: 'Sent',   count: 0,              countClass: '' },
          { id: 'drafts' as View, icon: Clock, label: 'Drafts', count: drafts.length,  countClass: 'text-yellow-400 bg-yellow-400/10' },
        ] as const).map(({ id, icon: Icon, label, count, countClass }) => (
          <button
            key={id}
            onClick={() => {
              setView(id);
              if (id === 'sent')  { loadSentEmails(); setSelectedSentId(null); }
              if (id === 'inbox') { loadInbox();      setSelectedInboxId(null); }
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-full text-sm transition-colors w-full ${
              view === id ? 'bg-blue-600/20 text-blue-300 font-medium' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={15} />
              {label}
            </div>
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${countClass}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Inbox ── */}
      {view === 'inbox' && (
        <div className="flex flex-1 overflow-hidden">

          {/* List pane */}
          <div className={`flex flex-col overflow-hidden border-r border-white/[0.05] ${selectedInbox ? 'w-72' : 'flex-1'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <span className="text-white text-sm font-medium">Inbox</span>
              <button onClick={loadInbox} className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/[0.05] transition-colors">
                <RefreshCw size={13} className={loadingInbox ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingInbox ? (
                <div className="flex justify-center items-center h-24 text-gray-600">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : receivedEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
                  <Inbox size={22} />
                  <p className="text-xs">No emails yet</p>
                  <p className="text-xs text-gray-700">Add MX record → inbound.resend.com</p>
                </div>
              ) : receivedEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => openInboxEmail(email)}
                  className={`w-full text-left px-3 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                    selectedInbox?.id === email.id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    {email.starred && <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                    <span className={`flex-1 text-sm truncate ${!email.is_read ? 'text-white font-semibold' : 'text-gray-300'}`}>
                      {email.from_name || email.from_email}
                    </span>
                    <span className="text-xs text-gray-600 flex-shrink-0">{fmtDate(email.received_at)}</span>
                  </div>
                  <p className={`text-xs truncate ${!email.is_read ? 'text-gray-200' : 'text-gray-500'}`}>{email.subject}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {email.body_text ? email.body_text.slice(0, 80) : stripHtml(email.body_html || '')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail pane */}
          {selectedInbox && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-white font-medium leading-snug">{selectedInbox.subject}</h2>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleStar(selectedInbox.id)}
                      title={selectedInbox.starred ? 'Unstar' : 'Star'}
                      className="p-1.5 rounded hover:bg-white/[0.05] transition-colors"
                    >
                      <Star size={15} className={selectedInbox.starred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-gray-300'} />
                    </button>
                    <button
                      onClick={() => replyToEmail(selectedInbox)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] rounded-full transition-colors"
                    >
                      <Reply size={12} />
                      Reply
                    </button>
                    <button
                      onClick={() => setSelectedInboxId(null)}
                      className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/[0.05] transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  {[
                    { label: 'From', value: selectedInbox.from_name ? `${selectedInbox.from_name} <${selectedInbox.from_email}>` : selectedInbox.from_email },
                    { label: 'To', value: selectedInbox.to_email },
                    { label: 'Date', value: new Date(selectedInbox.received_at).toLocaleString() },
                    ...(selectedInbox.reply_to ? [{ label: 'Reply-To', value: selectedInbox.reply_to }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-gray-600 w-16 text-right flex-shrink-0">{label}:</span>
                      <span className="text-gray-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="flex-1 overflow-y-auto p-6 text-white text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: selectedInbox.body_html
                    || (selectedInbox.body_text
                      ? `<pre style="white-space:pre-wrap;font-family:inherit">${selectedInbox.body_text}</pre>`
                      : '<em style="color:#666">No content</em>'),
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Compose ── */}
      {view === 'compose' && (
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* From dropdown */}
          <div className="relative px-4 py-2.5 border-b border-white/[0.05] bg-[#0a0a11]">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs w-10 flex-shrink-0">From</span>
              <button
                onClick={() => setShowFromMenu(v => !v)}
                className="flex items-center gap-1.5 text-sm text-gray-200 hover:text-white transition-colors"
              >
                {fromAddress}
                <ChevronDown size={13} className="text-gray-500" />
              </button>
            </div>
            {showFromMenu && (
              <div className="absolute top-full left-4 mt-1 z-10 bg-[#18182a] border border-white/[0.1] rounded-lg shadow-xl overflow-hidden min-w-[230px]">
                {FROM_ADDRESSES.map(addr => (
                  <button
                    key={addr}
                    onClick={() => { setFromAddress(addr); setShowFromMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      fromAddress === addr ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {addr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Audience selector */}
          <div className="px-4 py-2 border-b border-white/[0.05] bg-[#0a0a11]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 text-xs">To:</span>
              {(['manual', 'all-users', 'verified-only'] as RecipientType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setRecipientType(t)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    recipientType === t ? 'bg-blue-600 text-white' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {t === 'all-users' && <Users size={10} />}
                  {t === 'verified-only' && <UserCheck size={10} />}
                  {t === 'manual' ? 'Manual' : t === 'all-users' ? 'All Users' : 'Verified'}
                </button>
              ))}
            </div>
          </div>

          {recipientType === 'manual' && (
            <ChipRow
              label="To"
              chips={toEmails} input={toInput}
              setInput={setToInput} setChips={setToEmails}
              right={
                <div className="flex gap-2 ml-2 flex-shrink-0 pt-1">
                  {!showCc  && <button onClick={() => setShowCc(true)}  className="text-xs text-gray-600 hover:text-blue-400">Cc</button>}
                  {!showBcc && <button onClick={() => setShowBcc(true)} className="text-xs text-gray-600 hover:text-blue-400">Bcc</button>}
                </div>
              }
            />
          )}
          {showCc  && <ChipRow label="Cc"  chips={ccEmails}  input={ccInput}  setInput={setCcInput}  setChips={setCcEmails} />}
          {showBcc && <ChipRow label="Bcc" chips={bccEmails} input={bccInput} setInput={setBccInput} setChips={setBccEmails} />}

          {/* Subject */}
          <div className="px-4 py-2.5 border-b border-white/[0.05]">
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
          </div>

          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/[0.05] bg-[#09090f]">
            {[
              { icon: Bold,          cmd: 'bold',          title: 'Bold' },
              { icon: Italic,        cmd: 'italic',        title: 'Italic' },
              { icon: Underline,     cmd: 'underline',     title: 'Underline' },
              { icon: Strikethrough, cmd: 'strikeThrough', title: 'Strikethrough' },
            ].map(({ icon: Icon, cmd, title }) => (
              <button
                key={cmd}
                onMouseDown={e => { e.preventDefault(); applyFormat(cmd); }}
                title={title}
                className="p-1.5 rounded hover:bg-white/[0.07] text-gray-500 hover:text-white transition-colors"
              >
                <Icon size={13} />
              </button>
            ))}
            <div className="w-px h-3.5 bg-white/10 mx-1" />
            <button onMouseDown={e => { e.preventDefault(); applyFormat('insertUnorderedList'); }} title="Bullet list"   className="p-1.5 rounded hover:bg-white/[0.07] text-gray-500 hover:text-white transition-colors"><List        size={13} /></button>
            <button onMouseDown={e => { e.preventDefault(); applyFormat('insertOrderedList');   }} title="Numbered list" className="p-1.5 rounded hover:bg-white/[0.07] text-gray-500 hover:text-white transition-colors"><ListOrdered size={13} /></button>
            <div className="w-px h-3.5 bg-white/10 mx-1" />
            <button onMouseDown={e => { e.preventDefault(); insertLink(); }} title="Insert link" className="p-1.5 rounded hover:bg-white/[0.07] text-gray-500 hover:text-white transition-colors"><Link size={13} /></button>
          </div>

          {/* Body */}
          <div className="relative flex-1 overflow-auto p-4">
            {bodyEmpty && (
              <span className="absolute top-4 left-4 text-gray-600 text-sm pointer-events-none select-none">
                Write your message…
              </span>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => setBodyEmpty(!editorRef.current?.textContent?.trim())}
              className="min-h-full text-white text-sm outline-none leading-relaxed"
              style={{ wordBreak: 'break-word' }}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.05] bg-[#09090f]">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-full transition-colors"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? 'Sending…' : 'Send'}
              </button>
              <button
                onClick={saveDraft}
                className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-white text-xs rounded-full hover:bg-white/[0.05] transition-colors"
              >
                {draftSaved ? <Check size={13} className="text-green-400" /> : <Clock size={13} />}
                {draftSaved ? 'Saved' : 'Save draft'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {status && (
                <span className={`flex items-center gap-1.5 text-xs ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {status.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
                  {status.text}
                </span>
              )}
              <button onClick={clearCompose} title="Discard" className="p-1.5 text-gray-600 hover:text-gray-300 rounded-full hover:bg-white/[0.05] transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sent ── */}
      {view === 'sent' && (
        <div className="flex flex-1 overflow-hidden">

          {/* List pane */}
          <div className={`flex flex-col overflow-hidden border-r border-white/[0.05] ${selectedSent ? 'w-72' : 'flex-1'}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <span className="text-white text-sm font-medium">Sent</span>
              <button onClick={loadSentEmails} className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/[0.05] transition-colors">
                <RefreshCw size={13} className={loadingSent ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingSent ? (
                <div className="flex justify-center items-center h-24 text-gray-600"><Loader2 size={18} className="animate-spin" /></div>
              ) : sentEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-gray-600 gap-2">
                  <Send size={20} />
                  <p className="text-xs">No sent emails yet</p>
                </div>
              ) : sentEmails.map(email => (
                <button
                  key={email.id}
                  onClick={() => setSelectedSentId(email.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                    selectedSent?.id === email.id ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm text-white font-medium truncate">
                      {email.recipient_type === 'all-users'     ? 'All Users' :
                       email.recipient_type === 'verified-only' ? 'Verified Users' :
                       email.recipients.slice(0, 2).join(', ') + (email.recipients.length > 2 ? ` +${email.recipients.length - 2}` : '')}
                    </span>
                    <span className="text-xs text-gray-600 flex-shrink-0 ml-2">{fmtDate(email.sent_at)}</span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">{email.subject}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{stripHtml(email.body)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Detail pane */}
          {selectedSent && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-white font-medium">{selectedSent.subject}</h2>
                  <button onClick={() => setSelectedSentId(null)} className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/[0.05] flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
                <div className="mt-3 space-y-1 text-xs">
                  {[
                    { label: 'From', value: selectedSent.from_address || 'noreply@grraphic.xyz' },
                    {
                      label: 'To',
                      value: selectedSent.recipient_type === 'all-users'
                        ? `All Users (${selectedSent.recipient_count})`
                        : selectedSent.recipient_type === 'verified-only'
                        ? `Verified Users (${selectedSent.recipient_count})`
                        : selectedSent.recipients.join(', '),
                    },
                    { label: 'Date', value: new Date(selectedSent.sent_at).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-gray-600 w-10 text-right flex-shrink-0">{label}:</span>
                      <span className="text-gray-300 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="flex-1 overflow-y-auto p-6 text-white text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedSent.body }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Drafts ── */}
      {view === 'drafts' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <span className="text-white text-sm font-medium">Drafts</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-600 gap-2">
                <Clock size={20} />
                <p className="text-xs">No saved drafts</p>
              </div>
            ) : drafts.map(draft => (
              <div key={draft.id} className="flex items-center px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] group transition-colors">
                <button onClick={() => loadDraft(draft)} className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm text-yellow-200/80 truncate">{draft.subject || '(no subject)'}</span>
                    <span className="text-xs text-gray-600 flex-shrink-0">{fmtDate(draft.savedAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {draft.recipientType !== 'manual'
                      ? draft.recipientType === 'all-users' ? 'All Users' : 'Verified Users'
                      : draft.to.join(', ') || '(no recipients)'}
                  </p>
                </button>
                <button
                  onClick={() => deleteDraft(draft.id)}
                  className="p-1.5 text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-white/[0.05] ml-2 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
