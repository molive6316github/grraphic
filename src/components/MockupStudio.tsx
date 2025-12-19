import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, ScreenShare, Upload, Save, Eye, Trash2, Grid3x3, Layout, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MockupProject {
  id: string;
  title: string;
  design_url: string;
  mockup_type: string;
  mockup_data: any;
  rendered_url?: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
}

interface MockupStudioProps {
  userId?: string;
}

const mockupTemplates = [
  { id: 'iphone', name: 'iPhone 15 Pro', icon: Smartphone, category: 'mobile' },
  { id: 'ipad', name: 'iPad Pro', icon: Tablet, category: 'tablet' },
  { id: 'macbook', name: 'MacBook Pro', icon: Monitor, category: 'laptop' },
  { id: 'imac', name: 'iMac', icon: Monitor, category: 'desktop' },
  { id: 'billboard', name: 'Billboard', icon: ScreenShare, category: 'outdoor' },
  { id: 'tshirt', name: 'T-Shirt', icon: Layout, category: 'apparel' }
];

export function MockupStudio({ userId }: MockupStudioProps) {
  const [projects, setProjects] = useState<MockupProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gallery' | 'editor'>('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState('');
  const [mockupSettings, setMockupSettings] = useState({
    scale: 100,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    backgroundColor: '#f8fafc'
  });

  useEffect(() => {
    loadProjects();
  }, [userId]);

  useEffect(() => {
    if (designFile) {
      const url = URL.createObjectURL(designFile);
      setDesignPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [designFile]);

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

      const { error: insertError } = await supabase
        .from('mockup_projects')
        .insert([{
          user_id: userId,
          title: projectTitle || `${selectedTemplate} Mockup`,
          design_url: publicUrl,
          mockup_type: selectedTemplate,
          mockup_data: mockupSettings,
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

  const getMockupFrame = (type: string) => {
    const frames: Record<string, any> = {
      iphone: {
        width: 375,
        height: 812,
        borderRadius: 40,
        border: '12px solid #1f2937',
        shadow: '0 20px 60px rgba(0,0,0,0.3)'
      },
      ipad: {
        width: 820,
        height: 1180,
        borderRadius: 30,
        border: '16px solid #374151',
        shadow: '0 25px 70px rgba(0,0,0,0.25)'
      },
      macbook: {
        width: 1440,
        height: 900,
        borderRadius: 12,
        border: '8px solid #111827',
        shadow: '0 30px 80px rgba(0,0,0,0.2)'
      },
      imac: {
        width: 1920,
        height: 1080,
        borderRadius: 8,
        border: '24px solid #0f172a',
        shadow: '0 35px 90px rgba(0,0,0,0.15)'
      },
      billboard: {
        width: 1200,
        height: 600,
        borderRadius: 0,
        border: '4px solid #64748b',
        shadow: '0 20px 60px rgba(0,0,0,0.2)'
      },
      tshirt: {
        width: 800,
        height: 1000,
        borderRadius: 20,
        border: 'none',
        shadow: '0 15px 50px rgba(0,0,0,0.15)'
      }
    };
    return frames[type] || frames.iphone;
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
              <div className="p-3 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl shadow-soft">
                <Monitor size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Create Mockup</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Design your product mockup</p>
              </div>
            </div>
            <button
              onClick={() => setView('gallery')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Back to Gallery
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Select Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {mockupTemplates.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-xl font-medium transition-all ${
                          selectedTemplate === template.id
                            ? 'bg-primary-500 text-white shadow-soft'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon size={24} className="mx-auto mb-2" />
                        <div className="text-sm">{template.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Upload Design
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Background Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={mockupSettings.backgroundColor}
                    onChange={(e) => setMockupSettings({ ...mockupSettings, backgroundColor: e.target.value })}
                    className="w-20 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={mockupSettings.backgroundColor}
                    onChange={(e) => setMockupSettings({ ...mockupSettings, backgroundColor: e.target.value })}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                onClick={createMockup}
                disabled={!selectedTemplate || !designFile}
                className="w-full px-6 py-4 bg-gradient-to-r from-accent-600 to-primary-600 hover:from-accent-700 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} className="inline mr-2" />
                Create Mockup
              </button>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Preview</h3>
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: mockupSettings.backgroundColor }}
              >
                {designPreview && selectedTemplate ? (
                  <div
                    className="relative"
                    style={{
                      ...getMockupFrame(selectedTemplate),
                      transform: `scale(0.3) rotate(${mockupSettings.rotation}deg)`,
                      boxShadow: getMockupFrame(selectedTemplate).shadow
                    }}
                  >
                    <img
                      src={designPreview}
                      alt="Design preview"
                      className="w-full h-full object-cover"
                      style={{ borderRadius: getMockupFrame(selectedTemplate).borderRadius }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-slate-400">
                    <Maximize2 size={48} className="mx-auto mb-3" />
                    <p>Select template and upload design to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
              <p className="text-slate-600 dark:text-slate-400">Create stunning product mockups</p>
            </div>
          </div>
          <button
            onClick={() => setView('editor')}
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
          <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first mockup to get started!</p>
          <button
            onClick={() => setView('editor')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all"
          >
            Create First Mockup
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="glass-card p-5 card-hover group">
              <div
                className="w-full aspect-video rounded-xl mb-4 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                style={{ backgroundColor: project.mockup_data?.backgroundColor || '#f8fafc' }}
              >
                <div
                  className="relative"
                  style={{
                    ...getMockupFrame(project.mockup_type),
                    transform: 'scale(0.15)',
                    boxShadow: getMockupFrame(project.mockup_type).shadow
                  }}
                >
                  <img
                    src={project.design_url}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    style={{ borderRadius: getMockupFrame(project.mockup_type).borderRadius }}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{project.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{project.mockup_type}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteMockup(project.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
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
    </div>
  );
}
