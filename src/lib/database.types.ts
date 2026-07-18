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
      boxt_designs: {
        Row: {
          created_at: string | null
          data: Json | null
          height: number
          id: string
          is_public: boolean | null
          is_template: boolean | null
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
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          width?: number
        }
        Relationships: []
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
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      design_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          file_name: string
          id: string
          image_url: string | null
          is_public: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          file_name: string
          id?: string
          image_url?: string | null
          is_public?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          file_name?: string
          id?: string
          image_url?: string | null
          is_public?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          tags: string[] | null
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
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          tags?: string[] | null
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
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          template_data?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_duration?: number | null
        }
        Relationships: []
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
      expire_pro_subscriptions: { Args: never; Returns: undefined }
      get_admin_emails: { Args: never; Returns: Json }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
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
