import React, { useState } from 'react';
import { Shield, Users, FileImage, CreditCard, TrendingUp, RefreshCw, AlertCircle, MessageSquare, Ticket, Image, Settings, Code } from 'lucide-react';
import { useAdminStats } from '../hooks/useAdminStats';
import { AdminUsers } from './AdminUsers';
import { AdminSubscriptions } from './AdminSubscriptions';
import { AdminDiscountCodes } from './AdminDiscountCodes';
import { AdminErrorLogs } from './AdminErrorLogs';
import { AdminReviews } from './AdminReviews';
import { AdminGradiChats } from './AdminGradiChats';
import { AdminAnalyses } from './AdminAnalyses';
import { AdminSettings } from './AdminSettings';
import { AdminStripeSettings } from './AdminStripeSettings';
import { AdminOAuthApps } from './AdminOAuthApps';

type AdminView = 'overview' | 'users' | 'subscriptions' | 'discounts' | 'errors' | 'reviews' | 'chats' | 'analyses' | 'settings' | 'stripe' | 'oauth';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { stats, loading, error, refetch } = useAdminStats();
  const [activeView, setActiveView] = useState<AdminView>('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your platform</p>
              </div>
            </div>
          </div>
          <button
            onClick={refetch}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all"
          >
            <RefreshCw size={16} className="text-gray-600 dark:text-gray-300" />
            <span className="text-sm text-gray-700 dark:text-gray-200">Refresh</span>
          </button>
        </div>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Users & Admins
          </button>
          <button
            onClick={() => setActiveView('subscriptions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'subscriptions'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Subscriptions
          </button>
          <button
            onClick={() => setActiveView('discounts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'discounts'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Discount Codes
          </button>
          <button
            onClick={() => setActiveView('reviews')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'reviews'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All Reviews
          </button>
          <button
            onClick={() => setActiveView('chats')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'chats'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Gradi Chats
          </button>
          <button
            onClick={() => setActiveView('analyses')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'analyses'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All Analyses
          </button>
          <button
            onClick={() => setActiveView('errors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'errors'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Error Logs
          </button>
          <button
            onClick={() => setActiveView('oauth')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'oauth'
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            OAuth Apps
          </button>
          <button
            onClick={() => setActiveView('stripe')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'stripe'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Stripe
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'settings'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {activeView === 'overview' && stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Analyses</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAnalyses}</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FileImage size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pro Subscribers</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.proSubscribers}</p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CreditCard size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <TrendingUp size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username || 'no username'}</p>
                      </div>
                      {user.is_pro_subscriber && (
                        <span className="px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Analyses</h3>
                <div className="space-y-3">
                  {stats.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">{analysis.file_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{analysis.user_email}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'users' && <AdminUsers />}
        {activeView === 'subscriptions' && <AdminSubscriptions />}
        {activeView === 'discounts' && <AdminDiscountCodes />}
        {activeView === 'errors' && <AdminErrorLogs />}
        {activeView === 'reviews' && <AdminReviews />}
        {activeView === 'chats' && <AdminGradiChats />}
        {activeView === 'analyses' && <AdminAnalyses />}
        {activeView === 'oauth' && <AdminOAuthApps />}
        {activeView === 'stripe' && <AdminStripeSettings />}
        {activeView === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
