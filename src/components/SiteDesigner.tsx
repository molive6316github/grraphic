import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Code, Eye, Download, Copy, RefreshCw, Sparkles, Globe, Layout, Monitor, 
  Wand2, ChevronLeft, Play, Maximize2, Minimize2, ChevronDown, ChevronUp,
  FileCode, FileJson, FileText, Plus, Trash2, Check, X, Folder, FolderOpen,
  Terminal, Smartphone, Tablet, PanelLeftClose, PanelLeft, PanelRightClose,
  Loader2, ChevronRight, User, File, Settings2, Search,
  Zap, Package, Image, Palette, ShoppingCart, MessageSquare, Bot,
  ExternalLink, Save, FolderPlus, MoreHorizontal, Rocket, GitBranch, Github, 
  Clock, CheckCircle2, AlertCircle, Info, Command, Braces, Hash,
  ArrowRight, Undo2, Redo2, Split, Columns, LayoutGrid, Boxes,
  Cpu, Database, Cloud, Link, PanelBottomClose, PanelBottom, Menu, Users
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useSubscription } from '../hooks/useSubscription';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getOAuthConnection, removeOAuthConnection, rememberOAuthOrigin } from '../lib/oauthConnections';

// Map file extensions to Monaco language ids
function monacoLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
    svg: 'xml', xml: 'xml', yml: 'yaml', yaml: 'yaml',
  };
  return map[ext] || 'plaintext';
}

// Types
interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
}

interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  isExpanded: boolean;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  files?: ProjectFile[];
  isStreaming?: boolean;
  type?: 'info' | 'success' | 'error' | 'code';
}

interface Project {
  id: string;
  name: string;
  files: ProjectFile[];
  folders: ProjectFolder[];
  createdAt: Date;
  updatedAt: Date;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  tags: string[];
  files: ProjectFile[];
}

interface SiteDesignerProps {
  userId?: string;
  onBack?: () => void;
}

// Constants
const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  html: { icon: FileCode, color: '#e34c26' },
  htm: { icon: FileCode, color: '#e34c26' },
  css: { icon: Palette, color: '#264de4' },
  scss: { icon: Palette, color: '#cf649a' },
  js: { icon: Braces, color: '#f7df1e' },
  jsx: { icon: Braces, color: '#61dafb' },
  ts: { icon: Braces, color: '#3178c6' },
  tsx: { icon: Braces, color: '#3178c6' },
  json: { icon: FileJson, color: '#cbcb41' },
  md: { icon: FileText, color: '#083fa1' },
  py: { icon: FileCode, color: '#3776ab' },
  svg: { icon: Image, color: '#ffb13b' },
  png: { icon: Image, color: '#89cff0' },
  jpg: { icon: Image, color: '#89cff0' },
  env: { icon: Settings2, color: '#ecd53f' },
  gitignore: { icon: GitBranch, color: '#f05032' },
};

const TEMPLATES: Template[] = [
  {
    id: 'nextjs-landing',
    name: 'Next.js Landing',
    description: 'Modern SaaS landing page with hero, features, pricing, and CTA sections',
    icon: Rocket,
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    tags: ['Next.js', 'React', 'Tailwind'],
    files: [
      { id: '1', name: 'index.html', path: '/index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LaunchPad - Ship Faster</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="app">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-container">
        <a href="#" class="nav-logo">
          <div class="logo-icon">L</div>
          <span>LaunchPad</span>
        </a>
        <div class="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Testimonials</a>
          <button class="btn btn-ghost">Sign In</button>
          <button class="btn btn-primary">Get Started</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="badge">
          <span class="badge-dot"></span>
          Now in Public Beta
        </div>
        <h1 class="hero-title">
          Build and ship<br>
          <span class="gradient-text">10x faster</span>
        </h1>
        <p class="hero-subtitle">
          The modern development platform that helps teams build, deploy, and scale applications with unprecedented speed.
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary btn-lg">
            Start Building Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="btn btn-secondary btn-lg">Watch Demo</button>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-value">50K+</span>
            <span class="stat-label">Developers</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">Uptime</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">500ms</span>
            <span class="stat-label">Avg Deploy</span>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="code-window">
          <div class="window-header">
            <div class="window-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="window-title">terminal</span>
          </div>
          <div class="window-content">
            <code><span class="code-prompt">$</span> npx launchpad deploy</code>
            <code class="code-success">✓ Building application...</code>
            <code class="code-success">✓ Running tests...</code>
            <code class="code-success">✓ Deploying to production...</code>
            <code class="code-highlight">🚀 Deployed in 12.3s</code>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="section-header">
        <span class="section-badge">Features</span>
        <h2 class="section-title">Everything you need to build fast</h2>
        <p class="section-subtitle">Powerful tools designed for modern development workflows</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon" style="--accent: #3b82f6;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <h3>Lightning Fast</h3>
          <p>Deploy in seconds with our optimized build pipeline and global edge network.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" style="--accent: #8b5cf6;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <h3>Smart Layouts</h3>
          <p>AI-powered responsive layouts that adapt perfectly to any screen size.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" style="--accent: #ec4899;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <h3>Real-time Collab</h3>
          <p>Work together seamlessly with live cursors and instant synchronization.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon" style="--accent: #10b981;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3>Enterprise Security</h3>
          <p>Bank-grade encryption and compliance certifications out of the box.</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <h2>Ready to ship faster?</h2>
        <p>Join thousands of developers building the future.</p>
        <button class="btn btn-primary btn-lg">Get Started Free</button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2024 LaunchPad. All rights reserved.</p>
      </div>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>` },
      { id: '2', name: 'styles.css', path: '/styles.css', language: 'css', content: `/* Base Reset & Variables */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-primary: #030712;
  --bg-secondary: #0a0f1a;
  --bg-elevated: #111827;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --border: rgba(255,255,255,0.08);
  --accent: #8b5cf6;
  --accent-glow: rgba(139,92,246,0.4);
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Typography */
.gradient-text {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.625rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 15px var(--accent-glow);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--accent-glow);
}

.btn-secondary {
  background: rgba(255,255,255,0.05);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover { color: var(--text-primary); }

.btn-lg {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
}

/* Navigation */
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 2rem;
  background: rgba(3,7,18,0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.nav-links a:hover { color: var(--text-primary); }

/* Hero */
.hero {
  min-height: 100vh;
  padding: 8rem 2rem 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  position: relative;
}

.hero-glow {
  position: absolute;
  top: 20%;
  left: 30%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  filter: blur(100px);
  pointer-events: none;
}

.hero-content { position: relative; z-index: 1; }

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(139,92,246,0.15);
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 2rem;
  font-size: 0.8rem;
  color: #a78bfa;
  margin-bottom: 1.5rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #a78bfa;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

.hero-visual {
  position: relative;
  z-index: 1;
}

.code-window {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}

.window-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid var(--border);
}

.window-dots {
  display: flex;
  gap: 0.5rem;
}

.window-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.window-dots span:nth-child(1) { background: #ff5f57; }
.window-dots span:nth-child(2) { background: #febc2e; }
.window-dots span:nth-child(3) { background: #28c840; }

.window-title {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.window-content {
  padding: 1.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

.window-content code {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.code-prompt { color: #8b5cf6; }
.code-success { color: #10b981; }
.code-highlight { color: #f59e0b; font-weight: 600; }

/* Features */
.features {
  padding: 6rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: rgba(139,92,246,0.15);
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.feature-card {
  padding: 2rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139,92,246,0.3);
  box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(139,92,246,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: var(--accent, #8b5cf6);
}

.feature-card h3 {
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
}

.feature-card p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* CTA */
.cta {
  padding: 6rem 2rem;
  text-align: center;
  background: linear-gradient(180deg, transparent, rgba(139,92,246,0.1));
}

.cta h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Footer */
.footer {
  padding: 2rem;
  border-top: 1px solid var(--border);
  text-align: center;
}

.footer p {
  color: var(--text-muted);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero { grid-template-columns: 1fr; text-align: center; }
  .hero-subtitle { margin: 0 auto 2rem; }
  .hero-actions { justify-content: center; }
  .hero-stats { justify-content: center; }
  .hero-visual { display: none; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .hero-title { font-size: 2.5rem; }
  .nav-links a:not(.btn) { display: none; }
  .features-grid { grid-template-columns: 1fr; }
}` },
      { id: '3', name: 'script.js', path: '/script.js', language: 'js', content: `// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Intersection Observer for animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = \`all 0.5s ease \${i * 0.1}s\`;
  observer.observe(card);
});

console.log('🚀 LaunchPad loaded successfully!');` }
    ]
  },
  {
    id: 'portfolio',
    name: 'Developer Portfolio',
    description: 'Clean portfolio with projects, skills, and contact sections',
    icon: User,
    gradient: 'from-cyan-500 via-blue-600 to-violet-600',
    tags: ['Portfolio', 'Personal', 'Minimal'],
    files: [
      { id: '1', name: 'index.html', path: '/index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Chen - Full Stack Developer</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="portfolio">
    <header class="header">
      <div class="header-content">
        <div class="avatar">AC</div>
        <h1>Alex Chen</h1>
        <p class="title">Full Stack Developer</p>
        <p class="bio">Building elegant solutions to complex problems. Passionate about React, Node.js, and creating delightful user experiences.</p>
        <div class="social-links">
          <a href="#" class="social-btn">GitHub</a>
          <a href="#" class="social-btn">LinkedIn</a>
          <a href="#" class="social-btn primary">Contact</a>
        </div>
      </div>
    </header>
    <section class="projects">
      <h2>Featured Projects</h2>
      <div class="project-grid">
        <article class="project-card">
          <div class="project-image"></div>
          <div class="project-content">
            <h3>E-Commerce Platform</h3>
            <p>Full-stack e-commerce solution with React, Node.js, and Stripe integration.</p>
            <div class="project-tags">
              <span>React</span><span>Node.js</span><span>MongoDB</span>
            </div>
          </div>
        </article>
        <article class="project-card">
          <div class="project-image"></div>
          <div class="project-content">
            <h3>Task Management App</h3>
            <p>Real-time collaborative task manager with drag-and-drop functionality.</p>
            <div class="project-tags">
              <span>Next.js</span><span>Prisma</span><span>WebSocket</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</body>
</html>` },
      { id: '2', name: 'styles.css', path: '/styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; }
.portfolio { max-width: 900px; margin: 0 auto; padding: 4rem 2rem; }
.header { text-align: center; margin-bottom: 5rem; }
.avatar { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; margin: 0 auto 2rem; }
h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.title { color: #06b6d4; font-size: 1.1rem; margin-bottom: 1rem; }
.bio { color: #64748b; max-width: 500px; margin: 0 auto 2rem; line-height: 1.7; }
.social-links { display: flex; justify-content: center; gap: 1rem; }
.social-btn { padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; color: #94a3b8; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s; }
.social-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.social-btn.primary { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #fff; border: none; }
.projects h2 { font-size: 1.5rem; margin-bottom: 2rem; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.project-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; overflow: hidden; transition: all 0.3s; }
.project-card:hover { transform: translateY(-4px); border-color: #06b6d4; }
.project-image { height: 180px; background: linear-gradient(135deg, #1e293b, #334155); }
.project-content { padding: 1.5rem; }
.project-content h3 { margin-bottom: 0.75rem; }
.project-content p { color: #64748b; font-size: 0.9rem; margin-bottom: 1rem; }
.project-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.project-tags span { padding: 0.25rem 0.75rem; background: rgba(6,182,212,0.1); color: #06b6d4; border-radius: 1rem; font-size: 0.75rem; }` },
      { id: '3', name: 'script.js', path: '/script.js', language: 'js', content: `console.log('Portfolio loaded!');` }
    ]
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Analytics dashboard with charts, stats, and data tables',
    icon: Layout,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    tags: ['Dashboard', 'Analytics', 'Admin'],
    files: [
      { id: '1', name: 'index.html', path: '/index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="logo">Dashboard</div>
      <nav>
        <a href="#" class="nav-item active">Overview</a>
        <a href="#" class="nav-item">Analytics</a>
        <a href="#" class="nav-item">Users</a>
        <a href="#" class="nav-item">Reports</a>
        <a href="#" class="nav-item">Settings</a>
      </nav>
    </aside>
    <main class="main">
      <header class="main-header">
        <div>
          <h1>Overview</h1>
          <p>Welcome back! Here's your analytics summary.</p>
        </div>
        <button class="btn-primary">Download Report</button>
      </header>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon blue">📈</span>
          <div>
            <span class="stat-value">24,521</span>
            <span class="stat-label">Total Visitors</span>
            <span class="stat-change positive">+12.5%</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon green">💰</span>
          <div>
            <span class="stat-value">$84,254</span>
            <span class="stat-label">Revenue</span>
            <span class="stat-change positive">+8.2%</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon purple">🛒</span>
          <div>
            <span class="stat-value">1,429</span>
            <span class="stat-label">Orders</span>
            <span class="stat-change positive">+4.7%</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon orange">⭐</span>
          <div>
            <span class="stat-value">4.8</span>
            <span class="stat-label">Avg. Rating</span>
            <span class="stat-change positive">+0.3</span>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <h3>Revenue Over Time</h3>
        <div class="chart-placeholder">Chart visualization would go here</div>
      </div>
    </main>
  </div>
</body>
</html>` },
      { id: '2', name: 'styles.css', path: '/styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; }
.dashboard { display: flex; min-height: 100vh; }
.sidebar { width: 260px; background: #111118; border-right: 1px solid rgba(255,255,255,0.08); padding: 2rem 1.5rem; }
.logo { font-size: 1.5rem; font-weight: 700; color: #10b981; margin-bottom: 3rem; }
nav { display: flex; flex-direction: column; gap: 0.5rem; }
.nav-item { padding: 0.875rem 1rem; border-radius: 0.5rem; color: #64748b; text-decoration: none; transition: all 0.2s; }
.nav-item:hover, .nav-item.active { background: rgba(16,185,129,0.1); color: #10b981; }
.main { flex: 1; padding: 2rem; }
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.main-header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
.main-header p { color: #64748b; }
.btn-primary { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 500; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.stat-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
.stat-icon { font-size: 2rem; width: 60px; height: 60px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; }
.stat-icon.blue { background: rgba(59,130,246,0.15); }
.stat-icon.green { background: rgba(16,185,129,0.15); }
.stat-icon.purple { background: rgba(139,92,246,0.15); }
.stat-icon.orange { background: rgba(249,115,22,0.15); }
.stat-value { display: block; font-size: 1.75rem; font-weight: 700; }
.stat-label { display: block; color: #64748b; font-size: 0.875rem; }
.stat-change { font-size: 0.75rem; }
.stat-change.positive { color: #10b981; }
.chart-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; padding: 1.5rem; }
.chart-card h3 { margin-bottom: 1rem; }
.chart-placeholder { height: 300px; background: rgba(255,255,255,0.02); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #64748b; }` },
      { id: '3', name: 'script.js', path: '/script.js', language: 'js', content: `console.log('Dashboard loaded!');` }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Product listing with cart and modern shopping UI',
    icon: ShoppingCart,
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    tags: ['E-commerce', 'Shopping', 'Products'],
    files: [
      { id: '1', name: 'index.html', path: '/index.html', language: 'html', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Store</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="store">
    <nav class="nav">
      <a href="#" class="logo">Store</a>
      <div class="nav-links">
        <a href="#">New</a>
        <a href="#">Categories</a>
        <a href="#">Sale</a>
      </div>
      <div class="nav-actions">
        <button class="icon-btn">🔍</button>
        <button class="icon-btn cart-btn">🛒 <span class="cart-count">3</span></button>
      </div>
    </nav>
    <header class="hero">
      <div class="hero-content">
        <span class="tag">New Collection</span>
        <h1>Summer Essentials</h1>
        <p>Discover our curated collection of premium products for the season.</p>
        <button class="btn-primary">Shop Now</button>
      </div>
    </header>
    <section class="products">
      <h2>Featured Products</h2>
      <div class="product-grid">
        <div class="product-card">
          <div class="product-badge">New</div>
          <div class="product-image"></div>
          <div class="product-info">
            <h3>Premium Headphones</h3>
            <p class="price">$299.00</p>
            <button class="add-to-cart">Add to Cart</button>
          </div>
        </div>
        <div class="product-card">
          <div class="product-badge sale">-20%</div>
          <div class="product-image"></div>
          <div class="product-info">
            <h3>Wireless Speaker</h3>
            <p class="price"><span class="original">$199</span> $159.00</p>
            <button class="add-to-cart">Add to Cart</button>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image"></div>
          <div class="product-info">
            <h3>Smart Watch Pro</h3>
            <p class="price">$449.00</p>
            <button class="add-to-cart">Add to Cart</button>
          </div>
        </div>
        <div class="product-card">
          <div class="product-image"></div>
          <div class="product-info">
            <h3>Camera Lens Kit</h3>
            <p class="price">$899.00</p>
            <button class="add-to-cart">Add to Cart</button>
          </div>
        </div>
      </div>
    </section>
  </div>
  <script src="script.js"></script>
</body>
</html>` },
      { id: '2', name: 'styles.css', path: '/styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f1f5f9; }
.store { max-width: 1280px; margin: 0 auto; }
.nav { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
.logo { font-size: 1.5rem; font-weight: 700; color: #f97316; text-decoration: none; }
.nav-links { display: flex; gap: 2rem; }
.nav-links a { color: #94a3b8; text-decoration: none; transition: color 0.2s; }
.nav-links a:hover { color: #fff; }
.nav-actions { display: flex; gap: 1rem; }
.icon-btn { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; position: relative; }
.cart-count { position: absolute; top: -5px; right: -10px; background: #f97316; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 1rem; }
.hero { padding: 6rem 2rem; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); text-align: center; }
.tag { display: inline-block; padding: 0.5rem 1rem; background: rgba(249,115,22,0.2); color: #f97316; border-radius: 2rem; font-size: 0.8rem; margin-bottom: 1rem; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.hero p { color: #64748b; margin-bottom: 2rem; }
.btn-primary { padding: 1rem 2rem; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; border-radius: 0.5rem; font-size: 1rem; cursor: pointer; transition: transform 0.2s; }
.btn-primary:hover { transform: translateY(-2px); }
.products { padding: 4rem 2rem; }
.products h2 { font-size: 1.75rem; margin-bottom: 2rem; }
.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }
.product-card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; overflow: hidden; position: relative; transition: all 0.3s; }
.product-card:hover { transform: translateY(-4px); border-color: #f97316; }
.product-badge { position: absolute; top: 1rem; left: 1rem; padding: 0.375rem 0.75rem; background: #f97316; color: white; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; }
.product-badge.sale { background: #ef4444; }
.product-image { height: 200px; background: linear-gradient(135deg, #1e293b, #334155); }
.product-info { padding: 1.5rem; }
.product-info h3 { margin-bottom: 0.5rem; font-size: 1rem; }
.price { color: #f97316; font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
.price .original { color: #64748b; text-decoration: line-through; font-size: 0.9rem; margin-right: 0.5rem; }
.add-to-cart { width: 100%; padding: 0.75rem; background: rgba(249,115,22,0.1); color: #f97316; border: 1px solid rgba(249,115,22,0.3); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
.add-to-cart:hover { background: #f97316; color: white; }
@media (max-width: 1024px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .product-grid { grid-template-columns: 1fr; } .nav-links { display: none; } }` },
      { id: '3', name: 'script.js', path: '/script.js', language: 'js', content: `// Simple cart functionality
let cartCount = 3;
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    cartCount++;
    document.querySelector('.cart-count').textContent = cartCount;
    btn.textContent = 'Added!';
    btn.style.background = '#10b981';
    btn.style.borderColor = '#10b981';
    btn.style.color = 'white';
    setTimeout(() => {
      btn.textContent = 'Add to Cart';
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 1500);
  });
});
console.log('Store loaded!');` }
    ]
  }
];

const DEFAULT_FILES: ProjectFile[] = [
  { id: '1', name: 'index.html', path: '/index.html', language: 'html', content: `<!DOCTYPE html>
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
      <p>Describe what you want to build and let AI create it for you</p>
      <div class="features">
        <div class="feature"><span>✨</span> AI-Powered</div>
        <div class="feature"><span>⚡</span> Real-time Preview</div>
        <div class="feature"><span>🚀</span> Export Ready</div>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>` },
  { id: '2', name: 'styles.css', path: '/styles.css', language: 'css', content: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #0a0a0f 0%, #111118 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1f5f9;
}
.container { text-align: center; padding: 2rem; }
.badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2));
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 2rem;
  font-size: 0.85rem;
  color: #a78bfa;
  margin-bottom: 1.5rem;
}
h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
p { color: #64748b; font-size: 1.2rem; margin-bottom: 2.5rem; }
.features { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; }
.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.75rem;
  color: #94a3b8;
  transition: all 0.3s;
}
.feature:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(139,92,246,0.3);
  transform: translateY(-2px);
}` },
  { id: '3', name: 'script.js', path: '/script.js', language: 'js', content: `console.log('Site Designer loaded!');

document.querySelectorAll('.feature').forEach((f, i) => {
  f.style.opacity = '0';
  f.style.transform = 'translateY(20px)';
  setTimeout(() => {
    f.style.transition = 'all 0.5s ease';
    f.style.opacity = '1';
    f.style.transform = 'translateY(0)';
  }, 100 + i * 100);
});` }
];

// Main Component
export function SiteDesigner({ userId, onBack }: SiteDesignerProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>('1');
  const [openTabs, setOpenTabs] = useState<string[]>(['1']);
  const [showChat, setShowChat] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Ready']);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [streamingContent, setStreamingContent] = useState('');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [chatWidth, setChatWidth] = useState(420);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [previewSplit, setPreviewSplit] = useState(50);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState<any>(null);
  const [showGithubConnect, setShowGithubConnect] = useState(false);
  const [collabRoom, setCollabRoom] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('room')
  );
  const [collabPeers, setCollabPeers] = useState(1);
  const [collabCopied, setCollabCopied] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const collabChannel = useRef<RealtimeChannel | null>(null);
  const collabClientId = useRef(crypto.randomUUID());
  const collabSynced = useRef(false);
  const applyingRemote = useRef(false);
  const broadcastTimers = useRef<Map<string, number>>(new Map());
  const filesRef = useRef<ProjectFile[]>([]);
  filesRef.current = files;
  
  const { subscription } = useSubscription(userId);
  const activeFile = files.find(f => f.id === activeFileId);

  // Restore a previously linked GitHub account (saved after OAuth in useAuth)
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    let cancelled = false;
    (async () => {
      const conn = await getOAuthConnection(userId, 'github');
      if (cancelled || !conn) return;
      if (conn.provider_token) {
        try {
          const res = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${conn.provider_token}` },
          });
          if (res.ok) {
            const ghUser = await res.json();
            if (!cancelled) {
              setGithubConnected(true);
              setGithubUser(ghUser);
            }
            return;
          }
          // Token revoked/expired - drop the stale connection
          if (res.status === 401) await removeOAuthConnection(userId, 'github');
        } catch { /* network hiccup: fall through to username-only display */ }
      }
      if (conn.provider_username && !cancelled) {
        setGithubConnected(true);
        setGithubUser({ login: conn.provider_username });
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Real-time collaboration over Supabase Realtime broadcast.
  // Last write per file wins; joiners request full state from peers.
  useEffect(() => {
    if (!collabRoom || !isSupabaseConfigured()) return;
    collabSynced.current = false;

    const channel = supabase.channel(`site-designer:${collabRoom}`, {
      config: { broadcast: { self: false }, presence: { key: collabClientId.current } },
    });

    channel.on('broadcast', { event: 'file' }, ({ payload }) => {
      applyingRemote.current = true;
      setFiles(prev => {
        const exists = prev.some(f => f.id === payload.id);
        return exists
          ? prev.map(f => f.id === payload.id ? { ...f, ...payload } : f)
          : [...prev, payload as ProjectFile];
      });
      applyingRemote.current = false;
    });

    channel.on('broadcast', { event: 'sync_request' }, ({ payload }) => {
      if (payload?.from === collabClientId.current) return;
      if (filesRef.current.length > 0) {
        channel.send({ type: 'broadcast', event: 'sync_state', payload: { files: filesRef.current } });
      }
    });

    channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
      if (collabSynced.current || !payload?.files?.length) return;
      collabSynced.current = true;
      applyingRemote.current = true;
      setFiles(payload.files as ProjectFile[]);
      setActiveFileId((payload.files[0] as ProjectFile).id);
      setOpenTabs([(payload.files[0] as ProjectFile).id]);
      applyingRemote.current = false;
    });

    channel.on('presence', { event: 'sync' }, () => {
      setCollabPeers(Math.max(1, Object.keys(channel.presenceState()).length));
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ joined_at: Date.now() });
        channel.send({ type: 'broadcast', event: 'sync_request', payload: { from: collabClientId.current } });
      }
    });

    collabChannel.current = channel;
    return () => {
      supabase.removeChannel(channel);
      collabChannel.current = null;
      setCollabPeers(1);
    };
  }, [collabRoom]);

  const broadcastFileChange = (id: string) => {
    if (!collabChannel.current || applyingRemote.current) return;
    const existing = broadcastTimers.current.get(id);
    if (existing) clearTimeout(existing);
    broadcastTimers.current.set(id, window.setTimeout(() => {
      const file = filesRef.current.find(f => f.id === id);
      if (file) {
        collabChannel.current?.send({ type: 'broadcast', event: 'file', payload: file });
      }
    }, 250));
  };

  const startOrShareCollab = async () => {
    let room = collabRoom;
    if (!room) {
      room = Math.random().toString(36).slice(2, 10);
      setCollabRoom(room);
      const url = new URL(window.location.href);
      url.searchParams.set('room', room);
      window.history.replaceState({}, '', url.toString());
    }
    const link = `${window.location.origin}/site-designer?room=${room}`;
    try {
      await navigator.clipboard.writeText(link);
      setCollabCopied(true);
      setTimeout(() => setCollabCopied(false), 1500);
    } catch { /* clipboard denied */ }
  };

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowExplorer(!showExplorer);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExplorer]);

  // Build preview
  const buildPreview = useCallback(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js') && !f.name.endsWith('.json'));

    if (!htmlFile) return '<html><body style="background:#09090b;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;flex-direction:column;gap:1rem"><h2>No HTML file</h2><p style="color:#666">Create an index.html to see preview</p></body></html>';

    let html = htmlFile.content;

    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    const consoleScript = `<script>
      (function() {
        const send = (level, args) => window.parent.postMessage({type:'console',level,args:args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))},'*');
        ['log','error','warn','info'].forEach(m => {
          const orig = console[m];
          console[m] = (...a) => { send(m, a); orig.apply(console, a); };
        });
        window.onerror = (m,u,l) => send('error', ['Error: '+m+' at line '+l]);
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

  // Console messages
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'console') {
        const prefix = e.data.level === 'error' ? '✗' : e.data.level === 'warn' ? '⚠' : '›';
        const color = e.data.level === 'error' ? 'text-red-400' : e.data.level === 'warn' ? 'text-yellow-400' : 'text-gray-400';
        setTerminalOutput(prev => [...prev.slice(-200), `${prefix} ${e.data.args.join(' ')}`]);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Chat resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingChat) {
        const newWidth = Math.max(320, Math.min(600, e.clientX));
        setChatWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizingChat(false);
    
    if (isResizingChat) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingChat]);

  // Helpers
  const getFileExt = (name: string) => name.split('.').pop()?.toLowerCase() || 'txt';
  
  const getFileIcon = (name: string) => {
    const ext = getFileExt(name);
    return FILE_ICONS[ext] || { icon: File, color: '#64748b' };
  };

  const createFile = () => {
    if (!newFileName.trim()) return;
    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      path: '/' + newFileName.trim(),
      language: getFileExt(newFileName),
      content: ''
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenTabs(prev => [...prev, newFile.id]);
    setIsCreatingFile(false);
    setNewFileName('');
    addTerminalOutput(`Created ${newFileName}`);
  };

  const deleteFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file || files.length <= 1) return;
    
    setFiles(prev => prev.filter(f => f.id !== id));
    setOpenTabs(prev => prev.filter(t => t !== id));
    if (activeFileId === id) {
      const remaining = files.filter(f => f.id !== id);
      setActiveFileId(remaining[0]?.id || '');
    }
    addTerminalOutput(`Deleted ${file.name}`);
  };

  const updateFile = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
    broadcastFileChange(id);
  };

  const openFile = (id: string) => {
    setActiveFileId(id);
    if (!openTabs.includes(id)) {
      setOpenTabs(prev => [...prev, id]);
    }
  };

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenTabs(prev => prev.filter(t => t !== id));
    if (activeFileId === id) {
      const remaining = openTabs.filter(t => t !== id);
      setActiveFileId(remaining[remaining.length - 1] || files[0]?.id || '');
    }
  };

  const addTerminalOutput = (msg: string) => {
    setTerminalOutput(prev => [...prev.slice(-200), `$ ${msg}`]);
  };

  const loadTemplate = (template: Template) => {
    const newFiles = template.files.map(f => ({
      ...f,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
    }));
    setFiles(newFiles);
    setActiveFileId(newFiles[0]?.id || '');
    setOpenTabs([newFiles[0]?.id || '']);
    setShowTemplates(false);
    setProjectName(template.name);
    setMessages([{
      role: 'assistant',
      content: `Loaded **${template.name}** template! You can now edit the code or ask me to make changes.`,
      timestamp: new Date(),
      type: 'success'
    }]);
    addTerminalOutput(`Loaded template: ${template.name}`);
  };

  const parseFilesFromResponse = (text: string): ProjectFile[] => {
    const parsed: ProjectFile[] = [];
    
    const pattern1 = /\[FILE:\s*([^\]]+)\]\s*```[\w]*\n([\s\S]*?)```/gi;
    const pattern2 = /(?:\*\*|`)([a-zA-Z0-9_.-]+\.[a-zA-Z]+)(?:\*\*|`)\s*```[\w]*\n([\s\S]*?)```/gi;
    const pattern3 = /```(html|css|javascript|js|typescript|ts|json|jsx|tsx)\n([\s\S]*?)```/gi;

    let match;
    
    while ((match = pattern1.exec(text)) !== null) {
      parsed.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: match[1].trim(),
        path: '/' + match[1].trim(),
        language: getFileExt(match[1].trim()),
        content: match[2].trim()
      });
    }

    if (parsed.length === 0) {
      while ((match = pattern2.exec(text)) !== null) {
        parsed.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          name: match[1].trim(),
          path: '/' + match[1].trim(),
          language: getFileExt(match[1].trim()),
          content: match[2].trim()
        });
      }
    }

    if (parsed.length === 0) {
      const langToFile: Record<string, string> = {
        html: 'index.html', css: 'styles.css', javascript: 'script.js', js: 'script.js',
        typescript: 'main.ts', ts: 'main.ts', json: 'data.json', jsx: 'App.jsx', tsx: 'App.tsx'
      };

      while ((match = pattern3.exec(text)) !== null) {
        const lang = match[1].toLowerCase();
        const filename = langToFile[lang] || `file.${lang}`;
        const existingIdx = parsed.findIndex(p => p.name === filename);
        if (existingIdx >= 0) {
          parsed[existingIdx].content = match[2].trim();
        } else {
          parsed.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: filename,
            path: '/' + filename,
            language: getFileExt(filename),
            content: match[2].trim()
          });
        }
      }
    }

    return parsed;
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');
    setShowTemplates(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsGenerating(true);
    setStreamingContent('');
    addTerminalOutput('Generating...');

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const filesContext = files.map(f => `[${f.name}]\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');

      const systemPrompt = `You are an expert full-stack developer. Create beautiful, production-ready code.

CURRENT PROJECT:
${filesContext}

RESPONSE FORMAT - Use this exact format for code:
[FILE: filename.ext]
\`\`\`language
complete code here
\`\`\`

RULES:
1. ALWAYS use [FILE: name] format before code blocks
2. Generate COMPLETE file contents, never partial
3. Create stunning, modern designs with:
   - Dark themes (#0a0a0f backgrounds)
   - Gradient accents
   - Smooth animations
   - Professional typography
   - Responsive layouts
4. Use semantic HTML, modern CSS (flexbox/grid)
5. Brief explanation before code
6. When modifying files, include FULL updated content`;

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
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
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
              } catch { /* skip */ }
            }
          }
        }
      }

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
        
        const htmlFile = parsedFiles.find(f => f.name.endsWith('.html'));
        if (htmlFile) {
          const existing = files.find(f => f.name === htmlFile.name);
          if (existing) setActiveFileId(existing.id);
        }
        
        addTerminalOutput(`Updated ${parsedFiles.length} file(s)`);
      }

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
        timestamp: new Date(),
        type: 'error'
      }]);
      setStreamingContent('');
      addTerminalOutput('Error: Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProject = async () => {
    if (!isSupabaseConfigured() || !userId) {
      addTerminalOutput('Save: Login required');
      return;
    }
    setIsSaving(true);
    addTerminalOutput('Saving project...');
    
    try {
      // Save to local storage for now
      const project = { name: projectName, files, folders, updatedAt: new Date() };
      localStorage.setItem(`sitedesigner_${userId}`, JSON.stringify(project));
      addTerminalOutput('Project saved!');
    } catch (e) {
      addTerminalOutput('Save failed');
    }
    setIsSaving(false);
  };

  const downloadProject = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const cssFile = files.find(f => f.name.endsWith('.css'));
    const jsFile = files.find(f => f.name.endsWith('.js'));

    let content = htmlFile?.content || '';
    if (cssFile) content = content.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
    if (jsFile) content = content.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    addTerminalOutput('Downloaded project');
  };

  const viewportWidths = { desktop: '100%', tablet: '768px', mobile: '390px' };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden select-none">
      {/* Header */}
      <header className="h-11 bg-[#09090b] border-b border-white/[0.06] flex items-center justify-between px-2 flex-shrink-0 z-50">
        <div className="flex items-center gap-1">
          {onBack && (
            <button onClick={onBack} className="p-1.5 hover:bg-white/[0.06] rounded-md transition-colors">
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
          )}
          <button 
            onClick={() => setShowExplorer(!showExplorer)}
            className={`p-1.5 rounded-md transition-colors ${showExplorer ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title="Toggle Explorer (Cmd+B)"
          >
            <Menu size={15} />
          </button>
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Code size={12} className="text-white" />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-200 focus:outline-none focus:text-white w-40"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* View modes */}
          <div className="flex bg-white/[0.03] rounded-md p-0.5 mr-1">
            {(['desktop', 'tablet', 'mobile'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-1.5 rounded-sm transition-colors ${viewMode === mode ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                title={mode}
              >
                {mode === 'desktop' ? <Monitor size={13} /> : mode === 'tablet' ? <Tablet size={13} /> : <Smartphone size={13} />}
              </button>
            ))}
          </div>
          
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
          
          <button 
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-1.5 rounded-md transition-colors ${showTerminal ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title="Terminal"
          >
            <Terminal size={14} />
          </button>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-1.5 rounded-md transition-colors ${showChat ? 'bg-white/[0.06] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title="AI Chat"
          >
            <Bot size={14} />
          </button>
          
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
          
          <button
            onClick={() => setShowGithubConnect(true)}
            className={`p-1.5 rounded-md transition-colors ${githubConnected ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title={githubConnected ? `Connected to ${githubUser?.login}` : 'Connect GitHub'}
          >
            <Github size={14} />
          </button>
          <button
            onClick={startOrShareCollab}
            className={`flex items-center gap-1 p-1.5 rounded-md transition-colors ${collabRoom ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}
            title={collabCopied ? 'Invite link copied!' : collabRoom ? `Live session — ${collabPeers} online. Click to copy invite link` : 'Start live collaboration'}
          >
            <Users size={14} />
            {collabRoom && <span className="text-[10px] font-mono">{collabCopied ? '✓' : collabPeers}</span>}
          </button>
          <button 
            onClick={handleSaveProject}
            disabled={isSaving}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-md transition-colors disabled:opacity-50"
            title="Save (Cmd+S)"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </button>
          <button 
            onClick={downloadProject}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] rounded-md transition-colors"
            title="Download"
          >
            <Download size={14} />
          </button>
          <button 
            className="ml-1 px-3 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
            title="Deploy"
          >
            <Rocket size={12} />
            Deploy
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        {showChat && (
          <>
            <div 
              className="bg-[#0c0c0e] border-r border-white/[0.06] flex flex-col flex-shrink-0 relative"
              style={{ width: chatWidth }}
            >
              {/* Chat Header */}
              <div className="h-10 px-3 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-300">AI Assistant</span>
                </div>
                <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white/[0.06] rounded transition-colors">
                  <PanelLeftClose size={14} className="text-gray-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                {showTemplates && messages.length === 0 ? (
                  <div className="p-4">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">Start with a template</p>
                    <div className="space-y-2">
                      {TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => loadTemplate(template)}
                          className="w-full group p-3 text-left bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] rounded-lg transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${template.gradient} flex items-center justify-center flex-shrink-0`}>
                              <template.icon size={16} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-200 block">{template.name}</span>
                              <span className="text-xs text-gray-500 line-clamp-1">{template.description}</span>
                              <div className="flex gap-1 mt-1.5">
                                {template.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] text-gray-500 rounded">{tag}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/[0.04]">
                      <p className="text-xs text-gray-500 mb-2">Or describe what you want to build</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] ${
                          msg.role === 'user' 
                            ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-br-sm' 
                            : msg.type === 'error'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl rounded-bl-sm'
                            : 'bg-white/[0.03] text-gray-300 rounded-2xl rounded-bl-sm border border-white/[0.04]'
                        } px-3.5 py-2.5 text-sm`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          {msg.files && msg.files.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.files.map(f => {
                                const { color } = getFileIcon(f.name);
                                return (
                                  <span key={f.id} className="text-[10px] px-2 py-0.5 bg-black/20 rounded-full flex items-center gap-1">
                                    <span style={{ color }}>●</span>
                                    {f.name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isGenerating && streamingContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] bg-white/[0.03] text-gray-300 rounded-2xl rounded-bl-sm border border-white/[0.04] px-3.5 py-2.5 text-sm">
                          <p className="whitespace-pre-wrap">{streamingContent.replace(/\[FILE:[^\]]+\]\s*```[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim() || 'Writing code...'}</p>
                        </div>
                      </div>
                    )}
                    
                    {isGenerating && !streamingContent && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-500">Thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Describe what to build..."
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-3 pr-11 text-sm resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder-gray-600 transition-all"
                    rows={3}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isGenerating || !input.trim()}
                    className="absolute right-2 bottom-2.5 p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-fuchsia-600 rounded-lg transition-all"
                  >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-gray-600">Shift + Enter for new line</span>
                  <span className="text-[10px] text-gray-600">{input.length}/2000</span>
                </div>
              </div>
            </div>
            
            {/* Resize handle */}
            <div 
              className="w-1 bg-transparent hover:bg-violet-500/30 cursor-col-resize transition-colors flex-shrink-0"
              onMouseDown={() => setIsResizingChat(true)}
            />
          </>
        )}

        {/* File Explorer */}
        {showExplorer && (
          <div className="w-56 bg-[#0a0a0c] border-r border-white/[0.06] flex flex-col flex-shrink-0">
            <div className="h-10 px-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Explorer</span>
              <button 
                onClick={() => setIsCreatingFile(true)} 
                className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                title="New File"
              >
                <Plus size={13} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {isCreatingFile && (
                <div className="flex items-center gap-1 px-2 py-1.5 mx-1">
                  <File size={13} className="text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') createFile(); if (e.key === 'Escape') setIsCreatingFile(false); }}
                    placeholder="filename.ext"
                    className="flex-1 bg-white/[0.06] px-2 py-1 rounded text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30 min-w-0"
                    autoFocus
                  />
                </div>
              )}
              
              {files.map(file => {
                const { icon: FileIcon, color } = getFileIcon(file.name);
                return (
                  <div
                    key={file.id}
                    className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                      activeFileId === file.id 
                        ? 'bg-violet-500/10 text-white' 
                        : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'
                    }`}
                    onClick={() => openFile(file.id)}
                  >
                    <FileIcon size={14} style={{ color }} className="flex-shrink-0" />
                    <span className="flex-1 text-xs truncate">{file.name}</span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/[0.1] rounded transition-all"
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Editor & Preview */}
          <div className="flex-1 flex overflow-hidden">
            {/* Code Editor */}
            {activeFile && (
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]" style={{ width: `${previewSplit}%` }}>
                {/* Tabs */}
                <div className="h-9 bg-[#0a0a0c] border-b border-white/[0.06] flex items-center overflow-x-auto flex-shrink-0">
                  {openTabs.map(tabId => {
                    const file = files.find(f => f.id === tabId);
                    if (!file) return null;
                    const { icon: FileIcon, color } = getFileIcon(file.name);
                    return (
                      <div
                        key={tabId}
                        onClick={() => setActiveFileId(tabId)}
                        className={`group flex items-center gap-2 px-3 h-full cursor-pointer border-r border-white/[0.04] transition-colors ${
                          activeFileId === tabId 
                            ? 'bg-[#09090b] text-white' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        <FileIcon size={12} style={{ color }} />
                        <span className="text-xs whitespace-nowrap">{file.name}</span>
                        <button
                          onClick={(e) => closeTab(tabId, e)}
                          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.1] transition-all"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Editor (Monaco - the same editor VS Code uses) */}
                <div className="flex-1 overflow-hidden bg-[#09090b]">
                  <Editor
                    key={activeFile.id}
                    path={activeFile.name}
                    language={monacoLanguage(activeFile.name)}
                    value={activeFile.content}
                    onChange={(value) => updateFile(activeFile.id, value ?? '')}
                    theme="vs-dark"
                    options={{
                      fontSize: editorFontSize,
                      minimap: { enabled: false },
                      tabSize: 2,
                      wordWrap: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                      smoothScrolling: true,
                    }}
                    loading={
                      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
                        <Loader2 size={16} className="animate-spin mr-2" /> Loading editor…
                      </div>
                    }
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="flex-1 bg-[#0c0c0e] flex flex-col min-w-0">
              {/* Browser Chrome */}
              <div className="h-9 bg-[#111113] border-b border-white/[0.06] flex items-center px-3 gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1 bg-white/[0.03] rounded-md text-xs text-gray-500 max-w-xs w-full">
                    <Globe size={11} />
                    <span className="truncate">localhost:3000</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (iframeRef.current) {
                      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                      if (doc) { doc.open(); doc.write(buildPreview()); doc.close(); }
                    }
                    addTerminalOutput('Refreshed preview');
                  }} 
                  className="p-1 hover:bg-white/[0.06] rounded transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={12} className="text-gray-500" />
                </button>
              </div>
              
              {/* Preview Frame */}
              <div className="flex-1 flex items-center justify-center bg-[#18181b] p-4 overflow-auto">
                <div 
                  style={{ width: viewportWidths[viewMode], maxWidth: '100%' }} 
                  className="h-full bg-white shadow-2xl shadow-black/50 rounded-lg overflow-hidden transition-all duration-300"
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

          {/* Terminal */}
          {showTerminal && (
            <div className="h-44 bg-[#0a0a0c] border-t border-white/[0.06] flex flex-col flex-shrink-0">
              <div className="h-8 px-3 flex items-center justify-between border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Terminal size={12} className="text-gray-500" />
                    <span className="text-xs text-gray-400 font-medium">Terminal</span>
                  </div>
                  {terminalOutput.length > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] rounded text-gray-600">{terminalOutput.length - 1}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTerminalOutput(['$ Ready'])} className="text-[10px] text-gray-600 hover:text-gray-400 px-2 py-0.5 hover:bg-white/[0.04] rounded transition-colors">
                    Clear
                  </button>
                  <button onClick={() => setShowTerminal(false)} className="p-1 hover:bg-white/[0.04] rounded transition-colors">
                    <X size={12} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={`py-0.5 ${
                    line.includes('✗') || line.includes('Error') ? 'text-red-400' : 
                    line.includes('⚠') ? 'text-yellow-400' : 
                    line.includes('✓') || line.includes('saved') || line.includes('Updated') ? 'text-emerald-400' :
                    'text-gray-500'
                  }`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GitHub Connection Modal */}
      {showGithubConnect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Github size={20} className="text-orange-400" />
                {githubConnected ? 'GitHub Connected' : 'Connect GitHub Account'}
              </h3>
              <button onClick={() => setShowGithubConnect(false)} className="text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>

            {!githubConnected ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Connect your GitHub account to push projects directly to your repositories.
                </p>
                <button
                  onClick={() => {
                    // Trigger Supabase OAuth for GitHub. Redirect must be the
                    // origin (only allow-listed URL); we come back here via
                    // the saved path, and the token is persisted by useAuth.
                    if (isSupabaseConfigured()) {
                      rememberOAuthOrigin('/site-designer', 'github');
                      supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: {
                          redirectTo: window.location.origin,
                          scopes: 'repo,user'
                        }
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/[0.1] rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Github size={16} />
                  Connect with GitHub
                </button>
                <p className="text-xs text-gray-600 text-center">
                  You&apos;ll be able to initialize git repos and push your projects.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <p className="text-sm font-medium text-white mb-1">Connected as:</p>
                  <p className="text-sm text-orange-400">{githubUser?.login}</p>
                </div>
                <button
                  onClick={() => {
                    if (userId) removeOAuthConnection(userId, 'github');
                    setGithubConnected(false);
                    setGithubUser(null);
                    setShowGithubConnect(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-medium transition-colors"
                >
                  Disconnect GitHub
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
