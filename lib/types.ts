export type Role = 'user' | 'admin'

export interface Theme {
  // Background
  backgroundType: 'solid' | 'gradient' | 'image'
  backgroundColor: string
  gradientFrom: string
  gradientTo: string
  gradientDirection: string
  backgroundImage: string
  // Colors
  accentColor: string
  textColor: string
  // Typography
  font: 'inter' | 'playfair' | 'mono' | 'nunito' | 'lora'
  // Cards
  cardBorderRadius: number
  cardBorderColor: string
  cardShadow: 'none' | 'sm' | 'md' | 'lg'
  cardGlass: boolean
  // Sections
  sectionOrder: string[]
  // Animations
  animationStyle: 'none' | 'fade' | 'slide' | 'pop'
  animationSpeed: 'slow' | 'normal' | 'fast'
  customAnimation: string
  perSectionAnimations: Record<string, string>
  // Custom CSS
  customCSS: string
}

export const DEFAULT_THEME: Theme = {
  backgroundType: 'solid',
  backgroundColor: '#0f0f13',
  gradientFrom: '#0f0f13',
  gradientTo: '#1a1a2e',
  gradientDirection: 'to bottom right',
  backgroundImage: '',
  accentColor: '#7c6aff',
  textColor: '#e8e8f0',
  font: 'inter',
  cardBorderRadius: 12,
  cardBorderColor: 'rgba(255,255,255,0.08)',
  cardShadow: 'md',
  cardGlass: false,
  sectionOrder: ['links', 'projects', 'media', 'quotes', 'concepts'],
  animationStyle: 'fade',
  animationSpeed: 'normal',
  customAnimation: '',
  perSectionAnimations: {},
  customCSS: '',
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  role: Role
  theme: Theme
  created_at: string
  updated_at: string
}

export interface Link {
  id: string
  user_id: string
  label: string
  url: string
  icon: string | null
  is_public: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  user_id: string
  text: string
  author: string | null
  book_id: string | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
  book?: { title: string; author: string } | null
}

export interface Concept {
  id: string
  user_id: string
  title: string
  body: string | null
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'active' | 'complete' | 'paused'
  url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface MediaItem {
  id: string
  user_id: string
  name: string
  type: 'game' | 'book' | 'show' | 'music'
  status: string | null
  cover_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  release_date: string | null
  cover_url: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface QuoteSearchResult {
  book_id: string
  book_title: string
  book_author: string
  snippet: string
}
