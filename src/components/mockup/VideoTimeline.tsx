import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2, Copy, Scissors, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TimelineClip {
  id: string;
  type: 'scene' | 'text' | 'image' | 'video' | 'audio' | 'logo';
  startTime: number;
  duration: number;
  layer: number;
  data: any;
}

interface VideoTimelineProps {
  clips: TimelineClip[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onClipSelect: (clip: TimelineClip | null) => void;
  onClipUpdate: (clip: TimelineClip) => void;
  onClipDelete: (clipId: string) => void;
  onClipDuplicate: (clip: TimelineClip) => void;
  selectedClipId: string | null;
}

export function VideoTimeline({
  clips,
  duration,
  currentTime,
  isPlaying,
  onTimeChange,
  onPlayPause,
  onClipSelect,
  onClipUpdate,
  onClipDelete,
  onClipDuplicate,
  selectedClipId
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [resizingClip, setResizingClip] = useState<{ id: string; edge: 'start' | 'end' } | null>(null);

  const pixelsPerSecond = 60 * zoom;
  const timelineWidth = duration * pixelsPerSecond;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || draggingClip || resizingClip) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const newTime = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    onTimeChange(newTime);
  };

  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip, edge?: 'start' | 'end') => {
    e.stopPropagation();
    onClipSelect(clip);

    if (edge) {
      setResizingClip({ id: clip.id, edge });
    } else {
      setDraggingClip(clip.id);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const time = x / pixelsPerSecond;

      if (draggingClip) {
        const clip = clips.find(c => c.id === draggingClip);
        if (clip) {
          const newStart = Math.max(0, Math.min(duration - clip.duration, time - clip.duration / 2));
          onClipUpdate({ ...clip, startTime: newStart });
        }
      }

      if (resizingClip) {
        const clip = clips.find(c => c.id === resizingClip.id);
        if (clip) {
          if (resizingClip.edge === 'start') {
            const newStart = Math.max(0, Math.min(clip.startTime + clip.duration - 0.5, time));
            const newDuration = clip.startTime + clip.duration - newStart;
            onClipUpdate({ ...clip, startTime: newStart, duration: newDuration });
          } else {
            const newDuration = Math.max(0.5, time - clip.startTime);
            onClipUpdate({ ...clip, duration: Math.min(newDuration, duration - clip.startTime) });
          }
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingClip(null);
      setResizingClip(null);
    };

    if (draggingClip || resizingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip, resizingClip, clips, duration, pixelsPerSecond, scrollOffset, onClipUpdate]);

  const layers = [0, 1, 2, 3];
  const clipColors: Record<string, string> = {
    scene: 'bg-blue-500',
    text: 'bg-amber-500',
    image: 'bg-emerald-500',
    video: 'bg-rose-500',
    audio: 'bg-purple-500',
    logo: 'bg-cyan-500'
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTimeChange(0)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          >
            <SkipBack size={18} />
          </button>
          <button
            onClick={onPlayPause}
            className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl transition-colors text-white"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={() => onTimeChange(duration)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
          >
            <SkipForward size={18} />
          </button>
          <div className="ml-4 font-mono text-sm text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedClipId && (
            <>
              <button
                onClick={() => {
                  const clip = clips.find(c => c.id === selectedClipId);
                  if (clip) onClipDuplicate(clip);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
                title="Duplicate"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => onClipDelete(selectedClipId)}
                className="p-2 hover:bg-red-600 rounded-lg transition-colors text-slate-300"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          className="h-6 bg-slate-800 border-b border-slate-700 relative overflow-hidden"
          style={{ width: '100%' }}
        >
          <div
            className="absolute h-full"
            style={{ width: timelineWidth, transform: `translateX(-${scrollOffset}px)` }}
          >
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex flex-col items-center"
                style={{ left: i * pixelsPerSecond }}
              >
                <div className="w-px h-2 bg-slate-600"></div>
                <span className="text-[10px] text-slate-500 mt-0.5">{i}s</span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={timelineRef}
          className="relative overflow-x-auto"
          style={{ height: layers.length * 48 + 16 }}
          onClick={handleTimelineClick}
          onScroll={(e) => setScrollOffset(e.currentTarget.scrollLeft)}
        >
          <div
            className="relative"
            style={{ width: Math.max(timelineWidth, 800), height: '100%' }}
          >
            {layers.map((layer) => (
              <div
                key={layer}
                className="absolute left-0 right-0 h-12 border-b border-slate-800"
                style={{ top: layer * 48 + 8 }}
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-medium">
                  L{layer + 1}
                </div>
              </div>
            ))}

            {clips.map((clip) => (
              <div
                key={clip.id}
                className={`absolute h-10 rounded-lg cursor-move transition-all ${clipColors[clip.type]} ${
                  selectedClipId === clip.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                }`}
                style={{
                  left: clip.startTime * pixelsPerSecond,
                  width: clip.duration * pixelsPerSecond,
                  top: clip.layer * 48 + 12
                }}
                onMouseDown={(e) => handleClipMouseDown(e, clip)}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l-lg"
                  onMouseDown={(e) => handleClipMouseDown(e, clip, 'start')}
                />
                <div className="px-3 py-2 truncate text-white text-xs font-medium">
                  {clip.data?.name || clip.type}
                </div>
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r-lg"
                  onMouseDown={(e) => handleClipMouseDown(e, clip, 'end')}
                />
              </div>
            ))}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: currentTime * pixelsPerSecond }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
