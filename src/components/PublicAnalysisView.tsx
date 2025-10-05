import React from 'react';
import { Sparkles, User, Calendar, ArrowLeft } from 'lucide-react';
import { AnalysisResults } from './AnalysisResults';
import { AnalysisRecord } from '../types';

interface PublicAnalysisViewProps {
  analysis: AnalysisRecord;
  onStartNewAnalysis: () => void;
}

export function PublicAnalysisView({ analysis, onStartNewAnalysis }: PublicAnalysisViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onStartNewAnalysis}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={16} />
            <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 shadow-lg">
            <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Shared Design Analysis
          </h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-300">
            <User size={16} />
            <span>by @{analysis.user?.username || 'Anonymous'}</span>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      <AnalysisResults
        analysis={analysis.analysis_data}
        fileName={analysis.file_name}
        imagePreview={analysis.image_url || undefined}
        isProSubscriber={false}
        onUpgrade={() => {}}
      />
    </div>
  );
}