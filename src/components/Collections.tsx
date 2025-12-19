import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, X, Check, FolderOpen, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_default: boolean;
  item_count?: number;
}

interface CollectionsProps {
  userId: string;
  selectedAnalysisId?: string;
  onClose?: () => void;
}

export function Collections({ userId, selectedAnalysisId, onClose }: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0ea5e9',
    icon: 'Folder'
  });

  const availableColors = [
    '#0ea5e9', '#d946ef', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
  ];

  useEffect(() => {
    loadCollections();
  }, [userId]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('design_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      const collectionsWithCounts = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          const { count } = await supabase
            .from('design_collection_items')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);

          return { ...collection, item_count: count || 0 };
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('design_collections')
        .insert([{
          user_id: userId,
          ...formData
        }]);

      if (error) throw error;

      setFormData({ name: '', description: '', color: '#0ea5e9', icon: 'Folder' });
      setShowCreateForm(false);
      loadCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Failed to create collection');
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;

    try {
      const { error } = await supabase
        .from('design_collections')
        .update({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          icon: formData.icon,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCollection.id);

      if (error) throw error;

      setEditingCollection(null);
      setFormData({ name: '', description: '', color: '#0ea5e9', icon: 'Folder' });
      loadCollections();
    } catch (error) {
      console.error('Error updating collection:', error);
      alert('Failed to update collection');
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? This will not delete the designs.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('design_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection');
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!selectedAnalysisId) return;

    try {
      const { error } = await supabase
        .from('design_collection_items')
        .insert([{
          collection_id: collectionId,
          analysis_id: selectedAnalysisId
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('This design is already in this collection');
        } else {
          throw error;
        }
        return;
      }

      alert('Added to collection!');
      if (onClose) onClose();
      loadCollections();
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('Failed to add to collection');
    }
  };

  const startEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon
    });
  };

  const cancelEdit = () => {
    setEditingCollection(null);
    setFormData({ name: '', description: '', color: '#0ea5e9', icon: 'Folder' });
  };

  if (loading) {
    return (
      <div className="glass-card p-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-soft">
            <FolderOpen size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Collections</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Organize your designs</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {!showCreateForm && !editingCollection && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full mb-6 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            <Plus size={20} />
            <span className="font-medium">Create New Collection</span>
          </div>
        </button>
      )}

      {(showCreateForm || editingCollection) && (
        <form onSubmit={editingCollection ? handleUpdateCollection : handleCreateCollection} className="mb-6 p-6 glass-card">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            {editingCollection ? 'Edit Collection' : 'Create Collection'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Logo Designs, Social Media"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this collection..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg transition-all duration-300 ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all duration-300 hover:-translate-y-0.5 shadow-soft"
              >
                <div className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  {editingCollection ? 'Save Changes' : 'Create Collection'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEdit();
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <Folder size={32} className="text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">No collections yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create your first collection to organize your designs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group p-5 glass-card card-hover cursor-pointer relative"
              onClick={() => selectedAnalysisId && handleAddToCollection(collection.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-3 rounded-xl shadow-soft"
                  style={{ backgroundColor: collection.color + '20' }}
                >
                  <Folder size={24} style={{ color: collection.color }} />
                </div>
                {!selectedAnalysisId && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(collection);
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCollection(collection.id);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{collection.name}</h3>
              {collection.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{collection.description}</p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {collection.item_count} {collection.item_count === 1 ? 'design' : 'designs'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
