export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string | null
          direction: string
          error: string | null
          from_email: string
          from_name: string | null
          html: string | null
          id: string
          is_read: boolean | null
          is_starred: boolean | null
          resend_id: string | null
          status: string
          subject: string
          text_body: string | null
          to_emails: string[]
        }
        Insert: {
          created_at?: string | null
          direction: string
          error?: string | null
          from_email: string
          from_name?: string | null
          html?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          resend_id?: string | null
          status?: string
          subject?: string
          text_body?: string | null
          to_emails?: string[]
        }
        Update: {
          created_at?: string | null
          direction?: string
          error?: string | null
          from_email?: string
          from_name?: string | null
          html?: string | null
          id?: string
          is_read?: boolean | null
          is_starred?: boolean | null
          resend_id?: string | null
          status?: string
          subject?: string
          text_body?: string | null
          to_emails?: string[]
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          api_key_id: string
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          window_start: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          method: string
          request_count: number | null
          updated_at: string | null
          usage_date: string
          user_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          method: string
          request_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          method?: string
          request_count?: number | null
          updated_at?: string | null
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_collections: {
        Row: {
          asset_ids: string[] | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_ids?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      asset_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      boxt_designs: {
        Row: {
          created_at: string | null
          data: Json | null
          height: number
          id: string
          is_public: boolean | null
          is_template: boolean | null
          team_id: string | null
          thumbnail: string | null
          title: string
          updated_at: string | null
          user_id: string
          width: number
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          height?: number
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          team_id?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
          user_id: string
          width?: number
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          height?: number
          id?: string
          is_public?: boolean | null
          is_template?: boolean | null
          team_id?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "boxt_designs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      boxt_templates: {
        Row: {
          category: string
          created_at: string | null
          data: Json | null
          height: number
          id: string
          thumbnail: string | null
          title: string
          width: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          data?: Json | null
          height?: number
          id?: string
          thumbnail?: string | null
          title: string
          width?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          data?: Json | null
          height?: number
          id?: string
          thumbnail?: string | null
          title?: string
          width?: number
        }
        Relationships: []
      }
      color_palettes: {
        Row: {
          colors: Json
          created_at: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          name: string
          source_image_url: string | null
          tags: string[] | null
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          name: string
          source_image_url?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          name?: string
          source_image_url?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "color_palettes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      design_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          file_name: string
          id: string
          image_url: string | null
          is_public: boolean
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          file_name: string
          id?: string
          image_url?: string | null
          is_public?: boolean
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          file_name?: string
          id?: string
          image_url?: string | null
          is_public?: boolean
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_analyses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      design_assets: {
        Row: {
          asset_type: string
          category: string | null
          created_at: string | null
          description: string | null
          download_count: number | null
          file_format: string
          file_size: number | null
          file_url: string
          folder_id: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          tags: string[] | null
          team_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_format: string
          file_size?: number | null
          file_url: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          tags?: string[] | null
          team_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_format?: string
          file_size?: number | null
          file_url?: string
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          team_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "asset_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_assets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      design_collection_items: {
        Row: {
          added_at: string | null
          analysis_id: string
          collection_id: string
          id: string
        }
        Insert: {
          added_at?: string | null
          analysis_id: string
          collection_id: string
          id?: string
        }
        Update: {
          added_at?: string | null
          analysis_id?: string
          collection_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_collection_items_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "design_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "design_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      design_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_comparisons: {
        Row: {
          analysis_ids: string[]
          created_at: string | null
          id: string
          notes: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_ids: string[]
          created_at?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_ids?: string[]
          created_at?: string | null
          id?: string
          notes?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_exports: {
        Row: {
          analysis_id: string
          created_at: string | null
          export_type: string
          export_url: string | null
          id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          export_type: string
          export_url?: string | null
          id?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          export_type?: string
          export_url?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_exports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "design_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      design_favorites: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_favorites_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "design_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      design_tags: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          tag_name: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          tag_name: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          tag_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_tags_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "design_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: string
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gradi_agent_schedules: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          instructions: string
          interval_minutes: number
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string
          title: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          instructions: string
          interval_minutes: number
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          instructions?: string
          interval_minutes?: number
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      gradi_agent_tasks: {
        Row: {
          agent_id: string
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          instructions: string
          result: string | null
          started_at: string | null
          status: string
          steps: Json | null
          title: string
          user_id: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          instructions: string
          result?: string | null
          started_at?: string | null
          status?: string
          steps?: Json | null
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          instructions?: string
          result?: string | null
          started_at?: string | null
          status?: string
          steps?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gradi_agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "gradi_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradi_agent_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradi_agent_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gradi_agents: {
        Row: {
          can_email: boolean | null
          can_search: boolean | null
          can_use_project: boolean | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          is_active: boolean | null
          model: string
          name: string
          project_id: string | null
          system_prompt: string
          temperature: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_email?: boolean | null
          can_search?: boolean | null
          can_use_project?: boolean | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          model?: string
          name: string
          project_id?: string | null
          system_prompt: string
          temperature?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_email?: boolean | null
          can_search?: boolean | null
          can_use_project?: boolean | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          model?: string
          name?: string
          project_id?: string | null
          system_prompt?: string
          temperature?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gradi_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gradi_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gradi_chat_logs: {
        Row: {
          created_at: string | null
          id: string
          message_content: string
          message_role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_content: string
          message_role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message_content?: string
          message_role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gradi_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gradi_messages: {
        Row: {
          code_snippet: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          code_snippet?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          code_snippet?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gradi_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gradi_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gradi_usage: {
        Row: {
          created_at: string | null
          id: string
          last_reset: string | null
          message_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_reset?: string | null
          message_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_reset?: string | null
          message_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      mockup_assets: {
        Row: {
          created_at: string | null
          duration: number | null
          folder_id: string | null
          height: number | null
          id: string
          is_favorite: boolean | null
          name: string
          size: number
          tags: string[] | null
          thumbnail_url: string | null
          type: string
          updated_at: string | null
          url: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          folder_id?: string | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          name: string
          size?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          url: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          folder_id?: string | null
          height?: number | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          size?: number
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string | null
          url?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mockup_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "mockup_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      mockup_folders: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mockup_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "mockup_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      mockup_projects: {
        Row: {
          category: string | null
          created_at: string | null
          design_url: string
          export_settings: Json | null
          id: string
          is_public: boolean | null
          is_video: boolean | null
          mockup_data: Json | null
          mockup_type: string
          preview_url: string | null
          rendered_url: string | null
          team_id: string | null
          template_data: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_duration: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          design_url: string
          export_settings?: Json | null
          id?: string
          is_public?: boolean | null
          is_video?: boolean | null
          mockup_data?: Json | null
          mockup_type: string
          preview_url?: string | null
          rendered_url?: string | null
          team_id?: string | null
          template_data?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_duration?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          design_url?: string
          export_settings?: Json | null
          id?: string
          is_public?: boolean | null
          is_video?: boolean | null
          mockup_data?: Json | null
          mockup_type?: string
          preview_url?: string | null
          rendered_url?: string | null
          team_id?: string | null
          template_data?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mockup_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mockup_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          is_premium: boolean | null
          is_video: boolean | null
          name: string
          preview_image_url: string | null
          settings: Json | null
          subcategory: string | null
          tags: string[] | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_premium?: boolean | null
          is_video?: boolean | null
          name: string
          preview_image_url?: string | null
          settings?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_premium?: boolean | null
          is_video?: boolean | null
          name?: string
          preview_image_url?: string | null
          settings?: Json | null
          subcategory?: string | null
          tags?: string[] | null
          usage_count?: number | null
        }
        Relationships: []
      }
      oauth_access_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          scopes: string[]
          token_hash: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string[]
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_auth_codes: {
        Row: {
          client_id: string
          code: string
          code_challenge: string | null
          code_challenge_method: string | null
          created_at: string | null
          expires_at: string
          id: string
          redirect_uri: string
          scopes: string[]
          used_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          code: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          redirect_uri: string
          scopes?: string[]
          used_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          code?: string
          code_challenge?: string | null
          code_challenge_method?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          redirect_uri?: string
          scopes?: string[]
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_auth_codes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_auth_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_auth_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_clients: {
        Row: {
          client_id: string
          client_secret_hash: string
          created_at: string | null
          description: string | null
          homepage_url: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          redirect_uris: string[]
          scopes: string[]
          updated_at: string | null
          user_id: string
          verification_reason: string | null
          verification_requested_at: string | null
          verification_status: string | null
        }
        Insert: {
          client_id: string
          client_secret_hash: string
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          redirect_uris?: string[]
          scopes?: string[]
          updated_at?: string | null
          user_id: string
          verification_reason?: string | null
          verification_requested_at?: string | null
          verification_status?: string | null
        }
        Update: {
          client_id?: string
          client_secret_hash?: string
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          redirect_uris?: string[]
          scopes?: string[]
          updated_at?: string | null
          user_id?: string
          verification_reason?: string | null
          verification_requested_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_refresh_tokens: {
        Row: {
          access_token_id: string | null
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          access_token_id?: string | null
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          access_token_id?: string | null
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_refresh_tokens_access_token_id_fkey"
            columns: ["access_token_id"]
            isOneToOne: false
            referencedRelation: "oauth_access_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_user_consents: {
        Row: {
          client_id: string
          granted_at: string | null
          id: string
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_user_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      palette_likes: {
        Row: {
          created_at: string | null
          id: string
          palette_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          palette_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          palette_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "palette_likes_palette_id_fkey"
            columns: ["palette_id"]
            isOneToOne: false
            referencedRelation: "color_palettes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_items: {
        Row: {
          added_by: string | null
          content: Json | null
          created_at: string | null
          id: string
          item_id: string | null
          item_type: string
          project_id: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          project_id: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          project_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          owner_id: string
          status: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          owner_id: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          owner_id?: string
          status?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          owner_id: string
          resource_id: string
          resource_type: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id: string
          resource_id: string
          resource_type: string
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id?: string
          resource_id?: string
          resource_type?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          id: number
          payment_intent_id: string
          payment_status: string
          status: Database["public"]["Enums"]["stripe_order_status"]
          updated_at: string | null
        }
        Insert: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at?: string | null
          currency: string
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_intent_id: string
          payment_status: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Update: {
          amount_subtotal?: number
          amount_total?: number
          checkout_session_id?: string
          created_at?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_intent_id?: string
          payment_status?: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string
          deleted_at: string | null
          id: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          analysis_focus: Json | null
          auto_save: boolean | null
          created_at: string | null
          export_format: string | null
          id: string
          notifications_enabled: boolean | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_focus?: Json | null
          auto_save?: boolean | null
          created_at?: string | null
          export_format?: string | null
          id?: string
          notifications_enabled?: boolean | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_focus?: Json | null
          auto_save?: boolean | null
          created_at?: string | null
          export_format?: string | null
          id?: string
          notifications_enabled?: boolean | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_pro_subscriber: boolean | null
          pro_credits_remaining: number | null
          pro_credits_reset_date: string | null
          pro_subscription_expires_at: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_pro_subscriber?: boolean | null
          pro_credits_remaining?: number | null
          pro_credits_reset_date?: string | null
          pro_subscription_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_pro_subscriber?: boolean | null
          pro_credits_remaining?: number | null
          pro_credits_reset_date?: string | null
          pro_subscription_expires_at?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_admin: boolean | null
          is_verified: boolean | null
          subscription_tier: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_admin?: never
          is_verified?: never
          subscription_tier?: never
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_admin?: never
          is_verified?: never
          subscription_tier?: never
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      stripe_user_orders: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          checkout_session_id: string | null
          currency: string | null
          customer_id: string | null
          order_date: string | null
          order_id: number | null
          order_status:
            | Database["public"]["Enums"]["stripe_order_status"]
            | null
          payment_intent_id: string | null
          payment_status: string | null
        }
        Relationships: []
      }
      stripe_user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["stripe_subscription_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invite: { Args: { p_token: string }; Returns: Json }
      expire_pro_subscriptions: { Args: never; Returns: undefined }
      get_admin_emails: { Args: never; Returns: Json }
      get_email_for_username: { Args: { p_username: string }; Returns: string }
      get_shared_resource: { Args: { p_token: string }; Returns: Json }
      get_storage_usage: { Args: never; Returns: Json }
      increment_api_usage: {
        Args: {
          p_api_key_id: string
          p_endpoint: string
          p_method: string
          p_user_id: string
        }
        Returns: number
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_pro_user: { Args: { p_user_id: string }; Returns: boolean }
      is_team_admin: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      reset_monthly_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
