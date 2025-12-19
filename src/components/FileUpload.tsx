import React, { useCallback, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  onFileUpload: (file: UploadedFile) => void;
  uploadedFile: UploadedFile | null;
  onRemoveFile: () => void;
  hasProCredits: boolean;
  isProSubscriber: boolean;
  isAuthenticated: boolean;
  onShowAuth: () => void;
}

export function FileUpload({ 
  onFileUpload, 
  uploadedFile, 
  onRemoveFile, 
  hasProCredits, 
  isProSubscriber,
  isAuthenticated,
  onShowAuth 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const MAX_FREE_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_PRO_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    setError('');
    setShowUpgradePrompt(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Check file size limits
    if (file.size > MAX_FREE_SIZE && !isProSubscriber && (!isAuthenticated || !hasProCredits)) {
      if (!isAuthenticated) {
        setShowUpgradePrompt(true);
        setError('Files over 3MB require a free account with pro credits, or upgrade to Pro for unlimited large files!');
        return;
      } else {
        setError('File size exceeds 3MB and you have no pro credits remaining. Upgrade to Pro for unlimited large files, or wait for monthly credit reset.');
        return;
      }
    }

    if (file.size > MAX_PRO_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    onFileUpload({
      file,
      preview,
      name: file.name,
      size: file.size
    });
  }, [onFileUpload, hasProCredits, isProSubscriber, isAuthenticated]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setShowUpgradePrompt(false);

    // Clear the input to prevent file path exposure
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Check file size limits
    if (file.size > MAX_FREE_SIZE && !isProSubscriber && (!isAuthenticated || !hasProCredits)) {
      if (!isAuthenticated) {
        setShowUpgradePrompt(true);
        setError('Files over 3MB require a free account with pro credits, or upgrade to Pro for unlimited large files!');
        return;
      } else {
        setError('File size exceeds 3MB and you have no pro credits remaining. Upgrade to Pro for unlimited large files, or wait for monthly credit reset.');
        return;
      }
    }

    if (file.size > MAX_PRO_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    onFileUpload({
      file,
      preview,
      name: file.name,
      size: file.size
    });
  }, [onFileUpload, hasProCredits, isProSubscriber, isAuthenticated]);

  if (uploadedFile) {
    return (
      <div className="glass-card p-8 animate-scale-in card-hover">
        <div className="relative">
          <button
            onClick={onRemoveFile}
            className="absolute -top-3 -right-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 transition-all duration-300 hover:scale-110 shadow-soft-lg hover:shadow-red-500/50"
            aria-label="Remove file"
          >
            <X size={20} />
          </button>
          <div className="aspect-video bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden mb-6 shadow-inner-soft ring-2 ring-slate-200/60 dark:ring-slate-700/50">
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.name}
              className="w-full h-full object-contain p-4"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate pr-4">{uploadedFile.name}</span>
            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <div
        className={`
          relative border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-500 cursor-pointer group
          ${dragActive
            ? 'border-primary-500 bg-gradient-to-br from-primary-50 via-accent-50/50 to-primary-50 dark:from-primary-500/20 dark:via-accent-500/10 dark:to-primary-500/20 scale-[1.02] shadow-soft-xl'
            : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center space-y-6">
          <div className={`
            p-6 rounded-2xl transition-all duration-500 transform
            ${dragActive
              ? 'bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 text-white scale-110 shadow-soft-xl rotate-6'
              : 'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 text-slate-500 dark:text-slate-400 group-hover:scale-110 group-hover:rotate-3 shadow-soft-lg'
            }
          `}>
            {dragActive ? <Image size={48} className="animate-pulse" /> : <Upload size={48} />}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
              Upload your design
            </h3>
            <p className="text-lg text-slate-700 dark:text-slate-200 mb-4 font-medium leading-relaxed">
              Drag and drop your graphic design here, or click to browse
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-500">
              Supports JPG, PNG, GIF, WebP
              {isProSubscriber ? ' (unlimited with Pro subscription)' :
               isAuthenticated && hasProCredits ? ' (max 10MB with pro credits)' :
               isAuthenticated ? ' (max 3MB - no pro credits remaining)' :
               ' (max 3MB free, 10MB with pro credits, unlimited with Pro)'}
            </p>
            {isAuthenticated && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                {isProSubscriber ? 'Pro subscriber: Unlimited large files' :
                 `Pro credits: ${hasProCredits ? 'Available' : '0'}/10 • Resets monthly`}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500/30 rounded-xl transition-all duration-500 shadow-soft animate-slide-down">
          <p className="text-red-700 dark:text-red-300 text-sm font-medium transition-colors duration-500">{error}</p>
          {showUpgradePrompt && (
            <button
              onClick={onShowAuth}
              className="mt-3 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5 shadow-soft"
            >
              Sign Up for Free Pro Credits
            </button>
          )}
        </div>
      )}
    </div>
  );
}