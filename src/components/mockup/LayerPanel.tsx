import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronDown, ChevronRight, Image as ImageIcon, Type, Film, Sparkles, Box } from 'lucide-react';
import { SceneElement } from './SceneBuilder';

export interface Layer extends SceneElement {
  name: string;
  visible: boolean;
  locked: boolean;
  children?: Layer[];
  collapsed?: boolean;
  blendMode?: BlendMode;
  effects?: LayerEffect[];
}

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface LayerEffect {
  type: 'shadow' | 'glow' | 'blur' | 'outline';
  enabled: boolean;
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
  intensity?: number;
}

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (layer: Layer) => void;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layer: Layer) => void;
  onLayerReorder: (layerId: string, newIndex: number) => void;
  onLayerGroup: (layerIds: string[]) => void;
}

export function LayerPanel({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onLayerGroup
}: LayerPanelProps) {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'text': return Type;
      case 'video': return Film;
      case 'logo': return Sparkles;
      case 'shape': return Box;
      default: return Layers;
    }
  };

  const renderLayer = (layer: Layer, index: number, depth: number = 0) => {
    const Icon = getLayerIcon(layer.type);
    const isSelected = selectedLayerId === layer.id;
    const hasChildren = layer.children && layer.children.length > 0;

    return (
      <div key={layer.id}>
        <div
          className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
            isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'
          } ${draggedLayer === layer.id ? 'opacity-50' : ''}`}
          style={{ paddingLeft: `${depth * 1 + 0.5}rem` }}
          onClick={() => onLayerSelect(layer)}
          draggable={!layer.locked}
          onDragStart={() => setDraggedLayer(layer.id)}
          onDragEnd={() => setDraggedLayer(null)}
          onDragOver={(e) => {
            e.preventDefault();
            setHoveredLayer(layer.id);
          }}
          onDragLeave={() => setHoveredLayer(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedLayer && draggedLayer !== layer.id) {
              onLayerReorder(draggedLayer, index);
            }
            setHoveredLayer(null);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerUpdate(layer.id, { collapsed: !layer.collapsed });
              }}
              className="p-0.5 hover:bg-slate-600 rounded"
            >
              {layer.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />

          <span className="flex-1 text-sm truncate font-medium">{layer.name}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerUpdate(layer.id, { visible: !layer.visible });
              }}
              className="p-1 hover:bg-slate-600 rounded"
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerUpdate(layer.id, { locked: !layer.locked });
              }}
              className="p-1 hover:bg-slate-600 rounded"
            >
              {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerDuplicate(layer);
              }}
              className="p-1 hover:bg-slate-600 rounded"
            >
              <Copy size={14} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerDelete(layer.id);
              }}
              className="p-1 hover:bg-red-600 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {layer.locked && <Lock size={12} className={isSelected ? 'text-white' : 'text-slate-500'} />}
            {!layer.visible && <EyeOff size={12} className={isSelected ? 'text-white' : 'text-slate-500'} />}
            <span className="text-xs opacity-50">{Math.round(layer.opacity * 100)}%</span>
          </div>
        </div>

        {hasChildren && !layer.collapsed && (
          <div className="ml-4">
            {layer.children!.map((child, childIndex) =>
              renderLayer(child, childIndex, depth + 1)
            )}
          </div>
        )}

        {hoveredLayer === layer.id && draggedLayer && draggedLayer !== layer.id && (
          <div className="h-0.5 bg-blue-500 -mt-1" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-slate-400" />
          <h3 className="font-semibold text-white">Layers</h3>
          <span className="text-xs text-slate-500">({layers.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Layers size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No layers yet</p>
            <p className="text-xs text-slate-600">Add elements to create layers</p>
          </div>
        ) : (
          layers.map((layer, index) => renderLayer(layer, index))
        )}
      </div>

      {selectedLayerId && (() => {
        const selectedLayer = layers.find(l => l.id === selectedLayerId);
        if (!selectedLayer) return null;

        return (
          <div className="border-t border-slate-700 p-4 space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedLayer.opacity * 100}
                onChange={(e) => onLayerUpdate(selectedLayer.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Blend Mode</label>
              <select
                value={selectedLayer.blendMode || 'normal'}
                onChange={(e) => onLayerUpdate(selectedLayer.id, { blendMode: e.target.value as BlendMode })}
                className="w-full px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg border border-slate-600"
              >
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="darken">Darken</option>
                <option value="lighten">Lighten</option>
                <option value="color-dodge">Color Dodge</option>
                <option value="color-burn">Color Burn</option>
                <option value="hard-light">Hard Light</option>
                <option value="soft-light">Soft Light</option>
                <option value="difference">Difference</option>
                <option value="exclusion">Exclusion</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onLayerUpdate(selectedLayer.id, { visible: !selectedLayer.visible })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLayer.visible ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500'
                }`}
              >
                <Eye size={14} className="inline mr-1" />
                Visible
              </button>
              <button
                onClick={() => onLayerUpdate(selectedLayer.id, { locked: !selectedLayer.locked })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedLayer.locked ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'
                }`}
              >
                {selectedLayer.locked ? <Lock size={14} className="inline mr-1" /> : <Unlock size={14} className="inline mr-1" />}
                {selectedLayer.locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
