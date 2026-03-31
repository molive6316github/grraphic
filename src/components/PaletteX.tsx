import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Copy, Heart, Upload, Wand2, Trash2, Check, Shuffle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

// Color utility functions
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
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

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
  h /= 360; s /= 100; l /= 100;
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
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const getContrastColor = (hex: string) => {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export function PaletteX({ userId }: PaletteXProps) {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'my' | 'public'>('my');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [generatorMode, setGeneratorMode] = useState<'color' | 'image'>('color');
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [likedPalettes, setLikedPalettes] = useState<Set<string>>(new Set());
  const [generatedColors, setGeneratedColors] = useState<ColorInfo[]>([]);
  const [paletteName, setPaletteName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPalettes = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

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
  }, [userId, view]);

  const loadLikes = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) return;
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
  }, [userId]);

  useEffect(() => {
    loadPalettes();
    if (userId) loadLikes();
  }, [loadPalettes, loadLikes, userId]);

  const generateHarmoniousPalette = (hex: string): ColorInfo[] => {
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const harmonies = [
      { h: hsl.h, s: hsl.s, l: hsl.l, name: 'Base' },
      { h: (hsl.h + 30) % 360, s: Math.min(hsl.s + 10, 100), l: Math.min(hsl.l + 15, 90), name: 'Analogous Light' },
      { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l, name: 'Complementary' },
      { h: (hsl.h + 150) % 360, s: Math.max(hsl.s - 10, 20), l: Math.max(hsl.l - 10, 15), name: 'Split Comp' },
      { h: hsl.h, s: Math.max(hsl.s - 30, 10), l: Math.min(hsl.l + 25, 95), name: 'Tint' },
      { h: hsl.h, s: Math.min(hsl.s + 15, 100), l: Math.max(hsl.l - 25, 10), name: 'Shade' }
    ];

    return harmonies.map(v => {
      const newRgb = hslToRgb(v.h, v.s, v.l);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      return { hex: newHex, rgb: newRgb, hsl: { h: v.h, s: v.s, l: v.l }, name: v.name };
    });
  };

  const extractColorsFromImage = async (file: File): Promise<ColorInfo[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0, size, size);

        const imageData = ctx?.getImageData(0, 0, size, size);
        if (!imageData) {
          resolve([]);
          return;
        }

        // Quantize colors using a simple algorithm
        const colorBuckets: Map<string, { count: number; r: number; g: number; b: number }> = new Map();
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = Math.round(imageData.data[i] / 32) * 32;
          const g = Math.round(imageData.data[i + 1] / 32) * 32;
          const b = Math.round(imageData.data[i + 2] / 32) * 32;
          const key = `${r},${g},${b}`;
          
          const existing = colorBuckets.get(key);
          if (existing) {
            existing.count++;
            existing.r = (existing.r + imageData.data[i]) / 2;
            existing.g = (existing.g + imageData.data[i + 1]) / 2;
            existing.b = (existing.b + imageData.data[i + 2]) / 2;
          } else {
            colorBuckets.set(key, { count: 1, r: imageData.data[i], g: imageData.data[i + 1], b: imageData.data[i + 2] });
          }
        }

        const sortedColors = Array.from(colorBuckets.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map(({ r, g, b }) => {
            const hex = rgbToHex(Math.round(r), Math.round(g), Math.round(b));
            const rgb = { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            return { hex, rgb, hsl };
          });

        resolve(sortedColors);
      };

      img.onerror = () => resolve([]);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleGeneratePalette = async () => {
    if (generatorMode === 'color') {
      const colors = generateHarmoniousPalette(baseColor);
      setGeneratedColors(colors);
    } else if (imageFile) {
      const colors = await extractColorsFromImage(imageFile);
      setGeneratedColors(colors);
    }
  };

  const handleRandomize = () => {
    const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setBaseColor(randomHex);
    const colors = generateHarmoniousPalette(randomHex);
    setGeneratedColors(colors);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const colors = await extractColorsFromImage(file);
      setGeneratedColors(colors);
    }
  };

  const savePalette = async () => {
    if (!userId || generatedColors.length === 0 || !paletteName.trim()) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('color_palettes')
        .insert([{
          user_id: userId,
          name: paletteName.trim(),
          colors: generatedColors,
          is_public: false,
          tags: [],
          likes_count: 0
        }]);

      if (error) throw error;
      
      setPaletteName('');
      setGeneratedColors([]);
      setImageFile(null);
      setImagePreview(null);
      await loadPalettes();
    } catch (error) {
      console.error('Error saving palette:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleLike = async (paletteId: string) => {
    if (!userId || !isSupabaseConfigured()) return;

    const isLiked = likedPalettes.has(paletteId);
    
    // Optimistic update
    setLikedPalettes(prev => {
      const newSet = new Set(prev);
      if (isLiked) newSet.delete(paletteId);
      else newSet.add(paletteId);
      return newSet;
    });

    try {
      if (isLiked) {
        await supabase.from('palette_likes').delete()
          .eq('user_id', userId).eq('palette_id', paletteId);
      } else {
        await supabase.from('palette_likes')
          .insert([{ user_id: userId, palette_id: paletteId }]);
      }
      await loadPalettes();
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert optimistic update
      setLikedPalettes(prev => {
        const newSet = new Set(prev);
        if (isLiked) newSet.add(paletteId);
        else newSet.delete(paletteId);
        return newSet;
      });
    }
  };

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const deletePalette = async (paletteId: string) => {
    if (!confirm('Delete this palette?')) return;

    try {
      const { error } = await supabase.from('color_palettes').delete().eq('id', paletteId);
      if (error) throw error;
      await loadPalettes();
    } catch (error) {
      console.error('Error deleting palette:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Palette className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">PaletteX</h1>
            <p className="text-gray-400 text-sm">Create beautiful color harmonies</p>
          </div>
        </div>

        {userId && (
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setView('my')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'my' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              My Palettes
            </button>
            <button
              onClick={() => setView('public')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === 'public' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Explore
            </button>
          </div>
        )}
      </div>

      {/* Generator */}
      {userId && view === 'my' && (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-6">Create Palette</h3>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setGeneratorMode('color')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                generatorMode === 'color' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              From Color
            </button>
            <button
              onClick={() => setGeneratorMode('image')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                generatorMode === 'image' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Upload className="w-4 h-4" />
              From Image
            </button>
          </div>

          {generatorMode === 'color' ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div 
                  className="w-16 h-16 rounded-xl border-2 border-white/20 cursor-pointer overflow-hidden relative group"
                  style={{ backgroundColor: baseColor }}
                >
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: getContrastColor(baseColor) }}>
                      Pick
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="#6366f1"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleGeneratePalette}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Generate
                    </button>
                    <button
                      onClick={handleRandomize}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  imagePreview ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 hover:border-white/40'
                }`}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Click to upload an image</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Generated Colors Preview */}
          {generatedColors.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex rounded-xl overflow-hidden h-20">
                {generatedColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex-1 relative group cursor-pointer transition-all hover:flex-[1.5]"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => copyColor(color.hex)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                      {copiedColor === color.hex ? (
                        <Check className="w-5 h-5" style={{ color: getContrastColor(color.hex) }} />
                      ) : (
                        <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: getContrastColor(color.hex) }}>
                          {color.hex}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  placeholder="Palette name..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={savePalette}
                  disabled={!paletteName.trim() || saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Palettes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : palettes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10">
          <Palette className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {view === 'my' ? 'No palettes yet' : 'No public palettes'}
          </h3>
          <p className="text-gray-400 text-sm">
            {view === 'my' ? 'Create your first color palette above' : 'Check back later for shared palettes'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {palettes.map((palette) => (
            <div 
              key={palette.id} 
              className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{palette.name}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(palette.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {userId && (
                    <button
                      onClick={() => toggleLike(palette.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        likedPalettes.has(palette.id)
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-gray-400 hover:text-red-400 hover:bg-white/5'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedPalettes.has(palette.id) ? 'fill-current' : ''}`} />
                    </button>
                  )}
                  {palette.user_id === userId && (
                    <button
                      onClick={() => deletePalette(palette.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex rounded-xl overflow-hidden h-16 mb-3">
                {palette.colors.slice(0, 6).map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyColor(color.hex)}
                    className="flex-1 relative cursor-pointer group/color hover:flex-[1.5] transition-all"
                    style={{ backgroundColor: color.hex }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/color:bg-black/20 transition-all">
                      {copiedColor === color.hex ? (
                        <Check className="w-4 h-4" style={{ color: getContrastColor(color.hex) }} />
                      ) : (
                        <Copy className="w-3 h-3 opacity-0 group-hover/color:opacity-100 transition-opacity" style={{ color: getContrastColor(color.hex) }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{palette.colors.length} colors</span>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{palette.likes_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
