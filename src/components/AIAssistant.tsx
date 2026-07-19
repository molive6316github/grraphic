import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, MicOff, Download, Copy, Maximize2, Minimize2, MessageSquare, Volume2, VolumeX, Camera, Eraser } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { generateIntelligentResponse } from '../utils/gradiIntelligence';
import { gradiChat } from '../services/groqService';

async function logError(error: unknown, context: string, userId: string) {
  try {
    const { supabase } = await import('../lib/supabase');

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    await supabase.from('error_logs').insert({
      user_id: userId,
      error_message: errorMessage,
      error_stack: errorStack,
      context,
      created_at: new Date().toISOString()
    });

    // Notify admins via edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/functions/v1/notify-admin-error`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          error_message: errorMessage,
          error_stack: errorStack,
          context
        })
      });
    }
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

async function logChatMessage(userId: string | undefined, sessionId: string, role: 'user' | 'assistant', content: string) {
  try {
    if (!userId) return;

    const { supabase } = await import('../lib/supabase');

    await supabase.from('gradi_chat_logs').insert({
      user_id: userId,
      session_id: sessionId,
      message_role: role,
      message_content: content,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log chat message:', error);
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
    description: string;
  };
}

interface AIAssistantProps {
  onNavigate?: (page: string) => void;
  isAdmin?: boolean;
  userId?: string;
  screenshotUrl?: string;
  analysisData?: any;
  currentPage?: string;
  hasResults?: boolean;
}

export function AIAssistant({ onNavigate, isAdmin = false, userId, screenshotUrl, analysisData, currentPage = 'upload', hasResults = false }: AIAssistantProps) {
  const [highlightBox, setHighlightBox] = useState<{ x: number; y: number; width: number; height: number; description: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Gradi, your design buddy! I can help you navigate the site, answer questions about design analysis, or just chat. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [targetPosition, setTargetPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [chatPosition, setChatPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 540 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasGreeted, setHasGreeted] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // React to screen context when chat opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);

      // Add a context-aware greeting after a short delay
      setTimeout(() => {
        let contextMessage = "";

        if (currentPage === 'results' && hasResults) {
          const score = analysisData?.overall || 0;
          contextMessage = `I see you just got your analysis results! ${score >= 80 ? "Nice score! 🎉" : "Interesting findings!"} Want me to explain anything or highlight specific areas?`;
        } else if (currentPage === 'privacy') {
          contextMessage = "Reading the privacy policy? I can give you the quick summary if you'd like!";
        } else if (currentPage === 'terms') {
          contextMessage = "Looking at the terms? They're pretty straightforward - want the TL;DR version?";
        } else if (currentPage === 'upload') {
          contextMessage = "Ready to analyze a design? Upload an image and I'll help you make sense of the results!";
        } else if (currentPage === 'history') {
          contextMessage = "Checking out your past analyses? I can help you understand any of them!";
        }

        if (contextMessage) {
          setMessages(prev => [...prev, { role: 'assistant', content: contextMessage }]);
        }
      }, 500);
    }
  }, [isOpen, hasGreeted, currentPage, hasResults, analysisData]);

  const moveToElement = (target: string) => {
    setTimeout(() => {
      let element: Element | null = null;

      if (target === 'mode') {
        const buttons = Array.from(document.querySelectorAll('button'));
        element = buttons.find(btn =>
          btn.textContent?.includes('Design') ||
          btn.textContent?.includes('UI Mode') ||
          btn.textContent?.includes('Website')
        ) || null;
      } else if (target === 'upload') {
        const buttons = Array.from(document.querySelectorAll('button'));
        element = buttons.find(btn =>
          btn.textContent?.includes('Drop') ||
          btn.textContent?.includes('Choose') ||
          btn.querySelector('input[type="file"]')
        ) || null;
      } else if (target === 'history') {
        const buttons = Array.from(document.querySelectorAll('button'));
        element = buttons.find(btn =>
          btn.textContent?.includes('History')
        ) || null;
      } else if (target === 'subscription') {
        const proElements = Array.from(document.querySelectorAll('*'));
        element = proElements.find(el =>
          el.textContent?.includes('Pro') &&
          (el.textContent?.includes('Subscribe') || el.textContent?.includes('$'))
        ) || null;
      } else if (target === 'account') {
        const buttons = Array.from(document.querySelectorAll('button'));
        element = buttons.find(btn =>
          btn.textContent?.includes('Sign In') ||
          btn.textContent?.includes('Account')
        ) || null;
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        setTargetPosition({ x: targetX, y: targetY });
        setIsRunning(true);
      }
    }, 500);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const moveCharacter = () => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          setIsRunning(false);
          // Continue wandering even when chat is open
          setTimeout(() => {
            const padding = 100;
            const newX = Math.random() * (window.innerWidth - padding * 2) + padding;
            const newY = Math.random() * (window.innerHeight - padding * 2) + padding;
            setTargetPosition({ x: newX, y: newY });
            setIsRunning(true);
          }, Math.random() * 2000 + 1000);
          return prev;
        }

        const speed = 3;
        const newX = prev.x + (dx / distance) * speed;
        const newY = prev.y + (dy / distance) * speed;

        setDirection(dx < 0 ? 'left' : 'right');

        return { x: newX, y: newY };
      });
    };

    const interval = setInterval(moveCharacter, 30);
    return () => clearInterval(interval);
  }, [isOpen, targetPosition]);

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

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

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
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesisRef.current = utterance;
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
    const chatText = messages.map(m => `${m.role === 'user' ? 'You' : 'Gradi'}: ${m.content}`).join('\n\n');
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

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you today?"
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Log user message
    logChatMessage(userId, sessionId, 'user', userMessage);

    try {
      // Quick rule-based responses for common questions to save API calls
      const lowerMsg = userMessage.toLowerCase();
      let quickResponse: { message: string; action: string | null } | null = null;

      // Context-aware reactions based on current page
      if (lowerMsg.includes('privacy') || (currentPage === 'privacy' && (lowerMsg.includes('what') || lowerMsg.includes('summary') || lowerMsg.includes('tell me')))) {
        quickResponse = {
          message: "Our privacy policy is simple: We collect minimal data (email, designs you upload), use cookies for authentication, never sell your data, and you can delete your account anytime. We use Supabase for secure storage and Stripe for payments. Your designs are yours!",
          action: null
        };
      } else if (lowerMsg.includes('terms') || (currentPage === 'terms' && (lowerMsg.includes('what') || lowerMsg.includes('summary')))) {
        quickResponse = {
          message: "The terms are straightforward: Use Grraphic for design analysis, don't abuse the service, Pro subscriptions renew monthly, and we reserve the right to moderate content. You own your uploads!",
          action: null
        };
      } else if ((lowerMsg.includes('my results') || lowerMsg.includes('my analysis') || lowerMsg.includes('what did') || lowerMsg.includes('tell me about my')) && hasResults && analysisData) {
        const score = analysisData.overall || 0;
        const topCategory = analysisData.categories ?
          Object.entries(analysisData.categories).reduce((a: any, b: any) => a[1].score > b[1].score ? a : b)[0] : 'design';
        quickResponse = {
          message: `Your design scored ${score}/100! Your strongest area is ${topCategory}. ${score >= 80 ? "Great work! 🎉" : score >= 60 ? "Good foundation, with room for improvement!" : "There's potential here - check the improvement ideas!"} Want me to highlight specific areas?`,
          action: null
        };
      } else if ((lowerMsg.includes('what') || lowerMsg.includes('see')) && currentPage === 'results' && hasResults) {
        quickResponse = {
          message: "I can see your analysis results on screen! They look detailed. Want me to explain any specific category like typography, colors, or spacing? Or ask me to highlight problem areas!",
          action: null
        };
      } else if (lowerMsg.includes('where') || lowerMsg.includes('how do i') || lowerMsg.includes('find')) {
        if (lowerMsg.includes('mode') || lowerMsg.includes('ui') || lowerMsg.includes('design mode')) {
          quickResponse = { message: "Let me show you where to switch modes! I'll run over there now!", action: "MOVE_TO:mode" };
        } else if (lowerMsg.includes('upload') || lowerMsg.includes('add') || lowerMsg.includes('submit')) {
          quickResponse = { message: "I'll show you the upload area! Follow me!", action: "MOVE_TO:upload" };
        } else if (lowerMsg.includes('history') || lowerMsg.includes('past') || lowerMsg.includes('previous')) {
          quickResponse = { message: "Your history is right over here! Let me take you there!", action: "MOVE_TO:history" };
        } else if (lowerMsg.includes('pro') || lowerMsg.includes('subscribe') || lowerMsg.includes('premium')) {
          quickResponse = { message: "Want to see Pro features? I'll show you where they are!", action: "MOVE_TO:subscription" };
        } else if (lowerMsg.includes('sign in') || lowerMsg.includes('login') || lowerMsg.includes('account')) {
          quickResponse = { message: "I'll show you where to sign in! Coming right up!", action: "MOVE_TO:account" };
        }
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg === 'hi' || lowerMsg === 'hey') {
        const greeting = currentPage === 'results' ? "Hey! I see you got your results - they look great! Want me to break down any specific aspect?" :
                        currentPage === 'privacy' ? "Hi! Reading the privacy policy? I can summarize it for you if you'd like!" :
                        currentPage === 'upload' ? "Hey there! Ready to analyze a design? Just upload an image and I'll help you understand the results!" :
                        "Hey there! I'm Gradi, your design assistant! Need help finding something or want to learn about Grraphic?";
        quickResponse = { message: greeting, action: null };
      } else if (lowerMsg.includes('help') || lowerMsg.includes('what can you')) {
        quickResponse = { message: "I can help you navigate Grraphic, explain your analysis results, summarize policies, highlight design issues, and answer questions about using the app!", action: null };
      } else if (lowerMsg.includes('thank') || lowerMsg.includes('thanks')) {
        quickResponse = { message: "You're welcome! Happy to help anytime!", action: null };
      }

      if (quickResponse) {
        // Use quick response without API call
        logChatMessage(userId, sessionId, 'assistant', quickResponse.message);
        setMessages(prev => [...prev, { role: 'assistant', content: quickResponse.message }]);

        // Auto-speak if enabled
        if (isSpeaking) {
          speakMessage(quickResponse.message);
        }

        if (quickResponse.action && quickResponse.action.startsWith('MOVE_TO:')) {
          const target = quickResponse.action.split(':')[1];
          moveToElement(target);
        }

        setIsLoading(false);
        return;
      }

      // Check if user wants to talk about the design/analysis
      const needsAnalysis = analysisData && (
        lowerMsg.includes('show me') || lowerMsg.includes('where') ||
        lowerMsg.includes('point out') || lowerMsg.includes('highlight') ||
        lowerMsg.includes('typography') || lowerMsg.includes('color') ||
        lowerMsg.includes('spacing') || lowerMsg.includes('layout') ||
        lowerMsg.includes('composition') || lowerMsg.includes('contrast') ||
        lowerMsg.includes('hierarchy') || lowerMsg.includes('usability') ||
        lowerMsg.includes('accessibility') || lowerMsg.includes('improve') ||
        lowerMsg.includes('strength') || lowerMsg.includes('weakness') ||
        lowerMsg.includes('overall') || lowerMsg.includes('summary')
      );

      if (needsAnalysis) {
        // Use intelligent response system first (no API needed)
        try {
          const intelligentResponse = generateIntelligentResponse(userMessage, analysisData);

          logChatMessage(userId, sessionId, 'assistant', intelligentResponse.message);
          setMessages(prev => [...prev, { role: 'assistant', content: intelligentResponse.message }]);

          if (intelligentResponse.highlight && screenshotUrl) {
            setHighlightBox(intelligentResponse.highlight);
            setTimeout(() => setHighlightBox(null), 10000);
          }

          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Intelligent response failed:', error);
        }
      }

      // For non-analysis questions, use Groq AI
      if (!import.meta.env.VITE_GROQ_API_KEY) {
        // No API key - use intelligent fallback
        const fallbackMessage = "I can help you navigate Grraphic! Ask me where to find features, or if you have analysis results, I can explain specific aspects like colors, typography, spacing, and more!";
        logChatMessage(userId, sessionId, 'assistant', fallbackMessage);
        setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage }]);
        setIsLoading(false);
        return;
      }

      // Use Groq for conversational responses
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const assistantMessage = await gradiChat(userMessage, conversationHistory, {
        currentPage,
        hasResults,
        analysisData: analysisData ? {
          overall: analysisData.overall,
          categories: Object.keys(analysisData.categories || {})
        } : undefined
      });

      // Log assistant message
      logChatMessage(userId, sessionId, 'assistant', assistantMessage);

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Auto-speak if enabled
      if (isSpeaking) {
        speakMessage(assistantMessage);
      }

    } catch (error) {
      console.error('AI Assistant error:', error);

      // Log error to database and notify admins
      if (userId) {
        logError(error, 'ai_assistant', userId);
      }

      let errorMessage: string;

      // Try to use intelligent response as fallback if we have analysis data
      if (analysisData) {
        try {
          const intelligentResponse = generateIntelligentResponse(userMessage, analysisData);
          errorMessage = intelligentResponse.message;
        } catch (fallbackError) {
          console.error('Intelligent fallback failed:', fallbackError);
          errorMessage = isAdmin
            ? `**Error Details:**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n**Stack Trace:**\n${error instanceof Error ? error.stack : 'N/A'}`
            : "I'm having trouble right now, but if you have analysis results, try asking about specific categories like colors, typography, or spacing!";
        }
      } else {
        if (isAdmin) {
          const errorText = error instanceof Error ? error.message : 'Unknown error';
          const stackTrace = error instanceof Error ? error.stack : 'N/A';
          errorMessage = `**Error Details:**\n\n${errorText}\n\n**Stack Trace:**\n${stackTrace}`;
        } else {
          errorMessage = "I'm so sorry! I'm having a little trouble right now. The admins have been notified and will fix this soon. In the meantime, feel free to explore Grraphic!";
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setChatPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          setIsOpen(!isOpen);
        } else if (e.key === 'e' && isOpen) {
          e.preventDefault();
          exportChatHistory();
        } else if (e.key === 'l' && isOpen) {
          e.preventDefault();
          clearChat();
        } else if (e.key === 'm' && isOpen) {
          e.preventDefault();
          setIsMinimized(!isMinimized);
        }
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isOpen, isMinimized]);

  return (
    <>
      {/* Running Character */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 group transition-all duration-100"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translate(-50%, -50%) scaleX(${direction === 'left' ? -1 : 1})`,
          }}
        >
          <div className="relative">
            {/* Character shadow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-2 bg-black/20 rounded-full blur-sm"></div>

            {/* Logo character with running animation */}
            <div className={`relative ${isRunning ? 'animate-bounce-running' : 'animate-idle-bounce'}`}>
              <img
                src={logoImage}
                alt="Grraphic Assistant"
                className="w-16 h-16 object-contain drop-shadow-2xl"
              />

              {/* Eyes */}
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
              <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
                Click to chat with me!
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-scale-in"
          style={{
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Header - Draggable */}
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={logoImage}
                  alt="Grraphic"
                  className="w-10 h-10 rounded-full bg-white/20 p-1"
                />
                <div>
                  <h3 className="text-white font-bold">Gradi</h3>
                  <p className="text-white/80 text-xs">Your Design Buddy</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Action Bar */}
            <div className="flex items-center space-x-2 mt-2 pb-1 border-t border-white/10 pt-2">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    setIsSpeaking(false);
                  } else {
                    setIsSpeaking(true);
                  }
                }}
                className={`text-white/80 hover:text-white transition-colors p-1 rounded ${isSpeaking ? 'bg-white/20' : ''}`}
                title={isSpeaking ? "Auto-speak enabled (click to disable)" : "Enable auto-speak"}
              >
                {isSpeaking ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button
                onClick={exportChatHistory}
                className="text-white/80 hover:text-white transition-colors p-1"
                title="Export Chat"
              >
                <Download size={14} />
              </button>
              <button
                onClick={clearChat}
                className="text-white/80 hover:text-white transition-colors p-1"
                title="Clear Chat"
              >
                <Eraser size={14} />
              </button>
              {screenshotUrl && (
                <button
                  onClick={() => setIsDrawing(!isDrawing)}
                  className={`text-white/80 hover:text-white transition-colors p-1 ${isDrawing ? 'bg-white/20' : ''}`}
                  title="Annotate Image"
                >
                  <Camera size={14} />
                </button>
              )}
              <div className="flex-1"></div>
              <span className="text-white/60 text-xs">{messages.length - 1} msgs</span>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  {message.role === 'assistant' && (
                    <img
                      src={logoImage}
                      alt="Gradi"
                      className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                    />
                  )}
                  <div className="flex flex-col">
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex space-x-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
                        title="Copy"
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
                          title="Speak"
                        >
                          <Volume2 size={12} />
                          <span>Speak</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {isLoading && (
              <div className="flex justify-start items-start">
                <img
                  src={logoImage}
                  alt="Gradi"
                  className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                />
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          {!isMinimized && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  className={`p-2 rounded-full ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } transition-all duration-300`}
                  title={isListening ? "Stop recording" : "Voice input"}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>💡 Tip: Press Enter to send</span>
                <span>•</span>
                <span>Click mic for voice input</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Highlight Overlay */}
      {highlightBox && screenshotUrl && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            backgroundImage: `url(${screenshotUrl})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            opacity: 0.3
          }}
        >
          <div
            className="absolute border-4 border-blue-500 rounded-lg animate-pulse"
            style={{
              left: `${highlightBox.x * 100}%`,
              top: `${highlightBox.y * 100}%`,
              width: `${highlightBox.width * 100}%`,
              height: `${highlightBox.height * 100}%`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), inset 0 0 20px rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="absolute -top-8 left-0 bg-blue-500 text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
              {highlightBox.description}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
