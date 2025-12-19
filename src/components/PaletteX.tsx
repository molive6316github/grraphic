import React, { useState, useEffect } from 'react';
import { Palette, Plus, Copy, Heart, Download, Upload, Wand2, Eye, EyeOff, Trash2, Check, RefreshCw, Share2, Tag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  name?: string;
}

interface ColorPalette {
  id: string;
  name: string;
  colors: ColorInfo[];
  source_image_url?: string;
  is_public: boolean;
  likes_count: number;
  tags: string[];
  created_at: string;
  user_id: string;
}

interface PaletteXProps {
  userId?: string;
}

export function PaletteX({ userId }: PaletteXProps) {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'my' | 'public'>('my');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [editingPalette, setEditingPalette] = useState<ColorPalette | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [generatorMode, setGeneratorMode] = useState<'manual' | 'ai' | 'image'>('manual');
  const [baseColor, setBaseColor] = useState('#0ea5e9');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPalettes();
    if (userId) loadLikes();
  }, [userId, view]);

  const loadPalettes = async () => {
    try {
      setLoading(true);
      let query = supabase.from('color_palettes').select('*');

      if (view === 'my' && userId) {
        query = query.eq('user_id', userId);
      } else if (view === 'public') {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPalettes(data || []);
    } catch (error) {
      console.error('Error loading palettes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikes = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('palette_likes')
        .select('palette_id')
        .eq('user_id', userId);

      if (error) throw error;
      setLikedPalettes(new Set(data.map(l => l.palette_id)));
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const generateComplementaryColors = (hex: string): ColorInfo[] => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const colors: ColorInfo[] = [
      { hex, rgb, hsl, name: 'Base' }
    ];

    const variations = [
      { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l, name: 'Complementary' },
      { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l, name: 'Triadic 1' },
      { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l, name: 'Triadic 2' },
      { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 20, 100), name: 'Lighter' },
      { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 20, 0), name: 'Darker' }
    ];

    variations.forEach(v => {
      const rgb = hslToRgb(v.h, v.s, v.l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      colors.push({ hex, rgb, hsl: v, name: v.name });
    });

    return colors;
  };

  const extractColorsFromImage = async (file: File): Promise<ColorInfo[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve([]);
          return;
        }

        const colorMap = new Map<string, number>();
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const hex = rgbToHex(r, g, b);
          colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
        }

        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([hex]) => {
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            return { hex, rgb, hsl };
          });

        resolve(sortedColors);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const createPalette = async (colors: ColorInfo[], name: string, sourceImage?: string) => {
    if (!userId) {
      alert('Please sign in to save palettes');
      return;
    }

    try {
      const { error } = await supabase
        .from('color_palettes')
        .insert([{
          user_id: userId,
          name,
          colors,
          source_image_url: sourceImage,
          is_public: false,
          tags: []
        }]);

      if (error) throw error;
      await loadPalettes();
      setGeneratorMode('manual');
      setImageFile(null);
    } catch (error) {
      console.error('Error creating palette:', error);
      alert('Failed to create palette');
    }
  };

  const toggleLike = async (paletteId: string) => {
    if (!userId) return;

    try {
      if (likedPalettes.has(paletteId)) {
        await supabase
          .from('palette_likes')
          .delete()
          .eq('user_id', userId)
          .eq('palette_id', paletteId);

        await supabase.rpc('decrement', {
          row_id: paletteId,
          table_name: 'color_palettes',
          column_name: 'likes_count'
        });

        setLikedPalettes(prev => {
          const newSet = new Set(prev);
          newSet.delete(paletteId);
          return newSet;
        });
      } else {
        await supabase
          .from('palette_likes')
          .insert([{ user_id: userId, palette_id: paletteId }]);

        await supabase
          .from('color_palettes')
          .update({ likes_count: palettes.find(p => p.id === paletteId)!.likes_count + 1 })
          .eq('id', paletteId);

        setLikedPalettes(prev => new Set(prev).add(paletteId));
      }

      await loadPalettes();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const deletePalette = async (paletteId: string) => {
    if (!confirm('Delete this palette?')) return;

    try {
      const { error } = await supabase
        .from('color_palettes')
        .delete()
        .eq('id', paletteId);

      if (error) throw error;
      await loadPalettes();
    } catch (error) {
      console.error('Error deleting palette:', error);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const handleGeneratePalette = async () => {
    if (generatorMode === 'manual') {
      const colors = generateComplementaryColors(baseColor);
      const name = prompt('Name your palette:', 'Color Harmony');
      if (name) await createPalette(colors, name);
    } else if (generatorMode === 'image' && imageFile) {
      const colors = await extractColorsFromImage(imageFile);
      const name = prompt('Name your palette:', imageFile.name);
      if (name) await createPalette(colors, name);
    }
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
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-soft">
              <Palette size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">PaletteX</h1>
              <p className="text-slate-600 dark:text-slate-400">Generate and manage color palettes</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('my')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                view === 'my'
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              My Palettes
            </button>
            <button
              onClick={() => setView('public')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                view === 'public'
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Explore
            </button>
          </div>
        </div>

        {userId && view === 'my' && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Generate New Palette</h3>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setGeneratorMode('manual')}
                className={`flex-1 p-4 rounded-xl font-medium transition-all ${
                  generatorMode === 'manual'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Wand2 size={20} className="mx-auto mb-2" />
                From Color
              </button>
              <button
                onClick={() => setGeneratorMode('image')}
                className={`flex-1 p-4 rounded-xl font-medium transition-all ${
                  generatorMode === 'image'
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload size={20} className="mx-auto mb-2" />
                From Image
              </button>
            </div>

            {generatorMode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Pick a base color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="w-20 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGeneratePalette}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all shadow-soft"
                >
                  Generate Palette
                </button>
              </div>
            )}

            {generatorMode === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload an image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                {imageFile && (
                  <button
                    onClick={handleGeneratePalette}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all shadow-soft"
                  >
                    Extract Colors
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {palettes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Palette size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            {view === 'my' ? 'No palettes yet' : 'No public palettes'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {view === 'my' ? 'Create your first color palette!' : 'Check back later for shared palettes'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {palettes.map((palette) => (
            <div key={palette.id} className="glass-card p-5 card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{palette.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {new Date(palette.created_at).toLocaleDateString()}
                  </p>
                </div>
                {userId && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleLike(palette.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        likedPalettes.has(palette.id)
                          ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                          : 'text-slate-400 hover:text-red-500'
                      }`}
                    >
                      <Heart size={16} className={likedPalettes.has(palette.id) ? 'fill-current' : ''} />
                    </button>
                    {palette.user_id === userId && (
                      <button
                        onClick={() => deletePalette(palette.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {palette.colors.slice(0, 6).map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyColor(color.hex)}
                    className="relative h-16 rounded-lg cursor-pointer group/color hover:scale-105 transition-transform shadow-soft"
                    style={{ backgroundColor: color.hex }}
                    title={`Click to copy ${color.hex}`}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover/color:bg-black/20 rounded-lg flex items-center justify-center transition-all">
                      {copiedColor === color.hex ? (
                        <Check size={16} className="text-white" />
                      ) : (
                        <Copy size={16} className="text-white opacity-0 group-hover/color:opacity-100" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {palette.colors.length} colors
                </span>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Heart size={14} />
                  <span>{palette.likes_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
