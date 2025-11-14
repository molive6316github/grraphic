import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserX, Search, Shield, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  user_id: string;
  created_at: string;
  email?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  is_pro_subscriber: boolean;
}

export function AdminUsers() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [subscriptionDuration, setSubscriptionDuration] = useState<string>('1month');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: adminsData }, { data: usersData }] = await Promise.all([
        supabase.from('admins').select('*'),
        supabase.from('users').select('*').order('created_at', { ascending: false })
      ]);

      const adminsWithEmails = await Promise.all(
        (adminsData || []).map(async (admin) => {
          const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', admin.user_id)
            .maybeSingle();
          return { ...admin, email: user?.email };
        })
      );

      setAdmins(adminsWithEmails);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (userId: string, email: string) => {
    try {
      setActionLoading(userId);
      const { error } = await supabase.from('admins').insert({
        user_id: userId,
        granted_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      await fetchData();
      alert(`Successfully added ${email} as admin`);
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as admin?`)) return;

    try {
      setActionLoading(adminId);
      const { error } = await supabase.from('admins').delete().eq('id', adminId);

      if (error) throw error;

      await fetchData();
      alert(`Successfully removed ${email} as admin`);
    } catch (error) {
      console.error('Error removing admin:', error);
      alert('Failed to remove admin. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSubscription = async (userId: string, currentStatus: boolean) => {
    if (currentStatus) {
      // Removing subscription - just remove it
      try {
        setActionLoading(userId);
        const { error } = await supabase
          .from('users')
          .update({
            is_pro_subscriber: false,
            pro_subscription_expires_at: null
          })
          .eq('id', userId);

        if (error) throw error;

        await fetchData();
        alert('Successfully removed Pro subscription');
      } catch (error) {
        console.error('Error removing subscription:', error);
        alert('Failed to remove subscription. Please try again.');
      } finally {
        setActionLoading(null);
      }
    } else {
      // Granting subscription - show duration modal
      setSelectedUserId(userId);
      setShowDurationModal(true);
    }
  };

  const handleGrantSubscription = async () => {
    if (!selectedUserId) return;

    try {
      setActionLoading(selectedUserId);

      let expiresAt = null;
      if (subscriptionDuration !== 'lifetime') {
        const now = new Date();
        switch (subscriptionDuration) {
          case '1month':
            expiresAt = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
            break;
          case '3months':
            expiresAt = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
            break;
          case '6months':
            expiresAt = new Date(now.setMonth(now.getMonth() + 6)).toISOString();
            break;
          case '1year':
            expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
            break;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          is_pro_subscriber: true,
          pro_subscription_expires_at: expiresAt
        })
        .eq('id', selectedUserId);

      if (error) throw error;

      await fetchData();
      setShowDurationModal(false);
      setSelectedUserId(null);
      alert(`Successfully granted Pro subscription${expiresAt ? ` until ${new Date(expiresAt).toLocaleDateString()}` : ' (lifetime)'}`);
    } catch (error) {
      console.error('Error granting subscription:', error);
      alert('Failed to grant subscription. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAccount = async (userId: string, email: string) => {
    const confirmation = prompt(
      `WARNING: This will permanently delete the account for ${email} and all associated data.\n\nType "DELETE" to confirm:`
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      setActionLoading(userId);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === userId) {
        alert('You cannot delete your own account from the admin panel.');
        return;
      }

      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteUserError) throw deleteUserError;

      await fetchData();
      alert(`Successfully deleted account for ${email}`);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };


  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = (userId: string) => admins.some((admin) => admin.user_id === userId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showDurationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Grant Pro Subscription
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Select how long the Pro subscription should last:
            </p>
            <div className="space-y-2 mb-6">
              <label className="flex items-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="duration"
                  value="1month"
                  checked={subscriptionDuration === '1month'}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white font-medium">1 Month</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="duration"
                  value="3months"
                  checked={subscriptionDuration === '3months'}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white font-medium">3 Months</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="duration"
                  value="6months"
                  checked={subscriptionDuration === '6months'}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white font-medium">6 Months</span>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <input
                  type="radio"
                  name="duration"
                  value="1year"
                  checked={subscriptionDuration === '1year'}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white font-medium">1 Year</span>
              </label>
              <label className="flex items-center p-3 border-2 border-green-500 dark:border-green-400 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                <input
                  type="radio"
                  name="duration"
                  value="lifetime"
                  checked={subscriptionDuration === 'lifetime'}
                  onChange={(e) => setSubscriptionDuration(e.target.value)}
                  className="mr-3"
                />
                <span className="text-gray-900 dark:text-white font-medium">Lifetime (No Expiration)</span>
              </label>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDurationModal(false);
                  setSelectedUserId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantSubscription}
                disabled={actionLoading === selectedUserId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === selectedUserId ? 'Granting...' : 'Grant Pro'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Admins</h2>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
            <Shield size={20} />
            <span className="text-sm font-medium">{admins.length} Admins</span>
          </div>
        </div>
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{admin.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Admin since {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveAdmin(admin.id, admin.email || '')}
                disabled={actionLoading === admin.id}
                className="flex items-center space-x-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserX size={16} />
                <span className="text-sm">Remove</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">All Users</h2>
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredUsers.map((user) => {
            const userIsAdmin = isAdmin(user.id);
            return (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                    {userIsAdmin && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded">
                        ADMIN
                      </span>
                    )}
                    {user.is_pro_subscriber && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username || 'no username'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>

                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleSubscription(user.id, user.is_pro_subscriber)}
                    disabled={actionLoading === user.id}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      user.is_pro_subscriber
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    <UserCheck size={16} />
                    <span className="text-sm">{user.is_pro_subscriber ? 'Remove Pro' : 'Grant Pro'}</span>
                  </button>

                  {!userIsAdmin && (
                    <button
                      onClick={() => handleAddAdmin(user.id, user.email)}
                      disabled={actionLoading === user.id}
                      className="flex items-center space-x-2 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <UserPlus size={16} />
                      <span className="text-sm">Make Admin</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteAccount(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    className="flex items-center space-x-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    <span className="text-sm">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </>
  );
}
