import React, { useState, useEffect } from 'react';
import { Copy, Download, RefreshCw, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SiteDesignerWorkspaceProps {
  code: string;
  onClose: () => void;
  onCodeChange: (code: string) => void;
}

export function SiteDesignerWorkspace({ code, onClose, onCodeChange }: SiteDesignerWorkspaceProps) {
  const [currentCode, setCurrentCode] = useState(code);
  const [previewKey, setPreviewKey] = useState(0);
  const [showEditor, setShowEditor] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [codeEditorHeight, setCodeEditorHeight] = useState(50);

  useEffect(() => {
    setCurrentCode(code);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCurrentCode(newCode);
    onCodeChange(newCode);
    setPreviewKey(prev => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(currentCode));
    element.setAttribute('download', 'website.html');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-screen max-h-[90vh] bg-gray-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-emerald-600/20 to-teal-600/20">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Site Designer</h2>
            <span className="px-2 py-1 text-xs font-mono bg-white/10 rounded text-gray-300">Live Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Refresh preview"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={handleCopy}
              title="Copy code"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <Copy size={18} />
              {copiedToClipboard && <span className="text-xs text-green-400 ml-1">Copied!</span>}
            </button>
            <button
              onClick={handleDownload}
              title="Download as HTML"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Editor and Preview Split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Code Editor */}
          {showEditor && (
            <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-300">HTML / CSS / JS</span>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                  title="Hide editor"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
              <textarea
                value={currentCode}
                onChange={handleCodeChange}
                className="flex-1 bg-gray-950 text-gray-100 p-4 font-mono text-sm resize-none focus:outline-none"
                style={{
                  lineHeight: '1.5',
                  tabSize: 2,
                }}
                spellCheck="false"
              />
            </div>
          )}

          {/* Live Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gray-900">
              <span className="text-sm font-semibold text-gray-300">Preview</span>
              {!showEditor && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                  title="Show editor"
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 bg-white overflow-auto">
              <iframe
                key={previewKey}
                srcDoc={currentCode}
                title="Live Preview"
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t border-white/10 bg-gray-950 flex items-center justify-between text-xs text-gray-400">
          <span>{currentCode.length} characters</span>
          <span>Press Ctrl+S to save locally</span>
        </div>
      </div>
    </div>
  );
}
