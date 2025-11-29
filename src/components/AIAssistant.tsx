import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';

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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  onNavigate?: (page: string) => void;
  isAdmin?: boolean;
  userId?: string;
}

export function AIAssistant({ onNavigate, isAdmin = false, userId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Gradi, your design buddy! I can help you navigate the site, answer questions about design analysis, or just chat. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [targetPosition, setTargetPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 120 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) return;

    const pickNewTarget = () => {
      const padding = 100;
      const newX = Math.random() * (window.innerWidth - padding * 2) + padding;
      const newY = Math.random() * (window.innerHeight - padding * 2) + padding;
      setTargetPosition({ x: newX, y: newY });
      setIsRunning(true);
    };

    const moveCharacter = () => {
      setPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          setIsRunning(false);
          setTimeout(pickNewTarget, Math.random() * 2000 + 1000);
          return prev;
        }

        const speed = 3;
        const newX = prev.x + (dx / distance) * speed;
        const newY = prev.y + (dy / distance) * speed;

        setDirection(dx < 0 ? 'left' : 'right');

        return { x: newX, y: newY };
      });
    };

    pickNewTarget();
    const interval = setInterval(moveCharacter, 30);

    return () => clearInterval(interval);
  }, [isOpen, targetPosition]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const prompt = `You are Gradi, a friendly and helpful AI assistant for Grraphic, the design analysis tool. You're personified as the hexagonal logo character that runs around the screen.

Context about Grraphic:
- Grraphic analyzes graphic designs using AI (Gemini)
- It provides feedback on typography, color harmony, composition, hierarchy, spacing, and contrast
- Users can upload designs or analyze websites/UIs
- There's a Pro subscription for unlimited analyses
- Users can view their analysis history and share analyses publicly

User message: "${userMessage}"

Respond in a friendly, enthusiastic way (2-3 sentences max). Show personality as a helpful hexagonal design mascot! Be encouraging about design and helpful with navigation.

If the user mentions any of these, suggest navigation:
- "upload" or "analyze" → suggest starting an analysis
- "history" → suggest viewing their analysis history
- "subscription" or "pro" → suggest checking out Pro features
- "sign in" or "account" → suggest signing in

Return your response as plain text, be conversational and friendly!`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 200,
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm having trouble responding right now. Try asking me about design analysis or how to use Grraphic!";

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

    } catch (error) {
      console.error('AI Assistant error:', error);

      // Log error to database and notify admins
      if (userId) {
        logError(error, 'ai_assistant', userId);
      }

      const errorMessage = isAdmin
        ? `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Stack: ${error instanceof Error ? error.stack : 'N/A'}`
        : "I'm so sorry! I'm having a little trouble right now. The admins have been notified and will fix this soon. In the meantime, feel free to explore Grraphic!";

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
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between">
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
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <img
                    src={logoImage}
                    alt="Gradi"
                    className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
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

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
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
          </div>
        </div>
      )}
    </>
  );
}
