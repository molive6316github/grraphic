import React, { useState, useEffect } from 'react';
import { Search, Star, Download, Eye, TrendingUp, Clock, Grid3x3, List, Filter, Tag, Heart, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface Template {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  previewUrl?: string;
  description?: string;
  isPremium: boolean;
  tags: string[];
  usageCount: number;
  rating?: number;
  author?: string;
  createdAt: Date;
}

interface TemplateMarketplaceProps {
  onTemplateSelect: (template: Template) => void;
  filterCategory?: string;
}

export function TemplateMarketplace({ onTemplateSelect, filterCategory }: TemplateMarketplaceProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory || 'all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'trending'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const categories = [
    { id: 'all', label: 'All Templates', count: 0 },
    { id: 'device', label: 'Device Mockups', count: 0 },
    { id: 'video', label: 'Video Templates', count: 0 },
    { id: 'social', label: 'Social Media', count: 0 },
    { id: 'apparel', label: 'Apparel', count: 0 },
    { id: 'print', label: 'Print & Outdoor', count: 0 }
  ];

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, sortBy, showPremiumOnly]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('mockup_templates')
        .select('*');

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      if (showPremiumOnly) {
        query = query.eq('is_premium', true);
      }

      switch (sortBy) {
        case 'popular':
          query = query.order('usage_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        case 'trending':
          query = query.order('usage_count', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      setTemplates(data?.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        subcategory: t.subcategory,
        previewUrl: t.preview_image_url,
        description: t.description,
        isPremium: t.is_premium || false,
        tags: t.tags || [],
        usageCount: t.usage_count || 0,
        createdAt: new Date(t.created_at)
      })) || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    setLoading(false);
  };

  const incrementUsageCount = async (templateId: string) => {
    try {
      await supabase
        .from('mockup_templates')
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('id', templateId);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    incrementUsageCount(template.id);
    onTemplateSelect(template);
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Template Marketplace</h2>
              <p className="text-sm text-slate-400">{filteredTemplates.length} templates available</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  showPremiumOnly
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Crown size={16} />
                Premium
              </button>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates by name, tag, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 bg-slate-800 text-white text-sm rounded-lg border border-slate-700"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="trending">Trending</option>
            </select>

            <div className="flex bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4 flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Search size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="relative aspect-video bg-slate-700 overflow-hidden">
                  {template.previewUrl ? (
                    <img
                      src={template.previewUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Grid3x3 size={48} />
                    </div>
                  )}
                  {template.isPremium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center gap-1 text-xs font-bold text-white">
                      <Crown size={12} />
                      PRO
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye size={32} className="text-white" />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 truncate">{template.name}</h3>
                  {template.description && (
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{template.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Download size={12} />
                        {template.usageCount}
                      </span>
                      {template.rating && (
                        <span className="flex items-center gap-1">
                          <Star size={12} fill="currentColor" />
                          {template.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex gap-1">
                        {template.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all group"
              >
                <div className="w-32 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                  {template.previewUrl ? (
                    <img
                      src={template.previewUrl}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Grid3x3 size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{template.name}</h3>
                    {template.isPremium && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded text-xs font-bold text-white flex items-center gap-1">
                        <Crown size={10} />
                        PRO
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-slate-400 mb-2 line-clamp-1">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Download size={12} />
                      {template.usageCount} uses
                    </span>
                    {template.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        {template.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {template.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {template.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
