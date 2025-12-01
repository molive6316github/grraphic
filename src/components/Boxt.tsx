import React, { useState, useEffect, useRef } from 'react';
import {
  Square, Circle, Type, Download, Save, Undo, Redo,
  Trash2, Copy, ZoomIn, ZoomOut, Grid, Move, Upload,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, X,
  Plus, FolderOpen, Sparkles, Search, MessageSquare, BarChart,
  Underline, Strikethrough, Maximize2, Minimize2, RotateCw,
  AlignJustify, ChevronUp, ChevronDown, Wand2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSubscription } from '../hooks/useSubscription';
import { analyzeDesign } from '../utils/designAnalyzer';
import { gradiChat } from '../services/groqService';

interface DesignElement {
  id: string;
  type: 'rect' | 'circle' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  imageUrl?: string;
  rotation?: number;
  opacity?: number;
  textDecoration?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: string;
  textShadow?: string;
  borderRadius?: number;
}

interface BoxtProps {
  userId?: string;
}

const FREE_DESIGN_LIMIT = 5;
const PIXABAY_API_KEY = '48388095-62e5301173806e83180fb2e60';

export function Boxt({ userId }: BoxtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rect' | 'circle' | 'text'>('select');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fillColor, setFillColor] = useState('#3B82F6');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [zoom, setZoom] = useState(0.5);
  const [showGrid, setShowGrid] = useState(true);
  const [designTitle, setDesignTitle] = useState('Untitled Design');
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
  const [myDesigns, setMyDesigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showMyDesigns, setShowMyDesigns] = useState(false);
  const [showPixabay, setShowPixabay] = useState(false);
  const [showGradi, setShowGradi] = useState(false);
  const [showGrraphic, setShowGrraphic] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayImages, setPixabayImages] = useState<any[]>([]);
  const [pixabayLoading, setPixabayLoading] = useState(false);

  const [gradiInput, setGradiInput] = useState('');
  const [gradiMessages, setGradiMessages] = useState<any[]>([]);
  const [gradiLoading, setGradiLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [agentWorking, setAgentWorking] = useState(false);

  const [grraphicAnalysis, setGrraphicAnalysis] = useState<any>(null);
  const [grraphicLoading, setGrraphicLoading] = useState(false);

  const [history, setHistory] = useState<DesignElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { subscription } = useSubscription(userId);
  const isPro = subscription?.status === 'active';
  const canCreateDesign = isPro || myDesigns.length < FREE_DESIGN_LIMIT;

  useEffect(() => {
    if (userId) {
      loadMyDesigns();
      loadTemplates();
    }
  }, [userId]);

  useEffect(() => {
    drawCanvas();
  }, [elements, backgroundColor, zoom, showGrid, canvasWidth, canvasHeight]);

  const loadMyDesigns = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('boxt_designs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (data) setMyDesigns(data);
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('boxt_templates')
      .select('*')
      .order('created_at', { ascending: false});
    if (data) setTemplates(data);
  };

  const saveDesign = async () => {
    if (!userId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumbnail = canvas.toDataURL('image/png');
    const designData = { elements, backgroundColor, width: canvasWidth, height: canvasHeight };

    if (currentDesignId) {
      await supabase.from('boxt_designs').update({
        title: designTitle, thumbnail, data: designData, width: canvasWidth, height: canvasHeight
      }).eq('id', currentDesignId);
    } else {
      const { data } = await supabase.from('boxt_designs').insert({
        user_id: userId, title: designTitle, thumbnail, data: designData, width: canvasWidth, height: canvasHeight
      }).select().single();
      if (data) setCurrentDesignId(data.id);
    }
    loadMyDesigns();
  };

  const loadDesign = (design: any) => {
    setDesignTitle(design.title);
    setCurrentDesignId(design.id);
    setCanvasWidth(design.width);
    setCanvasHeight(design.height);
    setBackgroundColor(design.data.backgroundColor || '#ffffff');
    setElements(design.data.elements || []);
    setShowMyDesigns(false);
  };

  const loadTemplate = (template: any) => {
    setDesignTitle(template.title + ' (Copy)');
    setCurrentDesignId(null);
    setCanvasWidth(template.width);
    setCanvasHeight(template.height);
    setBackgroundColor(template.data.backgroundColor || '#ffffff');
    setElements(template.data.elements || []);
    setShowTemplates(false);
  };

  const newDesign = () => {
    if (!canCreateDesign) {
      alert(`Free users can create up to ${FREE_DESIGN_LIMIT} designs. Upgrade to Pro!`);
      return;
    }
    setDesignTitle('Untitled Design');
    setCurrentDesignId(null);
    setElements([]);
    setBackgroundColor('#ffffff');
    setShowTemplates(true);
  };

  const searchPixabay = async () => {
    if (!pixabayQuery.trim()) return;
    setPixabayLoading(true);
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(pixabayQuery)}&image_type=photo&per_page=20`
      );
      const data = await response.json();
      setPixabayImages(data.hits || []);
    } catch (error) {
      console.error('Pixabay error:', error);
    }
    setPixabayLoading(false);
  };

  const addPixabayImage = (imageUrl: string) => {
    addElement({
      id: Date.now().toString(),
      type: 'image',
      x: 100, y: 100,
      width: 400, height: 300,
      imageUrl
    });
    setShowPixabay(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addElement({
        id: Date.now().toString(),
        type: 'image',
        x: 100, y: 100,
        width: 400, height: 300,
        imageUrl: event.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const askGradi = async () => {
    if (!gradiInput.trim() || gradiLoading) return;
    const userMessage = gradiInput.trim();
    setGradiInput('');
    setGradiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setGradiLoading(true);

    try {
      if (agentMode) {
        await executeAgentMode(userMessage);
      } else {
        const response = await gradiChat(userMessage, gradiMessages, {
          currentPage: 'boxt-editor',
          hasResults: false
        });
        setGradiMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Gradi error:', error);
    }
    setGradiLoading(false);
  };

  const executeAgentMode = async (userRequest: string) => {
    setAgentWorking(true);
    setGradiMessages(prev => [...prev, { role: 'assistant', content: '🤖 Agent Mode Activated! Generating design plan...' }]);

    const agentPrompt = `You are an autonomous design agent controlling Boxt. User request: "${userRequest}"

CRITICAL RULES:
1. Output ONLY tool commands, nothing else
2. Each command on a new line
3. Use realistic coordinates for ${canvasWidth}x${canvasHeight} canvas
4. Create professional, balanced designs
5. Use complementary colors

AVAILABLE TOOLS:
ADD_RECT(x, y, width, height, fillColor, strokeColor)
ADD_CIRCLE(x, y, radius, fillColor, strokeColor)
ADD_TEXT(x, y, text, fontSize, fontFamily, textColor, bold, italic)
SEARCH_IMAGE(searchQuery)
SET_BACKGROUND(hexColor)

EXAMPLE:
SET_BACKGROUND(#1a1a2e)
ADD_RECT(100, 100, 400, 300, #4f46e5, #8b5cf6)
ADD_TEXT(120, 150, Welcome!, 48, Impact, #ffffff, true, false)
SEARCH_IMAGE(mountain landscape)

NOW CREATE THE DESIGN:`;

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const fallbackKey = import.meta.env.VITE_GEMINI_API_KEY;

      let response: string;

      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are a design automation AI. Output only tool commands, no explanations.' },
              { role: 'user', content: agentPrompt }
            ],
            temperature: 0.9,
            max_tokens: 2000,
            top_p: 1,
          }),
        });

        if (!groqResponse.ok) throw new Error('Groq failed');
        const data = await groqResponse.json();
        response = data.choices[0]?.message?.content || '';
        setGradiMessages(prev => [...prev, { role: 'assistant', content: '✨ Using Groq AI to generate design...' }]);
      } catch (error) {
        console.log('Groq failed, using Gemini fallback');
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${fallbackKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: agentPrompt }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 2000 }
            })
          }
        );
        const geminiData = await geminiResponse.json();
        response = geminiData.candidates[0]?.content?.parts[0]?.text || '';
        setGradiMessages(prev => [...prev, { role: 'assistant', content: '✨ Using Gemini AI to generate design...' }]);
      }

      const actions = parseAgentActions(response);
      if (actions.length === 0) {
        setGradiMessages(prev => [...prev, { role: 'assistant', content: '❌ Could not parse design commands. Try again!' }]);
        setAgentWorking(false);
        return;
      }

      setGradiMessages(prev => [...prev, { role: 'assistant', content: `🎨 Executing ${actions.length} actions...` }]);

      for (let i = 0; i < actions.length; i++) {
        await executeAction(actions[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
        setGradiMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: `🎨 [${i + 1}/${actions.length}] ${actions[i].tool}(${actions[i].params.slice(0, 2).join(', ')}...)`
          };
          return newMessages;
        });
      }

      setGradiMessages(prev => [...prev, { role: 'assistant', content: '✅ Design complete! What do you think?' }]);
    } catch (error) {
      console.error('Agent error:', error);
      setGradiMessages(prev => [...prev, { role: 'assistant', content: '❌ Agent error: ' + String(error) }]);
    }

    setAgentWorking(false);
  };

  const parseAgentActions = (response: string): any[] => {
    const actions: any[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('```') || trimmed.length < 5) continue;

      const match = trimmed.match(/^(\w+)\s*\((.*)\)\s*$/);
      if (match) {
        const [, tool, paramsStr] = match;

        const params: any[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < paramsStr.length; i++) {
          const char = paramsStr[i];
          if (char === '\"' || char === '\'') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            params.push(cleanParam(current.trim()));
            current = '';
          } else {
            current += char;
          }
        }
        if (current.trim()) {
          params.push(cleanParam(current.trim()));
        }

        actions.push({ tool, params });
      }
    }

    return actions;
  };

  const cleanParam = (param: string): any => {
    const cleaned = param.replace(/^['\"]+|['\"]+$/g, '');
    if (cleaned === 'true') return true;
    if (cleaned === 'false') return false;
    if (cleaned.startsWith('#')) return cleaned;
    const num = Number(cleaned);
    if (!isNaN(num) && cleaned !== '') return num;
    return cleaned;
  };

  const executeAction = async (action: any) => {
    const { tool, params } = action;

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        switch (tool) {
          case 'ADD_RECT':
            const rect = {
              id: Date.now().toString() + Math.random(),
              type: 'rect' as const,
              x: Number(params[0]) || 100,
              y: Number(params[1]) || 100,
              width: Number(params[2]) || 200,
              height: Number(params[3]) || 150,
              fill: String(params[4]) || fillColor,
              stroke: String(params[5]) || strokeColor,
              strokeWidth: 2
            };
            setElements(prev => {
              const newElements = [...prev, rect];
              addToHistory(newElements);
              return newElements;
            });
            break;

          case 'ADD_CIRCLE':
            const circle = {
              id: Date.now().toString() + Math.random(),
              type: 'circle' as const,
              x: Number(params[0]) || 100,
              y: Number(params[1]) || 100,
              width: (Number(params[2]) || 75) * 2,
              height: (Number(params[2]) || 75) * 2,
              fill: String(params[3]) || fillColor,
              stroke: String(params[4]) || strokeColor,
              strokeWidth: 2
            };
            setElements(prev => {
              const newElements = [...prev, circle];
              addToHistory(newElements);
              return newElements;
            });
            break;

          case 'ADD_TEXT':
            const text = {
              id: Date.now().toString() + Math.random(),
              type: 'text' as const,
              x: Number(params[0]) || 100,
              y: Number(params[1]) || 100,
              width: 400,
              height: 50,
              text: String(params[2]) || 'Text',
              fontSize: Number(params[3]) || 24,
              fontFamily: String(params[4]) || 'Arial',
              fill: String(params[5]) || '#000000',
              fontWeight: params[6] ? 'bold' : 'normal',
              fontStyle: params[7] ? 'italic' : 'normal'
            };
            setElements(prev => {
              const newElements = [...prev, text];
              addToHistory(newElements);
              return newElements;
            });
            break;

          case 'SEARCH_IMAGE':
            if (params[0]) {
              setPixabayQuery(String(params[0]));
              searchPixabayForAgent(String(params[0]));
            }
            break;

          case 'ADD_IMAGE':
            if (params[4]) {
              const image = {
                id: Date.now().toString() + Math.random(),
                type: 'image' as const,
                x: Number(params[0]) || 100,
                y: Number(params[1]) || 100,
                width: Number(params[2]) || 400,
                height: Number(params[3]) || 300,
                imageUrl: String(params[4])
              };
              setElements(prev => {
                const newElements = [...prev, image];
                addToHistory(newElements);
                return newElements;
              });
            }
            break;

          case 'SET_BACKGROUND':
            setBackgroundColor(String(params[0]) || '#ffffff');
            break;

          case 'MOVE_ELEMENT':
            setElements(prev => prev.map(el =>
              el.id === params[0] ? { ...el, x: Number(params[1]), y: Number(params[2]) } : el
            ));
            break;

          case 'RESIZE_ELEMENT':
            setElements(prev => prev.map(el =>
              el.id === params[0] ? { ...el, width: Number(params[1]), height: Number(params[2]) } : el
            ));
            break;

          case 'UPDATE_TEXT':
            setElements(prev => prev.map(el =>
              el.id === params[0] ? { ...el, [params[1]]: params[2] } : el
            ));
            break;
        }
        resolve();
      }, 100);
    });
  };

  const searchPixabayForAgent = async (query: string) => {
    try {
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5`
      );
      const data = await response.json();
      if (data.hits && data.hits.length > 0) {
        const randomImage = data.hits[Math.floor(Math.random() * data.hits.length)];
        const image = {
          id: Date.now().toString() + Math.random(),
          type: 'image' as const,
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          imageUrl: randomImage.webformatURL
        };
        setElements(prev => {
          const newElements = [...prev, image];
          addToHistory(newElements);
          return newElements;
        });
      }
    } catch (error) {
      console.error('Agent Pixabay error:', error);
    }
  };

  const analyzeDesignWithGrraphic = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGrraphicLoading(true);
    try {
      const imageData = canvas.toDataURL('image/png');
      const analysis = await analyzeDesign({
        url: imageData,
        name: designTitle,
        size: canvas.width * canvas.height,
        type: 'image/png'
      });
      setGrraphicAnalysis(analysis);
    } catch (error) {
      console.error('Analysis error:', error);
    }
    setGrraphicLoading(false);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth * zoom, canvasHeight * zoom);

    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const gridSize = 50 * zoom;
      for (let x = 0; x < canvasWidth * zoom; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight * zoom);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight * zoom; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth * zoom, y);
        ctx.stroke();
      }
    }

    elements.forEach(element => {
      ctx.save();
      ctx.globalAlpha = element.opacity || 1;

      if (element.type === 'rect') {
        ctx.fillStyle = element.fill || fillColor;
        ctx.fillRect(element.x * zoom, element.y * zoom, element.width * zoom, element.height * zoom);
        if (element.stroke) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = (element.strokeWidth || 1) * zoom;
          ctx.strokeRect(element.x * zoom, element.y * zoom, element.width * zoom, element.height * zoom);
        }
      } else if (element.type === 'circle') {
        const centerX = (element.x + element.width / 2) * zoom;
        const centerY = (element.y + element.height / 2) * zoom;
        ctx.fillStyle = element.fill || fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, (element.width / 2) * zoom, 0, Math.PI * 2);
        ctx.fill();
        if (element.stroke) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = (element.strokeWidth || 1) * zoom;
          ctx.stroke();
        }
      } else if (element.type === 'text') {
        ctx.fillStyle = element.fill || '#000000';
        ctx.font = `${element.fontStyle || ''} ${element.fontWeight || ''} ${(element.fontSize || 24) * zoom}px ${element.fontFamily || 'Arial'}`;
        ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(element.text || 'Text', element.x * zoom, (element.y + (element.fontSize || 24)) * zoom);
      } else if (element.type === 'image' && element.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = element.imageUrl;
        img.onload = () => {
          ctx.drawImage(img, element.x * zoom, element.y * zoom, element.width * zoom, element.height * zoom);
        };
        try {
          ctx.drawImage(img, element.x * zoom, element.y * zoom, element.width * zoom, element.height * zoom);
        } catch (e) {}
      }

      if (selectedId === element.id) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.strokeRect(element.x * zoom - 5, element.y * zoom - 5, element.width * zoom + 10, element.height * zoom + 10);
      }

      ctx.restore();
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (tool === 'select') {
      const clicked = elements.find(el => x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height);
      setSelectedId(clicked?.id || null);
    } else if (tool === 'rect') {
      addElement({ id: Date.now().toString(), type: 'rect', x, y, width: 200, height: 150, fill: fillColor, stroke: strokeColor, strokeWidth: 2 });
      setTool('select');
    } else if (tool === 'circle') {
      addElement({ id: Date.now().toString(), type: 'circle', x: x - 75, y: y - 75, width: 150, height: 150, fill: fillColor, stroke: strokeColor, strokeWidth: 2 });
      setTool('select');
    } else if (tool === 'text') {
      const newTextId = Date.now().toString();
      addElement({ id: newTextId, type: 'text', x, y, width: 200, height: 50, fill: fillColor, text: 'Double-click to edit', fontSize: 24, fontFamily: 'Arial' });
      setTool('select');
      setEditingTextId(newTextId);
      setTextInput('Double-click to edit');
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedId) return;
    const element = elements.find(el => el.id === selectedId);
    if (element && element.type === 'text') {
      setEditingTextId(selectedId);
      setTextInput(element.text || '');
    }
  };

  const updateTextElement = () => {
    if (!editingTextId) return;
    setElements(prev => prev.map(el => el.id === editingTextId ? { ...el, text: textInput } : el));
    setEditingTextId(null);
    setTextInput('');
  };

  const addElement = (element: DesignElement) => {
    const newElements = [...elements, element];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedId(element.id);
  };

  const addToHistory = (newElements: DesignElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const deleteSelected = () => {
    if (selectedId) {
      const newElements = elements.filter(el => el.id !== selectedId);
      setElements(newElements);
      addToHistory(newElements);
      setSelectedId(null);
    }
  };

  const duplicateSelected = () => {
    if (selectedId) {
      const element = elements.find(el => el.id === selectedId);
      if (element) {
        addElement({ ...element, id: Date.now().toString(), x: element.x + 20, y: element.y + 20 });
      }
    }
  };

  const exportDesign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    elements.forEach(element => {
      ctx.save();
      ctx.globalAlpha = element.opacity || 1;

      if (element.type === 'rect') {
        ctx.fillStyle = element.fill || fillColor;
        ctx.fillRect(element.x, element.y, element.width, element.height);
        if (element.stroke) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth || 1;
          ctx.strokeRect(element.x, element.y, element.width, element.height);
        }
      } else if (element.type === 'circle') {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.fillStyle = element.fill || fillColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, element.width / 2, 0, Math.PI * 2);
        ctx.fill();
        if (element.stroke) {
          ctx.strokeStyle = element.stroke;
          ctx.lineWidth = element.strokeWidth || 1;
          ctx.stroke();
        }
      } else if (element.type === 'text') {
        ctx.fillStyle = element.fill || '#000000';
        ctx.font = `${element.fontStyle || ''} ${element.fontWeight || ''} ${element.fontSize || 24}px ${element.fontFamily || 'Arial'}`;
        ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
        ctx.fillText(element.text || 'Text', element.x, element.y + (element.fontSize || 24));
      } else if (element.type === 'image' && element.imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = element.imageUrl;
        try {
          ctx.drawImage(img, element.x, element.y, element.width, element.height);
        } catch (e) {}
      }

      ctx.restore();
    });

    const url = tempCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designTitle}.png`;
    a.click();
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 p-4 flex items-center justify-between shadow-lg shadow-black/5">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg shadow-purple-500/30">
            <Sparkles className="text-white animate-pulse" size={28} />
            <h1 className="text-2xl font-black text-white tracking-tight">Boxt</h1>
          </div>
          <input
            type="text"
            value={designTitle}
            onChange={(e) => setDesignTitle(e.target.value)}
            className="px-4 py-2.5 border border-purple-200 dark:border-purple-800 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-inner"
            placeholder="Untitled Masterpiece"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={() => setShowGradi(!showGradi)} className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105" title="Ask Gradi AI">
            <MessageSquare size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-sm font-semibold">Gradi AI</span>
          </button>
          <button onClick={() => { setShowGrraphic(!showGrraphic); if (!showGrraphic) analyzeDesignWithGrraphic(); }} className="group flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105" title="Analyze with Grraphic">
            <BarChart size={18} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold">Analyze</span>
          </button>
          <button onClick={newDesign} className="flex items-center space-x-2 px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700">
            <Plus size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">New</span>
          </button>
          <button onClick={() => setShowMyDesigns(!showMyDesigns)} className="flex items-center space-x-2 px-4 py-2.5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-slate-700">
            <FolderOpen size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Designs ({myDesigns.length})</span>
          </button>
          <div className="flex items-center space-x-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-1 shadow-md border border-gray-200 dark:border-slate-700">
            <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Undo">
              <Undo size={18} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg disabled:opacity-30 transition-all duration-200 hover:scale-110" title="Redo">
              <Redo size={18} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
          <button onClick={saveDesign} className="group flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 transition-all duration-300 hover:scale-105 font-semibold">
            <Save size={18} className="group-hover:rotate-12 transition-transform" />
            <span>Save</span>
          </button>
          <button onClick={exportDesign} className="group flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-600/40 hover:shadow-emerald-600/60 transition-all duration-300 hover:scale-105 font-semibold">
            <Download size={18} className="group-hover:translate-y-1 transition-transform" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-24 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50 flex flex-col items-center py-6 space-y-3 shadow-2xl">
          <button onClick={() => setTool('select')} className={`group relative p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${tool === 'select' ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-md'}`} title="Select">
            <Move size={24} className={tool === 'select' ? 'text-white' : 'text-gray-700 dark:text-gray-300'} />
            {tool === 'select' && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>}
          </button>
          <button onClick={() => setTool('rect')} className={`group relative p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${tool === 'rect' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-md'}`} title="Rectangle">
            <Square size={24} className={tool === 'rect' ? 'text-white' : 'text-gray-700 dark:text-gray-300'} />
            {tool === 'rect' && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>}
          </button>
          <button onClick={() => setTool('circle')} className={`group relative p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${tool === 'circle' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-md'}`} title="Circle">
            <Circle size={24} className={tool === 'circle' ? 'text-white' : 'text-gray-700 dark:text-gray-300'} />
            {tool === 'circle' && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>}
          </button>
          <button onClick={() => setTool('text')} className={`group relative p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${tool === 'text' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-md'}`} title="Text">
            <Type size={24} className={tool === 'text' ? 'text-white' : 'text-gray-700 dark:text-gray-300'} />
            {tool === 'text' && <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>}
          </button>
          <button onClick={() => setShowPixabay(true)} className="group p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/50 hover:shadow-violet-500/70 transition-all duration-300 hover:scale-110" title="Search Images">
            <Search size={24} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="group p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110" title="Upload Image">
            <Upload size={24} className="group-hover:translate-y-1 transition-transform duration-300" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <div className="pt-6 mt-auto border-t border-white/20 dark:border-slate-700/50 w-full flex flex-col items-center space-y-3">
            <button onClick={() => setShowGrid(!showGrid)} className={`group p-4 rounded-2xl transition-all duration-300 hover:scale-110 ${showGrid ? 'bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-md'}`} title="Toggle grid">
              <Grid size={24} className={showGrid ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform'} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-100 via-purple-50 to-blue-100 dark:from-slate-800 dark:via-purple-950 dark:to-blue-950 p-8 flex items-center justify-center relative">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={canvasWidth * zoom}
              height={canvasHeight * zoom}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] cursor-crosshair rounded-2xl ring-1 ring-black/5 dark:ring-white/10"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-2xl -z-10 opacity-50"></div>
          </div>

          {showGradi && (
            <div className="absolute right-4 top-4 bottom-4 w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] flex flex-col border border-white/20 dark:border-slate-700/50 overflow-hidden">
              <div className="p-5 border-b border-purple-100 dark:border-slate-700/50 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <MessageSquare size={20} className="text-blue-600" />
                    <span>Ask Gradi</span>
                  </h3>
                  <button onClick={() => setShowGradi(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <X size={20} />
                  </button>
                </div>
                <button
                  onClick={() => setAgentMode(!agentMode)}
                  className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    agentMode
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  disabled={agentWorking}
                >
                  <Wand2 size={16} className={agentWorking ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">
                    {agentWorking ? 'Agent Working...' : agentMode ? '🤖 Agent Mode ON' : 'Agent Mode OFF'}
                  </span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {gradiMessages.map((msg, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-8' : 'bg-gray-100 dark:bg-gray-700 mr-8'}`}>
                    <p className="text-sm text-gray-900 dark:text-white">{msg.content}</p>
                  </div>
                ))}
                {gradiLoading && (
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 mr-8">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={gradiInput}
                    onChange={(e) => setGradiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && askGradi()}
                    placeholder="Ask for design help..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  />
                  <button onClick={askGradi} disabled={gradiLoading || !gradiInput.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showGrraphic && (
            <div className="absolute right-4 top-4 bottom-4 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                  <BarChart size={20} className="text-purple-600" />
                  <span>Design Analysis</span>
                </h3>
                <button onClick={() => setShowGrraphic(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {grraphicLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : grraphicAnalysis ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-purple-600">{grraphicAnalysis.overallScore}</div>
                      <p className="text-gray-600 dark:text-gray-400">Overall Score</p>
                    </div>
                    {Object.entries(grraphicAnalysis.categories).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">{key}</span>
                          <span className="text-lg font-bold text-purple-600">{value.score}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{value.feedback}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">Click Analyze to see design feedback</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fill Color</label>
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background</label>
              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zoom: {Math.round(zoom * 100)}%</label>
              <div className="flex items-center space-x-2">
                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  <ZoomOut size={16} />
                </button>
                <input type="range" min="0.1" max="2" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1" />
                <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {selectedElement && selectedElement.type === 'text' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Text Properties</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size: {selectedElement.fontSize || 24}px</label>
                  <input type="range" min="8" max="200" value={selectedElement.fontSize || 24} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: parseInt(e.target.value) } : el))} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Family</label>
                  <select value={selectedElement.fontFamily || 'Arial'} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontFamily: e.target.value } : el))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Impact">Impact</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Palatino">Palatino</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' } : el))} className={`p-2 rounded ${selectedElement.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Bold">
                    <Bold size={16} className="mx-auto" />
                  </button>
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' } : el))} className={`p-2 rounded ${selectedElement.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Italic">
                    <Italic size={16} className="mx-auto" />
                  </button>
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' } : el))} className={`p-2 rounded ${selectedElement.textDecoration === 'underline' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Underline">
                    <Underline size={16} className="mx-auto" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textAlign: 'left' } : el))} className={`p-2 rounded ${selectedElement.textAlign === 'left' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Align Left">
                    <AlignLeft size={16} className="mx-auto" />
                  </button>
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textAlign: 'center' } : el))} className={`p-2 rounded ${selectedElement.textAlign === 'center' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Align Center">
                    <AlignCenter size={16} className="mx-auto" />
                  </button>
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textAlign: 'right' } : el))} className={`p-2 rounded ${selectedElement.textAlign === 'right' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Align Right">
                    <AlignRight size={16} className="mx-auto" />
                  </button>
                  <button onClick={() => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textAlign: 'justify' } : el))} className={`p-2 rounded ${selectedElement.textAlign === 'justify' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`} title="Justify">
                    <AlignJustify size={16} className="mx-auto" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Line Height: {selectedElement.lineHeight || 1.2}</label>
                  <input type="range" min="0.5" max="3" step="0.1" value={selectedElement.lineHeight || 1.2} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, lineHeight: parseFloat(e.target.value) } : el))} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Letter Spacing: {selectedElement.letterSpacing || 0}px</label>
                  <input type="range" min="-5" max="20" value={selectedElement.letterSpacing || 0} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, letterSpacing: parseInt(e.target.value) } : el))} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Opacity: {Math.round((selectedElement.opacity || 1) * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.05" value={selectedElement.opacity || 1} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, opacity: parseFloat(e.target.value) } : el))} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Transform</label>
                  <select value={selectedElement.textTransform || 'none'} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedId ? { ...el, textTransform: e.target.value } : el))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                    <option value="none">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="lowercase">lowercase</option>
                    <option value="capitalize">Capitalize</option>
                  </select>
                </div>
              </div>
            )}

            {selectedId && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Selected Element</h4>
                <button onClick={duplicateSelected} className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Copy size={16} />
                  <span>Duplicate</span>
                </button>
                <button onClick={deleteSelected} className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Layers ({elements.length})</h4>
              <div className="space-y-1">
                {elements.map((el, idx) => (
                  <div key={el.id} onClick={() => setSelectedId(el.id)} className={`p-2 rounded cursor-pointer ${selectedId === el.id ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{el.type}</span>
                      <span className="text-xs text-gray-500">#{idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingTextId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Text</h3>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none" autoFocus />
            <div className="flex space-x-3 mt-4">
              <button onClick={updateTextElement} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update</button>
              <button onClick={() => { setEditingTextId(null); setTextInput(''); }} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPixabay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Images</h2>
              <button onClick={() => setShowPixabay(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6">
              <div className="flex space-x-2 mb-4">
                <input type="text" value={pixabayQuery} onChange={(e) => setPixabayQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchPixabay()} placeholder="Search for images..." className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
                <button onClick={searchPixabay} disabled={pixabayLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"><Search size={20} /></button>
              </div>
              <div className="overflow-y-auto max-h-[50vh]">
                {pixabayLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {pixabayImages.map((img) => (
                      <button key={img.id} onClick={() => addPixabayImage(img.webformatURL)} className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all">
                        <img src={img.previewURL} alt={img.tags} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4">
                {templates.map(template => (
                  <button key={template.id} onClick={() => loadTemplate(template)} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-all group">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      <Sparkles size={32} className="text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{template.title}</h3>
                    <p className="text-sm text-gray-500">{template.width} × {template.height}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMyDesigns && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Designs</h2>
              <button onClick={() => setShowMyDesigns(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {myDesigns.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-500">No designs yet. Create your first design!</p></div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {myDesigns.map(design => (
                    <button key={design.id} onClick={() => loadDesign(design)} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 transition-all group">
                      {design.thumbnail ? (
                        <img src={design.thumbnail} alt={design.title} className="w-full aspect-video object-cover rounded-lg mb-3" />
                      ) : (
                        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                          <Sparkles size={32} className="text-gray-400 group-hover:text-blue-500" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{design.title}</h3>
                      <p className="text-sm text-gray-500">{new Date(design.updated_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
