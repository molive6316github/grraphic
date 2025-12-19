import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image, MoveUp, MoveDown, Clock, Play, Pause } from 'lucide-react';

export interface SlideConfig {
  id: string;
  imageUrl: string;
  duration: number;
  transition: SlideTransition;
  textOverlay?: {
    text: string;
    position: 'top' | 'center' | 'bottom';
    fontSize: number;
    color: string;
    backgroundColor?: string;
  };
  filter?: 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'vintage' | 'warm' | 'cool';
  zoom?: 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'ken-burns';
}

export type SlideTransition =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'rotate'
  | 'flip'
  | 'blur'
  | 'wipe-left'
  | 'wipe-right'
  | 'dissolve'
  | 'crossfade';

interface SlideshowMakerProps {
  slides: SlideConfig[];
  onSlidesChange: (slides: SlideConfig[]) => void;
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  width?: number;
  height?: number;
}

export function SlideshowMaker({
  slides,
  onSlidesChange,
  currentTime,
  isPlaying,
  onPlayPause,
  width = 1920,
  height = 1080
}: SlideshowMakerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const totalDuration = slides.reduce((sum, slide) => sum + slide.duration, 0);

  const getCurrentSlide = () => {
    let elapsed = 0;
    for (let i = 0; i < slides.length; i++) {
      if (currentTime >= elapsed && currentTime < elapsed + slides[i].duration) {
        return { slide: slides[i], index: i, startTime: elapsed };
      }
      elapsed += slides[i].duration;
    }
    return slides.length > 0 ? { slide: slides[slides.length - 1], index: slides.length - 1, startTime: elapsed - slides[slides.length - 1].duration } : null;
  };

  const current = getCurrentSlide();

  const addSlide = (imageUrl: string) => {
    const newSlide: SlideConfig = {
      id: `slide-${Date.now()}`,
      imageUrl,
      duration: 3,
      transition: 'fade',
      zoom: 'none',
      filter: 'none'
    };
    onSlidesChange([...slides, newSlide]);
  };

  const removeSlide = (id: string) => {
    onSlidesChange(slides.filter(s => s.id !== id));
  };

  const updateSlide = (id: string, updates: Partial<SlideConfig>) => {
    onSlidesChange(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const index = slides.findIndex(s => s.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    onSlidesChange(newSlides);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      addSlide(url);
    });
  };

  const getFilterStyle = (filter: SlideConfig['filter']): React.CSSProperties => {
    switch (filter) {
      case 'grayscale': return { filter: 'grayscale(100%)' };
      case 'sepia': return { filter: 'sepia(100%)' };
      case 'blur': return { filter: 'blur(3px)' };
      case 'brightness': return { filter: 'brightness(1.2)' };
      case 'contrast': return { filter: 'contrast(1.3)' };
      case 'vintage': return { filter: 'sepia(50%) contrast(1.1) brightness(0.9)' };
      case 'warm': return { filter: 'sepia(30%) saturate(1.2)' };
      case 'cool': return { filter: 'saturate(0.8) hue-rotate(180deg) saturate(1.2) hue-rotate(-180deg) brightness(1.1)' };
      default: return {};
    }
  };

  const getZoomStyle = (zoom: SlideConfig['zoom'], progress: number): React.CSSProperties => {
    const scale = 1 + progress * 0.15;
    switch (zoom) {
      case 'zoom-in': return { transform: `scale(${scale})` };
      case 'zoom-out': return { transform: `scale(${2 - scale + 0.15})` };
      case 'pan-left': return { transform: `translateX(${-progress * 10}%) scale(1.1)` };
      case 'pan-right': return { transform: `translateX(${progress * 10}%) scale(1.1)` };
      case 'ken-burns': return { transform: `scale(${scale}) translate(${progress * 5}%, ${progress * 3}%)` };
      default: return {};
    }
  };

  const selectedSlide = slides.find(s => s.id === selectedSlideId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex gap-4 p-4">
        <div className="w-64 bg-slate-800 rounded-xl p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Slides ({slides.length})</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={18} className="text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedSlideId === slide.id ? 'ring-2 ring-blue-500' : ''
                } ${current?.slide.id === slide.id ? 'ring-2 ring-green-500' : ''}`}
              >
                <img
                  src={slide.imageUrl}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-20 object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-between p-2">
                  <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">
                    {index + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, 'up'); }}
                      className="p-1 bg-white/20 hover:bg-white/40 rounded transition-colors"
                      disabled={index === 0}
                    >
                      <MoveUp size={12} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSlide(slide.id, 'down'); }}
                      className="p-1 bg-white/20 hover:bg-white/40 rounded transition-colors"
                      disabled={index === slides.length - 1}
                    >
                      <MoveDown size={12} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSlide(slide.id); }}
                      className="p-1 bg-red-500/50 hover:bg-red-500 rounded transition-colors"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
                  <Clock size={10} />
                  {slide.duration}s
                </div>
              </div>
            ))}

            {slides.length === 0 && (
              <div className="text-center py-8">
                <Image size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-400">Add images to create slideshow</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
            {current ? (
              <div
                className="relative overflow-hidden bg-black"
                style={{ width: width * 0.4, height: height * 0.4 }}
              >
                <img
                  src={current.slide.imageUrl}
                  alt="Current slide"
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{
                    ...getFilterStyle(current.slide.filter),
                    ...getZoomStyle(current.slide.zoom, (currentTime - current.startTime) / current.slide.duration)
                  }}
                />
                {current.slide.textOverlay && (
                  <div
                    className={`absolute left-0 right-0 p-4 text-center ${
                      current.slide.textOverlay.position === 'top' ? 'top-0' :
                      current.slide.textOverlay.position === 'bottom' ? 'bottom-0' : 'top-1/2 -translate-y-1/2'
                    }`}
                    style={{
                      fontSize: current.slide.textOverlay.fontSize * 0.4,
                      color: current.slide.textOverlay.color,
                      backgroundColor: current.slide.textOverlay.backgroundColor
                    }}
                  >
                    {current.slide.textOverlay.text}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-center">
                <Image size={64} className="mx-auto mb-4 opacity-50" />
                <p>No slides yet</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 p-4 bg-slate-800 rounded-xl">
            <button
              onClick={onPlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
            </button>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-sm text-slate-400 font-mono">
              {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
            </span>
          </div>
        </div>

        {selectedSlide && (
          <div className="w-72 bg-slate-800 rounded-xl p-4 overflow-y-auto">
            <h3 className="font-semibold text-white mb-4">Slide Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={selectedSlide.duration}
                  onChange={(e) => updateSlide(selectedSlide.id, { duration: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Transition</label>
                <select
                  value={selectedSlide.transition}
                  onChange={(e) => updateSlide(selectedSlide.id, { transition: e.target.value as SlideTransition })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="dissolve">Dissolve</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="slide-right">Slide Right</option>
                  <option value="slide-up">Slide Up</option>
                  <option value="slide-down">Slide Down</option>
                  <option value="zoom">Zoom</option>
                  <option value="rotate">Rotate</option>
                  <option value="flip">Flip</option>
                  <option value="blur">Blur</option>
                  <option value="wipe-left">Wipe Left</option>
                  <option value="wipe-right">Wipe Right</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Motion Effect</label>
                <select
                  value={selectedSlide.zoom || 'none'}
                  onChange={(e) => updateSlide(selectedSlide.id, { zoom: e.target.value as SlideConfig['zoom'] })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="zoom-in">Zoom In</option>
                  <option value="zoom-out">Zoom Out</option>
                  <option value="pan-left">Pan Left</option>
                  <option value="pan-right">Pan Right</option>
                  <option value="ken-burns">Ken Burns</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Filter</label>
                <select
                  value={selectedSlide.filter || 'none'}
                  onChange={(e) => updateSlide(selectedSlide.id, { filter: e.target.value as SlideConfig['filter'] })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Sepia</option>
                  <option value="vintage">Vintage</option>
                  <option value="warm">Warm</option>
                  <option value="cool">Cool</option>
                  <option value="brightness">Bright</option>
                  <option value="contrast">High Contrast</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                  <input
                    type="checkbox"
                    checked={!!selectedSlide.textOverlay}
                    onChange={(e) => updateSlide(selectedSlide.id, {
                      textOverlay: e.target.checked ? {
                        text: 'Your Text Here',
                        position: 'bottom',
                        fontSize: 48,
                        color: '#ffffff',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                      } : undefined
                    })}
                    className="w-4 h-4 rounded"
                  />
                  Text Overlay
                </label>

                {selectedSlide.textOverlay && (
                  <div className="space-y-2 pl-6">
                    <input
                      type="text"
                      value={selectedSlide.textOverlay.text}
                      onChange={(e) => updateSlide(selectedSlide.id, {
                        textOverlay: { ...selectedSlide.textOverlay!, text: e.target.value }
                      })}
                      placeholder="Enter text..."
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
                    />
                    <select
                      value={selectedSlide.textOverlay.position}
                      onChange={(e) => updateSlide(selectedSlide.id, {
                        textOverlay: { ...selectedSlide.textOverlay!, position: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 text-sm"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
