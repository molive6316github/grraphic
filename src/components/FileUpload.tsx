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
      <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
        <div className="relative">
          <button
            onClick={onRemoveFile}
            className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
          >
            <X size={16} />
          </button>
          <div className="aspect-video bg-gray-100 dark:bg-black/20 rounded-lg overflow-hidden mb-4 transition-colors duration-300">
            <img
              src={uploadedFile.preview}
              alt={uploadedFile.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
            <span className="font-medium">{uploadedFile.name}</span>
            <span>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-white/20 p-6 transition-colors duration-300">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${dragActive 
            ? 'border-blue-400 bg-blue-500/10' 
            : 'border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400'
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
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-3 rounded-full transition-colors duration-200
            ${dragActive ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400'}
          `}>
            {dragActive ? <Image size={32} /> : <Upload size={32} />}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
              Upload your design
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-2 transition-colors duration-300">
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