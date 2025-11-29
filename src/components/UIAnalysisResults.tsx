import React from 'react';
import { Monitor, TrendingUp, Download, Star, Link } from 'lucide-react';
import { UIAnalysis } from '../types';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'lg';
}

function ScoreCircle({ score, size = 'lg' }: ScoreCircleProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const dimensions = size === 'lg' ? 'w-32 h-32' : 'w-16 h-16';
  const fontSize = size === 'lg' ? 'text-4xl' : 'text-xl';

  return (
    <div className={`${dimensions} ${getBgColor(score)} rounded-full flex items-center justify-center shadow-lg`}>
      <span className={`${fontSize} font-bold ${getColor(score)}`}>{score}</span>
    </div>
  );
}

interface UIAnalysisResultsProps {
  analysis: UIAnalysis;
  uploadName: string;
  uploadType: 'html' | 'url';
  uploadUrl?: string;
  isProSubscriber?: boolean;
  onUpgrade?: () => void;
  userId?: string;
}

export function UIAnalysisResults({
  analysis,
  uploadName,
  uploadType,
  uploadUrl,
  isProSubscriber = false,
  onUpgrade,
  userId
}: UIAnalysisResultsProps) {
  const categories = Object.entries(analysis.categories);

  const exportReport = () => {
    const report = {
      uploadName,
      uploadType,
      uploadUrl,
      analysis,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grraphic-ui-analysis-${uploadName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {uploadUrl && (
        <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Link size={22} className="mr-2 text-blue-600 dark:text-blue-400" />
            Analyzed Website
          </h3>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 shadow-inner ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
              {uploadName}
            </p>
            <a
              href={uploadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono break-all"
            >
              {uploadUrl}
            </a>
          </div>
        </div>
      )}

      <div className="glass-effect rounded-xl smooth-shadow-lg p-8 hover-lift">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text mb-3">UI Analysis Complete</h2>
            <p className="text-gray-600 dark:text-gray-300">Comprehensive evaluation of your user interface</p>
          </div>
          <ScoreCircle score={analysis.overall} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map(([key, category]) => (
          <div key={key} className="glass-effect rounded-xl smooth-shadow p-6 hover-lift transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {key === 'uxPatterns' ? 'UX Patterns' : key}
              </h3>
              <ScoreCircle score={category.score} size="sm" />
            </div>

            <p className="text-gray-700 dark:text-gray-200 mb-5 leading-relaxed">{category.feedback}</p>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                <TrendingUp size={16} className="mr-2 text-blue-500" />
                Improvement Ideas
              </h4>
              <ul className="space-y-1">
                {category.improvementIdeas?.map((idea, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Star size={22} className="mr-2 text-yellow-500" />
          Key Strengths
        </h3>
        <ul className="space-y-2">
          {analysis.strengths.map((strength, idx) => (
            <li key={idx} className="text-gray-700 dark:text-gray-200 flex items-start">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp size={22} className="mr-2 text-blue-500" />
          Priority Improvements
        </h3>
        <ul className="space-y-2">
          {analysis.improvements.map((improvement, idx) => (
            <li key={idx} className="text-gray-700 dark:text-gray-200 flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-effect rounded-xl smooth-shadow-lg p-6 hover-lift">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Monitor size={22} className="mr-2 text-purple-500" />
          Best Practices
        </h3>
        <ul className="space-y-2">
          {analysis.bestPractices.map((practice, idx) => (
            <li key={idx} className="text-gray-700 dark:text-gray-200 flex items-start">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              {practice}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
