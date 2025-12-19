import React, { useState, useEffect } from 'react';
import { Package, Upload, Search, Filter, Download, Trash2, Eye, Tag, Folder, Image as ImageIcon, FileText, Grid3x3, List, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DesignAsset {
  id: string;
  name: string;
  description: string;
  asset_type: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: number;
  file_format: string;
  category: string;
  tags: string[];
  metadata: any;
  is_public: boolean;
  download_count: number;
  created_at: string;
  user_id: string;
}

interface AssetVaultProps {
  userId?: string;
}

const assetTypes = ['icon', 'image', 'vector', 'template', 'font'];
const categories = ['uncategorized', 'logos', 'icons', 'backgrounds', 'illustrations', 'ui-kits', 'templates'];

export function AssetVault({ userId }: AssetVaultProps) {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    asset_type: 'image',
    category: 'uncategorized',
    tags: [] as string[],
    is_public: false
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadAssets();
  }, [userId, filterType, filterCategory]);

  const loadAssets = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('design_assets')
        .select('*')
        .eq('user_id', userId);

      if (filterType !== 'all') {
        query = query.eq('asset_type', filterType);
      }

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!userId || !uploadFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('design-assets')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('design-assets')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('design_assets')
        .insert([{
          user_id: userId,
          name: uploadData.name || uploadFile.name,
          description: uploadData.description,
          asset_type: uploadData.asset_type,
          file_url: publicUrl,
          file_size: uploadFile.size,
          file_format: fileExt || 'unknown',
          category: uploadData.category,
          tags: uploadData.tags,
          is_public: uploadData.is_public,
          download_count: 0
        }]);

      if (insertError) throw insertError;

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadData({
        name: '',
        description: '',
        asset_type: 'image',
        category: 'uncategorized',
        tags: [],
        is_public: false
      });
      await loadAssets();
    } catch (error) {
      console.error('Error uploading asset:', error);
      alert('Failed to upload asset. Make sure the design-assets bucket exists in Supabase Storage.');
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('design_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      await loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const downloadAsset = async (asset: DesignAsset) => {
    try {
      await supabase
        .from('design_assets')
        .update({ download_count: asset.download_count + 1 })
        .eq('id', asset.id);

      window.open(asset.file_url, '_blank');
      await loadAssets();
    } catch (error) {
      console.error('Error downloading asset:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !uploadData.tags.includes(tagInput.trim())) {
      setUploadData({
        ...uploadData,
        tags: [...uploadData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setUploadData({
      ...uploadData,
      tags: uploadData.tags.filter(t => t !== tag)
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAssetIcon = (type: string) => {
    const icons: Record<string, any> = {
      icon: Tag,
      image: ImageIcon,
      vector: Grid3x3,
      template: FileText,
      font: FileText
    };
    return icons[type] || FileText;
  };

  if (!userId) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <Package size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Sign In Required</h3>
        <p className="text-slate-600 dark:text-slate-400">Please sign in to use AssetVault</p>
      </div>
    );
  }

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
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-success-500 to-primary-500 rounded-xl shadow-soft">
              <Package size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">AssetVault</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your design assets</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-success-600 to-primary-600 hover:from-success-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-soft"
          >
            <Upload size={20} />
            Upload Asset
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by name or tags..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                showFilters
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <SlidersHorizontal size={18} />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {viewMode === 'grid' ? <List size={18} /> : <Grid3x3 size={18} />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Asset Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Types</option>
                  {assetTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600 dark:text-slate-400">
          {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
        </p>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            {searchQuery ? 'No matching assets' : 'No assets yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Upload your first design asset!'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
            >
              Upload First Asset
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-3'}>
          {filteredAssets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_type);

            if (viewMode === 'list') {
              return (
                <div key={asset.id} className="glass-card p-4 flex items-center gap-4 group">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {asset.file_format.match(/jpg|jpeg|png|gif|webp/i) ? (
                      <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Icon size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{asset.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="capitalize">{asset.asset_type}</span>
                      <span>•</span>
                      <span>{formatFileSize(asset.file_size)}</span>
                      <span>•</span>
                      <span>{asset.download_count} downloads</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadAsset(asset)}
                      className="p-2 text-slate-400 hover:text-primary-500 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={asset.id} className="glass-card p-4 card-hover group">
                <div className="w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 mb-3 flex items-center justify-center overflow-hidden">
                  {asset.file_format.match(/jpg|jpeg|png|gif|webp/i) ? (
                    <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={48} className="text-slate-400" />
                  )}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate text-sm">{asset.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{asset.asset_type}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadAsset(asset)}
                      className="p-1.5 text-slate-400 hover:text-primary-500 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {asset.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 2 && (
                      <span className="text-xs text-slate-500">+{asset.tags.length - 2}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>{formatFileSize(asset.file_size)}</span>
                  <span>{asset.download_count} downloads</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Upload Asset</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  placeholder="My awesome asset"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Describe your asset..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Asset Type
                  </label>
                  <select
                    value={uploadData.asset_type}
                    onChange={(e) => setUploadData({ ...uploadData, asset_type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  >
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tags..."
                    className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                {uploadData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-lg"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-success-600 to-primary-600 hover:from-success-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Asset
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
