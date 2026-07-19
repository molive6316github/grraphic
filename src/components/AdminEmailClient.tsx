import { useState } from 'react';
import { Mail, Send, Loader2, Check, AlertCircle, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminEmailClient() {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientType, setRecipientType] = useState<'manual' | 'all-users' | 'verified-only'>('manual');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Please fill in subject and body' });
      return;
    }

    let emailList: string[] = [];

    if (recipientType === 'manual') {
      if (!recipients.trim()) {
        setMessage({ type: 'error', text: 'Please enter recipient emails' });
        return;
      }
      emailList = recipients.split('\n').map(e => e.trim()).filter(e => e);
    } else if (recipientType === 'all-users') {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email')
        .not('email', 'is', null);
      
      if (error) {
        setMessage({ type: 'error', text: 'Failed to fetch users' });
        return;
      }
      emailList = (profiles?.map(p => p.email) || []).filter((e): e is string => !!e);
    } else if (recipientType === 'verified-only') {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('is_verified', true)
        .not('email', 'is', null);
      
      if (error) {
        setMessage({ type: 'error', text: 'Failed to fetch verified users' });
        return;
      }
      emailList = (profiles?.map(p => p.email) || []).filter((e): e is string => !!e);
    }

    if (emailList.length === 0) {
      setMessage({ type: 'error', text: 'No recipients found' });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/request.bot/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailList,
          subject,
          body,
          fromName: 'Grraphic'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Email sent to ${emailList.length} recipient${emailList.length !== 1 ? 's' : ''}` 
        });
        setSubject('');
        setBody('');
        setRecipients('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error sending email' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Mail className="text-blue-400" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Email Client</h2>
          <p className="text-gray-400">Send emails to users via Resend</p>
        </div>
      </div>

      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6 space-y-6">
        {/* Recipient Type Selection */}
        <div>
          <label className="block text-white font-medium mb-3">Recipients</label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setRecipientType('manual')}
              className={`p-3 rounded-lg border transition-colors ${
                recipientType === 'manual'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="text-sm font-medium">Manual</div>
              <div className="text-xs text-gray-500 mt-1">Paste emails</div>
            </button>
            <button
              onClick={() => setRecipientType('all-users')}
              className={`p-3 rounded-lg border transition-colors ${
                recipientType === 'all-users'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <User size={14} />
                <span className="text-sm font-medium">All Users</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Everyone</div>
            </button>
            <button
              onClick={() => setRecipientType('verified-only')}
              className={`p-3 rounded-lg border transition-colors ${
                recipientType === 'verified-only'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="text-sm font-medium">Verified</div>
              <div className="text-xs text-gray-500 mt-1">Verified only</div>
            </button>
          </div>
        </div>

        {/* Recipients Input */}
        {recipientType === 'manual' && (
          <div>
            <label className="block text-white font-medium mb-3">Email Addresses</label>
            <textarea
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Enter email addresses, one per line"
              rows={4}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-white font-medium mb-3">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line..."
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-white font-medium mb-3">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body (supports HTML)..."
            rows={10}
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none font-mono text-sm"
          />
        </div>

        {/* Message Status */}
        {message && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <Check size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendEmail}
          disabled={sending}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </div>
  );
}
