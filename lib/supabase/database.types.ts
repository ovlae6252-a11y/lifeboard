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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      content_filters: {
        Row: {
          created_at: string
          filter_type: string
          id: string
          is_active: boolean
          keywords: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter_type: string
          id?: string
          is_active?: boolean
          keywords: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter_type?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      grouping_jobs: {
        Row: {
          article_ids: string[]
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          article_ids: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          article_ids?: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      news_article_groups: {
        Row: {
          article_count: number
          category: string
          created_at: string
          fact_summary: string | null
          id: string
          is_summarized: boolean
          is_valid: boolean
          representative_article_id: string | null
          representative_published_at: string | null
          summarized_at: string | null
        }
        Insert: {
          article_count?: number
          category: string
          created_at?: string
          fact_summary?: string | null
          id?: string
          is_summarized?: boolean
          is_valid?: boolean
          representative_article_id?: string | null
          representative_published_at?: string | null
          summarized_at?: string | null
        }
        Update: {
          article_count?: number
          category?: string
          created_at?: string
          fact_summary?: string | null
          id?: string
          is_summarized?: boolean
          is_valid?: boolean
          representative_article_id?: string | null
          representative_published_at?: string | null
          summarized_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_representative_article"
            columns: ["representative_article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author: string | null
          category: string
          created_at: string
          description: string | null
          group_id: string | null
          guid: string
          id: string
          image_url: string | null
          is_deleted: boolean
          original_url: string
          published_at: string | null
          source_id: string
          title: string
          title_normalized: string
        }
        Insert: {
          author?: string | null
          category: string
          created_at?: string
          description?: string | null
          group_id?: string | null
          guid: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          original_url: string
          published_at?: string | null
          source_id: string
          title: string
          title_normalized: string
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          description?: string | null
          group_id?: string | null
          guid?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          original_url?: string
          published_at?: string | null
          source_id?: string
          title?: string
          title_normalized?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "news_article_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_fetch_logs: {
        Row: {
          articles_fetched: number
          articles_new: number
          created_at: string
          error_message: string | null
          filtered_count: number
          id: string
          source_id: string
          status: string
        }
        Insert: {
          articles_fetched?: number
          articles_new?: number
          created_at?: string
          error_message?: string | null
          filtered_count?: number
          id?: string
          source_id: string
          status: string
        }
        Update: {
          articles_fetched?: number
          articles_new?: number
          created_at?: string
          error_message?: string | null
          filtered_count?: number
          id?: string
          source_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_fetch_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          category: string
          created_at: string
          feed_url: string
          id: string
          is_active: boolean
          last_fetched_at: string | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          feed_url: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          feed_url?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name?: string
        }
        Relationships: []
      }
      summarize_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          group_id: string
          id: string
          requested_by: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          group_id: string
          id?: string
          requested_by?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          group_id?: string
          id?: string
          requested_by?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "summarize_jobs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "news_article_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "news_article_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          dashboard_config: Json
          email_digest_enabled: boolean
          preferred_categories: Json
          updated_at: string
          user_id: string
          weather_location: string
        }
        Insert: {
          dashboard_config?: Json
          email_digest_enabled?: boolean
          preferred_categories?: Json
          updated_at?: string
          user_id: string
          weather_location?: string
        }
        Update: {
          dashboard_config?: Json
          email_digest_enabled?: boolean
          preferred_categories?: Json
          updated_at?: string
          user_id?: string
          weather_location?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_group_articles: {
        Args: {
          p_articles: Json
          p_hours_range?: number
          p_similarity_threshold?: number
        }
        Returns: {
          article_id: string
          group_id: string
          is_new_group: boolean
        }[]
      }
      cleanup_old_records: { Args: never; Returns: Json }
      enqueue_summarize_jobs: {
        Args: { p_group_ids: string[]; p_requested_by?: string }
        Returns: number
      }
      find_similar_group: {
        Args: {
          p_category: string
          p_hours_range?: number
          p_similarity_threshold?: number
          p_title_normalized: string
        }
        Returns: {
          group_id: string
          similarity: number
        }[]
      }
      get_top_articles_for_groups: {
        Args: { p_group_ids: string[]; p_limit_per_group?: number }
        Returns: {
          group_id: string
          id: string
          original_url: string
          source_name: string
          title: string
        }[]
      }
      get_user_bookmarks: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          article_count: number
          articles: Json
          bookmarked_at: string
          category: string
          created_at: string
          fact_summary: string
          id: string
          is_summarized: boolean
          representative_article: Json
        }[]
      }
      increment_article_count: {
        Args: { p_group_id: string }
        Returns: undefined
      }
      merge_groups: {
        Args: { p_source_ids: string[]; p_target_id: string }
        Returns: undefined
      }
      search_news_groups: {
        Args: {
          p_category?: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          article_count: number
          articles: Json
          category: string
          created_at: string
          fact_summary: string
          id: string
          is_summarized: boolean
          match_score: number
          representative_article: Json
          total_count: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
