import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Download, Copy, Volume2, VolumeX, Sparkles, Plus, MessageSquare, Trash2, Check, ChevronDown, RotateCcw, Settings, User, Bot, Code, Image as ImageIcon, X } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { gradiChat } from '../services/groqService';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { GradiAgents } from './GradiAgents';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface GradiChatProps {
  userId?: string;
}

const FREE_MESSAGE_LIMIT = 50;

// Simple markdown-like renderer
const renderContent = (content: string, onCopy: (text: string) => void) => {
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let key = 0;

  // Process code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(<span key={key++}>{renderInlineContent(text)}</span>);
    }

    // Add code block
    const language = match[1] || 'code';
    const code = match[2].trim();
    parts.push(
      <div key={key++} className="my-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
          <span className="text-xs text-gray-400">{language}</span>
          <button
            onClick={() => onCopy(code)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Copy size={12} />
            Copy
          </button>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm text-gray-200 font-mono">{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={key++}>{renderInlineContent(content.slice(lastIndex))}</span>);
  }

  return parts.length > 0 ? parts : renderInlineContent(content);
};

const renderInlineContent = (text: string) => {
  // Split by newlines and process each line
  return text.split('\n').map((line, i) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
    }
    
    // Bold
    let processed: React.ReactNode = line;
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      processed = parts.map((part, j) => 
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
    }
    
    // Inline code
    if (typeof processed === 'string' && processed.includes('`')) {
      const parts = processed.split(/`([^`]+)`/g);
      processed = parts.map((part, j) =>
        j % 2 === 1 ? <code key={j} className="px-1.5 py-0.5 bg-gray-700 rounded text-sm font-mono">{part}</code> : part
      );
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc">{typeof processed === 'string' ? processed.slice(2) : processed}</li>;
    }
    
    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      return <li key={i} className="ml-4 list-decimal">{typeof processed === 'string' ? processed.slice(numberedMatch[0].length) : processed}</li>;
    }

    return line ? <p key={i} className="mb-1">{processed}</p> : <br key={i} />;
  });
};

export function GradiChat({ userId }: GradiChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'chat' | 'agents'>('chat');
  const [isProUser, setIsProUser] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { subscription } = useSubscription(userId);

  // Pro = active Stripe subscription, manual pro grant, or admin
  useEffect(() => {
    if (!userId) return;
    supabase.rpc('is_pro_user', { p_user_id: userId }).then(({ data }) => {
      setIsProUser(data === true);
    });
  }, [userId]);

  const isPro = subscription?.subscription_status === 'active' || isProUser;
  const canSendMessage = isPro || messageCount < FREE_MESSAGE_LIMIT;

  useEffect(() => {
    if (userId) {
      loadSessions();
      loadUsage();
    }
  }, [userId]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const loadSessions = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('gradi_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    setSessions((data || []) as ChatSession[]);
    if (!currentSessionId && data && data.length > 0) {
      setCurrentSessionId(data[0].id);
    } else if (!currentSessionId) {
      createNewSession();
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('gradi_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    setMessages((data || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at ?? Date.now()),
      imageUrl: msg.image_url ?? undefined
    })) as Message[]);
  };

  const loadUsage = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('gradi_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      const resetDate = new Date(data.last_reset ?? Date.now());
      const now = new Date();
      if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
        await supabase.from('gradi_usage').update({ message_count: 0, last_reset: now.toISOString() }).eq('user_id', userId);
        setMessageCount(0);
      } else {
        setMessageCount(data.message_count || 0);
      }
    }
  };

  const createNewSession = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('gradi_chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (data) {
      setSessions(prev => [data as ChatSession, ...prev]);
      setCurrentSessionId(data.id);
      setMessages([]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from('gradi_chat_sessions').delete().eq('id', sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!userId || !currentSessionId) return;
    await supabase.from('gradi_messages').insert({
      session_id: currentSessionId,
      user_id: userId,
      role,
      content
    });

    // Update title from first message
    const session = sessions.find(s => s.id === currentSessionId);
    if (session?.title === 'New Chat' && role === 'user') {
      const title = content.substring(0, 40) + (content.length > 40 ? '...' : '');
      await supabase.from('gradi_chat_sessions').update({ title }).eq('id', currentSessionId);
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canSendMessage) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    await saveMessage('user', userMessage);
    if (!isPro) setMessageCount(prev => prev + 1);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await gradiChat(userMessage, conversationHistory, { currentPage: 'gradi-chat', hasResults: false });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
      await saveMessage('assistant', response);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const regenerateResponse = async (index: number) => {
    if (isLoading) return;
    const userMessages = messages.slice(0, index).filter(m => m.role === 'user');
    if (userMessages.length === 0) return;
    
    const lastUserMessage = userMessages[userMessages.length - 1].content;
    setMessages(prev => prev.slice(0, index));
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(0, index - 1).map(m => ({ role: m.role, content: m.content }));
      const response = await gradiChat(lastUserMessage, conversationHistory, { currentPage: 'gradi-chat', hasResults: false });
      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error regenerating response.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return alert('Voice not supported');
      const recognition = new SpeechRecognition();
      recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const suggestions = [
    "What are the latest design trends?",
    "Help me improve my portfolio",
    "Explain color theory basics",
    "Tips for better typography"
  ];

  return (
    <div className="h-screen flex bg-[#212121] text-white">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-[#171717] flex flex-col transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <div className="p-3">
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 ${
                currentSessionId === session.id ? 'bg-[#2f2f2f]' : 'hover:bg-[#2f2f2f]'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare size={14} className="text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">{session.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#444] rounded"
              >
                <Trash2 size={12} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{isPro ? 'Pro' : 'Free'}</div>
              <div className="text-xs text-gray-500">{isPro ? 'Unlimited' : `${FREE_MESSAGE_LIMIT - messageCount} left`}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-white/10 rounded-lg">
              <MessageSquare size={18} />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Gradi" className="w-6 h-6 rounded-full" />
              <span className="font-medium">Gradi AI</span>
            </div>
            <div className="ml-2 flex items-center gap-1 p-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">
              <button
                onClick={() => setActiveView('chat')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeView === 'chat' ? 'bg-violet-500/25 text-violet-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveView('agents')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeView === 'agents' ? 'bg-violet-500/25 text-violet-200' : 'text-gray-400 hover:text-white'
                }`}
              >
                Agents{!isPro && ' ✦'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => {
              const text = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'chat.txt';
              a.click();
            }} className="p-2 hover:bg-white/10 rounded-lg">
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Agents console */}
        {activeView === 'agents' && userId && (
          <GradiAgents userId={userId} isPro={isPro} onUpgrade={() => setActiveView('chat')} />
        )}

        {/* Messages */}
        {activeView === 'chat' && (
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <Sparkles size={32} />
              </div>
              <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
              <p className="text-gray-400 mb-8 text-center max-w-md">I'm Gradi, your AI design assistant. Ask me about design, UX, color theory, or anything creative.</p>
              
              <div className="grid grid-cols-2 gap-3 max-w-xl w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="p-4 text-left bg-[#2f2f2f] hover:bg-[#3f3f3f] rounded-xl transition-colors"
                  >
                    <span className="text-sm text-gray-300">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-6 ${msg.role === 'user' ? '' : ''}`}>
                  <div className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                        : 'bg-gradient-to-br from-teal-500 to-cyan-600'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">{msg.role === 'user' ? 'You' : 'Gradi'}</div>
                      <div className="text-gray-200 leading-relaxed">
                        {renderContent(msg.content, copyToClipboard)}
                      </div>
                      
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => copyToClipboard(msg.content, i)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedIndex === i ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                          </button>
                          <button
                            onClick={() => regenerateResponse(i)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          >
                            <RotateCcw size={14} className="text-gray-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        )}

        {/* Input */}
        {activeView === 'chat' && (
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-[#2f2f2f] rounded-2xl border border-white/10">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message Gradi..."
                className="w-full bg-transparent px-4 py-3 pr-24 resize-none focus:outline-none max-h-48"
                rows={1}
                disabled={!canSendMessage}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button onClick={toggleVoice} className={`p-2 rounded-lg ${isListening ? 'bg-red-500' : 'hover:bg-white/10'}`}>
                  {isListening ? <MicOff size={18} /> : <Mic size={18} className="text-gray-400" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !canSendMessage}
                  className="p-2 bg-white text-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Gradi can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
