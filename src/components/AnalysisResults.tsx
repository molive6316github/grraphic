import React, { useRef, useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Download, Image, Crop } from 'lucide-react';
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

function VisualReference({ imageUrl, boundingBox, description }: { 
  imageUrl: string; 
  boundingBox: { x: number; y: number; width: number; height: number }; 
  description: string 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cropX = boundingBox.x * img.width;
      const cropY = boundingBox.y * img.height;
      const cropWidth = boundingBox.width * img.width;
      const cropHeight = boundingBox.height * img.height;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      setIsLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl, boundingBox]);

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-primary-200 dark:border-primary-800 shadow-soft max-w-full h-auto"
        style={{ maxHeight: '120px' }}
      />
      {isLoaded && (
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2">
          <p className="text-white text-xs font-medium text-center">{description}</p>
        </div>
      )}
    </div>
  );
}

function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeConfig = {
    sm: { class: 'w-14 h-14', radius: 20, stroke: 3, fontSize: 'text-sm' },
    md: { class: 'w-18 h-18', radius: 28, stroke: 4, fontSize: 'text-lg' },
    lg: { class: 'w-24 h-24', radius: 40, stroke: 5, fontSize: 'text-2xl' }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 90) return { ring: 'text-success-500', text: 'text-success-600 dark:text-success-400' };
    if (score >= 80) return { ring: 'text-primary-500', text: 'text-primary-600 dark:text-primary-400' };
    if (score >= 70) return { ring: 'text-warning-500', text: 'text-warning-600 dark:text-warning-400' };
    return { ring: 'text-error-500', text: 'text-error-600 dark:text-error-400' };
  };

  const colors = getScoreColor(score);

  return (
    <div className={`${config.class} relative`}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="transparent"
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx="50%"
          cy="50%"
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${colors.ring}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${config.fontSize} ${colors.text}`}>{score}</span>
      </div>
    </div>
  );
}

export function AnalysisResults({ analysis, fileName, imagePreview, isProSubscriber = false, onUpgrade, userId }: AnalysisResultsProps) {
  const categories = Object.entries(analysis.categories);

  const exportReport = () => {
    const report = { fileName, analysis, generatedAt: new Date().toISOString() };
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

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Image Preview */}
      {(imagePreview || (analysis as any).image_url) && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary-500" />
            Analyzed Design
          </h3>
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
            <img
              src={imagePreview || (analysis as any).image_url}
              alt={fileName}
              className="w-full h-full object-contain p-2"
            />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-3">{fileName}</p>
        </div>
      )}

      {/* Overall Score */}
      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">Analysis Complete</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Here&apos;s your comprehensive design review
              {analysis.designContext && (
                <span className="block text-sm mt-1">
                  {analysis.designContext.designType} - Target: {analysis.designContext.targetAudience}
                </span>
              )}
            </p>
          </div>
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          <ScoreCircle score={analysis.overall} size="lg" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-4">Overall Score</h3>
          <p className="text-slate-600 dark:text-slate-400">{getScoreLabel(analysis.overall)}</p>
        </div>

        {/* Category Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map(([key, category]) => (
            <div key={key} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
              <ScoreCircle score={category.score} size="sm" />
              <h4 className="font-medium text-slate-900 dark:text-white mt-2 capitalize text-sm">
                {key === 'colorHarmony' ? 'Color Harmony' : key}
              </h4>
            </div>
          ))}
        </div>
      </div>

      {/* Design Context */}
      {analysis.designContext && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Design Context</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Perceived Goal', value: analysis.designContext.perceivedGoal },
              { label: 'Target Audience', value: analysis.designContext.targetAudience },
              { label: 'Design Type', value: analysis.designContext.designType }
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{item.label}</h4>
                <p className="text-slate-900 dark:text-white font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Category Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map(([key, category]) => (
          <div key={key} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                {key === 'colorHarmony' ? 'Color Harmony' : key}
              </h3>
              <ScoreCircle score={category.score} size="sm" />
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{category.feedback}</p>

            {/* Visual References */}
            {category.visualReferences && category.visualReferences.length > 0 && (imagePreview || (analysis as any).image_url) && (
              <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800/50">
                <h5 className="text-xs font-semibold text-primary-700 dark:text-primary-300 mb-2 uppercase tracking-wide flex items-center gap-1">
                  <Crop className="w-3 h-3" />
                  Visual References
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {category.visualReferences.map((ref, idx) => (
                    <div key={idx}>
                      <VisualReference
                        imageUrl={imagePreview || (analysis as any).image_url}
                        boundingBox={ref.boundingBox}
                        description={ref.description}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ref.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referenced Elements */}
            {category.references && category.references.length > 0 && (
              <div className="mb-4">
                <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Referenced Elements</h5>
                <div className="flex flex-wrap gap-2">
                  {category.references.map((ref, idx) => (
                    <span key={idx} className="badge-primary">{ref}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Ideas */}
            {category.improvementIdeas && category.improvementIdeas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  Improvement Ideas
                </h4>
                <ul className="space-y-1.5">
                  {category.improvementIdeas.map((idea, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Improvement Ideas */}
      <ImprovementIdeas 
        analysis={analysis}
        fileName={fileName}
        isProSubscriber={isProSubscriber}
        onUpgrade={onUpgrade || (() => {})}
        userId={userId}
      />

      {/* Strengths & Improvements Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-success-500 rounded-full mt-2 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning-500" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.improvements.map((improvement, idx) => (
              <li key={idx} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-warning-500 rounded-full mt-2 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
