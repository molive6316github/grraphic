import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, ScreenShare, Upload, Save, Trash2, Grid3x3, Layout, Maximize2, Filter, Search, Play, Film, Image as ImageIcon, Shirt, FileText, Share2, Download, Settings, Sparkles, Video, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MockupTemplate {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  is_video: boolean;
  preview_image_url?: string;
  description: string;
  dimensions: any;
  settings: any;
  is_premium: boolean;
  tags: string[];
}

interface MockupProject {
  id: string;
  title: string;
  design_url: string;
  mockup_type: string;
  mockup_data: any;
  rendered_url?: string;
  is_public: boolean;
  category: string;
  is_video: boolean;
  video_duration: number;
  template_data: any;
  preview_url?: string;
  export_settings: any;
  created_at: string;
  user_id: string;
}

interface MockupStudioProps {
  userId?: string;
}

const categoryIcons: Record<string, any> = {
  device: Monitor,
  apparel: Shirt,
  print: FileText,
  video: Film,
  social: Share2
};

const categoryColors: Record<string, string> = {
  device: 'from-blue-500 to-cyan-500',
  apparel: 'from-purple-500 to-pink-500',
  print: 'from-orange-500 to-red-500',
  video: 'from-green-500 to-emerald-500',
  social: 'from-yellow-500 to-amber-500'
};

export function MockupStudio({ userId }: MockupStudioProps) {
  const [projects, setProjects] = useState<MockupProject[]>([]);
  const [templates, setTemplates] = useState<MockupTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gallery' | 'templates' | 'editor'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MockupTemplate | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingProject, setExportingProject] = useState<MockupProject | null>(null);
  const [mockupSettings, setMockupSettings] = useState({
    scale: 100,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    backgroundColor: '#f8fafc',
    showShadow: true,
    shadowIntensity: 50,
    borderRadius: 0
  });
  const [videoSettings, setVideoSettings] = useState({
    duration: 5,
    animation: 'fade',
    loop: true
  });

  useEffect(() => {
    loadTemplates();
    if (userId) loadProjects();
  }, [userId]);

  useEffect(() => {
    if (designFile) {
      const url = URL.createObjectURL(designFile);
      setDesignPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [designFile]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('mockup_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadProjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mockup_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMockup = async () => {
    if (!userId || !selectedTemplate || !designFile) {
      alert('Please select a template and upload a design');
      return;
    }

    try {
      const fileExt = designFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mockup-designs')
        .upload(filePath, designFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mockup-designs')
        .getPublicUrl(filePath);

      await supabase
        .from('mockup_templates')
        .update({ usage_count: (selectedTemplate as any).usage_count + 1 })
        .eq('id', selectedTemplate.id);

      const { error: insertError } = await supabase
        .from('mockup_projects')
        .insert([{
          user_id: userId,
          title: projectTitle || `${selectedTemplate.name} Mockup`,
          design_url: publicUrl,
          mockup_type: selectedTemplate.id,
          mockup_data: mockupSettings,
          category: selectedTemplate.category,
          is_video: selectedTemplate.is_video,
          video_duration: selectedTemplate.is_video ? videoSettings.duration : 0,
          template_data: selectedTemplate,
          export_settings: {
            quality: 'high',
            format: selectedTemplate.is_video ? 'mp4' : 'png',
            resolution: '1920x1080'
          },
          is_public: false
        }]);

      if (insertError) throw insertError;

      setView('gallery');
      setDesignFile(null);
      setDesignPreview('');
      setProjectTitle('');
      setSelectedTemplate(null);
      await loadProjects();
    } catch (error) {
      console.error('Error creating mockup:', error);
      alert('Failed to create mockup. Make sure the mockup-designs bucket exists in Supabase Storage.');
    }
  };

  const deleteMockup = async (projectId: string) => {
    if (!confirm('Delete this mockup?')) return;

    try {
      const { error } = await supabase
        .from('mockup_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      await loadProjects();
    } catch (error) {
      console.error('Error deleting mockup:', error);
    }
  };

  const handleTemplateSelect = (template: MockupTemplate) => {
    setSelectedTemplate(template);
    setView('editor');
    if (template.is_video) {
      setVideoSettings({
        ...videoSettings,
        duration: template.dimensions?.duration || 5
      });
    }
  };

  const exportMockup = async (project: MockupProject) => {
    setExportingProject(project);
    setShowExportModal(true);
  };

  const downloadMockup = () => {
    if (exportingProject) {
      window.open(exportingProject.design_url, '_blank');
      setShowExportModal(false);
      setExportingProject(null);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Templates', icon: Grid3x3 },
    { id: 'device', name: 'Devices', icon: Monitor },
    { id: 'apparel', name: 'Apparel', icon: Shirt },
    { id: 'print', name: 'Print', icon: FileText },
    { id: 'video', name: 'Video', icon: Film },
    { id: 'social', name: 'Social Media', icon: Share2 }
  ];

  const getMockupFrame = (template: MockupTemplate | any) => {
    const isDevice = template.category === 'device' || template.subcategory;
    const dimensions = template.dimensions || {};

    return {
      width: dimensions.width || 1920,
      height: dimensions.height || 1080,
      borderRadius: dimensions.borderRadius || 0,
      border: isDevice ? '12px solid #1f2937' : 'none',
      shadow: mockupSettings.showShadow ? `0 ${20 + mockupSettings.shadowIntensity}px ${60 + mockupSettings.shadowIntensity}px rgba(0,0,0,${0.3 * (mockupSettings.shadowIntensity / 100)})` : 'none'
    };
  };

  if (!userId) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <Monitor size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Sign In Required</h3>
        <p className="text-slate-600 dark:text-slate-400">Please sign in to use MockupStudio</p>
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

  if (view === 'editor') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-gradient-to-br ${categoryColors[selectedTemplate?.category || 'device']} rounded-xl shadow-soft`}>
                {selectedTemplate?.is_video ? <Film size={28} className="text-white" /> : <Monitor size={28} className="text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Create Mockup</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedTemplate?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('templates')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Change Template
              </button>
              <button
                onClick={() => setView('gallery')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="My Awesome Mockup"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {selectedTemplate?.is_video ? 'Upload Video or Image' : 'Upload Design'}
                </label>
                <input
                  type="file"
                  accept={selectedTemplate?.is_video ? "image/*,video/*" : "image/*"}
                  onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Recommended: {selectedTemplate?.dimensions?.width}x{selectedTemplate?.dimensions?.height}px
                </p>
              </div>

              {selectedTemplate?.is_video && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                    <Video size={18} />
                    Video Settings
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={videoSettings.duration}
                        onChange={(e) => setVideoSettings({ ...videoSettings, duration: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Animation
                      </label>
                      <select
                        value={videoSettings.animation}
                        onChange={(e) => setVideoSettings({ ...videoSettings, animation: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                      >
                        <option value="fade">Fade In</option>
                        <option value="slide">Slide In</option>
                        <option value="zoom">Zoom In</option>
                        <option value="rotate">Rotate In</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                  <Settings size={18} />
                  Customization
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Background Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={mockupSettings.backgroundColor}
                        onChange={(e) => setMockupSettings({ ...mockupSettings, backgroundColor: e.target.value })}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={mockupSettings.backgroundColor}
                        onChange={(e) => setMockupSettings({ ...mockupSettings, backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Scale: {mockupSettings.scale}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={mockupSettings.scale}
                      onChange={(e) => setMockupSettings({ ...mockupSettings, scale: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Rotation: {mockupSettings.rotation}°
                    </label>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={mockupSettings.rotation}
                      onChange={(e) => setMockupSettings({ ...mockupSettings, rotation: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Shadow Intensity: {mockupSettings.shadowIntensity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mockupSettings.shadowIntensity}
                      onChange={(e) => setMockupSettings({ ...mockupSettings, shadowIntensity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={createMockup}
                disabled={!selectedTemplate || !designFile}
                className="w-full px-6 py-4 bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {selectedTemplate?.is_video ? 'Create Video Mockup' : 'Create Mockup'}
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                Live Preview
              </h3>
              <div
                className="w-full aspect-video rounded-xl flex items-center justify-center overflow-hidden relative"
                style={{ backgroundColor: mockupSettings.backgroundColor }}
              >
                {designPreview && selectedTemplate ? (
                  <div className="relative flex items-center justify-center w-full h-full">
                    {selectedTemplate.is_video && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/70 text-white rounded-full text-xs font-medium">
                        <Clock size={14} />
                        {videoSettings.duration}s
                      </div>
                    )}
                    <div
                      className="relative"
                      style={{
                        ...getMockupFrame(selectedTemplate),
                        transform: `scale(${mockupSettings.scale / 300}) rotate(${mockupSettings.rotation}deg)`,
                        boxShadow: getMockupFrame(selectedTemplate).shadow,
                        maxWidth: '90%',
                        maxHeight: '90%'
                      }}
                    >
                      {designFile?.type?.startsWith('video/') ? (
                        <video
                          src={designPreview}
                          className="w-full h-full object-cover"
                          style={{ borderRadius: getMockupFrame(selectedTemplate).borderRadius }}
                          autoPlay
                          loop
                          muted
                        />
                      ) : (
                        <img
                          src={designPreview}
                          alt="Design preview"
                          className="w-full h-full object-cover"
                          style={{ borderRadius: getMockupFrame(selectedTemplate).borderRadius }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <Maximize2 size={48} className="mx-auto mb-3" />
                    <p>Upload design to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'templates') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl shadow-soft">
                <Layout size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Choose Template</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{filteredTemplates.length} templates available</p>
              </div>
            </div>
            <button
              onClick={() => setView('gallery')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Back to Gallery
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r ' + (categoryColors[category.id] || 'from-primary-600 to-accent-600') + ' text-white shadow-soft'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map(template => {
            const Icon = categoryIcons[template.category] || Monitor;
            return (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="glass-card p-5 text-left card-hover group"
              >
                <div className="relative w-full aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-4 overflow-hidden flex items-center justify-center">
                  {template.is_video && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                      <Play size={12} />
                      VIDEO
                    </div>
                  )}
                  <Icon size={48} className={`text-slate-400 bg-gradient-to-r ${categoryColors[template.category]} bg-clip-text text-transparent`} />
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 capitalize">
                  {template.subcategory || template.category}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl shadow-soft">
              <Monitor size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">MockupStudio</h1>
              <p className="text-slate-600 dark:text-slate-400">Professional mockups & video templates</p>
            </div>
          </div>
          <button
            onClick={() => setView('templates')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-soft"
          >
            <Upload size={20} />
            New Mockup
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Grid3x3 size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">No mockups yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create professional mockups in seconds!</p>
          <button
            onClick={() => setView('templates')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
          >
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="glass-card p-5 card-hover group">
              <div
                className="w-full aspect-video rounded-xl mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative"
                style={{ backgroundColor: project.mockup_data?.backgroundColor || '#f8fafc' }}
              >
                {project.is_video && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Film size={12} />
                    VIDEO
                  </div>
                )}
                <div
                  className="relative"
                  style={{
                    ...getMockupFrame(project.template_data || {}),
                    transform: 'scale(0.15)',
                    boxShadow: getMockupFrame(project.template_data || {}).shadow
                  }}
                >
                  <img
                    src={project.design_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: getMockupFrame(project.template_data || {}).borderRadius }}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{project.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                    {project.template_data?.name || project.mockup_type}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => exportMockup(project)}
                    className="p-2 text-slate-400 hover:text-primary-500 rounded-lg transition-colors"
                    title="Export"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteMockup(project.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-500">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showExportModal && exportingProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Export Mockup</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Format
                </label>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                  <option>{exportingProject.is_video ? 'MP4' : 'PNG'}</option>
                  {!exportingProject.is_video && <option>JPG</option>}
                  {exportingProject.is_video && <option>WebM</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quality
                </label>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100">
                  <option>High (1920x1080)</option>
                  <option>Medium (1280x720)</option>
                  <option>Low (854x480)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadMockup}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all shadow-soft flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
