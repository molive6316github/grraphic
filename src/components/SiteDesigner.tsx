import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Code, Eye, Download, Copy, RefreshCw, Sparkles, Globe, Layout, Monitor, 
  Wand2, ChevronLeft, Play, Maximize2, Minimize2,
  FileCode, FileJson, FileText, Plus, Trash2, Check, X,
  Terminal, Smartphone, Tablet, PanelLeftClose, PanelLeft,
  Loader2, ChevronDown, ChevronRight, User, FolderOpen, File
} from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { useSubscription } from '../hooks/useSubscription';

interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: ProjectFile[];
}

interface SiteDesignerProps {
  userId?: string;
  onBack?: () => void;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  html: FileCode,
    css: FileText,
  js: FileCode,
  ts: FileCode,
  json: FileJson,
  md: FileText,
  py: FileCode,
  jsx: FileCode,
  tsx: FileCode,
};

const LANG_COLORS: Record<string, string> = {
  html: '#e34c26',
  css: '#264de4',
  js: '#f7df1e',
  ts: '#3178c6',
  json: '#292929',
  py: '#3776ab',
  jsx: '#61dafb',
  tsx: '#3178c6',
};

const quickPrompts = [
  { icon: Globe, text: "Create a modern SaaS landing page with hero, features, pricing", color: "from-blue-500 to-cyan-500" },
  { icon: Layout, text: "Build a portfolio website with projects and contact form", color: "from-purple-500 to-pink-500" },
  { icon: Monitor, text: "Design an admin dashboard with sidebar and charts", color: "from-green-500 to-teal-500" },
  { icon: Wand2, text: "Create a React todo app with local storage", color: "from-orange-500 to-red-500" },
  { icon: User, text: "Build my public profile page - modern and minimal", color: "from-indigo-500 to-purple-500" }
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
    <title>My Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to Site Designer</h1>
        <p>Describe what you want to build in the chat panel.</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
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
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f1f5f9;
}

.container {
    text-align: center;
    padding: 2rem;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

p {
    color: #94a3b8;
    font-size: 1.1rem;
}`
  },
  {
    id: '3',
    name: 'script.js',
    language: 'js',
    content: `// Your JavaScript code here
console.log('Site Designer loaded!');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Ready to build something amazing!');
});`
  }
];

export function SiteDesigner({ userId, onBack }: SiteDesignerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [showChat, setShowChat] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { subscription } = useSubscription(userId);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build preview HTML
  const buildPreview = useCallback(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js') && !f.name.endsWith('.json'));

    if (!htmlFile) return '<html><body style="background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui"><h1>No HTML file</h1></body></html>';

    let html = htmlFile.content;

    // Inject CSS
    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    // Console capture script
    const consoleScript = `<script>
      (function() {
        const send = (level, args) => window.parent.postMessage({type:'console',level,args:args.map(String)},'*');
        ['log','error','warn','info'].forEach(m => {
          const orig = console[m];
          console[m] = (...a) => { send(m, a); orig.apply(console, a); };
        });
        window.onerror = (m,u,l) => send('error', ['Error: '+m+' (line '+l+')']);
      })();
    </script>`;

    if (jsFile) {
      html = html.replace('</body>', `${consoleScript}<script>${jsFile.content}</script></body>`);
    } else {
      html = html.replace('</body>', `${consoleScript}</body>`);
    }

    return html;
  }, [files]);

  // Update preview
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(buildPreview());
        doc.close();
      }
    }
  }, [files, buildPreview]);

  // Listen for console messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        const prefix = e.data.level === 'error' ? '[ERR]' : e.data.level === 'warn' ? '[WARN]' : '[LOG]';
        setConsoleOutput(prev => [...prev.slice(-100), `${prefix} ${e.data.args.join(' ')}`]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const getFileExt = (name: string) => name.split('.').pop()?.toLowerCase() || 'txt';

  const createFile = () => {
    if (!newFileName.trim()) return;
    const ext = getFileExt(newFileName);
    setFiles(prev => [...prev, {
      id: Date.now().toString(),
      name: newFileName.trim(),
      language: ext,
      content: ''
    }]);
    setIsCreatingFile(false);
    setNewFileName('');
  };

  const deleteFile = (id: string) => {
    if (files.length <= 1) return;
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(files.find(f => f.id !== id)?.id || '');
    }
  };

  const updateFile = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
  };

  const parseFilesFromResponse = (text: string): ProjectFile[] => {
    const parsed: ProjectFile[] = [];
    
    // Try multiple patterns
    // Pattern 1: [FILE: name.ext] followed by code block
    const pattern1 = /\[FILE:\s*([^\]]+)\]\s*```[\w]*\n([\s\S]*?)```/gi;
    // Pattern 2: **filename.ext** or `filename.ext` followed by code block
    const pattern2 = /(?:\*\*|`)([a-zA-Z0-9_.-]+\.[a-zA-Z]+)(?:\*\*|`)\s*```[\w]*\n([\s\S]*?)```/gi;
    // Pattern 3: Just code blocks with language hints
    const pattern3 = /```(html|css|javascript|js|typescript|ts|python|py|json|jsx|tsx)\n([\s\S]*?)```/gi;

    let match;
    
    // Try pattern 1 first
    while ((match = pattern1.exec(text)) !== null) {
      parsed.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: match[1].trim(),
        language: getFileExt(match[1].trim()),
        content: match[2].trim()
      });
    }

    // If no matches, try pattern 2
    if (parsed.length === 0) {
      while ((match = pattern2.exec(text)) !== null) {
        parsed.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: match[1].trim(),
          language: getFileExt(match[1].trim()),
          content: match[2].trim()
        });
      }
    }

    // If still no matches, try pattern 3 and use language for filename
    if (parsed.length === 0) {
      const langToFile: Record<string, string> = {
        html: 'index.html',
        css: 'styles.css',
        javascript: 'script.js',
        js: 'script.js',
        typescript: 'main.ts',
        ts: 'main.ts',
        python: 'main.py',
        py: 'main.py',
        json: 'data.json',
        jsx: 'App.jsx',
        tsx: 'App.tsx'
      };

      while ((match = pattern3.exec(text)) !== null) {
        const lang = match[1].toLowerCase();
        const filename = langToFile[lang] || `file.${lang}`;
        // Avoid duplicates
        const existingIndex = parsed.findIndex(p => p.name === filename);
        if (existingIndex >= 0) {
          parsed[existingIndex].content = match[2].trim();
        } else {
          parsed.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: filename,
            language: getFileExt(filename),
            content: match[2].trim()
          });
        }
      }
    }

    return parsed;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const filesContext = files.map(f => `[${f.name}]\n${f.content}`).join('\n\n');

      const systemPrompt = `You are an expert full-stack developer AI. You create complete, production-ready code.

CURRENT PROJECT FILES:
${filesContext}

IMPORTANT RESPONSE FORMAT:
When generating or modifying code, format EACH file like this:

[FILE: filename.ext]
\`\`\`language
complete code here
\`\`\`

For example:
[FILE: index.html]
\`\`\`html
<!DOCTYPE html>
<html>...</html>
\`\`\`

[FILE: styles.css]
\`\`\`css
body { ... }
\`\`\`

RULES:
1. ALWAYS use [FILE: name] format before code blocks
2. Generate COMPLETE file contents, not snippets
3. Create beautiful, modern designs
4. Make everything responsive
5. Use proper semantics and accessibility
6. When modifying existing files, include the FULL updated content
7. Explain what you created briefly before the code

For portfolios/profiles: Use dark themes, gradients, smooth animations, hero sections, project grids.`;

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
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Parse files from response
      const parsedFiles = parseFilesFromResponse(content);
      
      if (parsedFiles.length > 0) {
        // Update or add files
        setFiles(prev => {
          const updated = [...prev];
          parsedFiles.forEach(pf => {
            const existingIdx = updated.findIndex(f => f.name === pf.name);
            if (existingIdx >= 0) {
              updated[existingIdx] = { ...updated[existingIdx], content: pf.content };
            } else {
              updated.push(pf);
            }
          });
          return updated;
        });
        setActiveFileId(parsedFiles[0].id);
      }

      // Clean content for chat display
      const cleanContent = content
        .replace(/\[FILE:[^\]]+\]\s*```[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim() || `Created ${parsedFiles.length} file(s)`;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        files: parsedFiles
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyAllCode = () => {
    const allCode = files.map(f => `// ${f.name}\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(allCode);
  };

  const downloadProject = () => {
    const zip = files.map(f => `<!-- ${f.name} -->\n${f.content}`).join('\n\n---\n\n');
    const blob = new Blob([zip], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-files.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-[#111118] border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <Code size={16} />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Site Designer</h1>
              <p className="text-[10px] text-gray-500">Powered by Gradi AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded ${viewMode === mode ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                {mode === 'desktop' ? <Monitor size={14} /> : mode === 'tablet' ? <Tablet size={14} /> : <Smartphone size={14} />}
              </button>
            ))}
          </div>
          
          <button onClick={() => setShowConsole(!showConsole)} className={`p-2 rounded-lg ${showConsole ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <Terminal size={16} />
          </button>
          <button onClick={copyAllCode} className="p-2 hover:bg-white/5 rounded-lg"><Copy size={16} /></button>
          <button onClick={downloadProject} className="p-2 hover:bg-white/5 rounded-lg"><Download size={16} /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-white/5 rounded-lg">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        {showChat && !isFullscreen && (
          <div className="w-80 bg-[#111118] border-r border-white/10 flex flex-col flex-shrink-0">
            {/* Chat Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-medium">Chat</span>
              <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/10 rounded">
                <PanelLeftClose size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Quick prompts:</p>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(prompt.text)}
                      className="w-full p-2 text-left text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <prompt.icon size={14} className="text-gray-400" />
                      <span className="text-gray-300">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-2.5 rounded-lg text-sm ${
                    msg.role === 'user' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-white/5 text-gray-200'
                  }`}>
                    {msg.content}
                    {msg.files && msg.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.files.map(f => (
                          <span key={f.id} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs">Generating...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what to build..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-teal-500"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg self-end"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Chat */}
        {!showChat && !isFullscreen && (
          <button onClick={() => setShowChat(true)} className="absolute left-2 top-20 p-2 bg-[#111118] border border-white/10 rounded-lg z-10">
            <PanelLeft size={16} />
          </button>
        )}

        {/* File Tree */}
        {showFiles && !isFullscreen && (
          <div className="w-48 bg-[#0d0d12] border-r border-white/10 flex flex-col flex-shrink-0">
            <div className="p-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">FILES</span>
              <button onClick={() => setIsCreatingFile(true)} className="p-1 hover:bg-white/10 rounded">
                <Plus size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              {isCreatingFile && (
                <div className="flex items-center gap-1 p-1">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createFile()}
                    placeholder="filename.ext"
                    className="flex-1 bg-white/5 px-2 py-1 rounded text-xs focus:outline-none"
                    autoFocus
                  />
                  <button onClick={createFile} className="p-1 hover:bg-white/10 rounded"><Check size={12} /></button>
                  <button onClick={() => { setIsCreatingFile(false); setNewFileName(''); }} className="p-1 hover:bg-white/10 rounded"><X size={12} /></button>
                </div>
              )}
              
              {files.map(file => {
                const Icon = FILE_ICONS[file.language] || File;
                const color = LANG_COLORS[file.language] || '#888';
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${
                      activeFileId === file.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <Icon size={14} style={{ color }} />
                    <span className="flex-1 text-xs truncate">{file.name}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor & Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            {!isFullscreen && activeFile && (
              <div className="flex-1 flex flex-col border-r border-white/10">
                {/* File Tabs */}
                <div className="h-9 bg-[#0d0d12] border-b border-white/10 flex items-center px-2 overflow-x-auto">
                  {files.filter(f => f.id === activeFileId || files.indexOf(f) < 5).map(file => (
                    <button
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t ${
                        activeFileId === file.id 
                          ? 'bg-[#111118] text-white border-t border-x border-white/10' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span style={{ color: LANG_COLORS[file.language] || '#888' }}>●</span>
                      {file.name}
                    </button>
                  ))}
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                  <textarea
                    value={activeFile.content}
                    onChange={(e) => updateFile(activeFile.id, e.target.value)}
                    className="w-full h-full bg-[#0d0d12] p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className={`${isFullscreen ? 'flex-1' : 'w-1/2'} bg-white flex flex-col`}>
              <div className="h-9 bg-[#1a1a22] border-b border-white/10 flex items-center justify-between px-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-gray-500">Preview</span>
                <button onClick={() => {
                  if (iframeRef.current) {
                    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                    if (doc) { doc.open(); doc.write(buildPreview()); doc.close(); }
                  }
                }} className="p-1 hover:bg-white/10 rounded">
                  <RefreshCw size={12} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
                <div style={{ width: viewportWidths[viewMode], height: '100%', maxWidth: '100%' }} className="bg-white shadow-2xl rounded-lg overflow-hidden">
                  <iframe
                    ref={iframeRef}
                    title="Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Console */}
          {showConsole && (
            <div className="h-32 bg-[#0d0d12] border-t border-white/10 flex flex-col">
              <div className="h-7 px-3 flex items-center justify-between border-b border-white/10">
                <span className="text-xs text-gray-400">Console</span>
                <button onClick={() => setConsoleOutput([])} className="text-xs text-gray-500 hover:text-white">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
                {consoleOutput.map((line, i) => (
                  <div key={i} className={line.includes('[ERR]') ? 'text-red-400' : line.includes('[WARN]') ? 'text-yellow-400' : 'text-gray-300'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
