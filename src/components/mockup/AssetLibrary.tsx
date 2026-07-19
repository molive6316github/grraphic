import React, { useState, useRef, useEffect } from 'react';
import { Upload, Search, Folder, Image as ImageIcon, Film, Type, Music, X, Star, Clock, Grid3x3, List, Trash2, Copy, Download, Eye, ChevronRight, FolderPlus, Tag, Filter, SortAsc } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export type AssetType = 'image' | 'video' | 'audio' | 'font' | 'all';

export interface Asset {
  id: string;
  userId: string;
  name: string;
  type: AssetType;
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  folderId?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  parentId?: string;
  createdAt: Date;
}

interface AssetLibraryProps {
  userId?: string;
  onAssetSelect?: (asset: Asset) => void;
  filterType?: AssetType;
  compact?: boolean;
}

export function AssetLibrary({ userId, onAssetSelect, filterType = 'all', compact = false }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      loadAssets();
      loadFolders();
    }
  }, [userId, selectedFolder]);

  const loadAssets = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('mockup_assets')
        .select('*')
        .eq('user_id', userId);

      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data?.map(a => ({
        id: a.id,
        userId: a.user_id,
        name: a.name,
        type: a.type,
        url: a.url,
        thumbnailUrl: a.thumbnail_url,
        size: a.size,
        width: a.width,
        height: a.height,
        duration: a.duration,
        folderId: a.folder_id,
        tags: a.tags || [],
        isFavorite: a.is_favorite || false,
        createdAt: new Date(a.created_at ?? Date.now()),
        updatedAt: new Date(a.updated_at ?? Date.now())
      })) as Asset[] || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
    setLoading(false);
  };

  const loadFolders = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('mockup_folders')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setFolders(data?.map(f => ({
        id: f.id,
        userId: f.user_id,
        name: f.name,
        color: f.color,
        parentId: f.parent_id,
        createdAt: new Date(f.created_at ?? Date.now())
      })) as AssetFolder[] || []);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !userId) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileId = `${Date.now()}-${file.name}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        const filePath = `${userId}/${fileId}`;

        const { error: uploadError } = await supabase.storage
          .from('mockup-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('mockup-assets')
          .getPublicUrl(filePath);

        let type: AssetType = 'image';
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        let width, height;
        if (type === 'image') {
          const dimensions = await getImageDimensions(publicUrl);
          width = dimensions.width;
          height = dimensions.height;
        }

        const { error: dbError } = await supabase
          .from('mockup_assets')
          .insert({
            user_id: userId,
            name: file.name,
            type,
            url: publicUrl,
            size: file.size,
            width,
            height,
            folder_id: selectedFolder,
            tags: [],
            is_favorite: false
          });

        if (dbError) throw dbError;

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        await loadAssets();
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    });

    await Promise.all(uploadPromises);
  };

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = url;
    });
  };

  const createFolder = async () => {
    if (!userId || !newFolderName.trim()) return;

    try {
      const { error } = await supabase
        .from('mockup_folders')
        .insert({
          user_id: userId,
          name: newFolderName.trim(),
          color: '#3b82f6'
        });

      if (error) throw error;

      setNewFolderName('');
      setShowFolderModal(false);
      await loadFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const toggleFavorite = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    try {
      const { error } = await supabase
        .from('mockup_assets')
        .update({ is_favorite: !asset.isFavorite })
        .eq('id', assetId);

      if (error) throw error;
      await loadAssets();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('mockup_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      await loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const filteredAssets = assets
    .filter(a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return b.size - a.size;
        case 'date': return b.createdAt.getTime() - a.createdAt.getTime();
        default: return 0;
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAssetIcon = (type: AssetType) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Film;
      case 'audio': return Music;
      case 'font': return Type;
      default: return ImageIcon;
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Upload size={18} className="text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {filteredAssets.map(asset => (
            <button
              key={asset.id}
              onClick={() => onAssetSelect?.(asset)}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-700 hover:ring-2 hover:ring-blue-500 transition-all group"
            >
              {asset.type === 'image' ? (
                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {React.createElement(getAssetIcon(asset.type), { size: 32, className: 'text-slate-400' })}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{asset.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-900 rounded-xl overflow-hidden">
      <div className="w-56 bg-slate-800 border-r border-slate-700 p-4 space-y-2">
        <button
          onClick={() => setShowFolderModal(true)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <FolderPlus size={16} />
          New Folder
        </button>

        <div className="space-y-1">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              selectedFolder === null ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Assets
          </button>
          <button
            onClick={() => setSelectedFolder('favorites')}
            className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
              selectedFolder === 'favorites' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Star size={14} />
            Favorites
          </button>
          <button
            onClick={() => setSelectedFolder('recent')}
            className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
              selectedFolder === 'recent' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock size={14} />
            Recent
          </button>
        </div>

        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2 px-3">FOLDERS</p>
          <div className="space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full px-3 py-2 rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
                  selectedFolder === folder.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Folder size={14} style={{ color: folder.color }} />
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-700 text-white text-sm rounded-lg border border-slate-600"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>

            <div className="flex bg-slate-700 rounded-lg border border-slate-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
              >
                <List size={18} />
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Upload size={18} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-4 space-y-2">
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Uploading...</span>
                    <span className="text-xs text-slate-400">{progress}%</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <ImageIcon size={64} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No assets yet</p>
              <p className="text-sm">Upload your first asset to get started</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  className="group relative bg-slate-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <div
                    className="aspect-square bg-slate-700 flex items-center justify-center cursor-pointer"
                    onClick={() => onAssetSelect?.(asset)}
                  >
                    {asset.type === 'image' ? (
                      <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      React.createElement(getAssetIcon(asset.type), { size: 40, className: 'text-slate-400' })
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-300 truncate">{asset.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(asset.size)}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
                      className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
                        asset.isFavorite ? 'bg-yellow-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Star size={14} fill={asset.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                      className="p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map(asset => {
                const Icon = getAssetIcon(asset.type);
                return (
                  <div
                    key={asset.id}
                    onClick={() => onAssetSelect?.(asset)}
                    className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-750 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                      {asset.type === 'image' ? (
                        <img src={asset.thumbnailUrl || asset.url} alt={asset.name} className="w-full h-full object-cover rounded" />
                      ) : (
                        <Icon size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{asset.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{formatFileSize(asset.size)}</span>
                        {asset.width && asset.height && (
                          <span>{asset.width} × {asset.height}</span>
                        )}
                        <span>{asset.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.id); }}
                        className={`p-2 rounded-lg transition-colors ${
                          asset.isFavorite ? 'bg-yellow-500 text-white' : 'hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <Star size={16} fill={asset.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                        className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFolderModal(false)}>
          <div className="bg-slate-800 rounded-xl p-6 w-96 border border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Folder</h3>
              <button onClick={() => setShowFolderModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
