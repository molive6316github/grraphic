import { useEffect, useRef, useState } from 'react';
import {
  Palette, Package, ArrowUpRight
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
  path: string;
}

const TOOLS: Tool[] = [
  { id: 'palettex', name: 'PaletteX', tagline: 'Generate and save color palettes from any image', icon: <Palette size={22} />, accent: '#f472b6', path: '/palettex' },
  { id: 'assets', name: 'AssetVault', tagline: 'Cloud file storage with folders, favorites, and sharing', icon: <Package size={22} />, accent: '#34d399', path: '/assets' },
];

interface ToolShowcaseProps {
  onNavigate: (path: string) => void;
}

export function ToolShowcase({ onNavigate }: ToolShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-20">
      <div className={`text-center mb-10 ${visible ? 'reveal reveal-1' : 'opacity-0'}`}>
        <div className="font-mono text-[11px] tracking-widest text-violet-300/80 uppercase mb-3">The whole studio</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-balance">
          More in your design studio
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto text-balance">
          Grade a design, pull a palette, and keep your work close — without leaving Grraphic.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.id}
            onClick={() => onNavigate(tool.path)}
            className={`tool-card group relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-left overflow-hidden ${visible ? 'reveal' : 'opacity-0'}`}
            style={{ animationDelay: `${0.08 + i * 0.07}s`, '--tool-accent': tool.accent } as React.CSSProperties}
          >
            <div className="tool-card-glow" aria-hidden="true" />
            <div className="relative">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                style={{ backgroundColor: `${tool.accent}1f`, color: tool.accent }}
              >
                {tool.icon}
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="font-display font-semibold text-white text-base truncate">{tool.name}</h3>
                <ArrowUpRight size={14} className="text-gray-600 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" style={{ color: tool.accent }} />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.tagline}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
