import React, { useEffect, useState } from 'react';
import { FileImage, Eye, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Analysis {
  id: string;
  user_id: string;
  file_name: string;
  created_at: string;
  updated_at: string;
  is_public: string;
  analysis_data: any;
  user_email?: string;
}

export function AdminReviews() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    fetchAnalyses();
  }, [filter]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('design_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'public') {
        query = query.eq('is_public', true);
      } else if (filter === 'private') {
        query = query.eq('is_public', false);
      }

      const { data: analyses, error } = await query;

      if (error) throw error;

      // Get user emails separately
      const userIds = [...new Set(analyses?.map(a => a.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

      const formattedAnalyses = analyses?.map(analysis => ({
        ...analysis,
        user_email: userEmailMap.get(analysis.user_id) || 'Unknown'
      })) || [];

      setAnalyses(formattedAnalyses as unknown as Analysis[]);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            All ({analyses.length})
          </button>
          <button
            onClick={() => setFilter('public')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'public'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setFilter('private')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'private'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            Private
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Design Analyses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Design
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No analyses found
                  </td>
                </tr>
              ) : (
                analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileImage size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {analysis.user_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={16} className="mr-2" />
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {analysis.is_public === 'yes' ? (
                        <span className="px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                          Public
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                          Private
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {analysis.analysis_data?.overall || 'N/A'}/100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Eye size={16} />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Details</h3>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">File Name</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {selectedAnalysis.file_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {selectedAnalysis.user_email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Score</label>
                  <p className="mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                    {selectedAnalysis.analysis_data?.overall || 'N/A'}/100
                  </p>
                </div>
                {selectedAnalysis.analysis_data?.categories && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category Scores</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {Object.entries(selectedAnalysis.analysis_data.categories).map(([key, value]: [string, any]) => (
                        <div key={key} className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{key}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{value.score}/100</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
