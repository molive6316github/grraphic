import React, { useState, useRef } from 'react';
import { Download, X, Image as ImageIcon, Film, Zap, Settings, Check } from 'lucide-react';
import { ExportEngine, ExportOptions, ExportProgress } from '../../utils/exportEngine';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  element: HTMLElement | null;
  renderFrame?: (time: number) => Promise<void>;
  duration?: number;
  defaultFilename?: string;
}

const exportPresets = {
  '4k': { width: 3840, height: 2160, label: '4K (3840×2160)' },
  '1080p': { width: 1920, height: 1080, label: 'Full HD (1920×1080)' },
  '720p': { width: 1280, height: 720, label: 'HD (1280×720)' },
  'instagram-post': { width: 1080, height: 1080, label: 'Instagram Post' },
  'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story' },
  'youtube': { width: 1920, height: 1080, label: 'YouTube' },
  'tiktok': { width: 1080, height: 1920, label: 'TikTok' },
  'twitter': { width: 1200, height: 675, label: 'Twitter/X' },
  'custom': { width: 1920, height: 1080, label: 'Custom' }
};

export function ExportDialog({
  isOpen,
  onClose,
  element,
  renderFrame,
  duration = 5,
  defaultFilename = 'mockup'
}: ExportDialogProps) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp' | 'mp4' | 'webm' | 'gif'>('png');
  const [preset, setPreset] = useState<keyof typeof exportPresets>('1080p');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [quality, setQuality] = useState(95);
  const [fps, setFps] = useState(30);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [transparent, setTransparent] = useState(true);
  const [filename, setFilename] = useState(defaultFilename);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const exportEngine = useRef(new ExportEngine());

  if (!isOpen) return null;

  const isVideo = format === 'mp4' || format === 'webm' || format === 'gif';
  const selectedPreset = preset === 'custom'
    ? { width: customWidth, height: customHeight }
    : exportPresets[preset];

  const handleExport = async () => {
    if (!element && !renderFrame) return;

    setExporting(true);
    setProgress({ progress: 0, stage: 'Starting export' });

    try {
      const options: ExportOptions = {
        format,
        quality: quality / 100,
        width: selectedPreset.width,
        height: selectedPreset.height,
        fps,
        backgroundColor,
        transparent
      };

      let blob: Blob;

      if (isVideo && renderFrame) {
        if (format === 'gif') {
          blob = await exportEngine.current.exportGif(
            renderFrame,
            duration,
            options,
            setProgress
          );
        } else {
          blob = await exportEngine.current.exportVideo(
            renderFrame,
            duration,
            options,
            setProgress
          );
        }
      } else if (element) {
        blob = await exportEngine.current.exportImage(
          element,
          options,
          setProgress
        );
      } else {
        throw new Error('No content to export');
      }

      const ext = format === 'jpg' ? 'jpg' : format;
      exportEngine.current.downloadBlob(blob, `${filename}.${ext}`);

      setTimeout(() => {
        setExporting(false);
        setProgress(null);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setExporting(false);
      setProgress(null);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Download size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Export Mockup</h2>
              <p className="text-sm text-slate-400">Choose your export settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">File Name</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={exporting}
              className="w-full px-4 py-2.5 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter filename"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {['png', 'jpg', 'webp', 'mp4', 'webm', 'gif'].map((fmt) => {
                const isVideoFormat = fmt === 'mp4' || fmt === 'webm' || fmt === 'gif';
                const disabled = isVideoFormat && !renderFrame;
                return (
                  <button
                    key={fmt}
                    onClick={() => !disabled && setFormat(fmt as any)}
                    disabled={exporting || disabled}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      format === fmt
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {isVideoFormat && <Film size={16} className="inline mr-1" />}
                    {!isVideoFormat && <ImageIcon size={16} className="inline mr-1" />}
                    {fmt.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Resolution Preset</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(exportPresets).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key as any)}
                  disabled={exporting}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                    preset === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {preset === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Width (px)</label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                  disabled={exporting}
                  min="1"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Height (px)</label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                  disabled={exporting}
                  min="1"
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {!isVideo && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                disabled={exporting}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Lower filesize</span>
                <span>Higher quality</span>
              </div>
            </div>
          )}

          {isVideo && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Frame Rate: {fps} FPS
              </label>
              <input
                type="range"
                min="15"
                max="60"
                step="15"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value))}
                disabled={exporting}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>15 FPS</span>
                <span>30 FPS</span>
                <span>60 FPS</span>
              </div>
            </div>
          )}

          {format !== 'jpg' && !isVideo && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="transparent"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                disabled={exporting}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <label htmlFor="transparent" className="text-sm text-slate-300">
                Transparent background
              </label>
            </div>
          )}

          {!transparent && !isVideo && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  disabled={exporting}
                  className="w-16 h-10 rounded-lg cursor-pointer disabled:opacity-50"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  disabled={exporting}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {exporting && progress && (
            <div className="p-4 bg-slate-700 rounded-xl border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{progress.stage}</span>
                <span className="text-sm font-medium text-blue-400">{progress.progress}%</span>
              </div>
              <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.estimatedTime && progress.estimatedTime > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Estimated time remaining: {Math.ceil(progress.estimatedTime)}s
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-300 mb-1">Export Summary</p>
                <p className="text-xs text-slate-400">
                  {selectedPreset.width} × {selectedPreset.height}px • {format.toUpperCase()} •
                  {isVideo ? ` ${fps} FPS` : ` ${quality}% quality`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !filename.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Exporting...
              </>
            ) : progress?.progress === 100 ? (
              <>
                <Check size={20} />
                Complete!
              </>
            ) : (
              <>
                <Download size={20} />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
