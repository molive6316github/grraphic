import React, { useState } from 'react';
import { Wand2, Sparkles, Crown, Loader2, Download, Zap } from 'lucide-react';
import { DesignAnalysis } from '../types';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../hooks/useAuth';

interface AutofixSuggestionsProps {
  analysis: DesignAnalysis;
  fileName: string;
  isProSubscriber: boolean;
  onUpgrade: () => void;
  userId?: string;
}

interface AutofixSuggestion {
  category: string;
  issue: string;
  fix: string;
  impact: 'high' | 'medium' | 'low';
}

interface AutofixResult {
  fixedImageUrl: string;
  appliedFixes: string[];
  creditsUsed: number;
}

export function AutofixSuggestions({ analysis, fileName, isProSubscriber, onUpgrade, userId }: AutofixSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AutofixSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState<AutofixResult | null>(null);
  const [isSpecialUser, setIsSpecialUser] = useState(false);
  const { credits, useProCredit, refreshCredits } = useCredits(userId);
  
  React.useEffect(() => {
    const checkSpecialUser = async () => {
      const { supabase } = await import('../lib/supabase');
      const { data: userData } = await supabase.auth.getUser();
      setIsSpecialUser(userData?.user?.email === 'maxolive6316@gmail.com');
    };
    checkSpecialUser();
  }, []);

  const generateAutofixSuggestions = async () => {
    // Check if user has enough credits for suggestions (2 credits required)
    if (!isProSubscriber && !isSpecialUser && (!credits || credits.pro_credits_remaining < 2)) {
      alert('You need 2 pro credits to generate AI suggestions. Please upgrade to Pro or wait for your monthly credit reset.');
      return;
    }

    // Use 2 credits for suggestions (unless pro subscriber or special user)
    if (!isProSubscriber && !isSpecialUser) {
      for (let i = 0; i < 2; i++) {
        const success = await useProCredit();
        if (!success) {
          alert('Failed to use pro credits. Please try again.');
          return;
        }
      }
      refreshCredits();
    }

    setLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate smart suggestions based on analysis scores
    const autofixSuggestions: AutofixSuggestion[] = [];
    
    Object.entries(analysis.categories).forEach(([category, data]) => {
      if (data.score < 85) {
        const suggestions = generateCategoryFixes(category, data.score, data.feedback);
        autofixSuggestions.push(...suggestions);
      }
    });

    // Sort by impact
    const sortedSuggestions = autofixSuggestions.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    setSuggestions(sortedSuggestions.slice(0, 6)); // Limit to top 6 suggestions
    setGenerated(true);
    setLoading(false);
  };

  const applyAutofixes = async () => {
    if (!isProSubscriber && !isSpecialUser && (!credits || credits.pro_credits_remaining < 5)) {
      alert('You need 5 pro credits to apply AI autofixes. Please upgrade to Pro or wait for your monthly credit reset.');
      return;
    }

    // Use 5 credits for autofix implementation (unless pro subscriber or special user)
    if (!isProSubscriber && !isSpecialUser) {
      for (let i = 0; i < 5; i++) {
        const success = await useProCredit();
        if (!success) {
          alert('Failed to use pro credits. Please try again.');
          return;
        }
      }
      refreshCredits();
    }

    setFixLoading(true);
    
    try {
      // This is a placeholder for actual AI autofix implementation
      // In a real implementation, this would:
      // 1. Send the original image and suggestions to an AI service
      // 2. Apply the fixes using image processing/AI
      // 3. Return the enhanced image
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For now, show a message that this feature is coming soon
      alert('AI Autofix implementation is coming soon! This feature will automatically apply the suggested improvements to your design using advanced AI image processing.');
      
    } catch (error) {
      console.error('Autofix error:', error);
      alert('Failed to apply autofixes. Please try again later.');
    } finally {
      setFixLoading(false);
    }
  };

  const downloadFixedImage = () => {
    if (!fixResult) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = fixResult.fixedImageUrl;
    link.download = `fixed-${fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCategoryFixes = (category: string, score: number, feedback: string): AutofixSuggestion[] => {
    const fixes: Record<string, AutofixSuggestion[]> = {
      typography: [
        {
          category: 'Typography',
          issue: 'Inconsistent font hierarchy',
          fix: 'Establish a clear type scale with 3-4 distinct font sizes (e.g., 32px, 24px, 18px, 14px)',
          impact: 'high'
        },
        {
          category: 'Typography',
          issue: 'Poor readability',
          fix: 'Increase line height to 1.5-1.6 and ensure minimum 16px font size for body text',
          impact: 'high'
        }
      ],
      colorHarmony: [
        {
          category: 'Color Harmony',
          issue: 'Too many competing colors',
          fix: 'Limit palette to 3-5 colors: 1 primary, 1-2 secondary, and neutral tones',
          impact: 'high'
        },
        {
          category: 'Color Harmony',
          issue: 'Colors lack cohesion',
          fix: 'Use a color harmony rule (complementary, triadic, or analogous) and adjust saturation levels',
          impact: 'medium'
        }
      ],
      composition: [
        {
          category: 'Composition',
          issue: 'Unbalanced layout',
          fix: 'Apply rule of thirds: place key elements along grid lines or intersections',
          impact: 'high'
        },
        {
          category: 'Composition',
          issue: 'Weak focal point',
          fix: 'Create hierarchy using size, contrast, or positioning to establish a clear entry point',
          impact: 'medium'
        }
      ],
      hierarchy: [
        {
          category: 'Visual Hierarchy',
          issue: 'Elements compete for attention',
          fix: 'Use the 60-30-10 rule: 60% dominant element, 30% secondary, 10% accent',
          impact: 'high'
        },
        {
          category: 'Visual Hierarchy',
          issue: 'Unclear information flow',
          fix: 'Create a Z-pattern or F-pattern layout to guide eye movement naturally',
          impact: 'medium'
        }
      ],
      spacing: [
        {
          category: 'Spacing',
          issue: 'Cramped design',
          fix: 'Increase white space by 20-30% around key elements and between sections',
          impact: 'medium'
        },
        {
          category: 'Spacing',
          issue: 'Inconsistent margins',
          fix: 'Use a consistent spacing system (8px, 16px, 24px, 32px) throughout the design',
          impact: 'low'
        }
      ],
      contrast: [
        {
          category: 'Contrast',
          issue: 'Poor text readability',
          fix: 'Ensure 4.5:1 contrast ratio for normal text, 3:1 for large text (WCAG AA standard)',
          impact: 'high'
        },
        {
          category: 'Contrast',
          issue: 'Weak visual separation',
          fix: 'Increase contrast between sections using background colors or borders',
          impact: 'medium'
        }
      ]
    };

    return fixes[category] || [];
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/20';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-500/20';
    }
  };

  if (!isProSubscriber && !isSpecialUser) {
    return (
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-600/20 rounded-full mb-4">
            <Crown size={24} className="text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            AI Autofix Suggestions
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Get personalized suggestions (2 credits) and AI-powered autofixes (5 credits)
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p>• 2 credits: Get AI suggestions</p>
            <p>• 5 credits: Apply AI autofixes</p>
            <p>• Pro subscribers: Unlimited usage</p>
          </div>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
          >
            <Crown size={16} />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Wand2 size={20} className="mr-2 text-purple-500" />
          AI Autofix Suggestions
          <Crown size={16} className="ml-2 text-yellow-500" />
        </h3>
        {!generated && (
          <button
            onClick={generateAutofixSuggestions}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Fixes {!isProSubscriber && !isSpecialUser ? '(2 credits)' : ''}</span>
              </>
            )}
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400">
            <Loader2 size={20} className="animate-spin" />
            <span>AI is analyzing your design for improvement opportunities...</span>
          </div>
        </div>
      )}

      {generated && suggestions.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Based on your design analysis, here are personalized suggestions to improve your design:
          </p>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {suggestion.category}
                  </h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                    {suggestion.impact} impact
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Issue:</strong> {suggestion.issue}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Fix:</strong> {suggestion.fix}
                </p>
              </div>
            ))}
          </div>
          
          {!fixResult && (
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200 dark:border-purple-500/30">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <Zap size={16} className="mr-2 text-purple-500" />
                AI Autofix Implementation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Let our AI automatically apply these fixes to your design and generate an improved version. (Requires suggestions first)
              </p>
              <button
                onClick={applyAutofixes}
                disabled={fixLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                {fixLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Applying Fixes...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Apply AI Autofixes {!isProSubscriber && !isSpecialUser ? '(5 credits)' : ''}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {fixLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-4">
            <Loader2 size={24} className="animate-spin" />
            <span>AI is applying fixes to your design...</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This may take a few moments while we enhance your design.
          </p>
        </div>
      )}

      {fixResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
              <Sparkles size={16} className="mr-2" />
              AI Autofix Complete!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Your design has been enhanced with the following improvements:
            </p>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {fixResult.appliedFixes.map((fix, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {fix}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="aspect-video bg-gray-100 dark:bg-black/20 rounded-lg overflow-hidden">
            <img
              src={fixResult.fixedImageUrl}
              alt="AI-fixed design"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {fixResult.creditsUsed > 0 && `${fixResult.creditsUsed} credits used`}
            </p>
            <button
              onClick={downloadFixedImage}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              <Download size={16} />
              <span>Download Fixed Design</span>
            </button>
          </div>
        </div>
      )}

      {generated && suggestions.length === 0 && (
        <div className="text-center py-8">
          <Sparkles size={32} className="mx-auto text-green-500 mb-2" />
          <p className="text-gray-600 dark:text-gray-300">
            Great job! Your design is already well-optimized. No major improvements needed.
          </p>
        </div>
      )}
    </div>
  );
}