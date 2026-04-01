import React, { useState, useEffect, useRef } from 'react';
import { Send, Code, Eye, Download, Copy, RefreshCw, Sparkles, Globe, Layout, Monitor, Wand2, ChevronLeft, ChevronRight, Play, Maximize2, Minimize2 } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { gradiChat } from '../services/groqService';
import { useSubscription } from '../hooks/useSubscription';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: string;
}

interface SiteDesignerProps {
  userId?: string;
  onBack?: () => void;
}

const quickPrompts = [
  { icon: Globe, text: "Create a modern SaaS landing page", color: "from-blue-500 to-cyan-500" },
  { icon: Layout, text: "Design a portfolio website", color: "from-purple-500 to-pink-500" },
  { icon: Monitor, text: "Build a dashboard UI", color: "from-green-500 to-teal-500" },
  { icon: Wand2, text: "Generate a pricing page", color: "from-orange-500 to-red-500" }
];

export function SiteDesigner({ userId, onBack }: SiteDesignerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [showEditor, setShowEditor] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { subscription } = useSubscription(userId);

  const isPro = subscription?.status === 'active';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentCode && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(currentCode);
        doc.close();
      }
    }
  }, [currentCode]);

  const extractCode = (content: string): string | null => {
    const codeMatch = content.match(/```(?:html|jsx|tsx|css)?\n([\s\S]*?)```/);
    return codeMatch ? codeMatch[1] : null;
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
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await gradiChat(userMessage, conversationHistory, {
        currentPage: 'site-designer',
        hasResults: false,
        mode: 'site-designer'
      });

      const extractedCode = extractCode(response);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        code: extractedCode || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (extractedCode) {
        setCurrentCode(extractedCode);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
  };

  const downloadCode = () => {
    const blob = new Blob([currentCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(currentCode);
        doc.close();
      }
    }
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return 'max-w-[375px]';
      case 'tablet': return 'max-w-[768px]';
      default: return 'w-full';
    }
  };

  if (isFullscreen && currentCode) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
          >
            <Minimize2 size={16} />
            Exit Fullscreen
          </button>
        </div>
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Globe size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Site Designer</h1>
              <p className="text-white/70 text-xs flex items-center gap-1">
                Powered by <img src={logoImage} alt="Gradi" className="w-4 h-4 rounded-full inline" /> Gradi AI
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentCode && (
            <>
              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-2 py-1 rounded text-xs ${viewMode === 'mobile' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
                >
                  Mobile
                </button>
                <button
                  onClick={() => setViewMode('tablet')}
                  className={`px-2 py-1 rounded text-xs ${viewMode === 'tablet' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
                >
                  Tablet
                </button>
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-2 py-1 rounded text-xs ${viewMode === 'desktop' ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
                >
                  Desktop
                </button>
              </div>

              <button
                onClick={copyCode}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy Code"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={downloadCode}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Download HTML"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Fullscreen Preview"
              >
                <Maximize2 size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
            title="Toggle Chat"
          >
            <Sparkles size={18} />
          </button>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`p-2 rounded-lg transition-colors ${showEditor ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}
            title="Toggle Code"
          >
            <Code size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        {showChat && (
          <div className={`${showEditor || currentCode ? 'w-80' : 'flex-1 max-w-2xl mx-auto'} flex flex-col bg-gray-900 border-r border-white/10`}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Globe size={48} className="mx-auto text-teal-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">What would you like to build?</h2>
                    <p className="text-gray-400 text-sm">Describe your website and I&apos;ll generate it for you</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(prompt.text);
                          setTimeout(() => handleSend(), 100);
                        }}
                        className={`p-3 rounded-xl bg-gradient-to-r ${prompt.color} hover:shadow-lg transition-all text-white text-left text-sm`}
                      >
                        <div className="flex items-center gap-2">
                          <prompt.icon size={18} />
                          <span>{prompt.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === 'assistant' && message.code
                        ? message.content.split('```')[0].trim() || 'Here is your generated code:'
                        : message.content
                      }
                    </p>
                    {message.code && (
                      <button
                        onClick={() => setCurrentCode(message.code!)}
                        className="mt-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                      >
                        <Play size={12} />
                        Load in Preview
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your website..."
                  className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview/Editor Area */}
        {(currentCode || !showChat) && (
          <div className="flex-1 flex flex-col">
            {currentCode ? (
              <div className="flex-1 flex">
                {/* Code Editor */}
                {showEditor && (
                  <div className="w-1/2 flex flex-col border-r border-white/10">
                    <div className="px-4 py-2 bg-gray-800 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm text-gray-400">index.html</span>
                      <div className="flex gap-1">
                        <button
                          onClick={copyCode}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={currentCode}
                      onChange={(e) => setCurrentCode(e.target.value)}
                      className="flex-1 bg-gray-950 p-4 font-mono text-sm text-gray-300 resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Live Preview */}
                <div className={`${showEditor ? 'w-1/2' : 'flex-1'} flex flex-col bg-gray-100`}>
                  <div className="px-4 py-2 bg-gray-800 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Preview</span>
                    </div>
                    <button
                      onClick={refreshPreview}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="flex-1 flex items-start justify-center p-4 overflow-auto bg-gray-200">
                    <div className={`${getPreviewWidth()} h-full bg-white shadow-2xl rounded-lg overflow-hidden transition-all`}>
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Eye size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Preview will appear here</p>
                  <p className="text-sm mt-1">Start by describing what you want to build</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
