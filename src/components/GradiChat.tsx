import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Download, Copy, Volume2, VolumeX, ImagePlus, Sparkles, Clock, BookOpen, Lightbulb, X, Plus, MessageSquare, Code, Trash2, Globe, Wand2, Layout, Monitor } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { gradiChat } from '../services/groqService';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { SiteDesignerWorkspace } from './SiteDesignerWorkspace';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  codeSnippet?: string;
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

type ChatMode = 'assistant' | 'site-designer';

const FREE_MESSAGE_LIMIT = 50; // 50 messages per month for free users

const siteDesignerPrompts = [
  { icon: Globe, text: "Create a modern SaaS landing page", color: "from-blue-500 to-cyan-500" },
  { icon: Layout, text: "Design a portfolio website", color: "from-purple-500 to-pink-500" },
  { icon: Monitor, text: "Build a dashboard UI", color: "from-green-500 to-teal-500" },
  { icon: Wand2, text: "Generate a pricing page", color: "from-orange-500 to-red-500" }
];

export function GradiChat({ userId }: GradiChatProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [lastReset, setLastReset] = useState<Date>(new Date());
  const [chatMode, setChatMode] = useState<ChatMode>('assistant');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showSiteDesignerWorkspace, setShowSiteDesignerWorkspace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { subscription } = useSubscription(userId);

  const isPro = subscription?.status === 'active';
  const canSendMessage = isPro || messageCount < FREE_MESSAGE_LIMIT;
  const remainingMessages = isPro ? '∞' : Math.max(0, FREE_MESSAGE_LIMIT - messageCount);

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

  const loadSessions = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('gradi_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      return;
    }

    setSessions(data || []);

    // If no current session, create or select one
    if (!currentSessionId) {
      if (data && data.length > 0) {
        setCurrentSessionId(data[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('gradi_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const loadedMessages: Message[] = (data || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.created_at),
      imageUrl: msg.image_url,
      codeSnippet: msg.code_snippet
    }));

    setMessages(loadedMessages);
  };

  const loadUsage = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('gradi_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading usage:', error);
      return;
    }

    if (data) {
      const resetDate = new Date(data.last_reset);
      const now = new Date();

      // Reset counter if it's a new month
      if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
        await supabase
          .from('gradi_usage')
          .update({ message_count: 0, last_reset: now.toISOString() })
          .eq('user_id', userId);
        setMessageCount(0);
        setLastReset(now);
      } else {
        setMessageCount(data.message_count || 0);
        setLastReset(resetDate);
      }
    } else {
      // Create usage record
      await supabase
        .from('gradi_usage')
        .insert({ user_id: userId, message_count: 0 });
    }
  };

  const incrementUsage = async () => {
    if (!userId || isPro) return;

    const newCount = messageCount + 1;
    setMessageCount(newCount);

    await supabase
      .from('gradi_usage')
      .update({ message_count: newCount })
      .eq('user_id', userId);
  };

  const createNewSession = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('gradi_chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return;
    }

    setSessions(prev => [data, ...prev]);
    setCurrentSessionId(data.id);
    setMessages([]);
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('gradi_chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

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

  const saveMessage = async (role: 'user' | 'assistant', content: string, imageUrl?: string, codeSnippet?: string) => {
    if (!userId || !currentSessionId) return;

    await supabase
      .from('gradi_messages')
      .insert({
        session_id: currentSessionId,
        user_id: userId,
        role,
        content,
        image_url: imageUrl,
        code_snippet: codeSnippet
      });

    // Update session timestamp
    await supabase
      .from('gradi_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentSessionId);

    // Auto-generate title from first user message
    const session = sessions.find(s => s.id === currentSessionId);
    if (session && session.title === 'New Chat' && role === 'user') {
      const title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      await supabase
        .from('gradi_chat_sessions')
        .update({ title })
        .eq('id', currentSessionId);

      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, title } : s));
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser. Try Chrome or Edge!');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const exportChatHistory = () => {
    const chatText = messages.map(m =>
      `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'You' : 'Gradi'}: ${m.content}`
    ).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradi-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertCode = () => {
    if (codeContent.trim()) {
      setInput(prev => prev + '\n\n```\n' + codeContent + '\n```');
      setCodeContent('');
      setShowCodePanel(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !canSendMessage) return;

    const userMessage = input.trim();
    const imageUrl = selectedImage;
    const hasCode = userMessage.includes('```');
    let codeSnippet = undefined;

    if (hasCode) {
      const codeMatch = userMessage.match(/```[\s\S]*?```/);
      if (codeMatch) {
        codeSnippet = codeMatch[0];
      }
    }

    setInput('');
    setSelectedImage(null);

    const newMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      imageUrl,
      codeSnippet
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    // Save user message
    await saveMessage('user', userMessage, imageUrl, codeSnippet);
    await incrementUsage();

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const assistantMessage = await gradiChat(userMessage, conversationHistory, {
        currentPage: 'gradi-chat',
        hasResults: false,
        mode: chatMode
      });

      // Extract code blocks for Site Designer mode
      if (chatMode === 'site-designer') {
        const codeMatch = assistantMessage.match(/```(?:html|jsx|tsx|css)?\n([\s\S]*?)```/);
        if (codeMatch) {
          setGeneratedCode(codeMatch[1]);
        }
      }

      const responseMessage: Message = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, responseMessage]);

      // Save assistant message
      await saveMessage('assistant', assistantMessage);

      if (isSpeaking) {
        speakMessage(assistantMessage);
      }
    } catch (error) {
      console.error('Gradi error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble responding right now. Please try again!",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = chatMode === 'site-designer' ? siteDesignerPrompts : [
    { icon: Sparkles, text: "Give me design inspiration", color: "from-purple-500 to-pink-500" },
    { icon: Lightbulb, text: "Tips for better UX", color: "from-yellow-500 to-orange-500" },
    { icon: BookOpen, text: "Explain design principles", color: "from-blue-500 to-cyan-500" },
    { icon: Clock, text: "What's trending in design?", color: "from-green-500 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer mb-2 ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <MessageSquare size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {session.title}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {isPro ? (
                <span className="flex items-center space-x-1">
                  <Sparkles size={12} className="text-purple-500" />
                  <span>Pro: Unlimited Messages</span>
                </span>
              ) : (
                <span>Free: {remainingMessages} / {FREE_MESSAGE_LIMIT} left</span>
              )}
            </div>
            {!isPro && (
              <button className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-6 ${chatMode === 'site-designer' 
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600' 
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={logoImage} alt="Gradi" className="w-14 h-14 rounded-full bg-white/20 p-2" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {chatMode === 'site-designer' ? 'Site Designer' : 'Gradi AI'}
                </h1>
                <p className="text-white/80 text-sm">
                  {chatMode === 'site-designer' ? 'AI-Powered Website Builder' : 'Your Personal Design Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mode Toggle */}
              <div className="flex bg-white/10 rounded-full p-1 mr-2">
                <button
                  onClick={() => setChatMode('assistant')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    chatMode === 'assistant' 
                      ? 'bg-white text-gray-900' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Assistant
                </button>
                <button
                  onClick={() => setChatMode('site-designer')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    chatMode === 'site-designer' 
                      ? 'bg-white text-gray-900' 
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Site Designer
                </button>
              </div>
              <button
                onClick={() => setShowCodePanel(!showCodePanel)}
                className={`p-3 rounded-full ${showCodePanel ? 'bg-white/30' : 'bg-white/10'} hover:bg-white/20 transition-colors text-white`}
                title="Code tools"
              >
                <Code size={20} />
              </button>
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    setIsSpeaking(false);
                  } else {
                    setIsSpeaking(true);
                  }
                }}
                className={`p-3 rounded-full ${isSpeaking ? 'bg-white/30' : 'bg-white/10'} hover:bg-white/20 transition-colors text-white`}
                title={isSpeaking ? "Auto-speak enabled" : "Enable auto-speak"}
              >
                {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button
                onClick={exportChatHistory}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Export chat"
              >
                <Download size={20} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-white/80 text-sm">
            <div className="flex items-center space-x-6">
              <span>{messages.length} messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span>{isLoading ? 'Thinking...' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Quick Start</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt.text);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${prompt.color} hover:shadow-lg transition-all duration-300 text-white text-left group`}
                  >
                    <div className="flex items-center space-x-3">
                      <prompt.icon size={24} className="group-hover:scale-110 transition-transform" />
                      <span className="font-medium">{prompt.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
              <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-3xl`}>
                {message.role === 'assistant' && (
                  <img src={logoImage} alt="Gradi" className="w-10 h-10 rounded-full flex-shrink-0" />
                )}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                  <div className={`rounded-3xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  } shadow-lg`}>
                    {message.imageUrl && (
                      <img src={message.imageUrl} alt="Uploaded" className="max-w-xs rounded-xl mb-3" />
                    )}
                    <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                    {message.role === 'assistant' && (
                      <>
                        {chatMode === 'site-designer' && message.content.includes('```') && (
                          <button
                            onClick={() => {
                              const codeMatch = message.content.match(/```(?:html|jsx|tsx|css)?\n([\s\S]*?)```/);
                              if (codeMatch) {
                                setGeneratedCode(codeMatch[1]);
                                setShowSiteDesignerWorkspace(true);
                              }
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center space-x-1 px-2 py-1 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/20"
                          >
                            <Code size={12} />
                            <span>Open in Designer</span>
                          </button>
                        )}
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Volume2 size={12} />
                          <span>Speak</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-start">
              <img src={logoImage} alt="Gradi" className="w-10 h-10 rounded-full mr-3 flex-shrink-0" />
              <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl px-6 py-4 shadow-lg">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Code Panel */}
        {showCodePanel && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Code Snippet</h3>
              <button
                onClick={() => setShowCodePanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
            <textarea
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              placeholder="Paste your code here..."
              className="w-full h-32 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              onClick={insertCode}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Insert Code
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img src={selectedImage} alt="Selected" className="max-w-xs rounded-xl" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {!canSendMessage && (
            <div className="mb-3 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              You've reached the free limit of {FREE_MESSAGE_LIMIT} messages this month. Upgrade to Pro for unlimited access!
            </div>
          )}

          <div className="flex items-end space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Upload image"
              disabled={isLoading || !canSendMessage}
            >
              <ImagePlus size={24} />
            </button>

            <button
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              className={`p-3 rounded-full ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              } transition-all duration-300`}
              title={isListening ? "Stop recording" : "Voice input"}
              disabled={isLoading || !canSendMessage}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canSendMessage ? "Ask Gradi anything about design..." : "Upgrade to Pro to continue chatting..."}
              className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              disabled={isLoading || !canSendMessage}
              rows={1}
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !canSendMessage}
              className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Send size={24} />
            </button>
          </div>

          <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>

      {/* Site Designer Workspace */}
      {showSiteDesignerWorkspace && generatedCode && (
        <SiteDesignerWorkspace
          code={generatedCode}
          onClose={() => setShowSiteDesignerWorkspace(false)}
          onCodeChange={(newCode) => setGeneratedCode(newCode)}
        />
      )}
    </div>
  );
}
