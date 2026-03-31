import React, { useCallback, useState } from 'react';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';
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

  const MAX_FREE_SIZE = 3 * 1024 * 1024;
  const MAX_PRO_SIZE = 10 * 1024 * 1024;

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please upload an image file (JPG, PNG, GIF, WebP)';
    }

    if (file.size > MAX_FREE_SIZE && !isProSubscriber && (!isAuthenticated || !hasProCredits)) {
      if (!isAuthenticated) {
        setShowUpgradePrompt(true);
        return 'Files over 3MB require a free account with pro credits, or upgrade to Pro for unlimited large files!';
      }
      return 'File size exceeds 3MB and you have no pro credits remaining. Upgrade to Pro for unlimited large files.';
    }

    if (file.size > MAX_PRO_SIZE) {
      return 'File size must be less than 10MB';
    }

    return null;
  }, [hasProCredits, isProSubscriber, isAuthenticated]);

  const processFile = useCallback((file: File) => {
    setError('');
    setShowUpgradePrompt(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const preview = URL.createObjectURL(file);
    onFileUpload({
      file,
      preview,
      name: file.name,
      size: file.size
    });
  }, [onFileUpload, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) processFile(file);
  }, [processFile]);

  if (uploadedFile) {
    return (
      <div className="card p-6 animate-scale-in">
        <div className="relative">
          <button
            onClick={onRemoveFile}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center bg-error-500 hover:bg-error-600 text-white rounded-full transition-all duration-200 hover:scale-110 shadow-soft"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4 ring-1 ring-slate-200 dark:ring-slate-700">
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.name}
              className="w-full h-full object-contain p-4"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate pr-4">
              {uploadedFile.name}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer group
          ${dragActive
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${dragActive
              ? 'bg-primary-500 text-white scale-110 rotate-3'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:scale-105 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400'
            }
          `}>
            {dragActive ? <ImageIcon className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload your design
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Drag and drop your graphic design here, or click to browse
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Supports JPG, PNG, GIF, WebP
              {isProSubscriber 
                ? ' - Unlimited with Pro' 
                : isAuthenticated && hasProCredits 
                  ? ' - Up to 10MB with pro credits' 
                  : ' - Up to 3MB free'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/50 rounded-xl animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
              {showUpgradePrompt && (
                <button
                  onClick={onShowAuth}
                  className="mt-3 btn-primary text-sm py-2"
                >
                  Sign Up for Free Pro Credits
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
