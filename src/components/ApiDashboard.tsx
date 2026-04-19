import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff, 
  BarChart3, Clock, Shield, AlertCircle, RefreshCw,
  ChevronRight, Activity, Zap, Settings, ExternalLink, Code
} from 'lucide-react';
import { apiKeysService, apiUsageService, copyToClipboard } from '../services/apiService';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key?: string; // Only present on creation
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface UsageData {
  tier: 'free' | 'pro';
  today: {
    date: string;
    usage: Record<string, { used: number; limit: number | string; remaining: number | string; percentage: number }>;
    resetsAt: string;
  };
  history: Array<{ date: string; total: number; byEndpoint: Record<string, number> }>;
  totals: { last7Days: number; last30Days: number };
}

interface Props {
  onBack: () => void;
}

export function ApiDashboard({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'keys' | 'usage' | 'docs'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('never');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const [setupRequired, setSetupRequired] = useState(false);
  
  const loadData = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const [keysRes, usageRes] = await Promise.all([
        apiKeysService.list(),
        apiUsageService.getCurrent()
      ]);
      
      if (keysRes.code === 'TABLE_NOT_FOUND' || usageRes.code === 'TABLE_NOT_FOUND') {
        setSetupRequired(true);
      } else {
        if (keysRes.success) setApiKeys(keysRes.data || []);
        if (usageRes.success) setUsage(usageRes.data);
      }
    } catch (e) {
      setError('Failed to load API data');
    }
    setLoading(false);
  };

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    
    const res = await apiKeysService.create(newKeyName, ['read', 'write'], newKeyExpiry);
    if (res.success && res.data) {
      setNewlyCreatedKey(res.data.key);
      setApiKeys(prev => [res.data, ...prev]);
      setNewKeyName('');
    } else {
      setError(res.message || 'Failed to create API key');
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    
    const res = await apiKeysService.delete(id);
    if (res.success) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
    }
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">API Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage your API keys and monitor usage</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                usage?.tier === 'pro' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {usage?.tier === 'pro' ? 'Pro' : 'Free'} Tier
              </span>
              <button
                onClick={() => window.location.href = '/developer'}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                <Code size={16} />
                Developer Portal
              </button>
              <button
                onClick={() => window.open('/api/docs', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink size={16} />
                API Docs
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Setup Required Notice */}
      {setupRequired && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-amber-400 mb-2">API Setup Required</h3>
                <p className="text-gray-300 mb-4">
                  The API database tables have not been set up yet. To enable API functionality:
                </p>
                <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-2">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Open the file <code className="bg-slate-800 px-2 py-0.5 rounded text-green-400">scripts/create-api-tables.sql</code> from this project</li>
                  <li>Copy the entire contents of that file</li>
                  <li>Paste and run it in the SQL Editor</li>
                </ol>
                <p className="text-gray-400 text-sm">
                  Note: Do not type the filename directly in SQL Editor - you need to copy and paste the actual SQL code from the file.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!setupRequired && (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 border-b border-white/10 mb-6">
          {[
            { id: 'keys', label: 'API Keys', icon: Key },
            { id: 'usage', label: 'Usage', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <>
            {/* API Keys Tab */}
            {activeTab === 'keys' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Key className="text-blue-400" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Active Keys</p>
                        <p className="text-2xl font-bold text-white">{apiKeys.filter(k => k.is_active).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Activity className="text-green-400" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Requests Today</p>
                        <p className="text-2xl font-bold text-white">
                          {Object.values(usage?.today?.usage || {}).reduce((sum: number, u: any) => sum + (u.used || 0), 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Zap className="text-purple-400" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Max Keys</p>
                        <p className="text-2xl font-bold text-white">{usage?.tier === 'pro' ? 10 : 1}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create New Key */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Create New API Key</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name (e.g., Production, Development)"
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={newKeyExpiry}
                      onChange={(e) => setNewKeyExpiry(e.target.value)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="never">Never expires</option>
                      <option value="30d">30 days</option>
                      <option value="90d">90 days</option>
                      <option value="1y">1 year</option>
                    </select>
                    <button
                      onClick={createKey}
                      disabled={!newKeyName.trim()}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      <Plus size={18} />
                      Create Key
                    </button>
                  </div>
                </div>

                {/* Newly Created Key Alert */}
                {newlyCreatedKey && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <Check className="text-green-400 mt-1" size={20} />
                      <div className="flex-1">
                        <h4 className="text-green-400 font-semibold mb-2">API Key Created Successfully!</h4>
                        <p className="text-gray-300 text-sm mb-3">
                          Copy this key now. For security reasons, it will not be shown again.
                        </p>
                        <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg font-mono text-sm">
                          <code className="text-green-300 flex-1 break-all">{newlyCreatedKey}</code>
                          <button
                            onClick={() => handleCopy(newlyCreatedKey, 'new')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {copiedId === 'new' ? <Check className="text-green-400" size={18} /> : <Copy className="text-gray-400" size={18} />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => setNewlyCreatedKey(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Keys List */}
                <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Key</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Created</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Last Used</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                            No API keys yet. Create one above to get started.
                          </td>
                        </tr>
                      ) : (
                        apiKeys.map(key => (
                          <tr key={key.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4">
                              <span className="text-white font-medium">{key.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <code className="text-gray-400 text-sm">{key.key_prefix}</code>
                                <button
                                  onClick={() => handleCopy(key.key_prefix, key.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                  {copiedId === key.id ? <Check className="text-green-400" size={14} /> : <Copy className="text-gray-500" size={14} />}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(key.created_at)}</td>
                            <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(key.last_used_at)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                key.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {key.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => deleteKey(key.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && usage && (
              <div className="space-y-6">
                {/* Today's Usage */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Today&apos;s Usage</h3>
                    <p className="text-gray-400 text-sm">
                      Resets at {new Date(usage.today.resetsAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(usage.today.usage).map(([endpoint, data]) => (
                      <div key={endpoint} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 capitalize">{endpoint.replace('-', ' ')}</span>
                          <span className="text-white font-semibold">
                            {data.used}/{data.limit === 'unlimited' ? '∞' : data.limit}
                          </span>
                        </div>
                        {data.limit !== 'unlimited' && (
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                data.percentage > 80 ? 'bg-red-500' : data.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, data.percentage)}%` }}
                            />
                          </div>
                        )}
                        {data.limit === 'unlimited' && (
                          <p className="text-green-400 text-xs mt-1">Unlimited (Pro)</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Usage */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-6">Usage History (Last 30 Days)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Last 7 Days</p>
                      <p className="text-2xl font-bold text-white">{usage.totals.last7Days}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Last 30 Days</p>
                      <p className="text-2xl font-bold text-white">{usage.totals.last30Days}</p>
                    </div>
                  </div>
                  
                  {/* Simple bar chart */}
                  <div className="h-40 flex items-end gap-1">
                    {usage.history.slice(-30).map((day, i) => (
                      <div
                        key={day.date}
                        className="flex-1 bg-blue-500/50 hover:bg-blue-500 rounded-t transition-colors cursor-pointer group relative"
                        style={{ height: `${Math.max(4, (day.total / Math.max(...usage.history.map(d => d.total || 1))) * 100)}%` }}
                        title={`${day.date}: ${day.total} requests`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.date}: {day.total}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade CTA for free users */}
                {usage.tier === 'free' && (
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Upgrade to Pro</h3>
                        <p className="text-gray-300">
                          Get unlimited API access, higher rate limits, and up to 10 API keys.
                        </p>
                      </div>
                      <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors">
                        Upgrade Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  );
}
