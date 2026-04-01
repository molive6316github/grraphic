import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, Check, Settings, Bot, Code } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

const DEFAULT_GRADI_PROMPT = `You are Gradi, an expert AI assistant created by Grraphic. You're available to help with absolutely anything - from creative and technical problems to general knowledge questions and everyday tasks.

# YOUR CAPABILITIES:
- Answer questions on any topic (science, history, culture, technology, etc.)
- Help with writing, coding, math, and creative projects
- Provide explanations, brainstorming, analysis, and research
- Assist with learning and professional development
- Have thoughtful, nuanced conversations
- Admit when you're uncertain and provide context on limitations

# DESIGN & GRRAPHIC EXPERTISE:
When users ask about design or want to use Grraphic features:
- You have deep knowledge of Grraphic platform (design analysis, Boxt creator, etc.)
- Can explain design principles, color theory, typography, composition
- Can guide users on using Boxt's Agent Mode for AI-powered design creation
- Agent Mode in Boxt can create professional designs from text descriptions

# YOUR PERSONALITY:
- Helpful, knowledgeable, and honest
- Clear and conversational, avoiding unnecessary jargon
- Creative and thoughtful in problem-solving
- Direct and efficient with technical questions

Be genuinely useful for whatever the user needs. You're not limited to any specific domain - help with anything they ask about.`;

export function AdminSettings() {
  const [gradiPrompt, setGradiPrompt] = useState(DEFAULT_GRADI_PROMPT);
  const [originalPrompt, setOriginalPrompt] = useState(DEFAULT_GRADI_PROMPT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'gradi_system_prompt')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setGradiPrompt(data.value);
        setOriginalPrompt(data.value);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveGradiPrompt() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { data: existing } = await supabase
        .from('system_config')
        .select('id')
        .eq('key', 'gradi_system_prompt')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('system_config')
          .update({
            value: gradiPrompt,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'gradi_system_prompt');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_config')
          .insert({
            key: 'gradi_system_prompt',
            value: gradiPrompt,
            description: 'System prompt for Gradi AI assistant'
          });

        if (error) throw error;
      }

      setOriginalPrompt(gradiPrompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    if (confirm('Are you sure you want to reset to the default prompt?')) {
      setGradiPrompt(DEFAULT_GRADI_PROMPT);
    }
  }

  const hasChanges = gradiPrompt !== originalPrompt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure system-wide settings and AI behavior
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gradi System Prompt */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gradi AI System Prompt</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize Gradi's personality and capabilities
                </p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={gradiPrompt}
                onChange={(e) => setGradiPrompt(e.target.value)}
                className="w-full h-96 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Enter the system prompt for Gradi AI..."
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {gradiPrompt.length} characters
                </span>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle size={18} className="text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            {saved && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check size={18} className="text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Settings saved successfully!</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={resetToDefault}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Reset to Default
              </button>
              <button
                onClick={saveGradiPrompt}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Other Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Configuration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure external API settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Code size={16} className="text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Groq API</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Used for Gradi AI chat and Site Designer
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                  Configured
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Code size={16} className="text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-white">Gemini API</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Used for design analysis and UI analysis
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                  Optional
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
