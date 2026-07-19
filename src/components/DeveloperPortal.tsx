import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  Code, Key, Plus, Trash2, Copy, Check, ExternalLink, 
  Settings, Shield, Globe, Lock, Eye, EyeOff, RefreshCw,
  Users, Activity, AlertCircle, ChevronRight, X, Loader2,
  Link as LinkIcon, Image, FileText, Webhook, Clock, Send, Github, ShieldCheck
} from 'lucide-react';

interface OAuthApp {
  id: string;
  client_id: string;
  client_secret_hash: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  homepage_url: string | null;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  is_verified: boolean;
  verification_status: 'none' | 'pending' | 'approved' | 'rejected';
  verification_reason: string | null;
  verification_requested_at: string | null;
  created_at: string;
}

interface AppStats {
  total_authorizations: number;
  active_users: number;
  total_token_requests: number;
  last_used: string | null;
}

interface Props {
  onBack: () => void;
  userId: string;
}

export function DeveloperPortal({ onBack, userId }: Props) {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<OAuthApp | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState<{ appId: string; secret: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    loadApps();
  }, [userId]);

  const loadApps = async () => {
    if (!isSupabaseConfigured()) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('oauth_clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApps(data as unknown as OAuthApp[]);
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application? This will revoke all authorizations.')) {
      return;
    }

    const { error } = await supabase
      .from('oauth_clients')
      .delete()
      .eq('id', appId);

    if (!error) {
      setApps(apps.filter(a => a.id !== appId));
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
    }
  };

  const handleToggleActive = async (app: OAuthApp) => {
    const { error } = await supabase
      .from('oauth_clients')
      .update({ is_active: !app.is_active })
      .eq('id', app.id);

    if (!error) {
      setApps(apps.map(a => a.id === app.id ? { ...a, is_active: !a.is_active } : a));
      if (selectedApp?.id === app.id) {
        setSelectedApp({ ...selectedApp, is_active: !selectedApp.is_active });
      }
    }
  };

  const handleRegenerateSecret = async (appId: string) => {
    if (!confirm('Are you sure you want to regenerate the client secret? The old secret will stop working immediately.')) {
      return;
    }

    // Generate new secret
    const newSecret = `grphc_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('')}`;
    
    // Hash it for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(newSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { error } = await supabase
      .from('oauth_clients')
      .update({ client_secret_hash: hashHex })
      .eq('id', appId);

    if (!error) {
      setShowSecretModal({ appId, secret: newSecret });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <ChevronRight className="rotate-180 text-gray-400" size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Developer Portal</h1>
                <p className="text-sm text-gray-500">Manage your OAuth applications</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors"
            >
              <Plus size={18} />
              Create App
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Apps List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-white mb-4">Your Applications</h2>
            
            {apps.length === 0 ? (
              <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-8 text-center">
                <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="text-violet-400" size={32} />
                </div>
                <h3 className="text-white font-medium mb-2">No applications yet</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Create your first OAuth application to integrate with Grraphic
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Create App
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {apps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`w-full p-4 rounded-xl text-left transition-colors ${
                      selectedApp?.id === app.id
                        ? 'bg-violet-500/20 border border-violet-500/30'
                        : 'bg-[#12121a] border border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {app.logo_url ? (
                        <img src={app.logo_url} alt={app.name} className="w-10 h-10 rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-violet-400">{app.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{app.name}</span>
                          {!app.is_active && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                              Disabled
                            </span>
                          )}
                          {app.is_verified && (
                            <Shield size={14} className="text-emerald-400" />
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate mt-0.5">{app.client_id}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* App Details */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <AppDetails 
                app={selectedApp} 
                onUpdate={loadApps}
                onDelete={() => handleDeleteApp(selectedApp.id)}
                onToggleActive={() => handleToggleActive(selectedApp)}
                onRegenerateSecret={() => handleRegenerateSecret(selectedApp.id)}
                copyToClipboard={copyToClipboard}
                copiedText={copiedText}
              />
            ) : (
              <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-12 text-center">
                <Settings className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-white font-medium mb-2">Select an application</h3>
                <p className="text-gray-500 text-sm">
                  Choose an app from the list to view and edit its settings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* OAuth Documentation */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">OAuth 2.0 Integration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <LinkIcon className="text-blue-400" size={20} />
              </div>
              <h3 className="text-white font-medium mb-2">Authorization URL</h3>
              <code className="text-xs text-violet-400 break-all">
                https://grraphic.xyz/api/auth/consent
              </code>
            </div>
            <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <Key className="text-green-400" size={20} />
              </div>
              <h3 className="text-white font-medium mb-2">Token URL</h3>
              <code className="text-xs text-violet-400 break-all">
                https://api.grraphic.xyz/oauth/token
              </code>
            </div>
            <div className="bg-[#12121a] border border-white/[0.08] rounded-xl p-6">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-purple-400" size={20} />
              </div>
              <h3 className="text-white font-medium mb-2">User Info URL</h3>
              <code className="text-xs text-violet-400 break-all">
                https://api.grraphic.xyz/oauth/userinfo
              </code>
            </div>
          </div>
        </div>

        {/* Available Scopes */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Available Scopes</h2>
          <div className="bg-[#12121a] border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Scope</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Data Access</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { scope: 'openid', desc: 'OpenID Connect identifier', data: 'User ID' },
                  { scope: 'profile', desc: 'Basic profile information', data: 'Username, avatar' },
                  { scope: 'email', desc: 'Email address', data: 'Email, verification status' },
                  { scope: 'github', desc: 'Connected GitHub account', data: 'GitHub username, ID, avatar' },
                  { scope: 'read:projects', desc: 'Read user projects', data: 'Project list, analyses' },
                  { scope: 'write:projects', desc: 'Modify user projects', data: 'Create/update projects' },
                ].map((item, i) => (
                  <tr key={item.scope} className={i < 5 ? 'border-b border-white/[0.05]' : ''}>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-xs">
                        {item.scope}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{item.desc}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <CreateAppModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={(app, secret) => {
            setApps([app, ...apps]);
            setSelectedApp(app);
            setShowCreateModal(false);
            setShowSecretModal({ appId: app.id, secret });
          }}
          userId={userId}
        />
      )}

      {/* Secret Modal */}
      {showSecretModal && (
        <SecretModal 
          secret={showSecretModal.secret}
          onClose={() => setShowSecretModal(null)}
          copyToClipboard={copyToClipboard}
          copiedText={copiedText}
        />
      )}
    </div>
  );
}

// App Details Component
function AppDetails({ 
  app, 
  onUpdate, 
  onDelete, 
  onToggleActive,
  onRegenerateSecret,
  copyToClipboard, 
  copiedText 
}: { 
  app: OAuthApp; 
  onUpdate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onRegenerateSecret: () => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedText: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: app.name,
    description: app.description || '',
    homepage_url: app.homepage_url || '',
    logo_url: app.logo_url || '',
    redirect_uris: app.redirect_uris.join('\n'),
    scopes: app.scopes
  });

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('oauth_clients')
      .update({
        name: formData.name,
        description: formData.description || null,
        homepage_url: formData.homepage_url || null,
        logo_url: formData.logo_url || null,
        redirect_uris: formData.redirect_uris.split('\n').map(u => u.trim()).filter(Boolean),
        scopes: formData.scopes
      })
      .eq('id', app.id);

    if (!error) {
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const availableScopes = ['openid', 'profile', 'email', 'github', 'read:projects', 'write:projects'];

  return (
    <div className="bg-[#12121a] border border-white/[0.08] rounded-xl">
      {/* Header */}
      <div className="p-6 border-b border-white/[0.08]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {app.logo_url ? (
              <img src={app.logo_url} alt={app.name} className="w-14 h-14 rounded-xl" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-violet-400">{app.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{app.name}</h2>
                {app.is_verified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                    <Shield size={12} />
                    Verified
                  </span>
                )}
              </div>
              {app.description && (
                <p className="text-gray-400 text-sm mt-1">{app.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onToggleActive}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                app.is_active
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
              }`}
            >
              {app.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Credentials */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Credentials</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Client ID</p>
                <code className="text-sm text-white font-mono">{app.client_id}</code>
              </div>
              <button
                onClick={() => copyToClipboard(app.client_id, 'client_id')}
                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                {copiedText === 'client_id' ? (
                  <Check size={16} className="text-emerald-400" />
                ) : (
                  <Copy size={16} className="text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Client Secret</p>
                <code className="text-sm text-gray-500 font-mono">••••••••••••••••••••••••</code>
              </div>
              <button
                onClick={onRegenerateSecret}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-400 text-sm transition-colors"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <VerificationSection app={app} onUpdate={onUpdate} />

        {editing ? (
          <>
            {/* Edit Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">App Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Homepage URL</label>
                <input
                  type="url"
                  value={formData.homepage_url}
                  onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Redirect URIs <span className="text-gray-500">(one per line)</span>
                </label>
                <textarea
                  value={formData.redirect_uris}
                  onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scopes</label>
                <div className="flex flex-wrap gap-2">
                  {availableScopes.map(scope => (
                    <button
                      key={scope}
                      onClick={() => {
                        const newScopes = formData.scopes.includes(scope)
                          ? formData.scopes.filter(s => s !== scope)
                          : [...formData.scopes, scope];
                        setFormData({ ...formData, scopes: newScopes });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        formData.scopes.includes(scope)
                          ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                          : 'bg-white/[0.05] text-gray-400 border border-white/[0.1] hover:border-white/[0.2]'
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete App
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Display Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">URLs</h3>
              <div className="space-y-2">
                {app.homepage_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={14} className="text-gray-500" />
                    <a href={app.homepage_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                      {app.homepage_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Redirect URIs</h3>
              <div className="space-y-2">
                {app.redirect_uris.map((uri, i) => (
                  <code key={i} className="block text-sm text-gray-300 font-mono bg-white/[0.02] px-3 py-2 rounded-lg">
                    {uri}
                  </code>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Scopes</h3>
              <div className="flex flex-wrap gap-2">
                {app.scopes.map(scope => (
                  <span key={scope} className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded text-sm">
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <div className="text-sm text-gray-500">
                Created {new Date(app.created_at).toLocaleDateString()}
              </div>
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Delete App
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Create App Modal
function CreateAppModal({ 
  onClose, 
  onCreated,
  userId 
}: { 
  onClose: () => void;
  onCreated: (app: OAuthApp, secret: string) => void;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    homepage_url: '',
    redirect_uris: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Generate client ID and secret
    const clientId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const clientSecret = `grphc_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('')}`;
    
    // Hash secret for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(clientSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: app, error } = await supabase
      .from('oauth_clients')
      .insert({
        user_id: userId,
        client_id: clientId,
        client_secret_hash: hashHex,
        name: formData.name,
        description: formData.description || null,
        homepage_url: formData.homepage_url || null,
        redirect_uris: formData.redirect_uris.split('\n').map(u => u.trim()).filter(Boolean),
        scopes: ['openid', 'profile', 'email'],
        is_active: true,
        is_verified: false
      })
      .select()
      .single();

    if (!error && app) {
      onCreated(app as unknown as OAuthApp, clientSecret);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-xl font-bold text-white">Create New Application</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Application Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome App"
              className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does your app do?"
              rows={2}
              className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Homepage URL</label>
            <input
              type="url"
              value={formData.homepage_url}
              onChange={(e) => setFormData({ ...formData, homepage_url: e.target.value })}
              placeholder="https://myapp.com"
              className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Redirect URIs <span className="text-red-400">*</span>
              <span className="text-gray-500 font-normal ml-1">(one per line)</span>
            </label>
            <textarea
              required
              value={formData.redirect_uris}
              onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
              placeholder="https://myapp.com/auth/callback"
              rows={3}
              className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.redirect_uris}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create App'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Verification Section
function VerificationSection({ app, onUpdate }: { app: OAuthApp; onUpdate: () => void }) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestVerification = async () => {
    setSubmitting(true);
    
    const { error } = await supabase
      .from('oauth_clients')
      .update({
        verification_status: 'pending',
        verification_reason: reason,
        verification_requested_at: new Date().toISOString()
      })
      .eq('id', app.id);

    if (!error) {
      setShowRequestForm(false);
      setReason('');
      onUpdate();
    }
    setSubmitting(false);
  };

  if (app.is_verified || app.verification_status === 'approved') {
    return (
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <div>
            <h3 className="text-emerald-400 font-medium">Verified Application</h3>
            <p className="text-gray-400 text-sm">This app can access GitHub connections and sensitive scopes</p>
          </div>
        </div>
      </div>
    );
  }

  if (app.verification_status === 'pending') {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Clock className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="text-amber-400 font-medium">Verification Pending</h3>
            <p className="text-gray-400 text-sm">
              Your application is under review. We&apos;ll notify you once it&apos;s been reviewed.
            </p>
            {app.verification_requested_at && (
              <p className="text-gray-500 text-xs mt-1">
                Requested {new Date(app.verification_requested_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (app.verification_status === 'rejected') {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <X className="text-red-400" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-red-400 font-medium">Verification Denied</h3>
            <p className="text-gray-400 text-sm">
              Your verification request was not approved. You can submit a new request after addressing the issues.
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="mt-3 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors"
            >
              Request Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not verified, show request option
  return (
    <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="text-violet-400" size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-violet-400 font-medium">Get Verified</h3>
          <p className="text-gray-400 text-sm mb-3">
            Verified apps can access GitHub connections and display a verified badge. This builds trust with users.
          </p>
          
          {!showRequestForm ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRequestForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <Send size={16} />
                Apply for Verification
              </button>
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Github size={14} />
                <span>Required for GitHub scope</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us about your app and why you need verification (e.g., user base, use case, company info)..."
                rows={3}
                className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestVerification}
                  disabled={submitting || !reason.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  Submit Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Secret Modal
function SecretModal({ 
  secret, 
  onClose,
  copyToClipboard,
  copiedText
}: { 
  secret: string;
  onClose: () => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-amber-400 mb-2">
            <AlertCircle size={24} />
            <h2 className="text-xl font-bold">Save Your Client Secret</h2>
          </div>
          <p className="text-gray-400 text-sm">
            This is the only time you will see this secret. Copy it now and store it securely.
          </p>
        </div>

        <div className="p-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <code className="text-amber-300 font-mono text-sm break-all">{secret}</code>
              <button
                onClick={() => copyToClipboard(secret, 'new_secret')}
                className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors ml-3 flex-shrink-0"
              >
                {copiedText === 'new_secret' ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Copy size={18} className="text-amber-400" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/[0.02] rounded-lg">
            <p className="text-sm text-gray-400">
              <strong className="text-white">Important:</strong> Store this secret in a secure location like a password manager or environment variable. 
              You will need it to authenticate with the Grraphic OAuth API.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-white font-medium transition-colors"
          >
            I&apos;ve Saved My Secret
          </button>
        </div>
      </div>
    </div>
  );
}
