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
      ad_settings: {
        Row: {
          ads_required_for_free_time: number
          created_at: string | null
          free_time_hours: number
          id: string
          interval_minutes: number
          redirect_url: string
          updated_at: string | null
        }
        Insert: {
          ads_required_for_free_time?: number
          created_at?: string | null
          free_time_hours?: number
          id?: string
          interval_minutes?: number
          redirect_url?: string
          updated_at?: string | null
        }
        Update: {
          ads_required_for_free_time?: number
          created_at?: string | null
          free_time_hours?: number
          id?: string
          interval_minutes?: number
          redirect_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_urls: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          url?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          item_id: string | null
          message: string | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          item_id?: string | null
          message?: string | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          item_id?: string | null
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }





      api_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          created_at: string | null
          duration: string
          id: string
          number: number
          season_id: string
          synopsis: string
          thumbnail: string
          title: string
        }
        Insert: {
          created_at?: string | null
          duration: string
          id?: string
          number: number
          season_id: string
          synopsis: string
          thumbnail: string
          title: string
        }
        Update: {
          created_at?: string | null
          duration?: string
          id?: string
          number?: number
          season_id?: string
          synopsis?: string
          thumbnail?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          created_at: string
          embed_url: string | null
          id: string
          last_check_date: string | null
          last_check_message: string | null
          last_check_status: Database["public"]["Enums"]["check_status"] | null
          poster_url: string | null
          published: boolean | null
          seasons: number | null
          synopsis: string | null
          title: string
          tmdb_id: number
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          embed_url?: string | null
          id?: string
          last_check_date?: string | null
          last_check_message?: string | null
          last_check_status?: Database["public"]["Enums"]["check_status"] | null
          poster_url?: string | null
          published?: boolean | null
          seasons?: number | null
          synopsis?: string | null
          title: string
          tmdb_id: number
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          embed_url?: string | null
          id?: string
          last_check_date?: string | null
          last_check_message?: string | null
          last_check_status?: Database["public"]["Enums"]["check_status"] | null
          poster_url?: string | null
          published?: boolean | null
          seasons?: number | null
          synopsis?: string | null
          title?: string
          tmdb_id?: number
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string
        }
        Relationships: []
      }
      movies: {
        Row: {
          cover: string
          created_at: string | null
          created_by: string | null
          duration: string
          genre: string[]
          id: string
          rating: number | null
          synopsis: string
          title: string
          trailer: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          cover: string
          created_at?: string | null
          created_by?: string | null
          duration: string
          genre: string[]
          id?: string
          rating?: number | null
          synopsis: string
          title: string
          trailer?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          cover?: string
          created_at?: string | null
          created_by?: string | null
          duration?: string
          genre?: string[]
          id?: string
          rating?: number | null
          synopsis?: string
          title?: string
          trailer?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ad_free_until: string | null
          ad_preference:
            | Database["public"]["Enums"]["ad_preference_type"]
            | null
          ads_watched_count: number
          created_at: string | null
          email: string | null
          id: string
          is_vip: boolean | null
          updated_at: string | null
          vip_created_at: string | null
          vip_expires_at: string | null
          vip_updated_at: string | null
        }
        Insert: {
          ad_free_until?: string | null
          ad_preference?:
            | Database["public"]["Enums"]["ad_preference_type"]
            | null
          ads_watched_count?: number
          created_at?: string | null
          email?: string | null
          id: string
          is_vip?: boolean | null
          updated_at?: string | null
          vip_created_at?: string | null
          vip_expires_at?: string | null
          vip_updated_at?: string | null
        }
        Update: {
          ad_free_until?: string | null
          ad_preference?:
            | Database["public"]["Enums"]["ad_preference_type"]
            | null
          ads_watched_count?: number
          created_at?: string | null
          email?: string | null
          id?: string
          is_vip?: boolean | null
          updated_at?: string | null
          vip_created_at?: string | null
          vip_expires_at?: string | null
          vip_updated_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          id: string
          number: number
          series_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          number: number
          series_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          number?: number
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          cover: string
          created_at: string | null
          created_by: string | null
          genre: string[]
          id: string
          rating: number | null
          synopsis: string
          title: string
          trailer: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          cover: string
          created_at?: string | null
          created_by?: string | null
          genre: string[]
          id?: string
          rating?: number | null
          synopsis: string
          title: string
          trailer?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          cover?: string
          created_at?: string | null
          created_by?: string | null
          genre?: string[]
          id?: string
          rating?: number | null
          synopsis?: string
          title?: string
          trailer?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_settings: {
        Row: {
          created_at: string | null
          id: string
          monthly_price_cents: number | null
          test_payment_enabled: boolean | null
          updated_at: string | null
          vip_duration_days: number
          vip_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_price_cents?: number | null
          test_payment_enabled?: boolean | null
          updated_at?: string | null
          vip_duration_days?: number
          vip_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_price_cents?: number | null
          test_payment_enabled?: boolean | null
          updated_at?: string | null
          vip_duration_days?: number
          vip_price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_cache: { Args: never; Returns: undefined }
      generate_affiliate_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_main_admin: { Args: { user_id: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_item_id: string
          p_message?: string
          p_status: string
        }
        Returns: string
      }
    }
    Enums: {
      ad_preference_type: "five_at_once" | "one_per_40min"
      app_role: "admin" | "user"
      check_status: "pending" | "ok" | "not_found" | "error"
      media_type: "movie" | "series"
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
      ad_preference_type: ["five_at_once", "one_per_40min"],
      app_role: ["admin", "user"],
      check_status: ["pending", "ok", "not_found", "error"],
      media_type: ["movie", "series"],
    },
  },
} as const
