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
      <div className="glass-effect rounded-xl smooth-shadow-lg p-6 animate-scale-in hover-lift">
        <div className="relative">
          <button
            onClick={onRemoveFile}
            className="absolute top-3 right-3 z-10 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 hover:scale-110 shadow-lg"
            aria-label="Remove file"
          >
            <X size={18} />
          </button>
          <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden mb-4 shadow-inner ring-1 ring-gray-200/50 dark:ring-gray-700/50">
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.name}
              className="w-full h-full object-contain p-2"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900 dark:text-white truncate pr-2">{uploadedFile.name}</span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl smooth-shadow-lg p-6 animate-fade-in">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer
          ${dragActive
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-500/20 dark:to-purple-500/20 scale-[1.02] shadow-lg'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
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
        
        <div className="flex flex-col items-center space-y-5">
          <div className={`
            p-4 rounded-full transition-all duration-300 transform
            ${dragActive
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-2xl'
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-500 dark:text-gray-400 hover:scale-105 shadow-md'
            }
          `}>
            {dragActive ? <Image size={40} className="animate-pulse" /> : <Upload size={40} />}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Upload your design
            </h3>
            <p className="text-base text-gray-700 dark:text-gray-200 mb-3 font-medium">
              Drag and drop your graphic design here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
              Supports JPG, PNG, GIF, WebP 
              {isProSubscriber ? ' (unlimited with Pro subscription)' :
               isAuthenticated && hasProCredits ? ' (max 10MB with pro credits)' : 
               isAuthenticated ? ' (max 3MB - no pro credits remaining)' :
               ' (max 3MB free, 10MB with pro credits, unlimited with Pro)'}
            </p>
            {isAuthenticated && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {isProSubscriber ? 'Pro subscriber: Unlimited large files' : 
                 `Pro credits: ${hasProCredits ? 'Available' : '0'}/10 • Resets monthly`}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg transition-colors duration-300">
          <p className="text-red-700 dark:text-red-300 text-sm transition-colors duration-300">{error}</p>
          {showUpgradePrompt && (
            <button
              onClick={onShowAuth}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-300"
            >
              Sign Up for Free Pro Credits
            </button>
          )}
        </div>
      )}
    </div>
  );
}