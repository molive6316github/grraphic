import React, { useState, useEffect } from 'react';
import { Clock, Eye, Trash2, Image, Share2, Globe, Lock, Check, Star, Tag, FolderPlus, Search, Filter, X, SlidersHorizontal, Heart, TrendingUp } from 'lucide-react';
import { AnalysisRecord } from '../types';
import { supabase } from '../lib/supabase';
import { Collections } from './Collections';

interface AnalysisHistoryProps {
  analyses: AnalysisRecord[];
  onViewAnalysis: (analysis: AnalysisRecord) => void;
  onDeleteAnalysis: (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
  loading: boolean;
  userId?: string;
}

export default function AnalysisHistory({
  analyses,
  onViewAnalysis,
  onDeleteAnalysis,
  onTogglePublic,
  loading,
  userId
}: AnalysisHistoryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'public' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'name'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [analysisTags, setAnalysisTags] = useState<Map<string, string[]>>(new Map());
  const [showTagInput, setShowTagInput] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (userId) {
      loadFavorites();
      loadTags();
    }
  }, [userId, analyses]);

  const loadFavorites = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('design_favorites')
        .select('analysis_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(new Set(data.map(f => f.analysis_id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const loadTags = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('design_tags')
        .select('analysis_id, tag_name')
        .eq('user_id', userId);

      if (error) throw error;

      const tagsMap = new Map<string, string[]>();
      data.forEach(item => {
        const existing = tagsMap.get(item.analysis_id) || [];
        tagsMap.set(item.analysis_id, [...existing, item.tag_name]);
      });
      setAnalysisTags(tagsMap);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const toggleFavorite = async (analysisId: string) => {
    if (!userId) return;

    try {
      if (favorites.has(analysisId)) {
        const { error } = await supabase
          .from('design_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('analysis_id', analysisId);

        if (error) throw error;
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(analysisId);
          return newSet;
        });
      } else {
        const { error } = await supabase
          .from('design_favorites')
          .insert([{ user_id: userId, analysis_id: analysisId }]);

        if (error) throw error;
        setFavorites(prev => new Set(prev).add(analysisId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const addTag = async (analysisId: string) => {
    if (!userId || !tagInput.trim()) return;

    try {
      const { error } = await supabase
        .from('design_tags')
        .insert([{
          user_id: userId,
          analysis_id: analysisId,
          tag_name: tagInput.trim()
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('This tag already exists on this design');
        } else {
          throw error;
        }
        return;
      }

      await loadTags();
      setTagInput('');
      setShowTagInput(null);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (analysisId: string, tagName: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('design_tags')
        .delete()
        .eq('user_id', userId)
        .eq('analysis_id', analysisId)
        .eq('tag_name', tagName);

      if (error) throw error;
      await loadTags();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const copyShareLink = (analysisId: string) => {
    const shareUrl = `${window.location.origin}?analysis=${analysisId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(analysisId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((err) => {
      console.error('Failed to copy link:', err);
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedId(analysisId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    });
  };

  const openCollections = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setShowCollections(true);
  };

  const filteredAndSortedAnalyses = () => {
    let filtered = [...analyses];

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (analysisTags.get(a.id) || []).some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (filterBy === 'favorites') {
      filtered = filtered.filter(a => favorites.has(a.id));
    } else if (filterBy === 'public') {
      filtered = filtered.filter(a => a.is_public);
    } else if (filterBy === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(a => new Date(a.created_at) > weekAgo);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'score') {
        return (b.analysis_data?.overall || 0) - (a.analysis_data?.overall || 0);
      } else {
        return a.file_name.localeCompare(b.file_name);
      }
    });

    return filtered;
  };

  if (showCollections && userId) {
    return (
      <Collections
        userId={userId}
        selectedAnalysisId={selectedAnalysisId || undefined}
        onClose={() => {
          setShowCollections(false);
          setSelectedAnalysisId(null);
        }}
      />
    );
  }

  const displayedAnalyses = filteredAndSortedAnalyses();

  if (loading) {
    return (
      <div className="glass-card p-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
          <Clock size={36} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">No analyses yet</h3>
        <p className="text-slate-600 dark:text-slate-400">Upload your first design to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-soft">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Design History</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{analyses.length} total designs</p>
            </div>
          </div>
          <button
            onClick={() => setShowCollections(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <FolderPlus size={18} />
            <span className="font-medium">Collections</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or tags..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
              showFilters
                ? 'bg-primary-500 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Filter By
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'favorites', 'public', 'recent'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFilterBy(filter)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        filterBy === filter
                          ? 'bg-primary-500 text-white shadow-soft'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter === 'favorites' ? 'Favorites' : filter === 'public' ? 'Public' : 'Recent'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['date', 'score', 'name'] as const).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        sortBy === sort
                          ? 'bg-accent-500 text-white shadow-soft'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {sort === 'date' ? 'Date' : sort === 'score' ? 'Score' : 'Name'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {displayedAnalyses.length === 0 ? (
          <div className="text-center py-8">
            <Filter size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No designs match your filters</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showing {displayedAnalyses.length} of {analyses.length} designs
          </p>
        )}
      </div>

      <div className="space-y-3">
        {displayedAnalyses.map((analysis) => {
          const tags = analysisTags.get(analysis.id) || [];
          const isFavorite = favorites.has(analysis.id);

          return (
            <div
              key={analysis.id}
              className="glass-card p-5 card-hover"
            >
              <div className="flex items-start gap-4">
                {analysis.image_url ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 shadow-soft">
                    <img
                      src={analysis.image_url}
                      alt="Design thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center flex-shrink-0 shadow-soft">
                    <Image size={32} className="text-slate-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate mb-1">
                        {analysis.file_name}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </span>
                        {analysis.analysis_data?.overall && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-gradient-to-r from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 text-primary-700 dark:text-primary-300 shadow-soft">
                            <TrendingUp size={14} className="mr-1" />
                            Score: {analysis.analysis_data.overall}/100
                          </span>
                        )}
                        {analysis.is_public && (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                            <Globe size={12} className="mr-1" />
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    {userId && (
                      <button
                        onClick={() => toggleFavorite(analysis.id)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          isFavorite
                            ? 'text-red-500 bg-red-100 dark:bg-red-900/30 hover:scale-110'
                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
                      </button>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="group inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
                        >
                          <Tag size={12} />
                          {tag}
                          {userId && (
                            <button
                              onClick={() => removeTag(analysis.id, tag)}
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {showTagInput === analysis.id && userId ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag(analysis.id)}
                        placeholder="Enter tag name..."
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={() => addTag(analysis.id)}
                        className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setShowTagInput(null);
                          setTagInput('');
                        }}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 flex-wrap">
                    {userId && (
                      <>
                        <button
                          onClick={() => setShowTagInput(analysis.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                          title="Add tag"
                        >
                          <Tag size={14} />
                          <span>Add Tag</span>
                        </button>
                        <button
                          onClick={() => openCollections(analysis.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                          title="Add to collection"
                        >
                          <FolderPlus size={14} />
                          <span>Collection</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onTogglePublic?.(analysis.id, !analysis.is_public)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        analysis.is_public
                          ? 'bg-success-100 hover:bg-success-200 dark:bg-success-900/30 dark:hover:bg-success-900/40 text-success-700 dark:text-success-300'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                      title={analysis.is_public ? 'Make private' : 'Make public'}
                    >
                      {analysis.is_public ? <Globe size={14} /> : <Lock size={14} />}
                      <span>{analysis.is_public ? 'Public' : 'Private'}</span>
                    </button>
                    <button
                      onClick={() => copyShareLink(analysis.id)}
                      disabled={!analysis.is_public}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        analysis.is_public
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed'
                      }`}
                      title={analysis.is_public ? 'Copy share link' : 'Make public first'}
                    >
                      {copiedId === analysis.id ? (
                        <>
                          <Check size={14} className="text-success-600" />
                          <span className="text-success-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onViewAnalysis(analysis)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg transition-colors font-medium"
                      title="View analysis"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onDeleteAnalysis(analysis.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                      title="Delete analysis"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}