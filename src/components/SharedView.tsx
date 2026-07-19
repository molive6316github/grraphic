import { useState, useEffect } from 'react';
import { Loader2, Download, Sparkles, FileImage, Palette as PaletteIcon, Folder, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SharedViewProps {
  token: string;
  onGoHome: () => void;
}

type SharedPayload = {
  success: boolean;
  error?: string;
  resource_type?: 'analysis' | 'boxt_design' | 'palette' | 'asset' | 'mockup' | 'project';
  resource?: any;
};

export function SharedView({ token, onGoHome }: SharedViewProps) {
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_shared_resource', { p_token: token }).then(({ data, error }) => {
      setPayload(error ? { success: false, error: error.message } : (data as SharedPayload));
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  if (!payload?.success || !payload.resource) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
        <AlertTriangle size={32} className="mx-auto mb-4 text-amber-400" />
        <h2 className="font-display text-xl font-semibold text-white mb-2">Link unavailable</h2>
        <p className="text-gray-400 mb-6">{payload?.error || 'This share link is invalid, expired, or was revoked.'}</p>
        <button
          onClick={onGoHome}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-500/25"
        >
          Go to Grraphic
        </button>
      </div>
    );
  }

  const { resource_type, resource } = payload;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <LinkIcon size={14} />
        <span>Shared via Grraphic</span>
      </div>

      {resource_type === 'asset' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          {resource.asset_type === 'image' && resource.file_url && (
            <div className="bg-black/40 flex items-center justify-center p-6">
              <img src={resource.file_url} alt={resource.name} className="max-h-[60vh] rounded-lg" />
            </div>
          )}
          <div className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileImage size={20} className="text-violet-300 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-display text-lg font-semibold text-white truncate">{resource.name}</h1>
                <p className="text-xs text-gray-500 font-mono">
                  {resource.file_format?.toUpperCase()} · {resource.file_size ? `${Math.round(resource.file_size / 1024)} KB` : 'unknown size'}
                </p>
              </div>
            </div>
            <a
              href={resource.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <Download size={15} />
              Download
            </a>
          </div>
        </div>
      )}

      {resource_type === 'palette' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-5">
            <PaletteIcon size={20} className="text-violet-300" />
            <h1 className="font-display text-lg font-semibold text-white">{resource.name}</h1>
          </div>
          <div className="flex rounded-xl overflow-hidden h-32">
            {(Array.isArray(resource.colors) ? resource.colors : []).map((c: any, i: number) => {
              const hex = typeof c === 'string' ? c : c?.hex;
              return (
                <div key={i} className="flex-1 relative group" style={{ backgroundColor: hex }}>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {hex}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resource_type === 'boxt_design' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          {resource.thumbnail && (
            <div className="bg-black/40 flex items-center justify-center p-6">
              <img src={resource.thumbnail} alt={resource.title} className="max-h-[60vh] rounded-lg" />
            </div>
          )}
          <div className="p-6">
            <h1 className="font-display text-lg font-semibold text-white">{resource.title}</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">{resource.width} × {resource.height}px · made in Boxt</p>
          </div>
        </div>
      )}

      {resource_type === 'mockup' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          {(resource.rendered_url || resource.preview_url || resource.design_url) && (
            <div className="bg-black/40 flex items-center justify-center p-6">
              <img
                src={resource.rendered_url || resource.preview_url || resource.design_url}
                alt={resource.title || 'Mockup'}
                className="max-h-[60vh] rounded-lg"
              />
            </div>
          )}
          <div className="p-6">
            <h1 className="font-display text-lg font-semibold text-white">{resource.title || 'Mockup'}</h1>
            <p className="text-xs text-gray-500 font-mono mt-1">{resource.mockup_type}</p>
          </div>
        </div>
      )}

      {resource_type === 'analysis' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
          {resource.image_url && (
            <div className="bg-black/40 flex items-center justify-center p-6">
              <img src={resource.image_url} alt={resource.file_name} className="max-h-[50vh] rounded-lg" />
            </div>
          )}
          <div className="p-6">
            <h1 className="font-display text-lg font-semibold text-white mb-4">{resource.file_name}</h1>
            {resource.analysis_data && typeof resource.analysis_data === 'object' && resource.analysis_data.categories && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(resource.analysis_data.categories as Record<string, any>).map(([name, cat]) => (
                  <div key={name} className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                    <div className="text-xs text-gray-400 capitalize mb-1">{name.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="font-mono text-xl font-semibold text-white">{cat?.score ?? '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {resource_type === 'project' && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
          <div className="flex items-center gap-3 mb-2">
            <Folder size={20} style={{ color: resource.color || '#8b5cf6' }} />
            <h1 className="font-display text-lg font-semibold text-white">{resource.name}</h1>
          </div>
          {resource.description && <p className="text-gray-400 mb-5">{resource.description}</p>}
          <div className="space-y-2">
            {(resource.items || []).map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                <span className="font-mono text-[10px] tracking-wide uppercase text-violet-300/80 w-20 flex-shrink-0">{item.item_type.replace('_', ' ')}</span>
                <span className="text-sm text-gray-200 truncate">{item.title || 'Untitled'}</span>
              </div>
            ))}
            {(!resource.items || resource.items.length === 0) && (
              <p className="text-sm text-gray-500">This project has no items yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Sparkles size={14} className="text-violet-400" />
          Made with Grraphic — try it yourself
        </button>
      </div>
    </div>
  );
}
