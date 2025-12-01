import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Download, Copy, Volume2, VolumeX, Eraser, ImagePlus, Sparkles, Clock, BookOpen, Lightbulb, X } from 'lucide-react';
import logoImage from '../assets/ae52010de59e187ce864ed24eee6209a.png';
import { gradiChat } from '../services/groqService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface GradiChatProps {
  userId?: string;
}

export function GradiChat({ userId }: GradiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey there! I'm Gradi, your personal design AI assistant! 🎨\n\nI can help you with:\n• Design advice and best practices\n• Color theory and typography guidance\n• Layout and composition tips\n• Critique your design ideas\n• Answer any creative questions\n\nWhat would you like to explore today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! What would you like to talk about?",
      timestamp: new Date()
    }]);
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const imageUrl = selectedImage;
    setInput('');
    setSelectedImage(null);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      imageUrl
    }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const assistantMessage = await gradiChat(userMessage, conversationHistory, {
        currentPage: 'gradi-chat',
        hasResults: false
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      }]);

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

  const quickPrompts = [
    { icon: Sparkles, text: "Give me design inspiration", color: "from-purple-500 to-pink-500" },
    { icon: Lightbulb, text: "Tips for better UX", color: "from-yellow-500 to-orange-500" },
    { icon: BookOpen, text: "Explain design principles", color: "from-blue-500 to-cyan-500" },
    { icon: Clock, text: "What's trending in design?", color: "from-green-500 to-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={logoImage}
                alt="Gradi"
                className="w-16 h-16 rounded-full bg-white/20 p-2"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">Gradi AI</h1>
                <p className="text-white/80">Your Personal Design Assistant</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    setIsSpeaking(false);
                  } else {
                    setIsSpeaking(true);
                  }
                }}
                className={`p-3 rounded-full ${
                  isSpeaking ? 'bg-white/30' : 'bg-white/10'
                } hover:bg-white/20 transition-colors text-white`}
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
              <button
                onClick={clearChat}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                title="Clear chat"
              >
                <Eraser size={20} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center justify-between text-white/80 text-sm">
            <div className="flex items-center space-x-6">
              <span>{messages.length} messages</span>
              <span>•</span>
              <span>Powered by Groq AI</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span>{isLoading ? 'Thinking...' : 'Ready'}</span>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
            >
              <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3 max-w-3xl`}>
                {message.role === 'assistant' && (
                  <img
                    src={logoImage}
                    alt="Gradi"
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                )}
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                  <div
                    className={`rounded-3xl px-6 py-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    } shadow-lg`}
                  >
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
                      <button
                        onClick={() => speakMessage(message.content)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Volume2 size={12} />
                        <span>Speak</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-start">
              <img
                src={logoImage}
                alt="Gradi"
                className="w-10 h-10 rounded-full mr-3 flex-shrink-0"
              />
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
              disabled={isLoading}
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
              disabled={isLoading}
            >
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Gradi anything about design..."
              className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
    </div>
  );
}
