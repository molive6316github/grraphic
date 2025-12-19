import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor, Smartphone, Tablet, Laptop, Watch, Tv,
  Film, Play, Pause, SkipBack, SkipForward,
  Upload, Download, Save, Trash2, Copy,
  Grid3x3, Layout, Layers, Type, Image as ImageIcon,
  Sparkles, Wand2, Palette, Settings, ChevronRight,
  Plus, X, Check, Search, Filter, SlidersHorizontal,
  Shirt, Coffee, ShoppingBag, FileText, Share2,
  Video, Camera, Zap, Star, Crown, Lock,
  RotateCcw, ZoomIn, ZoomOut, Move, Eye, EyeOff,
  Sun, Moon, Droplet, Wind, Flame, Snowflake
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoTimeline, TimelineClip } from './mockup/VideoTimeline';
import { DeviceMockup, deviceConfigs, DeviceConfig } from './mockup/DeviceMockup';
import { LogoAnimator, logoAnimationPresets, LogoAnimationConfig, LogoAnimation } from './mockup/LogoAnimator';
import { TextAnimator, textAnimationPresets, TextAnimationConfig, fontOptions } from './mockup/TextAnimator';
import { SceneBuilder, sceneTemplates, SceneConfig, SceneElement } from './mockup/SceneBuilder';
import { SlideshowMaker, SlideConfig } from './mockup/SlideshowMaker';

type StudioMode = 'home' | 'device' | 'video' | 'logo' | 'text' | 'slideshow' | 'social' | 'apparel';
type ProjectType = 'mockup' | 'video' | 'logo' | 'slideshow';

interface Project {
  id: string;
  name: string;
  type: ProjectType;
  thumbnail?: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

interface MockupStudioProps {
  userId?: string;
}

const modeConfig = {
  home: { icon: Grid3x3, label: 'Home', color: 'from-slate-600 to-slate-700' },
  device: { icon: Smartphone, label: 'Device Mockups', color: 'from-blue-600 to-cyan-600' },
  video: { icon: Film, label: 'Video Maker', color: 'from-green-600 to-emerald-600' },
  logo: { icon: Sparkles, label: 'Logo Animation', color: 'from-amber-600 to-orange-600' },
  text: { icon: Type, label: 'Text Animation', color: 'from-rose-600 to-pink-600' },
  slideshow: { icon: ImageIcon, label: 'Slideshow', color: 'from-purple-600 to-violet-600' },
  social: { icon: Share2, label: 'Social Media', color: 'from-sky-600 to-blue-600' },
  apparel: { icon: Shirt, label: 'Apparel & Merch', color: 'from-teal-600 to-cyan-600' }
};

const socialFormats = [
  { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080, icon: Camera },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, icon: Video },
  { id: 'instagram-reel', name: 'Instagram Reel', width: 1080, height: 1920, icon: Film },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920, icon: Video },
  { id: 'youtube-video', name: 'YouTube Video', width: 1920, height: 1080, icon: Video },
  { id: 'youtube-short', name: 'YouTube Short', width: 1080, height: 1920, icon: Film },
  { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, icon: ImageIcon },
  { id: 'twitter-post', name: 'Twitter/X Post', width: 1200, height: 675, icon: ImageIcon },
  { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 628, icon: ImageIcon },
  { id: 'pinterest-pin', name: 'Pinterest Pin', width: 1000, height: 1500, icon: ImageIcon }
];

const apparelItems = [
  { id: 'tshirt-front', name: 'T-Shirt Front', icon: Shirt },
  { id: 'tshirt-back', name: 'T-Shirt Back', icon: Shirt },
  { id: 'hoodie-front', name: 'Hoodie Front', icon: Shirt },
  { id: 'hoodie-back', name: 'Hoodie Back', icon: Shirt },
  { id: 'tank-top', name: 'Tank Top', icon: Shirt },
  { id: 'mug', name: 'Coffee Mug', icon: Coffee },
  { id: 'tote-bag', name: 'Tote Bag', icon: ShoppingBag },
  { id: 'cap', name: 'Baseball Cap', icon: Crown },
  { id: 'phone-case', name: 'Phone Case', icon: Smartphone },
  { id: 'poster', name: 'Wall Poster', icon: FileText }
];

export function MockupStudio({ userId }: MockupStudioProps) {
  const [mode, setMode] = useState<StudioMode>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(10);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(deviceConfigs[0]);
  const [deviceSettings, setDeviceSettings] = useState({
    angle: { x: 0, y: 0, z: 0 },
    shadow: true,
    shadowIntensity: 50,
    reflection: false,
    glare: true,
    environment: 'floating' as const,
    backgroundColor: '#0f172a',
    screenImage: ''
  });

  const [logoSettings, setLogoSettings] = useState<LogoAnimationConfig>({
    ...logoAnimationPresets['elegant-fade'],
    color: '#ffffff'
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [logoText, setLogoText] = useState('YOUR LOGO');

  const [textSettings, setTextSettings] = useState<TextAnimationConfig>({
    animation: 'fade-in-up',
    duration: 1,
    delay: 0.2,
    staggerDelay: 0.05,
    easing: 'ease-out',
    color: '#ffffff',
    fontSize: 72,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 1.2
  });
  const [animatedText, setAnimatedText] = useState('Amazing Text');

  const [slides, setSlides] = useState<SlideConfig[]>([]);

  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const [currentScene, setCurrentScene] = useState<SceneConfig | null>(null);

  useEffect(() => {
    if (userId) loadProjects();
    else setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const animate = (timestamp: number) => {
        const delta = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;
        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, duration]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mockup_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProjects(data.map((p: any) => ({
          id: p.id,
          name: p.title,
          type: p.is_video ? 'video' : 'mockup',
          thumbnail: p.design_url,
          data: p.mockup_data,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at || p.created_at)
        })));
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying(prev => !prev);
  }, [currentTime, duration]);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'screen' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (target === 'screen') {
      setDeviceSettings(prev => ({ ...prev, screenImage: url }));
    } else {
      setLogoUrl(url);
    }
  };

  const handleClipUpdate = useCallback((clip: TimelineClip) => {
    setTimelineClips(prev => prev.map(c => c.id === clip.id ? clip : c));
  }, []);

  const handleClipDelete = useCallback((clipId: string) => {
    setTimelineClips(prev => prev.filter(c => c.id !== clipId));
    if (selectedClipId === clipId) setSelectedClipId(null);
  }, [selectedClipId]);

  const handleClipDuplicate = useCallback((clip: TimelineClip) => {
    const newClip = { ...clip, id: `clip-${Date.now()}`, startTime: clip.startTime + clip.duration };
    setTimelineClips(prev => [...prev, newClip]);
  }, []);

  const addClip = (type: TimelineClip['type'], data: any) => {
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      type,
      startTime: timelineClips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0),
      duration: 3,
      layer: 0,
      data
    };
    setTimelineClips(prev => [...prev, newClip]);
    setDuration(prev => Math.max(prev, newClip.startTime + newClip.duration + 2));
  };

  if (!userId) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <Film size={48} className="mx-auto text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Sign In Required</h3>
        <p className="text-slate-600 dark:text-slate-400">Please sign in to access MockupStudio Pro</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl shadow-lg">
            <Wand2 size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">MockupStudio Pro</h1>
            <p className="text-slate-600 dark:text-slate-400">Professional mockups, videos & animations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(modeConfig) as StudioMode[]).filter(m => m !== 'home').map(m => {
            const config = modeConfig[m];
            const Icon = config.icon;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-left">{config.label}</h3>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Smartphone size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Device Mockups</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showcase your app on 15+ realistic 3D device frames including iPhone, iPad, MacBook, and more.
          </p>
          <button
            onClick={() => setMode('device')}
            className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Create Mockup <ChevronRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Film size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Video Editor</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create stunning videos with timeline editing, scenes, transitions, and professional effects.
          </p>
          <button
            onClick={() => setMode('video')}
            className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Create Video <ChevronRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Logo Animation</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Animate your logo with 25+ stunning effects including neon glow, particles, 3D flip, and more.
          </p>
          <button
            onClick={() => setMode('logo')}
            className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Animate Logo <ChevronRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
              <Type size={20} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Text Animation</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create kinetic typography with 20+ text animations for intros, promos, and social content.
          </p>
          <button
            onClick={() => setMode('text')}
            className="text-sm text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Animate Text <ChevronRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Slideshow Maker</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create photo slideshows with transitions, Ken Burns effects, filters, and text overlays.
          </p>
          <button
            onClick={() => setMode('slideshow')}
            className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Create Slideshow <ChevronRight size={16} />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
              <Share2 size={20} className="text-sky-600 dark:text-sky-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Social Media</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create content for Instagram, TikTok, YouTube, Facebook, Twitter, and more platforms.
          </p>
          <button
            onClick={() => setMode('social')}
            className="text-sm text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Create Content <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {projects.slice(0, 6).map(project => (
              <div key={project.id} className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={24} className="text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-sm font-medium truncate">{project.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDeviceMockups = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl">
              <Smartphone size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Device Mockups</h2>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl flex items-center gap-2">
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="w-full aspect-video rounded-2xl flex items-center justify-center overflow-hidden relative"
              style={{ backgroundColor: deviceSettings.backgroundColor }}
            >
              <DeviceMockup
                device={selectedDevice}
                screenContent={
                  deviceSettings.screenImage ? (
                    <img src={deviceSettings.screenImage} alt="Screen" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <span className="text-slate-500">Upload Screenshot</span>
                    </div>
                  )
                }
                angle={deviceSettings.angle}
                shadow={deviceSettings.shadow}
                shadowIntensity={deviceSettings.shadowIntensity}
                reflection={deviceSettings.reflection}
                glare={deviceSettings.glare}
                environment={deviceSettings.environment}
                scale={selectedDevice.type === 'laptop' || selectedDevice.type === 'desktop' ? 0.7 : 0.9}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Device</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {deviceConfigs.map(device => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`p-2 rounded-lg text-left text-sm transition-all ${
                      selectedDevice.id === device.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {device.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'screen')}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={deviceSettings.backgroundColor}
                  onChange={(e) => setDeviceSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={deviceSettings.backgroundColor}
                  onChange={(e) => setDeviceSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rotation X: {deviceSettings.angle.x}
              </label>
              <input
                type="range"
                min="-30"
                max="30"
                value={deviceSettings.angle.x}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, angle: { ...prev.angle, x: parseInt(e.target.value) } }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rotation Y: {deviceSettings.angle.y}
              </label>
              <input
                type="range"
                min="-30"
                max="30"
                value={deviceSettings.angle.y}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, angle: { ...prev.angle, y: parseInt(e.target.value) } }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Shadow: {deviceSettings.shadowIntensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={deviceSettings.shadowIntensity}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, shadowIntensity: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDeviceSettings(prev => ({ ...prev, glare: !prev.glare }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  deviceSettings.glare ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Glare
              </button>
              <button
                onClick={() => setDeviceSettings(prev => ({ ...prev, reflection: !prev.reflection }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  deviceSettings.reflection ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Reflection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogoAnimation = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Logo Animation</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl flex items-center gap-2"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause' : 'Preview'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900">
              <LogoAnimator
                logoUrl={logoUrl}
                logoText={!logoUrl ? logoText : undefined}
                config={logoSettings}
                isPlaying={isPlaying}
                currentTime={currentTime}
                backgroundColor="#0a0a0a"
                width={800}
                height={450}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-slate-500 font-mono">{currentTime.toFixed(2)}s</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                  style={{ width: `${(currentTime / (logoSettings.delay + logoSettings.duration + 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-slate-500 font-mono">{(logoSettings.delay + logoSettings.duration + 1).toFixed(2)}s</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logo')}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Or Text Logo</label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                placeholder="YOUR BRAND"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Animation Style</label>
              <select
                value={logoSettings.animation}
                onChange={(e) => {
                  const preset = Object.entries(logoAnimationPresets).find(([_, p]) => p.animation === e.target.value)?.[1];
                  if (preset) setLogoSettings({ ...logoSettings, ...preset });
                  else setLogoSettings({ ...logoSettings, animation: e.target.value as LogoAnimation });
                }}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              >
                <optgroup label="Fade & Reveal">
                  <option value="fade-in">Fade In</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="zoom-out">Zoom Out</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                </optgroup>
                <optgroup label="3D Effects">
                  <option value="flip-x">Flip X</option>
                  <option value="flip-y">Flip Y</option>
                  <option value="rotate-in">Rotate In</option>
                  <option value="3d-flip">3D Flip</option>
                </optgroup>
                <optgroup label="Dynamic">
                  <option value="bounce">Bounce</option>
                  <option value="elastic">Elastic</option>
                  <option value="wave">Wave</option>
                  <option value="ripple">Ripple</option>
                </optgroup>
                <optgroup label="Special Effects">
                  <option value="glitch">Glitch</option>
                  <option value="neon-glow">Neon Glow</option>
                  <option value="particles">Particles</option>
                  <option value="electric">Electric</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={logoSettings.color || '#ffffff'}
                  onChange={(e) => setLogoSettings({ ...logoSettings, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={logoSettings.color || '#ffffff'}
                  onChange={(e) => setLogoSettings({ ...logoSettings, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Duration: {logoSettings.duration}s
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={logoSettings.duration}
                onChange={(e) => setLogoSettings({ ...logoSettings, duration: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Delay: {logoSettings.delay}s
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={logoSettings.delay}
                onChange={(e) => setLogoSettings({ ...logoSettings, delay: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {logoSettings.animation === 'neon-glow' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Glow Intensity: {logoSettings.glowIntensity || 20}
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={logoSettings.glowIntensity || 20}
                  onChange={(e) => setLogoSettings({ ...logoSettings, glowIntensity: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTextAnimation = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-rose-600 to-pink-600 rounded-xl">
              <Type size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Text Animation</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium rounded-xl flex items-center gap-2"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              {isPlaying ? 'Pause' : 'Preview'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
              <TextAnimator
                text={animatedText}
                config={textSettings}
                isPlaying={isPlaying}
                currentTime={currentTime}
                width={800}
                height={200}
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Text</label>
              <textarea
                value={animatedText}
                onChange={(e) => setAnimatedText(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm resize-none"
                placeholder="Enter your text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Animation</label>
              <select
                value={textSettings.animation}
                onChange={(e) => {
                  const preset = Object.entries(textAnimationPresets).find(([_, p]) => p.animation === e.target.value)?.[1];
                  if (preset) setTextSettings({ ...textSettings, ...preset } as TextAnimationConfig);
                  else setTextSettings({ ...textSettings, animation: e.target.value as any });
                }}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              >
                <optgroup label="Simple">
                  <option value="fade-in">Fade In</option>
                  <option value="fade-in-up">Fade In Up</option>
                  <option value="fade-in-down">Fade In Down</option>
                  <option value="zoom-in">Zoom In</option>
                </optgroup>
                <optgroup label="Character-by-Character">
                  <option value="typewriter">Typewriter</option>
                  <option value="letter-by-letter">Letter by Letter</option>
                  <option value="wave">Wave</option>
                  <option value="blur-in">Blur In</option>
                </optgroup>
                <optgroup label="Word-by-Word">
                  <option value="word-by-word">Word by Word</option>
                  <option value="split-reveal">Split Reveal</option>
                </optgroup>
                <optgroup label="Dynamic">
                  <option value="kinetic-pop">Kinetic Pop</option>
                  <option value="elastic-bounce">Elastic Bounce</option>
                  <option value="flip-in">Flip In</option>
                  <option value="rotate-in">Rotate In</option>
                </optgroup>
                <optgroup label="Special">
                  <option value="scramble">Scramble Decode</option>
                  <option value="neon-flicker">Neon Flicker</option>
                  <option value="slide-reveal">Slide Reveal</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font</label>
              <select
                value={textSettings.fontFamily}
                onChange={(e) => setTextSettings({ ...textSettings, fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Size</label>
                <input
                  type="number"
                  min="12"
                  max="200"
                  value={textSettings.fontSize}
                  onChange={(e) => setTextSettings({ ...textSettings, fontSize: parseInt(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Weight</label>
                <select
                  value={textSettings.fontWeight}
                  onChange={(e) => setTextSettings({ ...textSettings, fontWeight: parseInt(e.target.value) })}
                  className="w-full px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded text-sm"
                >
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="900">Black</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textSettings.color}
                  onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={textSettings.color}
                  onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Duration: {textSettings.duration}s
              </label>
              <input
                type="range"
                min="0.3"
                max="3"
                step="0.1"
                value={textSettings.duration}
                onChange={(e) => setTextSettings({ ...textSettings, duration: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Stagger: {textSettings.staggerDelay}s
              </label>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.01"
                value={textSettings.staggerDelay}
                onChange={(e) => setTextSettings({ ...textSettings, staggerDelay: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVideoEditor = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl">
              <Film size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Video Editor</h2>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl flex items-center gap-2">
            <Download size={18} />
            Export Video
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
              {currentScene ? (
                <SceneBuilder
                  scene={currentScene}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  scale={0.5}
                />
              ) : (
                <div className="text-center text-slate-500">
                  <Film size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Add a scene to get started</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Scene Templates</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sceneTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setCurrentScene(template);
                    addClip('scene', { sceneId: template.id, name: template.name });
                  }}
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                >
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{template.name}</div>
                  <div className="text-xs text-slate-500">{template.width}x{template.height} - {template.duration}s</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <VideoTimeline
          clips={timelineClips}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onTimeChange={handleTimeChange}
          onPlayPause={togglePlay}
          onClipSelect={(clip) => setSelectedClipId(clip?.id || null)}
          onClipUpdate={handleClipUpdate}
          onClipDelete={handleClipDelete}
          onClipDuplicate={handleClipDuplicate}
          selectedClipId={selectedClipId}
        />
      </div>
    </div>
  );

  const renderSlideshow = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 min-h-[600px]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl">
              <ImageIcon size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Slideshow Maker</h2>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium rounded-xl flex items-center gap-2">
            <Download size={18} />
            Export Video
          </button>
        </div>

        <SlideshowMaker
          slides={slides}
          onSlidesChange={setSlides}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
        />
      </div>
    </div>
  );

  const renderSocialMedia = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-sky-600 to-blue-600 rounded-xl">
              <Share2 size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Social Media Templates</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {socialFormats.map(format => {
            const Icon = format.icon;
            const isVertical = format.height > format.width;
            return (
              <button
                key={format.id}
                className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className={`mx-auto mb-3 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center ${
                  isVertical ? 'w-12 h-20' : 'w-20 h-12'
                }`}>
                  <Icon size={20} className="text-slate-500" />
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">{format.name}</div>
                <div className="text-xs text-slate-500">{format.width} x {format.height}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderApparel = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ChevronRight size={20} className="rotate-180 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl">
              <Shirt size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Apparel & Merchandise</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {apparelItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="group p-6 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-slate-500" />
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50 text-center">{item.name}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (mode) {
      case 'home': return renderHome();
      case 'device': return renderDeviceMockups();
      case 'video': return renderVideoEditor();
      case 'logo': return renderLogoAnimation();
      case 'text': return renderTextAnimation();
      case 'slideshow': return renderSlideshow();
      case 'social': return renderSocialMedia();
      case 'apparel': return renderApparel();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
}
