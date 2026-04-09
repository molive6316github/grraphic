import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Code, Eye, Download, Copy, RefreshCw, Sparkles, Globe, Layout, Monitor, 
  Wand2, ChevronLeft, Play, Maximize2, Minimize2,
  FileCode, FileJson, FileText, Plus, Trash2, Check, X,
  Terminal, Smartphone, Tablet, PanelLeftClose, PanelLeft,
  Loader2, ChevronDown, ChevronRight, User, FolderOpen, File,
  Zap, Package, Image, Palette, ShoppingCart, MessageSquare,
  ExternalLink, Settings, History, Save, FolderPlus, Search,
  MoreHorizontal, Rocket, GitBranch, Clock, CheckCircle2
} from 'lucide-react';
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
  isStreaming?: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  files: ProjectFile[];
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
  svg: Image,
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
  svg: '#ffb13b',
};

const TEMPLATES: Template[] = [
  {
    id: 'landing',
    name: 'SaaS Landing Page',
    description: 'Modern landing with hero, features, pricing',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    files: [
      { id: '1', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaaS Landing</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="nav">
        <div class="nav-brand">Brand</div>
        <div class="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <button class="btn btn-primary">Get Started</button>
        </div>
    </nav>
    <header class="hero">
        <h1>Build something amazing</h1>
        <p>The modern platform for creating beautiful websites with AI</p>
        <div class="hero-buttons">
            <button class="btn btn-primary btn-lg">Start Free</button>
            <button class="btn btn-secondary btn-lg">Watch Demo</button>
        </div>
    </header>
    <script src="script.js"></script>
</body>
</html>` },
      { id: '2', name: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.nav-brand { font-size: 1.5rem; font-weight: bold; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.nav-links { display: flex; gap: 2rem; align-items: center; }
.nav-links a { color: #94a3b8; text-decoration: none; }
.nav-links a:hover { color: #fff; }
.btn { padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.btn-primary { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59,130,246,0.3); }
.btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
.btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
.hero { text-align: center; padding: 8rem 2rem; }
.hero h1 { font-size: 4rem; margin-bottom: 1rem; background: linear-gradient(135deg, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero p { font-size: 1.25rem; color: #64748b; max-width: 600px; margin: 0 auto 2rem; }
.hero-buttons { display: flex; gap: 1rem; justify-content: center; }` },
      { id: '3', name: 'script.js', language: 'js', content: `console.log('SaaS Landing loaded!');` }
    ]
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'Showcase projects and skills',
    icon: User,
    color: 'from-purple-500 to-pink-500',
    files: [
      { id: '1', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="avatar">JD</div>
            <h1>John Doe</h1>
            <p class="title">Full Stack Developer</p>
            <p class="bio">Building beautiful, performant web experiences</p>
        </header>
        <section class="projects">
            <h2>Projects</h2>
            <div class="project-grid">
                <div class="project-card">
                    <h3>Project One</h3>
                    <p>A modern web application built with React</p>
                </div>
                <div class="project-card">
                    <h3>Project Two</h3>
                    <p>E-commerce platform with Next.js</p>
                </div>
            </div>
        </section>
    </div>
</body>
</html>` },
      { id: '2', name: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%); color: #fff; min-height: 100vh; }
.container { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
.header { text-align: center; margin-bottom: 4rem; }
.avatar { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; margin: 0 auto 1.5rem; }
.header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.title { color: #8b5cf6; font-size: 1.1rem; margin-bottom: 1rem; }
.bio { color: #64748b; }
.projects h2 { margin-bottom: 1.5rem; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.project-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 1.5rem; transition: all 0.3s; }
.project-card:hover { transform: translateY(-4px); border-color: #8b5cf6; }
.project-card h3 { margin-bottom: 0.5rem; }
.project-card p { color: #64748b; font-size: 0.9rem; }` },
      { id: '3', name: 'script.js', language: 'js', content: `console.log('Portfolio loaded!');` }
    ]
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Analytics and management UI',
    icon: Layout,
    color: 'from-green-500 to-emerald-500',
    files: [
      { id: '1', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <div class="logo">Dashboard</div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active">Overview</a>
                <a href="#" class="nav-item">Analytics</a>
                <a href="#" class="nav-item">Users</a>
                <a href="#" class="nav-item">Settings</a>
            </nav>
        </aside>
        <main class="main">
            <header class="main-header">
                <h1>Overview</h1>
            </header>
            <div class="stats">
                <div class="stat-card">
                    <span class="stat-value">12,345</span>
                    <span class="stat-label">Total Users</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">$54,321</span>
                    <span class="stat-label">Revenue</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">98.5%</span>
                    <span class="stat-label">Uptime</span>
                </div>
            </div>
        </main>
    </div>
</body>
</html>` },
      { id: '2', name: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; }
.dashboard { display: flex; min-height: 100vh; }
.sidebar { width: 250px; background: #111118; border-right: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; }
.logo { font-size: 1.5rem; font-weight: bold; margin-bottom: 2rem; color: #10b981; }
.sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item { color: #64748b; text-decoration: none; padding: 0.75rem 1rem; border-radius: 0.5rem; transition: all 0.2s; }
.nav-item:hover, .nav-item.active { background: rgba(16,185,129,0.1); color: #10b981; }
.main { flex: 1; padding: 2rem; }
.main-header { margin-bottom: 2rem; }
.main-header h1 { font-size: 1.75rem; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.stat-card { background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.2); border-radius: 1rem; padding: 1.5rem; }
.stat-value { display: block; font-size: 2rem; font-weight: bold; margin-bottom: 0.25rem; }
.stat-label { color: #64748b; font-size: 0.9rem; }` },
      { id: '3', name: 'script.js', language: 'js', content: `console.log('Dashboard loaded!');` }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Product cards and shopping cart',
    icon: ShoppingCart,
    color: 'from-orange-500 to-red-500',
    files: [
      { id: '1', name: 'index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="nav">
        <div class="nav-brand">Store</div>
        <div class="cart-icon">Cart (0)</div>
    </nav>
    <main class="products">
        <div class="product-card">
            <div class="product-image"></div>
            <h3>Product Name</h3>
            <p class="price">$99.00</p>
            <button class="btn btn-primary">Add to Cart</button>
        </div>
        <div class="product-card">
            <div class="product-image"></div>
            <h3>Product Name</h3>
            <p class="price">$149.00</p>
            <button class="btn btn-primary">Add to Cart</button>
        </div>
        <div class="product-card">
            <div class="product-image"></div>
            <h3>Product Name</h3>
            <p class="price">$79.00</p>
            <button class="btn btn-primary">Add to Cart</button>
        </div>
    </main>
</body>
</html>` },
      { id: '2', name: 'styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
.nav-brand { font-size: 1.5rem; font-weight: bold; color: #f97316; }
.cart-icon { color: #94a3b8; cursor: pointer; }
.products { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; padding: 2rem; }
.product-card { background: #111118; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; overflow: hidden; transition: all 0.3s; }
.product-card:hover { transform: translateY(-4px); border-color: #f97316; }
.product-image { height: 200px; background: linear-gradient(135deg, #1e293b, #334155); }
.product-card h3, .product-card p, .product-card button { margin: 1rem; }
.price { color: #f97316; font-size: 1.25rem; font-weight: bold; }
.btn { width: calc(100% - 2rem); padding: 0.75rem; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
.btn-primary { background: linear-gradient(135deg, #f97316, #ef4444); color: #fff; }
.btn-primary:hover { opacity: 0.9; }` },
      { id: '3', name: 'script.js', language: 'js', content: `console.log('Store loaded!');` }
    ]
  },
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
        <div class="hero">
            <div class="badge">Powered by AI</div>
            <h1>Site Designer</h1>
            <p>Describe what you want to build and watch the magic happen</p>
            <div class="features">
                <div class="feature">
                    <span class="feature-icon">&#x2728;</span>
                    <span>AI-Powered</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">&#x26A1;</span>
                    <span>Real-time Preview</span>
                </div>
                <div class="feature">
                    <span class="feature-icon">&#x1F680;</span>
                    <span>Export Ready</span>
                </div>
            </div>
        </div>
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
    background: linear-gradient(135deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%);
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

.hero {
    max-width: 600px;
}

.badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 2rem;
    font-size: 0.85rem;
    color: #a78bfa;
    margin-bottom: 1.5rem;
}

h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

p {
    color: #64748b;
    font-size: 1.2rem;
    margin-bottom: 2.5rem;
    line-height: 1.6;
}

.features {
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.feature {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    font-size: 0.9rem;
    color: #94a3b8;
    transition: all 0.3s ease;
}

.feature:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
}

.feature-icon {
    font-size: 1.1rem;
}`
  },
  {
    id: '3',
    name: 'script.js',
    language: 'js',
    content: `// Site Designer - Ready to build!
console.log('Site Designer loaded!');

document.addEventListener('DOMContentLoaded', () => {
    // Add animation to features
    const features = document.querySelectorAll('.feature');
    features.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        setTimeout(() => {
            feature.style.transition = 'all 0.5s ease';
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
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
  const [showTemplates, setShowTemplates] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { subscription } = useSubscription(userId);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
    const newFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      language: ext,
      content: ''
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
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
    
    // Pattern 1: [FILE: name.ext] followed by code block
    const pattern1 = /\[FILE:\s*([^\]]+)\]\s*```[\w]*\n([\s\S]*?)```/gi;
    // Pattern 2: **filename.ext** or `filename.ext` followed by code block
    const pattern2 = /(?:\*\*|`)([a-zA-Z0-9_.-]+\.[a-zA-Z]+)(?:\*\*|`)\s*```[\w]*\n([\s\S]*?)```/gi;
    // Pattern 3: Just code blocks with language hints
    const pattern3 = /```(html|css|javascript|js|typescript|ts|python|py|json|jsx|tsx)\n([\s\S]*?)```/gi;

    let match;
    
    while ((match = pattern1.exec(text)) !== null) {
      parsed.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: match[1].trim(),
        language: getFileExt(match[1].trim()),
        content: match[2].trim()
      });
    }

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

    if (parsed.length === 0) {
      const langToFile: Record<string, string> = {
        html: 'index.html', css: 'styles.css', javascript: 'script.js', js: 'script.js',
        typescript: 'main.ts', ts: 'main.ts', python: 'main.py', py: 'main.py',
        json: 'data.json', jsx: 'App.jsx', tsx: 'App.tsx'
      };

      while ((match = pattern3.exec(text)) !== null) {
        const lang = match[1].toLowerCase();
        const filename = langToFile[lang] || `file.${lang}`;
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

  const loadTemplate = (template: Template) => {
    setFiles(template.files.map(f => ({ ...f, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })));
    setActiveFileId(template.files[0]?.id || '1');
    setShowTemplates(false);
    setMessages([{
      role: 'assistant',
      content: `Loaded the "${template.name}" template. You can now customize it or ask me to make changes!`,
      timestamp: new Date()
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setShowTemplates(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);
    setStreamingContent('');

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const filesContext = files.map(f => `[${f.name}]\n${f.content}`).join('\n\n');

      const systemPrompt = `You are an expert full-stack developer AI assistant. You create complete, production-ready, beautiful code.

CURRENT PROJECT FILES:
${filesContext}

RESPONSE FORMAT - ALWAYS use this exact format for code:

[FILE: filename.ext]
\`\`\`language
complete code here
\`\`\`

RULES:
1. ALWAYS use [FILE: name] format before code blocks
2. Generate COMPLETE file contents, not snippets
3. Create beautiful, modern designs with:
   - Dark themes with subtle gradients
   - Smooth animations and transitions
   - Professional spacing and typography
   - Responsive design
4. Use semantic HTML and accessibility best practices
5. When modifying existing files, include the FULL updated content
6. Explain changes briefly before showing code
7. For any website: use modern CSS (flexbox/grid), smooth hover effects, and polished UI`;

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
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                fullContent += content;
                setStreamingContent(fullContent);
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Parse files from response
      const parsedFiles = parseFilesFromResponse(fullContent);
      
      if (parsedFiles.length > 0) {
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
        // Set active file to first parsed file
        const firstHtml = parsedFiles.find(f => f.name.endsWith('.html'));
        if (firstHtml) {
          setActiveFileId(files.find(f => f.name === firstHtml.name)?.id || firstHtml.id);
        }
      }

      // Clean content for chat display
      const cleanContent = fullContent
        .replace(/\[FILE:[^\]]+\]\s*```[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        .trim() || `Updated ${parsedFiles.length} file(s)`;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        files: parsedFiles
      }]);
      setStreamingContent('');

    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong'}`,
        timestamp: new Date()
      }]);
      setStreamingContent('');
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

  const copyAllCode = async () => {
    const allCode = files.map(f => `/* === ${f.name} === */\n${f.content}`).join('\n\n');
    await navigator.clipboard.writeText(allCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadProject = () => {
    // Create a proper HTML file with embedded CSS and JS
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js'));

    let downloadContent = htmlFile?.content || '';
    if (cssFile) {
      downloadContent = downloadContent.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
    }
    if (jsFile) {
      downloadContent = downloadContent.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
    }

    const blob = new Blob([downloadContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '375px' };

  // Render line numbers for code
  const renderLineNumbers = (content: string) => {
    const lines = content.split('\n');
    return lines.map((_, i) => i + 1).join('\n');
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-[#09090b] border-b border-white/[0.08] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1.5 hover:bg-white/[0.06] rounded-md transition-colors">
              <ChevronLeft size={18} className="text-gray-400" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Code size={14} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none">Site Designer</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">AI-powered code editor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* View Mode */}
          <div className="flex bg-white/[0.04] rounded-md p-0.5 mr-2">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded transition-colors ${viewMode === mode ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              >
                {mode === 'desktop' ? <Monitor size={14} /> : mode === 'tablet' ? <Tablet size={14} /> : <Smartphone size={14} />}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowConsole(!showConsole)} 
            className={`p-1.5 rounded-md transition-colors ${showConsole ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title="Toggle Console"
          >
            <Terminal size={15} />
          </button>
          <button 
            onClick={copyAllCode} 
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-md transition-colors"
            title="Copy Code"
          >
            {copiedCode ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
          </button>
          <button 
            onClick={downloadProject} 
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-md transition-colors"
            title="Download"
          >
            <Download size={15} />
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-md transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        {showChat && !isFullscreen && (
          <div className="w-[380px] bg-[#09090b] border-r border-white/[0.08] flex flex-col flex-shrink-0">
            {/* Chat Header */}
            <div className="h-10 px-3 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-gray-500" />
                <span className="text-xs font-medium text-gray-400">AI Assistant</span>
              </div>
              <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/[0.06] rounded transition-colors">
                <PanelLeftClose size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {/* Templates */}
              {showTemplates && messages.length === 0 && (
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-3 font-medium">Start with a template</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => loadTemplate(template)}
                        className="group p-3 text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-2`}>
                          <template.icon size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-200 block">{template.name}</span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">{template.description}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-xs text-gray-500 mb-2">Or describe what you want to build:</p>
                  </div>
                </div>
              )}
              
              {/* Message list */}
              <div className="p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600/90 text-white rounded-2xl rounded-br-md' 
                        : 'bg-white/[0.04] text-gray-200 rounded-2xl rounded-bl-md border border-white/[0.06]'
                    } px-3 py-2 text-sm`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.files.map(f => (
                            <span key={f.id} className="text-[10px] px-2 py-0.5 bg-black/20 rounded-full flex items-center gap-1">
                              <span style={{ color: LANG_COLORS[f.language] || '#888' }}>●</span>
                              {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Streaming indicator */}
                {isLoading && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] bg-white/[0.04] text-gray-200 rounded-2xl rounded-bl-md border border-white/[0.06] px-3 py-2 text-sm">
                      <p className="whitespace-pre-wrap">{streamingContent.replace(/\[FILE:[^\]]+\]\s*```[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim() || 'Generating code...'}</p>
                    </div>
                  </div>
                )}
                
                {isLoading && !streamingContent && (
                  <div className="flex items-center gap-2 text-gray-500 px-1">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.08]">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what to build..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 pr-10 text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder-gray-600 transition-all"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 bottom-2 p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Chat */}
        {!showChat && !isFullscreen && (
          <button 
            onClick={() => setShowChat(true)} 
            className="absolute left-2 top-16 p-2 bg-[#111113] border border-white/[0.08] rounded-lg z-10 hover:bg-white/[0.04] transition-colors"
          >
            <PanelLeft size={16} className="text-gray-400" />
          </button>
        )}

        {/* File Tree */}
        {showFiles && !isFullscreen && (
          <div className="w-52 bg-[#0c0c0e] border-r border-white/[0.08] flex flex-col flex-shrink-0">
            <div className="h-10 px-3 border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Explorer</span>
              <button 
                onClick={() => setIsCreatingFile(true)} 
                className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                title="New File"
              >
                <Plus size={14} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {isCreatingFile && (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createFile()}
                    placeholder="filename.ext"
                    className="flex-1 bg-white/[0.06] px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    autoFocus
                  />
                  <button onClick={createFile} className="p-1 hover:bg-white/[0.08] rounded"><Check size={12} className="text-emerald-500" /></button>
                  <button onClick={() => { setIsCreatingFile(false); setNewFileName(''); }} className="p-1 hover:bg-white/[0.08] rounded"><X size={12} className="text-gray-500" /></button>
                </div>
              )}
              
              {files.map(file => {
                const Icon = FILE_ICONS[file.language] || File;
                const color = LANG_COLORS[file.language] || '#64748b';
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer border-l-2 transition-colors ${
                      activeFileId === file.id 
                        ? 'bg-white/[0.06] border-emerald-500 text-white' 
                        : 'border-transparent hover:bg-white/[0.03] text-gray-400 hover:text-gray-200'
                    }`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <Icon size={14} style={{ color }} />
                    <span className="flex-1 text-xs truncate">{file.name}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/[0.1] rounded transition-opacity"
                      >
                        <X size={10} className="text-gray-500" />
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
              <div className="flex-1 flex flex-col border-r border-white/[0.08] min-w-0">
                {/* File Tabs */}
                <div className="h-9 bg-[#0c0c0e] border-b border-white/[0.08] flex items-center px-1 overflow-x-auto">
                  {files.map(file => (
                    <button
                      key={file.id}
                      onClick={() => setActiveFileId(file.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t transition-colors whitespace-nowrap ${
                        activeFileId === file.id 
                          ? 'bg-[#09090b] text-white border-t border-x border-white/[0.08] -mb-px' 
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <span style={{ color: LANG_COLORS[file.language] || '#64748b' }}>●</span>
                      {file.name}
                    </button>
                  ))}
                </div>

                {/* Editor with Line Numbers */}
                <div className="flex-1 overflow-hidden flex bg-[#09090b]">
                  {/* Line numbers */}
                  <div className="py-4 px-3 text-right text-gray-600 font-mono text-xs select-none bg-[#0c0c0e] border-r border-white/[0.06] overflow-hidden">
                    <pre className="leading-5">{renderLineNumbers(activeFile.content)}</pre>
                  </div>
                  {/* Code */}
                  <textarea
                    value={activeFile.content}
                    onChange={(e) => updateFile(activeFile.id, e.target.value)}
                    className="flex-1 bg-transparent py-4 px-4 font-mono text-sm text-gray-200 resize-none focus:outline-none leading-5"
                    spellCheck={false}
                    style={{ tabSize: 2 }}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className={`${isFullscreen ? 'flex-1' : 'w-1/2'} bg-[#0c0c0e] flex flex-col min-w-0`}>
              {/* Browser Chrome */}
              <div className="h-9 bg-[#111113] border-b border-white/[0.08] flex items-center px-3 gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.04] rounded-md text-xs text-gray-500 max-w-[300px] w-full">
                    <Globe size={12} />
                    <span className="truncate">localhost:3000</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (iframeRef.current) {
                      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                      if (doc) { doc.open(); doc.write(buildPreview()); doc.close(); }
                    }
                  }} 
                  className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                  title="Refresh Preview"
                >
                  <RefreshCw size={12} className="text-gray-500" />
                </button>
              </div>
              
              {/* Preview Frame */}
              <div className="flex-1 flex items-center justify-center bg-[#18181b] p-4 overflow-auto">
                <div 
                  style={{ width: viewportWidths[viewMode], height: '100%', maxWidth: '100%' }} 
                  className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
                >
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
            <div className="h-36 bg-[#0c0c0e] border-t border-white/[0.08] flex flex-col">
              <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">Console</span>
                  {consoleOutput.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.06] rounded-full text-gray-500">{consoleOutput.length}</span>
                  )}
                </div>
                <button 
                  onClick={() => setConsoleOutput([])} 
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
                {consoleOutput.length === 0 ? (
                  <span className="text-gray-600">No console output</span>
                ) : (
                  consoleOutput.map((line, i) => (
                    <div key={i} className={`py-0.5 ${
                      line.includes('[ERR]') ? 'text-red-400' : 
                      line.includes('[WARN]') ? 'text-yellow-400' : 
                      'text-gray-400'
                    }`}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
