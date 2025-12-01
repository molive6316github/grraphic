import React from 'react';
import {
  Move, Square, Circle, Type, Image as ImageIcon, Layers, Copy, Trash2,
  Lock, Unlock, Eye, EyeOff, FlipHorizontal, FlipVertical,
  RotateCw, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Bold, Italic, Underline, Maximize, Minimize,
  ChevronUp, ChevronDown, Droplet, Palette
} from 'lucide-react';
import type { DesignElement } from '../types';

interface PropertiesPanelProps {
  selectedElement: DesignElement | undefined;
  elements: DesignElement[];
  onUpdate: (updates: Partial<DesignElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  elements,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveLayer,
}) => {
  if (!selectedElement) {
    return (
      <div className="w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-l border-white/20 dark:border-slate-700/50 p-6 overflow-y-auto">
        <div className="text-center text-gray-500 dark:text-gray-400 py-20">
          <Layers className="mx-auto mb-4 opacity-30" size={48} />
          <p className="text-sm">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-l border-white/20 dark:border-slate-700/50 overflow-y-auto shadow-2xl">
      <div className="p-6 space-y-6">

        {/* Header with element type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedElement.type === 'rect' && <Square className="text-blue-500" size={24} />}
            {selectedElement.type === 'circle' && <Circle className="text-emerald-500" size={24} />}
            {selectedElement.type === 'text' && <Type className="text-orange-500" size={24} />}
            {selectedElement.type === 'image' && <ImageIcon className="text-pink-500" size={24} />}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white capitalize">{selectedElement.type}</h3>
              <p className="text-xs text-gray-500">ID: {selectedElement.id.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <Copy size={16} />
            <span className="text-sm font-semibold">Duplicate</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            <Trash2 size={16} />
            <span className="text-sm font-semibold">Delete</span>
          </button>
        </div>

        {/* Position & Size */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Move size={16} className="text-purple-600" />
            <span>Transform</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">X Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdate({ x: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Y Position</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdate({ y: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Width</label>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Height</label>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Rotation: {selectedElement.rotation || 0}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={selectedElement.rotation || 0}
              onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
              className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Palette size={16} className="text-blue-600" />
            <span>Appearance</span>
          </h4>

          {/* Fill Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Fill Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => onUpdate({ fill: e.target.value })}
                className="w-16 h-10 rounded-lg cursor-pointer border-2 border-white dark:border-slate-700 shadow-md"
              />
              <input
                type="text"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => onUpdate({ fill: e.target.value })}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Stroke for shapes */}
          {(selectedElement.type === 'rect' || selectedElement.type === 'circle') && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Stroke Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.stroke || '#000000'}
                    onChange={(e) => onUpdate({ stroke: e.target.value })}
                    className="w-16 h-10 rounded-lg cursor-pointer border-2 border-white dark:border-slate-700 shadow-md"
                  />
                  <input
                    type="text"
                    value={selectedElement.stroke || '#000000'}
                    onChange={(e) => onUpdate({ stroke: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Stroke Width: {selectedElement.strokeWidth || 0}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={selectedElement.strokeWidth || 0}
                  onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
                  className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Opacity */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Opacity: {Math.round((selectedElement.opacity || 1) * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedElement.opacity || 1}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
              className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Border Radius for rect */}
          {selectedElement.type === 'rect' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Border Radius: {selectedElement.borderRadius || 0}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedElement.borderRadius || 0}
                onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
                className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <div className="space-y-3 p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
              <Type size={16} className="text-orange-600" />
              <span>Typography</span>
            </h4>

            {/* Text Content */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Text Content</label>
              <textarea
                value={selectedElement.text || ''}
                onChange={(e) => onUpdate({ text: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:outline-none"
                rows={3}
              />
            </div>

            {/* Font Family */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Arial'}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Palatino">Palatino</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Font Size: {selectedElement.fontSize || 24}px
              </label>
              <input
                type="range"
                min="8"
                max="200"
                value={selectedElement.fontSize || 24}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Font Style Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdate({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.fontWeight === 'bold' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <Bold size={20} className="mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.fontStyle === 'italic' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <Italic size={20} className="mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.textDecoration === 'underline' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <Underline size={20} className="mx-auto" />
              </button>
            </div>

            {/* Text Alignment */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => onUpdate({ textAlign: 'left' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.textAlign === 'left' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <AlignLeft size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'center' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.textAlign === 'center' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <AlignCenter size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'right' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.textAlign === 'right' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <AlignRight size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => onUpdate({ textAlign: 'justify' })}
                className={`p-3 rounded-xl transition-all ${selectedElement.textAlign === 'justify' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700'}`}
              >
                <AlignJustify size={18} className="mx-auto" />
              </button>
            </div>

            {/* Letter Spacing */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Letter Spacing: {selectedElement.letterSpacing || 0}px
              </label>
              <input
                type="range"
                min="-5"
                max="20"
                value={selectedElement.letterSpacing || 0}
                onChange={(e) => onUpdate({ letterSpacing: Number(e.target.value) })}
                className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Line Height: {(selectedElement.lineHeight || 1.2).toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={selectedElement.lineHeight || 1.2}
                onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })}
                className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Text Transform */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Text Transform</label>
              <select
                value={selectedElement.textTransform || 'none'}
                onChange={(e) => onUpdate({ textTransform: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
          </div>
        )}

        {/* Layer Controls */}
        <div className="space-y-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl">
          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Layers size={16} className="text-emerald-600" />
            <span>Layers</span>
          </h4>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onMoveLayer('top')}
              className="p-3 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-xl transition-all hover:scale-105"
              title="Bring to Front"
            >
              <Maximize size={18} className="mx-auto" />
            </button>
            <button
              onClick={() => onMoveLayer('up')}
              className="p-3 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-xl transition-all hover:scale-105"
              title="Bring Forward"
            >
              <ChevronUp size={18} className="mx-auto" />
            </button>
            <button
              onClick={() => onMoveLayer('down')}
              className="p-3 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-xl transition-all hover:scale-105"
              title="Send Backward"
            >
              <ChevronDown size={18} className="mx-auto" />
            </button>
            <button
              onClick={() => onMoveLayer('bottom')}
              className="p-3 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 rounded-xl transition-all hover:scale-105"
              title="Send to Back"
            >
              <Minimize size={18} className="mx-auto" />
            </button>
          </div>
        </div>

        {/* Element Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
          <p>Layer: {elements.findIndex(el => el.id === selectedElement.id) + 1} of {elements.length}</p>
          <p>Type: {selectedElement.type}</p>
          <p>Position: ({Math.round(selectedElement.x)}, {Math.round(selectedElement.y)})</p>
          <p>Size: {Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}</p>
        </div>

      </div>
    </div>
  );
};
