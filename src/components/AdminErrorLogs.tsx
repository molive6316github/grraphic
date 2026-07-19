import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ErrorLog {
  id: string;
  user_id: string;
  error_message: string;
  error_stack?: string;
  context: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  user_email?: string;
}

export function AdminErrorLogs() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      const { data: logs, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get user emails separately
      const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

      const formattedLogs = logs?.map(log => ({
        ...log,
        user_email: userEmailMap.get(log.user_id) || 'Unknown'
      })) || [];

      setErrorLogs(formattedLogs as unknown as ErrorLog[]);
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (errorId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', errorId);

      if (error) throw error;

      await fetchErrorLogs();
      setSelectedError(null);
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading error logs...</p>
        </div>
      </div>
    );
  }

  const unresolvedErrors = errorLogs.filter(log => !log.resolved);
  const resolvedErrors = errorLogs.filter(log => log.resolved);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Unresolved Errors</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{unresolvedErrors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Resolved Errors</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{resolvedErrors.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Logs</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {errorLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No error logs found
            </div>
          ) : (
            errorLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  log.resolved ? 'opacity-60' : ''
                }`}
                onClick={() => setSelectedError(log)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {log.resolved ? (
                        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                      )}
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {log.context}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {log.error_message.substring(0, 100)}
                      {log.error_message.length > 100 ? '...' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <User size={12} className="mr-1" />
                      {log.user_email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Details</h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Context</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {selectedError.context}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {selectedError.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {new Date(selectedError.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Message</label>
                  <p className="mt-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-gray-900 dark:text-white font-mono">
                    {selectedError.error_message}
                  </p>
                </div>
                {selectedError.error_stack && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stack Trace</label>
                    <pre className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-900 dark:text-white overflow-x-auto font-mono">
                      {selectedError.error_stack}
                    </pre>
                  </div>
                )}
                {selectedError.resolved && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ Resolved on {new Date(selectedError.resolved_at!).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {!selectedError.resolved && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => markAsResolved(selectedError.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark as Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
