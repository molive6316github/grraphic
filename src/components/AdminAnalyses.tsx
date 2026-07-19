import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Download, ChevronLeft, ChevronRight, Image, Calendar, User, Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Analysis {
  id: string;
  user_id: string;
  file_name: string;
  image_url: string;
  overall_score: number;
  analysis_data: any;
  created_at: string;
  is_public: boolean;
  public_slug: string | null;
  user_email?: string;
  username?: string;
}

export function AdminAnalyses() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAnalyses();
  }, [currentPage, searchQuery]);

  async function fetchAnalyses() {
    setLoading(true);
    try {
      let query = supabase
        .from('design_analyses')
        .select(`
          *,
          profiles!design_analyses_user_id_fkey (
            email,
            username
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (searchQuery) {
        query = query.or(`file_name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        user_email: (item as any).profiles?.email || 'Unknown',
        username: (item as any).profiles?.username || 'No username'
      })) || [];

      setAnalyses(formattedData as unknown as Analysis[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAnalysis(id: string) {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const { error } = await supabase
        .from('design_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAnalyses();
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  }

  async function togglePublic(id: string, isPublic: boolean) {
    try {
      const { error } = await supabase
        .from('design_analyses')
        .update({ is_public: !isPublic })
        .eq('id', id);

      if (error) throw error;
      fetchAnalyses();
    } catch (error) {
      console.error('Error updating analysis:', error);
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Analyses</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by filename or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {totalCount} total analyses
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Public</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      {analysis.image_url ? (
                        <img
                          src={analysis.image_url}
                          alt={analysis.file_name}
                          className="w-16 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedAnalysis(analysis)}
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Image size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{analysis.file_name}</span>
                      {analysis.public_slug && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">/{analysis.public_slug}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{analysis.user_email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{analysis.username}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.overall_score || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublic(analysis.id, analysis.is_public)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          analysis.is_public
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {analysis.is_public ? 'Public' : 'Private'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAnalysis(analysis)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analysis Details: {selectedAnalysis.file_name}
              </h3>
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  {selectedAnalysis.image_url && (
                    <img
                      src={selectedAnalysis.image_url}
                      alt={selectedAnalysis.file_name}
                      className="w-full rounded-xl shadow-lg"
                    />
                  )}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedAnalysis.user_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">
                        {new Date(selectedAnalysis.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-gray-600 dark:text-gray-300">
                        Overall Score: {selectedAnalysis.overall_score}/100
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Analysis Data</h4>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-96 text-gray-800 dark:text-gray-200">
                    {JSON.stringify(selectedAnalysis.analysis_data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
