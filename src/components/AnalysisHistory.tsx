import React from 'react';
import { Clock, Eye, Trash2, Image, Share2, Globe, Lock, Check } from 'lucide-react';
import { AnalysisRecord } from '../types';

interface AnalysisHistoryProps {
  analyses: AnalysisRecord[];
  onViewAnalysis: (analysis: AnalysisRecord) => void;
  onDeleteAnalysis: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  loading: boolean;
}

export default function AnalysisHistory({
  analyses,
  onViewAnalysis,
  onDeleteAnalysis,
  onTogglePublic,
  loading
}: AnalysisHistoryProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyShareLink = (analysisId: string) => {
    const shareUrl = `${window.location.origin}?analysis=${analysisId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(analysisId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((err) => {
      console.error('Failed to copy link:', err);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(analysisId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Analysis History</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No analyses yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Upload your first design to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Analysis History</h2>
      <div className="space-y-3">
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {analysis.image_url && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    <img
                      src={analysis.image_url}
                      alt="Design thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {!analysis.image_url && (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {analysis.file_name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                    {analysis.analysis_data?.overall && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Score: {analysis.analysis_data.overall}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onTogglePublic?.(analysis.id, !analysis.is_public)}
                  className={`p-2 transition-colors ${
                    analysis.is_public 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={analysis.is_public ? 'Make private' : 'Make public'}
                >
                  {analysis.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyShareLink(analysis.id)}
                  disabled={!analysis.is_public}
                  className={`p-2 transition-colors relative ${
                    analysis.is_public 
                      ? 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400' 
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                  title={analysis.is_public ? 'Copy share link' : 'Make public first to share'}
                >
                  {copiedId === analysis.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onViewAnalysis(analysis)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="View analysis"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteAnalysis(analysis.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete analysis"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}