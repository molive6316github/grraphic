import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Code, Eye, Download, Copy, RefreshCw, Sparkles, Globe, Layout, Monitor, 
  Wand2, ChevronLeft, ChevronRight, Play, Maximize2, Minimize2, FolderTree,
  FileCode, FileJson, FileCss, FileText, Plus, Trash2, Edit3, Check, X,
  Terminal, Smartphone, Tablet, PanelLeftClose, PanelLeft, Save, Share2,
  Loader2, ChevronDown, ChevronRight as ChevronRightIcon, User, ExternalLink
} from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';

interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: 'html' | 'css' | 'javascript' | 'typescript' | 'json' | 'markdown' | 'python' | 'jsx' | 'tsx';
  isOpen?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SiteDesignerProps {
  userId?: string;
  onBack?: () => void;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  html: FileCode,
  css: FileCss,
  javascript: FileCode,
  typescript: FileCode,
  json: FileJson,
  markdown: FileText,
  python: FileCode,
  jsx: FileCode,
  tsx: FileCode,
};

const LANGUAGE_COLORS: Record<string, string> = {
  html: 'text-orange-400',
  css: 'text-blue-400',
  javascript: 'text-yellow-400',
  typescript: 'text-blue-500',
  json: 'text-green-400',
  markdown: 'text-gray-400',
  python: 'text-green-500',
  jsx: 'text-cyan-400',
  tsx: 'text-cyan-500',
};

const quickPrompts = [
  { icon: Globe, text: "Create a modern SaaS landing page with hero, features, pricing, and footer", color: "from-blue-500 to-cyan-500" },
  { icon: Layout, text: "Build a portfolio website with projects grid, about section, and contact form", color: "from-purple-500 to-pink-500" },
  { icon: Monitor, text: "Design an admin dashboard with sidebar, charts, and data tables", color: "from-green-500 to-teal-500" },
  { icon: Wand2, text: "Generate a React component library with buttons, cards, and modals", color: "from-orange-500 to-red-500" },
  { icon: User, text: "Create my public profile page - clean, minimal, showcasing my work", color: "from-indigo-500 to-purple-500" }
];

const DEFAULT_FILES: ProjectFile[] = [
  {
    id: '1',
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <h1>Welcome to Site Designer</h1>
    <p>Start by describing what you want to build in the chat.</p>
    <script src="script.js"></script>
</body>
</html>`,
    isOpen: true
  },
  {
    id: '2',
    name: 'styles.css',
    language: 'css',
    content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    text-align: center;
    padding: 2rem;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

p {
    font-size: 1.25rem;
    opacity: 0.9;
}`,
    isOpen: false
  },
  {
    id: '3',
    name: 'script.js',
    language: 'javascript',
    content: `// Your JavaScript code here
console.log('Site Designer loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
});`,
    isOpen: false
  }
];

export function SiteDesigner({ userId, onBack }: SiteDesignerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [showChat, setShowChat] = useState(true);
  const [showFileTree, setShowFileTree] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { subscription } = useSubscription(userId);

  const isPro = subscription?.status === 'active';
  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build combined HTML for preview
  const buildPreviewHtml = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js') && !f.name.endsWith('.json'));

    if (!htmlFile) return '<html><body><h1>No HTML file found</h1></body></html>';

    let html = htmlFile.content;

    // Inject CSS
    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Inject JS with console capture
    const consoleCapture = `
      <script>
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        console.log = (...args) => {
          window.parent.postMessage({ type: 'console', level: 'log', args: args.map(a => String(a)) }, '*');
          originalLog.apply(console, args);
        };
        console.error = (...args) => {
          window.parent.postMessage({ type: 'console', level: 'error', args: args.map(a => String(a)) }, '*');
          originalError.apply(console, args);
        };
        console.warn = (...args) => {
          window.parent.postMessage({ type: 'console', level: 'warn', args: args.map(a => String(a)) }, '*');
          originalWarn.apply(console, args);
        };
        window.onerror = (msg, url, line) => {
          window.parent.postMessage({ type: 'console', level: 'error', args: ['Error: ' + msg + ' (line ' + line + ')'] }, '*');
        };
      </script>
    `;

    if (jsFile) {
      html = html.replace('</body>', `${consoleCapture}<script>${jsFile.content}</script></body>`);
    } else {
      html = html.replace('</body>', `${consoleCapture}</body>`);
    }

    return html;
  };

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        const { level, args } = event.data;
        const prefix = level === 'error' ? '[ERROR]' : level === 'warn' ? '[WARN]' : '[LOG]';
        setConsoleOutput(prev => [...prev.slice(-50), `${prefix} ${args.join(' ')}`]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update preview when files change
  useEffect(() => {
    if (iframeRef.current) {
      const html = buildPreviewHtml();
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [files, previewKey]);

  const getFileLanguage = (filename: string): ProjectFile['language'] => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, ProjectFile['language']> = {
      'html': 'html', 'htm': 'html',
      'css': 'css', 'scss': 'css', 'sass': 'css',
      'js': 'javascript', 'mjs': 'javascript',
      'ts': 'typescript',
      'json': 'json',
      'md': 'markdown', 'mdx': 'markdown',
      'py': 'python',
      'jsx': 'jsx',
      'tsx': 'tsx'
    };
    return langMap[ext || ''] || 'javascript';
  };

  const createFile = () => {
    if (!newFileName.trim()) return;
    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      language: getFileLanguage(newFileName.trim()),
      content: '',
      isOpen: true
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter(f => f.id !== id);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
  };

  const renameFile = (id: string) => {
    if (!editingFileName.trim()) return;
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, name: editingFileName.trim(), language: getFileLanguage(editingFileName.trim()) } : f
    ));
    setEditingFileId(null);
    setEditingFileName('');
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('Groq API key not configured');

      // Build context with current files
      const filesContext = files.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n');

      const systemPrompt = `You are Site Designer, an expert AI developer that creates complete, production-ready code projects.

# CAPABILITIES:
- Generate multi-file web projects (HTML, CSS, JS, React, TypeScript, Python, etc.)
- Create complete applications with proper file structure
- Support any programming language or framework
- Build responsive, accessible, modern designs

# CURRENT PROJECT FILES:
${filesContext}

# RESPONSE FORMAT - CRITICAL:
When generating code, use this EXACT format for EACH file:

[FILE: filename.ext]
\`\`\`language
code here
\`\`\`

Examples:
[FILE: index.html]
\`\`\`html
<!DOCTYPE html>...
\`\`\`

[FILE: styles.css]
\`\`\`css
body { ... }
\`\`\`

[FILE: app.js]
\`\`\`javascript
console.log('Hello');
\`\`\`

# RULES:
1. Always use [FILE: name] format before each code block
2. Generate COMPLETE files, not snippets
3. Create beautiful, modern designs with smooth animations
4. Use proper color contrasts and typography
5. Make everything responsive
6. Add comments explaining complex logic
7. When user asks to modify, update the relevant file(s)
8. If creating a profile page, make it showcase work beautifully with gradients and animations

# PROFILE PAGES:
When creating profile/portfolio pages:
- Use dark theme with gradient accents
- Add smooth hover animations
- Include hero section with name and tagline
- Projects grid with image placeholders
- Skills section with tags
- Contact section
- Social links
- Make it visually stunning

Respond naturally, explain what you're creating, then provide the file(s).`;

      const conversationHistory = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Parse files from response
      const filePattern = /\[FILE:\s*([^\]]+)\]\s*```(\w+)?\n([\s\S]*?)```/g;
      let match;
      const newFiles: ProjectFile[] = [];

      while ((match = filePattern.exec(assistantContent)) !== null) {
        const [, filename, lang, content] = match;
        const trimmedFilename = filename.trim();
        const existingFile = files.find(f => f.name === trimmedFilename);
        
        if (existingFile) {
          // Update existing file
          updateFileContent(existingFile.id, content.trim());
        } else {
          // Create new file
          newFiles.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: trimmedFilename,
            language: getFileLanguage(trimmedFilename),
            content: content.trim(),
            isOpen: true
          });
        }
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        setActiveFileId(newFiles[0].id);
      }

      // Clean response for display (remove code blocks)
      const cleanResponse = assistantContent
        .replace(/\[FILE:[^\]]+\]\s*```[\s\S]*?```/g, '')
        .trim() || 'Files updated successfully!';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanResponse,
        timestamp: new Date()
      }]);

      setPreviewKey(prev => prev + 1);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAllCode = () => {
    const allCode = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(allCode);
  };

  const downloadProject = () => {
    // Create a simple zip-like download (multiple files as text)
    const content = files.map(f => `===== ${f.name} =====\n${f.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'w-full';
    }
  };

  // Fullscreen preview
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 hover:bg-gray-800"
          >
            <Minimize2 size={16} />
            Exit Fullscreen
          </button>
        </div>
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#161b22] border-b border-white/10 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Globe size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Site Designer</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                Powered by <img src={logoImage} alt="" className="w-3 h-3 rounded-full" /> Gradi AI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
            {(['mobile', 'tablet', 'desktop'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded ${viewMode === mode ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                title={mode}
              >
                {mode === 'mobile' ? <Smartphone size={14} /> : mode === 'tablet' ? <Tablet size={14} /> : <Monitor size={14} />}
              </button>
            ))}
          </div>

          <button onClick={copyAllCode} className="p-2 hover:bg-white/10 rounded-lg" title="Copy All">
            <Copy size={16} />
          </button>
          <button onClick={downloadProject} className="p-2 hover:bg-white/10 rounded-lg" title="Download">
            <Download size={16} />
          </button>
          <button onClick={() => setIsFullscreen(true)} className="p-2 hover:bg-white/10 rounded-lg" title="Fullscreen">
            <Maximize2 size={16} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button 
            onClick={() => setShowChat(!showChat)} 
            className={`p-2 rounded-lg ${showChat ? 'bg-teal-500/20 text-teal-400' : 'hover:bg-white/10'}`}
          >
            <Sparkles size={16} />
          </button>
          <button 
            onClick={() => setShowFileTree(!showFileTree)} 
            className={`p-2 rounded-lg ${showFileTree ? 'bg-white/10' : 'hover:bg-white/10'}`}
          >
            {showFileTree ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 flex-shrink-0 flex flex-col bg-[#0d1117] border-r border-white/10">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Wand2 size={24} />
                    </div>
                    <h2 className="font-semibold mb-1">What would you like to build?</h2>
                    <p className="text-xs text-gray-500">Describe your project and I will generate the code</p>
                  </div>
                  <div className="space-y-2">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(prompt.text)}
                        className={`w-full p-2.5 rounded-lg bg-gradient-to-r ${prompt.color} text-white text-left text-xs hover:opacity-90 transition-opacity`}
                      >
                        <div className="flex items-center gap-2">
                          <prompt.icon size={14} />
                          <span className="line-clamp-2">{prompt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white/5 text-gray-200'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-teal-400" />
                    <span className="text-sm text-gray-400">Generating code...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe what to build..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-teal-600 rounded-lg hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-teal-600"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Tree */}
        {showFileTree && (
          <div className="w-48 flex-shrink-0 flex flex-col bg-[#0d1117] border-r border-white/10">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase">Files</span>
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 hover:bg-white/10 rounded"
                title="New File"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {isCreatingFile && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFile()}
                    placeholder="filename.ext"
                    className="flex-1 bg-white/10 rounded px-2 py-1 text-xs focus:outline-none"
                    autoFocus
                  />
                  <button onClick={createFile} className="p-1 hover:bg-white/10 rounded text-green-400">
                    <Check size={12} />
                  </button>
                  <button onClick={() => { setIsCreatingFile(false); setNewFileName(''); }} className="p-1 hover:bg-white/10 rounded text-red-400">
                    <X size={12} />
                  </button>
                </div>
              )}
              {files.map(file => {
                const FileIcon = FILE_ICONS[file.language] || FileCode;
                const colorClass = LANGUAGE_COLORS[file.language] || 'text-gray-400';
                
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
                      activeFileId === file.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <FileIcon size={14} className={colorClass} />
                    {editingFileId === file.id ? (
                      <input
                        type="text"
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && renameFile(file.id)}
                        onBlur={() => renameFile(file.id)}
                        className="flex-1 bg-white/10 rounded px-1 text-xs focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 text-xs truncate">{file.name}</span>
                    )}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id); setEditingFileName(file.name); }}
                        className="p-0.5 hover:bg-white/10 rounded"
                      >
                        <Edit3 size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="p-0.5 hover:bg-white/10 rounded text-red-400"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex items-center bg-[#161b22] border-b border-white/10 overflow-x-auto">
            {files.filter(f => f.isOpen || f.id === activeFileId).map(file => {
              const FileIcon = FILE_ICONS[file.language] || FileCode;
              const colorClass = LANGUAGE_COLORS[file.language] || 'text-gray-400';
              
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-white/5 ${
                    activeFileId === file.id ? 'bg-[#0d1117] text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileIcon size={12} className={colorClass} />
                  {file.name}
                </button>
              );
            })}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {activeFile && (
              <textarea
                value={activeFile.content}
                onChange={(e) => updateFileContent(activeFile.id, e.target.value)}
                className="w-full h-full bg-[#0d1117] text-gray-200 p-4 font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
                style={{ tabSize: 2 }}
              />
            )}
          </div>

          {/* Console */}
          {showConsole && (
            <div className="h-32 border-t border-white/10 bg-[#0d1117]">
              <div className="px-3 py-1 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Console</span>
                <button onClick={() => setConsoleOutput([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
              </div>
              <div className="p-2 overflow-y-auto h-24 font-mono text-xs">
                {consoleOutput.map((line, i) => (
                  <div key={i} className={line.includes('[ERROR]') ? 'text-red-400' : line.includes('[WARN]') ? 'text-yellow-400' : 'text-gray-400'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 flex-shrink-0 flex flex-col bg-gray-100 border-l border-white/10">
            <div className="px-3 py-2 bg-[#161b22] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">Preview</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowConsole(!showConsole)}
                  className={`p-1 rounded hover:bg-white/10 ${showConsole ? 'text-teal-400' : 'text-gray-500'}`}
                  title="Toggle Console"
                >
                  <Terminal size={14} />
                </button>
                <button
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white"
                  title="Refresh"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-start justify-center p-4 overflow-auto">
              <div className={`${getPreviewWidth()} h-full bg-white shadow-2xl rounded-lg overflow-hidden transition-all`}>
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0"
                  title="Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
