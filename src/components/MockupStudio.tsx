import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Smartphone, Tablet, Laptop, Watch, Tv, Film, Play, Pause, SkipBack, SkipForward, Upload, Download, Save, Trash2, Copy, Grid3x3, LayoutGrid as Layout, Layers, Type, Image as ImageIcon, Sparkles, Wand2, Palette, Settings, ChevronRight, ChevronLeft, Plus, X, Check, Search, Filter, SlidersHorizontal, Shirt, Coffee, ShoppingBag, FileText, Share2, Video, Camera, Zap, Star, Crown, Lock, RotateCcw, ZoomIn, ZoomOut, Move, Eye, EyeOff, Sun, Moon, Droplet, Wind, Flame, Snowflake, Box, Cube, Globe, Building, Car, Gamepad2, Headphones, Speaker, Frame, Gift, Package, BookOpen, Newspaper, CreditCard, PenTool, Brush, Paintbrush, Scissors, Stamp, Sticker, Tag, Award, Medal, Trophy, Target, Crosshair, Compass, Map, Navigation, Rocket, Plane, Ship, Train, Bus, Bike, Mountain, TreePine, Waves, CloudSun, Sunrise, Sunset, Stars, MoonStar, Heart, ThumbsUp, MessageCircle, Send, Mail, Bell, Music, Mic, Radio, Wifi, Bluetooth, Battery, Power, Lightbulb, Flashlight, Home, Store, Warehouse, Factory, Hospital, School, Library, Church, Castle, Tent, Umbrella, Glasses, Watch as WatchIcon, Ring, Gem, Diamond, Crown as CrownIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { VideoTimeline, TimelineClip } from './mockup/VideoTimeline';
import { DeviceMockup, deviceConfigs, DeviceConfig } from './mockup/DeviceMockup';
import { LogoAnimator, logoAnimationPresets, LogoAnimationConfig, LogoAnimation } from './mockup/LogoAnimator';
import { TextAnimator, textAnimationPresets, TextAnimationConfig, fontOptions } from './mockup/TextAnimator';
import { SceneBuilder, sceneTemplates, SceneConfig, SceneElement } from './mockup/SceneBuilder';
import { SlideshowMaker, SlideConfig } from './mockup/SlideshowMaker';

const Flag = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const Wine = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M8 22h8M12 18v4M12 18a6 6 0 0 0 6-6V2H6v10a6 6 0 0 0 6 6z"/>
  </svg>
);

const Beer = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M17 11h1a3 3 0 0 1 0 6h-1"/>
    <path d="M5 6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
    <path d="M5 6h12l-1-4H6L5 6z"/>
  </svg>
);

export type StudioSection = 'home' | 'devices' | 'intros' | 'products' | 'scenes' | 'video' | 'logo' | 'text' | 'slideshow' | 'social' | 'apparel' | 'environments' | 'packages' | 'print' | 'signage' | 'frames' | 'tech' | 'vehicles' | 'food' | 'nature';

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
  initialSection?: StudioSection;
  onNavigate?: (section: StudioSection) => void;
}

const sectionConfig: Record<StudioSection, { icon: any; label: string; color: string; description: string }> = {
  home: { icon: Grid3x3, label: 'Home', color: 'from-slate-600 to-slate-700', description: 'MockupStudio Pro Dashboard' },
  devices: { icon: Smartphone, label: 'Device Mockups', color: 'from-blue-600 to-cyan-600', description: '50+ 3D device frames' },
  intros: { icon: Film, label: '3D Intros', color: 'from-amber-600 to-orange-600', description: '30+ cinematic intro templates' },
  products: { icon: Package, label: 'Product Mockups', color: 'from-emerald-600 to-teal-600', description: '40+ product showcase templates' },
  scenes: { icon: Layers, label: '3D Scenes', color: 'from-violet-600 to-purple-600', description: 'Multi-element scene composer' },
  video: { icon: Video, label: 'Video Editor', color: 'from-green-600 to-emerald-600', description: 'Timeline-based video editing' },
  logo: { icon: Sparkles, label: 'Logo Animation', color: 'from-rose-600 to-pink-600', description: '25+ logo animation effects' },
  text: { icon: Type, label: 'Text Animation', color: 'from-sky-600 to-blue-600', description: '20+ kinetic typography effects' },
  slideshow: { icon: ImageIcon, label: 'Slideshow', color: 'from-indigo-600 to-violet-600', description: 'Photo slideshows with transitions' },
  social: { icon: Share2, label: 'Social Media', color: 'from-pink-600 to-rose-600', description: 'Platform-optimized templates' },
  apparel: { icon: Shirt, label: 'Apparel & Merch', color: 'from-teal-600 to-cyan-600', description: 'T-shirts, hoodies, merch' },
  environments: { icon: Globe, label: '3D Environments', color: 'from-green-600 to-lime-600', description: 'Studios, offices, outdoor scenes' },
  packages: { icon: Box, label: 'Packaging', color: 'from-orange-600 to-amber-600', description: 'Boxes, bottles, containers' },
  print: { icon: BookOpen, label: 'Print & Editorial', color: 'from-red-600 to-rose-600', description: 'Books, magazines, brochures' },
  signage: { icon: Newspaper, label: 'Signage & OOH', color: 'from-slate-600 to-zinc-600', description: 'Billboards, banners, signs' },
  frames: { icon: Frame, label: 'Frames & Art', color: 'from-amber-700 to-yellow-600', description: 'Picture frames, canvas, posters' },
  tech: { icon: Headphones, label: 'Tech & Gadgets', color: 'from-gray-600 to-slate-600', description: 'Headphones, speakers, gadgets' },
  vehicles: { icon: Car, label: 'Vehicle Wraps', color: 'from-blue-700 to-indigo-600', description: 'Cars, trucks, vans, buses' },
  food: { icon: Coffee, label: 'Food & Beverage', color: 'from-orange-700 to-red-600', description: 'Cups, plates, packaging' },
  nature: { icon: TreePine, label: 'Nature Scenes', color: 'from-green-700 to-emerald-600', description: 'Outdoor, landscape mockups' }
};

const introTemplates = [
  { id: 'cinematic-logo-reveal', name: 'Cinematic Logo Reveal', category: 'cinematic', duration: 5, preview: 'Epic logo reveal with lens flares' },
  { id: 'neon-city', name: 'Neon City', category: 'cinematic', duration: 6, preview: '80s retro neon cityscape' },
  { id: 'particle-explosion', name: 'Particle Explosion', category: 'cinematic', duration: 4, preview: 'Logo emerges from particles' },
  { id: 'glitch-distortion', name: 'Glitch Distortion', category: 'cinematic', duration: 3, preview: 'Digital glitch effect' },
  { id: 'liquid-metal', name: 'Liquid Metal', category: 'cinematic', duration: 5, preview: 'Chrome liquid morphing' },
  { id: 'fire-reveal', name: 'Fire Reveal', category: 'cinematic', duration: 4, preview: 'Flames reveal your logo' },
  { id: 'ice-shatter', name: 'Ice Shatter', category: 'cinematic', duration: 4, preview: 'Frozen glass shattering' },
  { id: 'smoke-reveal', name: 'Smoke Reveal', category: 'cinematic', duration: 5, preview: 'Mysterious smoke effect' },
  { id: 'electric-surge', name: 'Electric Surge', category: 'cinematic', duration: 3, preview: 'Lightning and electricity' },
  { id: 'hologram-3d', name: '3D Hologram', category: 'cinematic', duration: 5, preview: 'Futuristic hologram display' },
  { id: 'minimal-fade', name: 'Minimal Fade', category: 'minimal', duration: 3, preview: 'Clean, elegant fade in' },
  { id: 'line-draw', name: 'Line Draw', category: 'minimal', duration: 4, preview: 'Logo drawn with lines' },
  { id: 'dot-matrix', name: 'Dot Matrix', category: 'minimal', duration: 3, preview: 'Dots form your logo' },
  { id: 'split-reveal', name: 'Split Reveal', category: 'minimal', duration: 3, preview: 'Horizontal split animation' },
  { id: 'zoom-blur', name: 'Zoom Blur', category: 'minimal', duration: 2, preview: 'Fast zoom with blur' },
  { id: 'corporate-gradient', name: 'Corporate Gradient', category: 'corporate', duration: 4, preview: 'Professional gradient sweep' },
  { id: 'business-cards-3d', name: '3D Business Cards', category: 'corporate', duration: 5, preview: 'Floating business cards' },
  { id: 'office-reveal', name: 'Office Reveal', category: 'corporate', duration: 5, preview: 'Modern office backdrop' },
  { id: 'gaming-hud', name: 'Gaming HUD', category: 'gaming', duration: 4, preview: 'Futuristic gaming interface' },
  { id: 'pixel-glitch', name: 'Pixel Glitch', category: 'gaming', duration: 3, preview: 'Retro pixel glitch' },
  { id: 'neon-gaming', name: 'Neon Gaming', category: 'gaming', duration: 4, preview: 'RGB neon gamer style' },
  { id: 'youtube-intro', name: 'YouTube Intro', category: 'social', duration: 5, preview: 'Dynamic YouTube opener' },
  { id: 'instagram-story', name: 'Instagram Story', category: 'social', duration: 3, preview: 'Vertical story format' },
  { id: 'tiktok-hook', name: 'TikTok Hook', category: 'social', duration: 2, preview: 'Fast-paced TikTok style' },
  { id: 'podcast-intro', name: 'Podcast Intro', category: 'audio', duration: 5, preview: 'Audio waveform animation' },
  { id: 'music-visualizer', name: 'Music Visualizer', category: 'audio', duration: 6, preview: 'Audio-reactive visuals' },
  { id: 'luxury-gold', name: 'Luxury Gold', category: 'luxury', duration: 5, preview: 'Elegant gold particles' },
  { id: 'diamond-sparkle', name: 'Diamond Sparkle', category: 'luxury', duration: 4, preview: 'Premium diamond effect' },
  { id: 'marble-texture', name: 'Marble Texture', category: 'luxury', duration: 4, preview: 'Sophisticated marble background' },
  { id: 'space-nebula', name: 'Space Nebula', category: 'cinematic', duration: 6, preview: 'Cosmic space journey' }
];

const productMockups = [
  { id: 'box-3d', name: '3D Product Box', category: 'packaging', icon: Box },
  { id: 'software-box', name: 'Software Box', category: 'packaging', icon: Package },
  { id: 'cereal-box', name: 'Cereal Box', category: 'packaging', icon: Box },
  { id: 'shoe-box', name: 'Shoe Box', category: 'packaging', icon: Gift },
  { id: 'gift-box', name: 'Gift Box', category: 'packaging', icon: Gift },
  { id: 'mailer-box', name: 'Mailer Box', category: 'packaging', icon: Mail },
  { id: 'book-hardcover', name: 'Hardcover Book', category: 'print', icon: BookOpen },
  { id: 'book-softcover', name: 'Softcover Book', category: 'print', icon: BookOpen },
  { id: 'magazine-open', name: 'Magazine Open', category: 'print', icon: Newspaper },
  { id: 'magazine-stack', name: 'Magazine Stack', category: 'print', icon: Newspaper },
  { id: 'brochure-trifold', name: 'Trifold Brochure', category: 'print', icon: FileText },
  { id: 'brochure-bifold', name: 'Bifold Brochure', category: 'print', icon: FileText },
  { id: 'flyer-a4', name: 'A4 Flyer', category: 'print', icon: FileText },
  { id: 'poster-a2', name: 'A2 Poster', category: 'print', icon: FileText },
  { id: 'business-card', name: 'Business Card', category: 'stationery', icon: CreditCard },
  { id: 'business-card-stack', name: 'Business Card Stack', category: 'stationery', icon: CreditCard },
  { id: 'letterhead', name: 'Letterhead', category: 'stationery', icon: FileText },
  { id: 'envelope', name: 'Envelope', category: 'stationery', icon: Mail },
  { id: 'notebook', name: 'Notebook', category: 'stationery', icon: BookOpen },
  { id: 'pen-set', name: 'Pen Set', category: 'stationery', icon: PenTool },
  { id: 'billboard-city', name: 'City Billboard', category: 'signage', icon: Newspaper },
  { id: 'billboard-highway', name: 'Highway Billboard', category: 'signage', icon: Newspaper },
  { id: 'bus-stop', name: 'Bus Stop Ad', category: 'signage', icon: Bus },
  { id: 'subway-poster', name: 'Subway Poster', category: 'signage', icon: Train },
  { id: 'store-sign', name: 'Store Sign', category: 'signage', icon: Store },
  { id: 'banner-roll', name: 'Roll-up Banner', category: 'signage', icon: Flag },
  { id: 'flag-banner', name: 'Flag Banner', category: 'signage', icon: Flag },
  { id: 'frame-gold', name: 'Gold Frame', category: 'frames', icon: Frame },
  { id: 'frame-wood', name: 'Wood Frame', category: 'frames', icon: Frame },
  { id: 'frame-modern', name: 'Modern Frame', category: 'frames', icon: Frame },
  { id: 'canvas-gallery', name: 'Gallery Canvas', category: 'frames', icon: Frame },
  { id: 'canvas-mockup', name: 'Canvas Mockup', category: 'frames', icon: Frame },
  { id: 'poster-frame', name: 'Poster Frame', category: 'frames', icon: Frame },
  { id: 'tshirt-front', name: 'T-Shirt Front', category: 'apparel', icon: Shirt },
  { id: 'tshirt-back', name: 'T-Shirt Back', category: 'apparel', icon: Shirt },
  { id: 'hoodie-front', name: 'Hoodie Front', category: 'apparel', icon: Shirt },
  { id: 'hoodie-back', name: 'Hoodie Back', category: 'apparel', icon: Shirt },
  { id: 'cap', name: 'Baseball Cap', category: 'apparel', icon: Crown },
  { id: 'tote-bag', name: 'Tote Bag', category: 'apparel', icon: ShoppingBag },
  { id: 'coffee-mug', name: 'Coffee Mug', category: 'drinkware', icon: Coffee },
  { id: 'travel-mug', name: 'Travel Mug', category: 'drinkware', icon: Coffee },
  { id: 'water-bottle', name: 'Water Bottle', category: 'drinkware', icon: Droplet },
  { id: 'wine-bottle', name: 'Wine Bottle', category: 'drinkware', icon: Wine },
  { id: 'beer-can', name: 'Beer Can', category: 'drinkware', icon: Beer }
];

const environmentTemplates = [
  { id: 'studio-white', name: 'White Studio', category: 'studio', description: 'Clean white infinity background' },
  { id: 'studio-dark', name: 'Dark Studio', category: 'studio', description: 'Dramatic dark background' },
  { id: 'studio-gradient', name: 'Gradient Studio', category: 'studio', description: 'Smooth color gradients' },
  { id: 'studio-neon', name: 'Neon Studio', category: 'studio', description: 'RGB neon lighting' },
  { id: 'office-modern', name: 'Modern Office', category: 'office', description: 'Contemporary workspace' },
  { id: 'office-minimal', name: 'Minimal Desk', category: 'office', description: 'Clean desk setup' },
  { id: 'office-creative', name: 'Creative Studio', category: 'office', description: 'Designer workspace' },
  { id: 'office-executive', name: 'Executive Office', category: 'office', description: 'Luxury office space' },
  { id: 'cafe-interior', name: 'Cafe Interior', category: 'indoor', description: 'Cozy coffee shop' },
  { id: 'restaurant', name: 'Restaurant', category: 'indoor', description: 'Fine dining setting' },
  { id: 'retail-store', name: 'Retail Store', category: 'indoor', description: 'Shopping environment' },
  { id: 'gym-interior', name: 'Gym Interior', category: 'indoor', description: 'Fitness center' },
  { id: 'outdoor-urban', name: 'Urban Street', category: 'outdoor', description: 'City street scene' },
  { id: 'outdoor-park', name: 'City Park', category: 'outdoor', description: 'Green park setting' },
  { id: 'outdoor-beach', name: 'Beach Scene', category: 'outdoor', description: 'Coastal environment' },
  { id: 'outdoor-mountain', name: 'Mountain View', category: 'outdoor', description: 'Alpine landscape' },
  { id: 'outdoor-forest', name: 'Forest Path', category: 'outdoor', description: 'Woodland setting' },
  { id: 'outdoor-desert', name: 'Desert Dunes', category: 'outdoor', description: 'Sand dune landscape' },
  { id: 'tech-lab', name: 'Tech Lab', category: 'tech', description: 'Futuristic laboratory' },
  { id: 'server-room', name: 'Server Room', category: 'tech', description: 'Data center environment' },
  { id: 'gaming-setup', name: 'Gaming Setup', category: 'tech', description: 'RGB gaming battlestation' },
  { id: 'abstract-geometric', name: 'Geometric Abstract', category: 'abstract', description: '3D geometric shapes' },
  { id: 'abstract-liquid', name: 'Liquid Abstract', category: 'abstract', description: 'Fluid metallic forms' },
  { id: 'abstract-particles', name: 'Particle Field', category: 'abstract', description: 'Floating particles' }
];

const socialFormats = [
  { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080, icon: Camera },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, icon: Video },
  { id: 'instagram-reel', name: 'Instagram Reel', width: 1080, height: 1920, icon: Film },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920, icon: Video },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720, icon: ImageIcon },
  { id: 'youtube-video', name: 'YouTube Video', width: 1920, height: 1080, icon: Video },
  { id: 'youtube-short', name: 'YouTube Short', width: 1080, height: 1920, icon: Film },
  { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, icon: ImageIcon },
  { id: 'facebook-cover', name: 'Facebook Cover', width: 820, height: 312, icon: ImageIcon },
  { id: 'twitter-post', name: 'Twitter/X Post', width: 1200, height: 675, icon: ImageIcon },
  { id: 'twitter-header', name: 'Twitter/X Header', width: 1500, height: 500, icon: ImageIcon },
  { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 628, icon: ImageIcon },
  { id: 'linkedin-cover', name: 'LinkedIn Cover', width: 1584, height: 396, icon: ImageIcon },
  { id: 'pinterest-pin', name: 'Pinterest Pin', width: 1000, height: 1500, icon: ImageIcon },
  { id: 'snapchat', name: 'Snapchat', width: 1080, height: 1920, icon: Camera },
  { id: 'twitch-overlay', name: 'Twitch Overlay', width: 1920, height: 1080, icon: Video },
  { id: 'discord-banner', name: 'Discord Banner', width: 960, height: 540, icon: ImageIcon }
];

const apparelItems = [
  { id: 'tshirt-front', name: 'T-Shirt Front', icon: Shirt, colors: ['white', 'black', 'navy', 'red', 'gray'] },
  { id: 'tshirt-back', name: 'T-Shirt Back', icon: Shirt, colors: ['white', 'black', 'navy', 'red', 'gray'] },
  { id: 'tshirt-closeup', name: 'T-Shirt Closeup', icon: Shirt, colors: ['white', 'black', 'navy'] },
  { id: 'vneck', name: 'V-Neck Shirt', icon: Shirt, colors: ['white', 'black', 'gray'] },
  { id: 'longsleeve', name: 'Long Sleeve', icon: Shirt, colors: ['white', 'black', 'navy'] },
  { id: 'hoodie-front', name: 'Hoodie Front', icon: Shirt, colors: ['black', 'gray', 'navy', 'white'] },
  { id: 'hoodie-back', name: 'Hoodie Back', icon: Shirt, colors: ['black', 'gray', 'navy', 'white'] },
  { id: 'hoodie-detail', name: 'Hoodie Detail', icon: Shirt, colors: ['black', 'gray'] },
  { id: 'zip-hoodie', name: 'Zip Hoodie', icon: Shirt, colors: ['black', 'gray', 'navy'] },
  { id: 'sweatshirt', name: 'Sweatshirt', icon: Shirt, colors: ['gray', 'black', 'navy', 'white'] },
  { id: 'tank-top', name: 'Tank Top', icon: Shirt, colors: ['white', 'black', 'gray'] },
  { id: 'polo', name: 'Polo Shirt', icon: Shirt, colors: ['white', 'navy', 'black'] },
  { id: 'cap-front', name: 'Cap Front', icon: Crown, colors: ['black', 'white', 'navy', 'red'] },
  { id: 'cap-side', name: 'Cap Side', icon: Crown, colors: ['black', 'white', 'navy'] },
  { id: 'beanie', name: 'Beanie', icon: Crown, colors: ['black', 'gray', 'navy'] },
  { id: 'tote-bag', name: 'Tote Bag', icon: ShoppingBag, colors: ['natural', 'black', 'navy'] },
  { id: 'drawstring-bag', name: 'Drawstring Bag', icon: ShoppingBag, colors: ['black', 'white'] },
  { id: 'backpack', name: 'Backpack', icon: ShoppingBag, colors: ['black', 'gray'] },
  { id: 'mug-white', name: 'White Mug', icon: Coffee, colors: ['white'] },
  { id: 'mug-black', name: 'Black Mug', icon: Coffee, colors: ['black'] },
  { id: 'mug-colored', name: 'Colored Mug', icon: Coffee, colors: ['red', 'blue', 'green'] },
  { id: 'travel-mug', name: 'Travel Mug', icon: Coffee, colors: ['white', 'black', 'steel'] },
  { id: 'water-bottle', name: 'Water Bottle', icon: Droplet, colors: ['white', 'black', 'blue'] },
  { id: 'phone-case', name: 'Phone Case', icon: Smartphone, colors: ['clear', 'black', 'white'] },
  { id: 'laptop-sleeve', name: 'Laptop Sleeve', icon: Laptop, colors: ['gray', 'black'] },
  { id: 'mousepad', name: 'Mouse Pad', icon: Monitor, colors: ['black'] },
  { id: 'poster-frame', name: 'Framed Poster', icon: Frame, colors: ['black', 'white', 'wood'] },
  { id: 'canvas-print', name: 'Canvas Print', icon: Frame, colors: ['white'] },
  { id: 'sticker-sheet', name: 'Sticker Sheet', icon: Sticker, colors: ['white'] },
  { id: 'pillow', name: 'Throw Pillow', icon: Home, colors: ['white', 'gray', 'black'] }
];

export function MockupStudio({ userId, initialSection = 'home', onNavigate }: MockupStudioProps) {
  const [section, setSection] = useState<StudioSection>(initialSection);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(10);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(deviceConfigs[0]);
  const [deviceSettings, setDeviceSettings] = useState({
    angle: { x: 15, y: -20, z: 5 },
    shadow: true,
    shadowIntensity: 60,
    reflection: true,
    glare: true,
    environment: 'floating' as const,
    backgroundColor: '#0f172a',
    screenImage: '',
    clayMode: false,
    clayColor: '#e2e8f0'
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

  const [selectedIntro, setSelectedIntro] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [selectedApparel, setSelectedApparel] = useState<string | null>(null);
  const [selectedApparelColor, setSelectedApparelColor] = useState<string>('white');
  const [designImage, setDesignImage] = useState<string>('');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

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

  const navigateToSection = (newSection: StudioSection) => {
    setSection(newSection);
    onNavigate?.(newSection);
  };

  const togglePlay = useCallback(() => {
    if (currentTime >= duration) setCurrentTime(0);
    setIsPlaying(prev => !prev);
  }, [currentTime, duration]);

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'screen' | 'logo' | 'design') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (target === 'screen') {
      setDeviceSettings(prev => ({ ...prev, screenImage: url }));
    } else if (target === 'logo') {
      setLogoUrl(url);
    } else {
      setDesignImage(url);
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

  const SectionHeader = ({ title, icon: Icon, gradient }: { title: string; icon: any; gradient: string }) => (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigateToSection('home')}
          className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <ChevronLeft size={22} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div className={`p-3.5 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg`}>
          <Icon size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{sectionConfig[section]?.description}</p>
        </div>
      </div>
      <button className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-medium rounded-xl flex items-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5">
        <Download size={18} />
        Export
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyek0zNiAyNnYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-2xl">
              <Wand2 size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">MockupStudio Pro</h1>
              <p className="text-slate-300 text-lg">Create stunning 3D mockups, videos & animations</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-3xl font-bold text-primary-400">50+</div>
              <div className="text-sm text-slate-400">Devices</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-3xl font-bold text-accent-400">30+</div>
              <div className="text-sm text-slate-400">Intros</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-3xl font-bold text-emerald-400">40+</div>
              <div className="text-sm text-slate-400">Products</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
              <div className="text-3xl font-bold text-rose-400">25+</div>
              <div className="text-sm text-slate-400">Scenes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(sectionConfig) as StudioSection[]).filter(s => s !== 'home').map(s => {
          const config = sectionConfig[s];
          const Icon = config.icon;
          return (
            <button
              key={s}
              onClick={() => navigateToSection(s)}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <Icon size={26} className="text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-left text-sm">{config.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-left mt-1">{config.description}</p>
            </button>
          );
        })}
      </div>

      {projects.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Projects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {projects.slice(0, 6).map(project => (
              <div key={project.id} className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all">
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

  const renderDevices = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Device Mockups" icon={Smartphone} gradient="from-blue-600 to-cyan-600" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div
              className="w-full aspect-video rounded-2xl flex items-center justify-center overflow-hidden relative"
              style={{
                backgroundColor: deviceSettings.backgroundColor,
                perspective: '1200px'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              <DeviceMockup
                device={selectedDevice}
                screenContent={
                  deviceSettings.screenImage ? (
                    <img src={deviceSettings.screenImage} alt="Screen" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <div className="text-center">
                        <Upload size={32} className="mx-auto text-slate-500 mb-2" />
                        <span className="text-slate-500 text-sm">Upload Screenshot</span>
                      </div>
                    </div>
                  )
                }
                angle={deviceSettings.angle}
                shadow={deviceSettings.shadow}
                shadowIntensity={deviceSettings.shadowIntensity}
                reflection={deviceSettings.reflection}
                glare={deviceSettings.glare}
                environment={deviceSettings.environment}
                scale={selectedDevice.type === 'laptop' || selectedDevice.type === 'desktop' || selectedDevice.type === 'tv' ? 0.6 : 0.85}
                clayMode={deviceSettings.clayMode}
                clayColor={deviceSettings.clayColor}
              />
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {['#0f172a', '#1e1b4b', '#14532d', '#7f1d1d', '#78350f'].map(color => (
                <button
                  key={color}
                  onClick={() => setDeviceSettings(prev => ({ ...prev, backgroundColor: color }))}
                  className={`h-10 rounded-lg transition-all ${deviceSettings.backgroundColor === color ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Device Type</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['phone', 'tablet', 'laptop', 'desktop', 'watch', 'tv', 'gaming'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const firstOfType = deviceConfigs.find(d => d.type === type);
                      if (firstOfType) setSelectedDevice(firstOfType);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                      selectedDevice.type === type
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {deviceConfigs.filter(d => d.type === selectedDevice.type).map(device => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`p-2 rounded-lg text-left text-xs transition-all ${
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
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'screen')}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rotation X: {deviceSettings.angle.x}deg
              </label>
              <input
                type="range"
                min="-45"
                max="45"
                value={deviceSettings.angle.x}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, angle: { ...prev.angle, x: parseInt(e.target.value) } }))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rotation Y: {deviceSettings.angle.y}deg
              </label>
              <input
                type="range"
                min="-45"
                max="45"
                value={deviceSettings.angle.y}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, angle: { ...prev.angle, y: parseInt(e.target.value) } }))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rotation Z: {deviceSettings.angle.z}deg
              </label>
              <input
                type="range"
                min="-30"
                max="30"
                value={deviceSettings.angle.z}
                onChange={(e) => setDeviceSettings(prev => ({ ...prev, angle: { ...prev.angle, z: parseInt(e.target.value) } }))}
                className="w-full accent-blue-500"
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
                className="w-full accent-blue-500"
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
              <button
                onClick={() => setDeviceSettings(prev => ({ ...prev, clayMode: !prev.clayMode }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  deviceSettings.clayMode ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                Clay Mode
              </button>
            </div>

            {deviceSettings.clayMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Clay Color</label>
                <div className="flex gap-2">
                  {['#e2e8f0', '#fecaca', '#bbf7d0', '#bfdbfe', '#fde68a'].map(color => (
                    <button
                      key={color}
                      onClick={() => setDeviceSettings(prev => ({ ...prev, clayColor: color }))}
                      className={`w-8 h-8 rounded-full transition-all ${deviceSettings.clayColor === color ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Presets</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeviceSettings(prev => ({ ...prev, angle: { x: 0, y: 0, z: 0 } }))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Front View
                </button>
                <button
                  onClick={() => setDeviceSettings(prev => ({ ...prev, angle: { x: 15, y: -25, z: 5 } }))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Perspective
                </button>
                <button
                  onClick={() => setDeviceSettings(prev => ({ ...prev, angle: { x: 45, y: 0, z: 0 } }))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Top Down
                </button>
                <button
                  onClick={() => setDeviceSettings(prev => ({ ...prev, angle: { x: 0, y: -45, z: 0 } }))}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Side View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntros = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="3D Intro Templates" icon={Film} gradient="from-amber-600 to-orange-600" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 relative">
              {selectedIntro ? (
                <div className="w-full h-full flex items-center justify-center">
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
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Film size={48} className="mx-auto mb-3 opacity-50" />
                    <p>Select an intro template</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={togglePlay}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl flex items-center gap-2"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {isPlaying ? 'Pause' : 'Preview'}
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="font-mono">{currentTime.toFixed(2)}s</span>
                <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${(currentTime / 5) * 100}%` }}
                  />
                </div>
                <span className="font-mono">5.00s</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo Image</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Or Text Logo</label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm border-0 focus:ring-2 focus:ring-amber-500"
                placeholder="YOUR BRAND"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {['cinematic', 'minimal', 'corporate', 'gaming', 'social', 'audio', 'luxury'].map(cat => (
                  <button
                    key={cat}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium capitalize hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {introTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedIntro(template.id);
                    setDuration(template.duration);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedIntro === template.id
                      ? 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-500'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{template.name}</div>
                      <div className="text-xs text-slate-500">{template.preview}</div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{template.duration}s</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Product Mockups" icon={Package} gradient="from-emerald-600 to-teal-600" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative" style={{ perspective: '1200px' }}>
              {selectedProduct ? (
                <div
                  className="relative transition-transform duration-500"
                  style={{
                    transform: 'rotateX(10deg) rotateY(-15deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="w-64 h-80 bg-white rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
                    {designImage ? (
                      <img src={designImage} alt="Design" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Package size={48} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-400 text-sm">Upload your design</p>
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-lg pointer-events-none"
                    style={{ transform: 'translateZ(2px)' }}
                  />
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a product mockup</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Design Image</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload Design</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'design')}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {['packaging', 'print', 'stationery', 'signage', 'frames', 'apparel', 'drinkware'].map(cat => (
                  <button
                    key={cat}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium capitalize hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {productMockups.map(mockup => {
                const Icon = mockup.icon;
                return (
                  <button
                    key={mockup.id}
                    onClick={() => setSelectedProduct(mockup.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedProduct === mockup.id
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Icon size={20} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{mockup.name}</div>
                      <div className="text-xs text-slate-500 capitalize">{mockup.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvironments = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="3D Environments" icon={Globe} gradient="from-green-600 to-lime-600" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
              {selectedEnvironment ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-slate-900/50"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative"
                      style={{
                        transform: 'perspective(1000px) rotateX(5deg) rotateY(-10deg)',
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {deviceSettings.screenImage ? (
                        <DeviceMockup
                          device={selectedDevice}
                          screenContent={<img src={deviceSettings.screenImage} alt="Screen" className="w-full h-full object-cover" />}
                          angle={{ x: 10, y: -15, z: 0 }}
                          shadow={true}
                          shadowIntensity={70}
                          scale={0.7}
                        />
                      ) : (
                        <div className="w-48 h-64 bg-slate-700 rounded-3xl border-4 border-slate-600 flex items-center justify-center">
                          <Smartphone size={48} className="text-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <Globe size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select an environment</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {['studio', 'office', 'indoor', 'outdoor', 'tech', 'abstract'].map(cat => (
                  <button
                    key={cat}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium capitalize hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {environmentTemplates.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvironment(env.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedEnvironment === env.id
                      ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{env.name}</div>
                  <div className="text-xs text-slate-500">{env.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSocial = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Social Media Templates" icon={Share2} gradient="from-pink-600 to-rose-600" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {socialFormats.map(format => {
            const Icon = format.icon;
            const isVertical = format.height > format.width;
            const aspectRatio = format.width / format.height;
            return (
              <button
                key={format.id}
                className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="mx-auto mb-3 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center overflow-hidden"
                  style={{
                    width: isVertical ? '48px' : '80px',
                    height: isVertical ? '80px' : `${80 / aspectRatio}px`
                  }}
                >
                  <Icon size={20} className="text-pink-600 dark:text-pink-400" />
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
        <SectionHeader title="Apparel & Merchandise" icon={Shirt} gradient="from-teal-600 to-cyan-600" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center" style={{ perspective: '1200px' }}>
              {selectedApparel ? (
                <div
                  className="relative transition-transform duration-500"
                  style={{
                    transform: 'rotateX(5deg) rotateY(-10deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div
                    className="w-72 h-80 rounded-lg shadow-2xl flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: selectedApparelColor }}
                  >
                    {designImage && (
                      <img
                        src={designImage}
                        alt="Design"
                        className="w-32 h-32 object-contain"
                        style={{ mixBlendMode: selectedApparelColor === 'white' ? 'multiply' : 'screen' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <Shirt size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select an apparel item</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Design Image</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload Design</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'design')}
                  className="hidden"
                />
              </label>
            </div>

            {selectedApparel && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {apparelItems.find(a => a.id === selectedApparel)?.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedApparelColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedApparelColor === color ? 'ring-2 ring-teal-500 ring-offset-2' : 'border-slate-300'
                      }`}
                      style={{
                        backgroundColor: color === 'natural' ? '#f5f5dc' :
                                        color === 'steel' ? '#71717a' :
                                        color === 'clear' ? 'transparent' : color,
                        backgroundImage: color === 'clear' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : undefined,
                        backgroundSize: color === 'clear' ? '8px 8px' : undefined,
                        backgroundPosition: color === 'clear' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-2">
              {apparelItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedApparel(item.id);
                      setSelectedApparelColor(item.colors[0]);
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                      selectedApparel === item.id
                        ? 'bg-teal-100 dark:bg-teal-900/30 ring-2 ring-teal-500'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Icon size={20} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{item.name}</div>
                      <div className="flex gap-1 mt-1">
                        {item.colors.slice(0, 4).map(c => (
                          <div
                            key={c}
                            className="w-3 h-3 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: c === 'natural' ? '#f5f5dc' :
                                              c === 'steel' ? '#71717a' :
                                              c === 'clear' ? '#f0f0f0' : c
                            }}
                          />
                        ))}
                        {item.colors.length > 4 && (
                          <span className="text-xs text-slate-400">+{item.colors.length - 4}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScenes = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="3D Scene Builder" icon={Layers} gradient="from-violet-600 to-purple-600" />

        <div className="grid lg:grid-cols-4 gap-6">
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
                  <Layers size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a scene template</p>
                </div>
              )}
            </div>

            <div className="mt-4">
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

          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Scene Templates</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sceneTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setCurrentScene(template);
                    addClip('scene', { sceneId: template.id, name: template.name });
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    currentScene?.id === template.id
                      ? 'bg-violet-100 dark:bg-violet-900/30 ring-2 ring-violet-500'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-50">{template.name}</div>
                  <div className="text-xs text-slate-500">{template.width}x{template.height} - {template.duration}s</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVideo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Video Editor" icon={Video} gradient="from-green-600 to-emerald-600" />

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
                  <p>Add clips to get started</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Add Elements</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigateToSection('devices')}
                className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors flex items-center gap-3"
              >
                <Smartphone size={20} className="text-blue-500" />
                <span className="text-sm font-medium">Device Mockup</span>
              </button>
              <button
                onClick={() => navigateToSection('logo')}
                className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left transition-colors flex items-center gap-3"
              >
                <Sparkles size={20} className="text-amber-500" />
                <span className="text-sm font-medium">Logo Animation</span>
              </button>
              <button
                onClick={() => navigateToSection('text')}
                className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-left transition-colors flex items-center gap-3"
              >
                <Type size={20} className="text-rose-500" />
                <span className="text-sm font-medium">Text Animation</span>
              </button>
              <button
                onClick={() => navigateToSection('scenes')}
                className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left transition-colors flex items-center gap-3"
              >
                <Layers size={20} className="text-violet-500" />
                <span className="text-sm font-medium">Scene Template</span>
              </button>
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

  const renderLogo = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Logo Animation" icon={Sparkles} gradient="from-rose-600 to-pink-600" />

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
              <button
                onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={togglePlay}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-medium rounded-xl flex items-center gap-2"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Preview'}
              </button>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all"
                  style={{ width: `${(currentTime / (logoSettings.delay + logoSettings.duration + 1)) * 100}%` }}
                />
              </div>
              <span className="text-sm text-slate-500 font-mono">{currentTime.toFixed(2)}s</span>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo Image</label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-medium">Upload Logo</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Or Text Logo</label>
              <input
                type="text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm"
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
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm"
              >
                <optgroup label="Fade & Reveal">
                  <option value="fade-in">Fade In</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="zoom-out">Zoom Out</option>
                  <option value="slide-up">Slide Up</option>
                </optgroup>
                <optgroup label="3D Effects">
                  <option value="flip-x">Flip X</option>
                  <option value="flip-y">Flip Y</option>
                  <option value="rotate-in">Rotate In</option>
                  <option value="3d-flip">3D Flip</option>
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
                className="w-full accent-rose-500"
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
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderText = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <SectionHeader title="Text Animation" icon={Type} gradient="from-sky-600 to-blue-600" />

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
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={togglePlay}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium rounded-xl flex items-center gap-2"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause' : 'Preview'}
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Text</label>
              <textarea
                value={animatedText}
                onChange={(e) => setAnimatedText(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm resize-none"
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
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm"
              >
                <optgroup label="Simple">
                  <option value="fade-in">Fade In</option>
                  <option value="fade-in-up">Fade In Up</option>
                  <option value="zoom-in">Zoom In</option>
                </optgroup>
                <optgroup label="Character-by-Character">
                  <option value="typewriter">Typewriter</option>
                  <option value="letter-by-letter">Letter by Letter</option>
                  <option value="wave">Wave</option>
                </optgroup>
                <optgroup label="Dynamic">
                  <option value="kinetic-pop">Kinetic Pop</option>
                  <option value="elastic-bounce">Elastic Bounce</option>
                  <option value="flip-in">Flip In</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font</label>
              <select
                value={textSettings.fontFamily}
                onChange={(e) => setTextSettings({ ...textSettings, fontFamily: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value}>{font.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Size</label>
                <input
                  type="number"
                  min="12"
                  max="200"
                  value={textSettings.fontSize}
                  onChange={(e) => setTextSettings({ ...textSettings, fontSize: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Weight</label>
                <select
                  value={textSettings.fontWeight}
                  onChange={(e) => setTextSettings({ ...textSettings, fontWeight: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm"
                >
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
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
          </div>
        </div>
      </div>
    </div>
  );

  const renderSlideshow = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6 min-h-[600px]">
        <SectionHeader title="Slideshow Maker" icon={ImageIcon} gradient="from-indigo-600 to-violet-600" />

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

  const renderContent = () => {
    switch (section) {
      case 'home': return renderHome();
      case 'devices': return renderDevices();
      case 'intros': return renderIntros();
      case 'products': return renderProducts();
      case 'scenes': return renderScenes();
      case 'video': return renderVideo();
      case 'logo': return renderLogo();
      case 'text': return renderText();
      case 'slideshow': return renderSlideshow();
      case 'social': return renderSocial();
      case 'apparel': return renderApparel();
      case 'environments': return renderEnvironments();
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
}
