import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Upload, Search, Download, Trash2, Tag, Folder, FolderPlus, 
  Image as ImageIcon, FileText, Grid3x3, List, X, ChevronRight, 
  Home, MoreVertical, Edit2, Move, ArrowLeft, Plus, File, Star, Share2, HardDrive, Link2, Check
} from 'lucide-react';
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
  folder_id?: string;
  is_favorite?: boolean;
}

interface AssetFolder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
  user_id: string;
}

interface AssetVaultProps {
  userId?: string;
}

const BUCKET_NAME = 'design-assets';

const folderColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#ef4444'
];

export function AssetVault({ userId }: AssetVaultProps) {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<AssetFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ type: 'asset' | 'folder'; id: string }[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; type: 'asset' | 'folder' } | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');
  const [editingFolder, setEditingFolder] = useState<AssetFolder | null>(null);
  const [bucketExists, setBucketExists] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ total_bytes: number; file_count: number } | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sharedAssetId, setSharedAssetId] = useState<string | null>(null);

  // Check if bucket exists by trying to list files (more reliable than getBucket)
  const checkBucket = useCallback(async () => {
    try {
      // Try to list files in the bucket - this works even if getBucket fails due to permissions
      const { error } = await supabase.storage.from(BUCKET_NAME).list('', { limit: 1 });
      if (error && (error.message.includes('not found') || error.message.includes('does not exist'))) {
        setBucketExists(false);
        return false;
      }
      // If no error or error is just about empty results, bucket exists
      setBucketExists(true);
      return true;
    } catch {
      // If we get here, try one more method - attempt an upload check
      setBucketExists(true); // Assume it exists, let uploads fail with better error messages
      return false;
    }
  }, []);

  // Load folders and assets
  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await checkBucket();

      supabase.rpc('get_storage_usage').then(({ data }) => {
        if (data && typeof data === 'object') {
          setStorageUsage(data as { total_bytes: number; file_count: number });
        }
      });

      // Load folders
      const { data: folderData } = await supabase
        .from('asset_folders')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      setFolders((folderData || []) as unknown as AssetFolder[]);

      // Load assets for current folder
      let query = supabase
        .from('design_assets')
        .select('*')
        .eq('user_id', userId);

      if (currentFolder) {
        query = query.eq('folder_id', currentFolder);
      } else {
        query = query.is('folder_id', null);
      }

      const { data: assetData } = await query.order('created_at', { ascending: false });
      setAssets((assetData || []) as unknown as DesignAsset[]);

      // Build folder path
      if (currentFolder && folderData) {
        const path: AssetFolder[] = [];
        let folderId: string | null = currentFolder;
        while (folderId) {
          const folder = folderData.find(f => f.id === folderId);
          if (folder) {
            path.unshift(folder as unknown as AssetFolder);
            folderId = folder.parent_id;
          } else {
            break;
          }
        }
        setFolderPath(path);
      } else {
        setFolderPath([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentFolder, checkBucket]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleUpload = async () => {
    if (!userId || uploadFiles.length === 0) return;

    const exists = await checkBucket();
    if (!exists) {
      alert('Storage bucket not configured. Please create a bucket named "design-assets" in your Supabase Storage settings.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${userId}/${currentFolder || 'root'}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const assetType = file.type.startsWith('image/') ? 'image' : 
                         file.type.includes('font') ? 'font' :
                         file.type.includes('svg') ? 'vector' : 'file';

        await supabase.from('design_assets').insert([{
          user_id: userId,
          name: file.name,
          description: '',
          asset_type: assetType,
          file_url: publicUrl,
          file_size: file.size,
          file_format: fileExt,
          category: 'uncategorized',
          tags: [],
          is_public: false,
          download_count: 0,
          folder_id: currentFolder
        }]);

        setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
      }

      setShowUploadModal(false);
      setUploadFiles([]);
      await loadData();
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const createFolder = async () => {
    if (!userId || !newFolderName.trim()) return;

    try {
      const { error } = await supabase.from('asset_folders').insert([{
        user_id: userId,
        name: newFolderName.trim(),
        parent_id: currentFolder,
        color: newFolderColor
      }]);

      if (error) throw error;

      setShowFolderModal(false);
      setNewFolderName('');
      setNewFolderColor('#6366f1');
      await loadData();
    } catch (error: any) {
      if (error.code === '23505') {
        alert('A folder with this name already exists here.');
      } else {
        alert('Failed to create folder.');
      }
    }
  };

  const updateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      await supabase.from('asset_folders')
        .update({ name: newFolderName.trim(), color: newFolderColor })
        .eq('id', editingFolder.id);

      setEditingFolder(null);
      setNewFolderName('');
      setShowFolderModal(false);
      await loadData();
    } catch {
      alert('Failed to update folder.');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder and all its contents?')) return;

    try {
      // Delete all assets in folder first
      await supabase.from('design_assets').delete().eq('folder_id', folderId);
      // Delete subfolders
      await supabase.from('asset_folders').delete().eq('parent_id', folderId);
      // Delete folder
      await supabase.from('asset_folders').delete().eq('id', folderId);
      await loadData();
    } catch {
      alert('Failed to delete folder.');
    }
  };

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Delete this asset?')) return;

    try {
      await supabase.from('design_assets').delete().eq('id', assetId);
      await loadData();
    } catch {
      alert('Failed to delete asset.');
    }
  };

  const moveItems = async (targetFolderId: string | null) => {
    try {
      for (const item of selectedItems) {
        if (item.type === 'folder') {
          await supabase.from('asset_folders')
            .update({ parent_id: targetFolderId })
            .eq('id', item.id);
        } else {
          await supabase.from('design_assets')
            .update({ folder_id: targetFolderId })
            .eq('id', item.id);
        }
      }
      setSelectedItems([]);
      setShowMoveModal(false);
      await loadData();
    } catch {
      alert('Failed to move items.');
    }
  };

  const downloadAsset = async (asset: DesignAsset) => {
    try {
      await supabase.from('design_assets')
        .update({ download_count: asset.download_count + 1 })
        .eq('id', asset.id);
      window.open(asset.file_url, '_blank');
    } catch {
      window.open(asset.file_url, '_blank');
    }
  };

  const toggleFavorite = async (asset: DesignAsset) => {
    const next = !asset.is_favorite;
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorite: next } : a));
    await supabase.from('design_assets').update({ is_favorite: next }).eq('id', asset.id);
  };

  const shareAsset = async (asset: DesignAsset) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('share_links')
      .insert({ owner_id: userId, resource_type: 'asset', resource_id: asset.id })
      .select('token')
      .single();
    if (!error && data) {
      const url = `${window.location.origin}/?share=${data.token}`;
      await navigator.clipboard.writeText(url);
      setSharedAssetId(asset.id);
      setTimeout(() => setSharedAssetId(null), 2000);
    } else {
      alert('Failed to create share link.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadFiles(files);
      setShowUploadModal(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const currentFolders = folders.filter(f => f.parent_id === currentFolder);
  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!showFavoritesOnly || a.is_favorite)
  );
  const filteredFolders = currentFolders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center backdrop-blur-sm">
        <Package size={48} className="mx-auto text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Sign In Required</h3>
        <p className="text-gray-400">Please sign in to use AssetVault</p>
      </div>
    );
  }

  if (!bucketExists) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center backdrop-blur-sm">
        <Package size={48} className="mx-auto text-yellow-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Storage Setup Required</h3>
        <p className="text-gray-400 mb-4">
          Please create a storage bucket named <code className="px-2 py-1 bg-white/10 rounded text-blue-400">design-assets</code> in your Supabase dashboard.
        </p>
        <ol className="text-left text-gray-400 text-sm max-w-md mx-auto space-y-2">
          <li>1. Go to your Supabase project dashboard</li>
          <li>2. Navigate to Storage in the sidebar</li>
          <li>3. Click "New bucket"</li>
          <li>4. Name it <code className="px-1 bg-white/10 rounded">design-assets</code></li>
          <li>5. Enable "Public bucket" and save</li>
          <li>6. Refresh this page</li>
        </ol>
        <button
          onClick={() => loadData()}
          className="mt-6 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-12 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="space-y-4"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AssetVault</h1>
              <p className="text-gray-400 text-sm">Your design assets, organized</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingFolder(null); setNewFolderName(''); setShowFolderModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
            >
              <FolderPlus size={18} />
              <span className="hidden sm:inline">New Folder</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
              !currentFolder ? 'text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Home size={16} />
            <span>Home</span>
          </button>
          {folderPath.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} className="text-gray-600" />
              <button
                onClick={() => setCurrentFolder(folder.id)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  idx === folderPath.length - 1 ? 'text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-2.5 border rounded-xl transition-colors ${
              showFavoritesOnly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Show favorites"
          >
            <Star size={20} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {viewMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
          </button>
        </div>

        {/* Storage quota */}
        {storageUsage && (() => {
          const limit = 1024 * 1024 * 1024; // 1 GB soft quota display
          const pct = Math.min(100, (storageUsage.total_bytes / limit) * 100);
          return (
            <div className="mt-4 flex items-center gap-3">
              <HardDrive size={15} className="text-gray-500 flex-shrink-0" />
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-400 to-blue-400'}`}
                  style={{ width: `${Math.max(pct, 1)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                {formatFileSize(storageUsage.total_bytes)} / 1 GB · {storageUsage.file_count} files
              </span>
            </div>
          );
        })()}
      </div>

      {/* Share link copied toast */}
      {sharedAssetId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm backdrop-blur-md animate-slide-up">
          <Check size={15} />
          Share link copied to clipboard
        </div>
      )}

      {/* Drop Zone Overlay */}
      {dragOver && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/10 border-2 border-dashed border-blue-500 rounded-2xl p-12 text-center">
            <Upload size={48} className="mx-auto text-blue-400 mb-4" />
            <p className="text-xl text-white font-medium">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredFolders.length === 0 && filteredAssets.length === 0 ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center backdrop-blur-sm">
          <Folder size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchQuery ? 'No results found' : 'This folder is empty'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchQuery ? 'Try a different search term' : 'Create folders or upload files to get started'}
          </p>
          {!searchQuery && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowFolderModal(true)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
              >
                Create Folder
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Upload Files
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3' 
          : 'space-y-2'
        }>
          {/* Back button */}
          {currentFolder && (
            <button
              onClick={() => {
                const parentFolder = folders.find(f => f.id === currentFolder)?.parent_id || null;
                setCurrentFolder(parentFolder);
              }}
              className={`group ${viewMode === 'grid' 
                ? 'rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors'
                : 'rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3 hover:bg-white/10 transition-colors'
              }`}
            >
              <div className={viewMode === 'grid' ? 'mb-3' : ''}>
                <ArrowLeft size={viewMode === 'grid' ? 32 : 20} className="text-gray-400" />
              </div>
              <span className="text-gray-400 text-sm">Back</span>
            </button>
          )}

          {/* Folders */}
          {filteredFolders.map(folder => (
            <div
              key={folder.id}
              onDoubleClick={() => setCurrentFolder(folder.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: 'folder' });
              }}
              className={`group cursor-pointer ${viewMode === 'grid'
                ? 'rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 hover:border-white/20 transition-all'
                : 'rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3 hover:bg-white/10 transition-colors'
              }`}
            >
              <div className={viewMode === 'grid' ? 'mb-3 flex items-center justify-between' : ''}>
                <Folder 
                  size={viewMode === 'grid' ? 32 : 20} 
                  className="flex-shrink-0"
                  style={{ color: folder.color }} 
                  fill={folder.color}
                />
                {viewMode === 'grid' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, item: folder, type: 'folder' });
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{folder.name}</p>
                <p className="text-gray-500 text-xs">
                  {folders.filter(f => f.parent_id === folder.id).length} folders, {assets.filter(a => a.folder_id === folder.id).length} files
                </p>
              </div>
            </div>
          ))}

          {/* Assets */}
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item: asset, type: 'asset' });
              }}
              className={`group cursor-pointer ${viewMode === 'grid'
                ? 'rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all'
                : 'rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3 hover:bg-white/10 transition-colors'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-square bg-black/20 flex items-center justify-center overflow-hidden">
                    {asset.file_format.match(/jpg|jpeg|png|gif|webp|svg/i) ? (
                      <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <File size={32} className="text-gray-500" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-gray-500 text-xs">{formatFileSize(asset.file_size)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {asset.file_format.match(/jpg|jpeg|png|gif|webp|svg/i) ? (
                      <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <File size={18} className="text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-gray-500 text-xs">{formatFileSize(asset.file_size)}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => downloadAsset(asset)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => deleteAsset(asset.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-900 border border-white/10 rounded-xl shadow-xl py-2 z-50 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === 'folder' ? (
            <>
              <button
                onClick={() => { setCurrentFolder(contextMenu.item.id); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Folder size={16} /> Open
              </button>
              <button
                onClick={() => {
                  setEditingFolder(contextMenu.item);
                  setNewFolderName(contextMenu.item.name);
                  setNewFolderColor(contextMenu.item.color);
                  setShowFolderModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Edit2 size={16} /> Rename
              </button>
              <button
                onClick={() => { deleteFolder(contextMenu.item.id); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { downloadAsset(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Download size={16} /> Download
              </button>
              <button
                onClick={() => { shareAsset(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Link2 size={16} /> Copy share link
              </button>
              <button
                onClick={() => { toggleFavorite(contextMenu.item); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 flex items-center gap-2"
              >
                <Star size={16} /> {contextMenu.item.is_favorite ? 'Unfavorite' : 'Favorite'}
              </button>
              <button
                onClick={() => { deleteAsset(contextMenu.item.id); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upload Files</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadFiles([]); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-white font-medium mb-1">Click to select files</p>
                  <p className="text-gray-500 text-sm">or drag and drop</p>
                </label>
              </div>
            </div>

            {uploadFiles.length > 0 && (
              <div className="mb-6 max-h-40 overflow-y-auto space-y-2">
                {uploadFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    <File size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => setUploadFiles(files => files.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="mb-6">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-400 mt-2">{uploadProgress}% uploaded</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowUploadModal(false); setUploadFiles([]); }}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || isUploading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : `Upload ${uploadFiles.length} file${uploadFiles.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingFolder ? 'Edit Folder' : 'New Folder'}</h2>
              <button onClick={() => { setShowFolderModal(false); setEditingFolder(null); setNewFolderName(''); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="My Folder"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Color</label>
                <div className="flex gap-2">
                  {folderColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-lg transition-transform ${newFolderColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowFolderModal(false); setEditingFolder(null); setNewFolderName(''); }}
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingFolder ? updateFolder : createFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingFolder ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
