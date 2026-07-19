import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Shield, ShieldCheck, ShieldX, Clock, ExternalLink, 
  Check, X, Eye, Globe, Users, Loader2, RefreshCw,
  Github, ChevronDown, ChevronUp
} from 'lucide-react';

interface OAuthApp {
  id: string;
  client_id: string;
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
  user_id: string;
  profiles?: {
    email: string;
    username: string | null;
  };
}

export function AdminOAuthApps() {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadApps();
  }, [filter]);

  const loadApps = async () => {
    setLoading(true);
    
    let query = supabase
      .from('oauth_clients')
      .select(`
        *,
        profiles!oauth_clients_user_id_fkey (email, username)
      `)
      .order('verification_requested_at', { ascending: false, nullsFirst: false });

    if (filter === 'pending') {
      query = query.eq('verification_status', 'pending');
    } else if (filter === 'verified') {
      query = query.eq('is_verified', true);
    } else if (filter === 'rejected') {
      query = query.eq('verification_status', 'rejected');
    }

    const { data, error } = await query;

    if (!error && data) {
      setApps(data as unknown as OAuthApp[]);
    }
    setLoading(false);
  };

  const handleApprove = async (app: OAuthApp) => {
    if (!confirm(`Approve verification for "${app.name}"? This will allow the app to access GitHub connections.`)) {
      return;
    }

    setProcessing(app.id);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('oauth_clients')
      .update({
        is_verified: true,
        verification_status: 'approved',
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user?.id
      })
      .eq('id', app.id);

    if (!error) {
      loadApps();
    }
    setProcessing(null);
  };

  const handleReject = async (app: OAuthApp) => {
    const reason = prompt('Reason for rejection (optional):');
    
    if (reason === null) return; // User cancelled

    setProcessing(app.id);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('oauth_clients')
      .update({
        is_verified: false,
        verification_status: 'rejected',
        verification_reviewed_at: new Date().toISOString(),
        verification_reviewed_by: user?.id
      })
      .eq('id', app.id);

    if (!error) {
      loadApps();
    }
    setProcessing(null);
  };

  const handleRevoke = async (app: OAuthApp) => {
    if (!confirm(`Revoke verification for "${app.name}"? The app will lose access to GitHub connections.`)) {
      return;
    }

    setProcessing(app.id);

    const { error } = await supabase
      .from('oauth_clients')
      .update({
        is_verified: false,
        verification_status: 'none'
      })
      .eq('id', app.id);

    if (!error) {
      loadApps();
    }
    setProcessing(null);
  };

  const pendingCount = apps.filter(a => a.verification_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">OAuth Applications</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage third-party app verifications</p>
        </div>
        <button
          onClick={loadApps}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
        >
          <RefreshCw size={16} className="text-gray-600 dark:text-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-200">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Clock size={16} />
          Pending
          {pendingCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filter === 'pending' ? 'bg-white/20' : 'bg-amber-500 text-white'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === 'verified'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <ShieldCheck size={16} />
          Verified
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <ShieldX size={16} />
          Rejected
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          All Apps
        </button>
      </div>

      {/* Apps List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Shield className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-gray-900 dark:text-white font-medium mb-2">No applications found</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'No pending verification requests' 
              : `No ${filter} applications`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map(app => (
            <div 
              key={app.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden"
            >
              {/* App Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
              >
                <div className="flex items-center gap-4">
                  {app.logo_url ? (
                    <img src={app.logo_url} alt={app.name} className="w-12 h-12 rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-xl flex items-center justify-center">
                      <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{app.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                      {app.is_verified && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      )}
                      {app.verification_status === 'pending' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {app.client_id} • {app.profiles?.email || 'Unknown user'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {app.verification_status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleApprove(app); }}
                        disabled={processing === app.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {processing === app.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReject(app); }}
                        disabled={processing === app.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                  {app.is_verified && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRevoke(app); }}
                      disabled={processing === app.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                  {expandedApp === app.id ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedApp === app.id && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">App Info</h4>
                      <div className="space-y-2">
                        {app.description && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{app.description}</p>
                        )}
                        {app.homepage_url && (
                          <a 
                            href={app.homepage_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:underline text-sm"
                          >
                            <Globe size={14} />
                            {app.homepage_url}
                            <ExternalLink size={12} />
                          </a>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          Owner: {app.profiles?.username || app.profiles?.email}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Requested Scopes</h4>
                      <div className="flex flex-wrap gap-2">
                        {app.scopes.map(scope => (
                          <span 
                            key={scope} 
                            className={`px-2 py-1 rounded text-xs ${
                              scope === 'github' 
                                ? 'bg-gray-900 dark:bg-gray-700 text-white flex items-center gap-1'
                                : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                            }`}
                          >
                            {scope === 'github' && <Github size={12} />}
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {app.verification_reason && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Verification Request Reason</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300">{app.verification_reason}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Redirect URIs</h4>
                    <div className="space-y-1">
                      {app.redirect_uris.map((uri, i) => (
                        <code key={i} className="block text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                          {uri}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
