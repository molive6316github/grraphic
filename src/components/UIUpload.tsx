import React, { useState, useCallback } from 'react';
import { Upload, Link, FileCode, X } from 'lucide-react';
import { UIUpload } from '../types';

interface UIUploadProps {
  onUpload: (upload: UIUpload) => void;
  uploadedUI: UIUpload | null;
  onRemove: () => void;
  hasProCredits: boolean;
  isProSubscriber: boolean;
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export function UIUpload({
  onUpload,
  uploadedUI,
  onRemove,
  hasProCredits,
  isProSubscriber,
  isAuthenticated,
  onShowAuth
}: UIUploadProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('url');
  const [url, setUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!file.name.endsWith('.html')) {
      setError('Please upload an HTML file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      const content = await file.text();
      onUpload({
        type: 'html',
        content,
        name: file.name
      });
    } catch (err) {
      setError('Failed to read file');
    }

    e.target.value = '';
  }, [onUpload]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    setError('');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      setError('Please upload an HTML file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      const content = await file.text();
      onUpload({
        type: 'html',
        content,
        name: file.name
      });
    } catch (err) {
      setError('Failed to read file');
    }
  }, [onUpload]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!url.trim()) {
      setError('Please enter a URL');
      setLoading(false);
      return;
    }

    try {
      const urlObj = new URL(url);
      onUpload({
        type: 'url',
        content: url,
        name: urlObj.hostname,
        url: url
      });
    } catch (err) {
      setError('Please enter a valid URL (including http:// or https://)');
    } finally {
      setLoading(false);
    }
  };

  if (uploadedUI) {
    return (
      <div className="glass-effect rounded-xl smooth-shadow-lg p-6 animate-scale-in hover-lift">
        <div className="relative">
          <button
            onClick={onRemove}
            className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
            aria-label="Remove"
          >
            <X size={18} />
          </button>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-4 ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <div className="flex items-center gap-3 mb-3">
              {uploadedUI.type === 'html' ? (
                <FileCode className="text-blue-600 dark:text-blue-400" size={32} />
              ) : (
                <Link className="text-purple-600 dark:text-purple-400" size={32} />
              )}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  {uploadedUI.type === 'html' ? 'HTML File' : 'Website URL'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadedUI.name}
                </p>
              </div>
            </div>
            {uploadedUI.url && (
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white/50 dark:bg-black/20 rounded px-3 py-2">
                {uploadedUI.url}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl smooth-shadow-lg p-6 animate-fade-in">
      <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Enter Website URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Capturing Screenshot...' : 'Analyze Website'}
          </button>
        </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg animate-fade-in">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
