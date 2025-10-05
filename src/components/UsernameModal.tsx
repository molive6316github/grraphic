import React, { useState, useEffect } from 'react';
import { X, User, Check, AlertCircle, LogOut } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onUpdate: (username: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  onSignOut: () => void;
}

export function UsernameModal({
  isOpen,
  onClose,
  currentUsername,
  onUpdate,
  loading,
  error,
  clearError,
  onSignOut,
}: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setUsername(currentUsername);
  }, [currentUsername]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const result = await onUpdate(username);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transition-colors duration-300">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 mx-auto">
              <User size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Set Username
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mt-2">
              Choose a unique username for your public profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {error && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600 dark:text-green-400">Username updated successfully!</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !username.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
