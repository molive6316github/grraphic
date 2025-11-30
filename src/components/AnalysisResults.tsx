import React from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Download, Image } from 'lucide-react';
import { DesignAnalysis } from '../types';
import { ImprovementIdeas } from './ImprovementIdeas';

interface AnalysisResultsProps {
  analysis: DesignAnalysis;
  fileName: string;
  imagePreview?: string;
  isProSubscriber?: boolean;
  onUpgrade?: () => void;
  userId?: string;
}

function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const circumference = 2 * Math.PI * 20;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="20"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx="50%"
          cy="50%"
          r="20"
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${getScoreColor(score)}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${size === 'lg' ? 'text-lg' : 'text-sm'} ${getScoreColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

export function AnalysisResults({ analysis, fileName, imagePreview, isProSubscriber = false, onUpgrade, userId }: AnalysisResultsProps) {
  const categories = Object.entries(analysis.categories);

  const exportReport = () => {
    const report = {
      fileName,
      analysis,
      generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grraphic-analysis-${fileName.split('.')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Image Preview */}
      {(imagePreview || (analysis as any).image_url) && (
        <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Image size={22} className="mr-2 text-blue-600 dark:text-blue-400" />
            Analyzed Design
          </h3>
          <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden shadow-inner ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <img
              src={imagePreview || (analysis as any).image_url}
              alt={fileName}
              className="w-full h-full object-contain p-2"
            />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-3">
            {fileName}
          </p>
        </div>
      )}

      {/* Overall Score */}
      <div className="glass-effect rounded-xl smooth-shadow-lg p-8 hover-lift">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Analysis Complete</h2>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              Here's your comprehensive design review
              {analysis.designContext && (
                <span className="block text-sm mt-1">
                  {analysis.designContext.designType} • Target: {analysis.designContext.targetAudience}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all duration-300 border border-gray-200 dark:border-white/20"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="text-center">
            <ScoreCircle score={analysis.overall} size="lg" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 transition-colors duration-300">Overall Score</h3>
            <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {analysis.overall >= 90 ? 'Excellent' : 
               analysis.overall >= 80 ? 'Very Good' : 
               analysis.overall >= 70 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(([key, category]) => (
            <div key={key} className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center border border-gray-200 dark:border-white/10 transition-colors duration-300">
              <ScoreCircle score={category.score} size="sm" />
              <h4 className="font-semibold text-gray-900 dark:text-white mt-2 capitalize transition-colors duration-300">
                {key === 'colorHarmony' ? 'Color Harmony' : key}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">{category.score}/100</p>
            </div>
          ))}
        </div>
      </div>

      {/* Design Context */}
      {analysis.designContext && (
        <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Design Context & Purpose
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Perceived Goal</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{analysis.designContext.perceivedGoal}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Target Audience</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{analysis.designContext.targetAudience}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Design Type</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{analysis.designContext.designType}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map(([key, category]) => (
          <div key={key} className="glass-effect rounded-xl smooth-shadow p-6 hover-lift transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {key === 'colorHarmony' ? 'Color Harmony' : key}
              </h3>
              <ScoreCircle score={category.score} size="sm" />
            </div>

            <p className="text-gray-700 dark:text-gray-200 mb-5 leading-relaxed">{category.feedback}</p>

            {category.references && category.references.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">Referenced Elements</h5>
                <div className="flex flex-wrap gap-2">
                  {category.references.map((ref, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 rounded-full border border-blue-300 dark:border-blue-700"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center transition-colors duration-300">
                <TrendingUp size={16} className="mr-2 text-blue-500" />
                Improvement Ideas
              </h4>
              <ul className="space-y-1">
                {category.improvementIdeas?.map((idea, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start transition-colors duration-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* AI Autofix Suggestions */}
      <ImprovementIdeas 
        analysis={analysis}
        fileName={fileName}
        isProSubscriber={isProSubscriber}
        onUpgrade={onUpgrade || (() => {})}
        userId={userId}
      />

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
            <CheckCircle size={20} className="mr-2 text-green-600" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="text-gray-600 dark:text-gray-300 flex items-start transition-colors duration-300">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
            <AlertCircle size={20} className="mr-2 text-yellow-600" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.improvements.map((improvement, idx) => (
              <li key={idx} className="text-gray-600 dark:text-gray-300 flex items-start transition-colors duration-300">
                <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}