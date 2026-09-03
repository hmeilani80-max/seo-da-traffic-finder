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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backlinks: {
        Row: {
          anchor_text: string | null
          created_at: string
          dr: number | null
          first_seen_at: string | null
          id: string
          keyword: string | null
          last_checked_at: string | null
          link_type: string
          placement_order_id: string | null
          project_id: string | null
          source_domain: string
          source_url: string | null
          status: string
          target_url: string | null
          traffic: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string
          dr?: number | null
          first_seen_at?: string | null
          id?: string
          keyword?: string | null
          last_checked_at?: string | null
          link_type?: string
          placement_order_id?: string | null
          project_id?: string | null
          source_domain: string
          source_url?: string | null
          status?: string
          target_url?: string | null
          traffic?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          anchor_text?: string | null
          created_at?: string
          dr?: number | null
          first_seen_at?: string | null
          id?: string
          keyword?: string | null
          last_checked_at?: string | null
          link_type?: string
          placement_order_id?: string | null
          project_id?: string | null
          source_domain?: string
          source_url?: string | null
          status?: string
          target_url?: string | null
          traffic?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlinks_placement_order_id_fkey"
            columns: ["placement_order_id"]
            isOneToOne: false
            referencedRelation: "placement_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlinks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      check_logs: {
        Row: {
          created_at: string
          domain: string
          dr: number | null
          hasil: string
          id: string
          pesan: string | null
          traffic: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          dr?: number | null
          hasil: string
          id?: string
          pesan?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          dr?: number | null
          hasil?: string
          id?: string
          pesan?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      domain_sudah_pernah: {
        Row: {
          checked_at: string
          created_at: string
          domain: string
          dr: number | null
          id: string
          keyword: string | null
          notes: string | null
          price: number | null
          purchase_date: string | null
          research_status: string
          status: string
          target_page: string | null
          traffic: number | null
          user_id: string | null
        }
        Insert: {
          checked_at?: string
          created_at?: string
          domain: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          research_status?: string
          status?: string
          target_page?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Update: {
          checked_at?: string
          created_at?: string
          domain?: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          research_status?: string
          status?: string
          target_page?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      global_domain_cache: {
        Row: {
          authority_checked_at: string | null
          backlinks: number | null
          created_at: string
          dr: number | null
          id: string
          normalized_domain: string
          provider: string
          raw_data: Json | null
          referring_domains: number | null
          top_keywords: Json | null
          top_pages: Json | null
          traffic: number | null
          traffic_checked_at: string | null
          updated_at: string
        }
        Insert: {
          authority_checked_at?: string | null
          backlinks?: number | null
          created_at?: string
          dr?: number | null
          id?: string
          normalized_domain: string
          provider?: string
          raw_data?: Json | null
          referring_domains?: number | null
          top_keywords?: Json | null
          top_pages?: Json | null
          traffic?: number | null
          traffic_checked_at?: string | null
          updated_at?: string
        }
        Update: {
          authority_checked_at?: string | null
          backlinks?: number | null
          created_at?: string
          dr?: number | null
          id?: string
          normalized_domain?: string
          provider?: string
          raw_data?: Json | null
          referring_domains?: number | null
          top_keywords?: Json | null
          top_pages?: Json | null
          traffic?: number | null
          traffic_checked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      keyword_metrics_cache: {
        Row: {
          checked_at: string
          country: string
          cpc: number | null
          created_at: string
          id: string
          keyword: string
          keyword_difficulty: number | null
          normalized_keyword: string
          provider: string
          raw_data: Json | null
          search_volume: number | null
          traffic_potential: number | null
          updated_at: string
        }
        Insert: {
          checked_at?: string
          country?: string
          cpc?: number | null
          created_at?: string
          id?: string
          keyword: string
          keyword_difficulty?: number | null
          normalized_keyword: string
          provider?: string
          raw_data?: Json | null
          search_volume?: number | null
          traffic_potential?: number | null
          updated_at?: string
        }
        Update: {
          checked_at?: string
          country?: string
          cpc?: number | null
          created_at?: string
          id?: string
          keyword?: string
          keyword_difficulty?: number | null
          normalized_keyword?: string
          provider?: string
          raw_data?: Json | null
          search_volume?: number | null
          traffic_potential?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      keyword_rank_cache: {
        Row: {
          checked_at: string
          country: string
          created_at: string
          dr: number | null
          id: string
          keyword: string
          normalized_keyword: string
          position: number | null
          provider: string
          ranking_title: string | null
          ranking_url: string | null
          raw_data: Json | null
          target_domain: string
          traffic: number | null
          updated_at: string
          ur: number | null
        }
        Insert: {
          checked_at?: string
          country?: string
          created_at?: string
          dr?: number | null
          id?: string
          keyword: string
          normalized_keyword: string
          position?: number | null
          provider?: string
          ranking_title?: string | null
          ranking_url?: string | null
          raw_data?: Json | null
          target_domain: string
          traffic?: number | null
          updated_at?: string
          ur?: number | null
        }
        Update: {
          checked_at?: string
          country?: string
          created_at?: string
          dr?: number | null
          id?: string
          keyword?: string
          normalized_keyword?: string
          position?: number | null
          provider?: string
          ranking_title?: string | null
          ranking_url?: string | null
          raw_data?: Json | null
          target_domain?: string
          traffic?: number | null
          updated_at?: string
          ur?: number | null
        }
        Relationships: []
      }
      placement_orders: {
        Row: {
          anchor_text: string | null
          created_at: string
          dr: number | null
          id: string
          keyword: string | null
          notes: string | null
          placed_at: string | null
          price: number | null
          project_id: string | null
          search_volume: number | null
          source_domain: string
          status: string
          target_url: string | null
          traffic: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_text?: string | null
          created_at?: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          placed_at?: string | null
          price?: number | null
          project_id?: string | null
          search_volume?: number | null
          source_domain: string
          status?: string
          target_url?: string | null
          traffic?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          anchor_text?: string | null
          created_at?: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          placed_at?: string | null
          price?: number | null
          project_id?: string | null
          search_volume?: number | null
          source_domain?: string
          status?: string
          target_url?: string | null
          traffic?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_domain: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_domain?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          client_domain?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          first_searched_at: string
          id: string
          last_searched_at: string
          normalized_query: string
          query: string
          search_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          normalized_query: string
          query: string
          search_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          first_searched_at?: string
          id?: string
          last_searched_at?: string
          normalized_query?: string
          query?: string
          search_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      seo_research_runs: {
        Row: {
          cache_hit: boolean
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          provider: string
          query: string | null
          result_count: number | null
          search_type: string
          status: string
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          provider?: string
          query?: string | null
          result_count?: number | null
          search_type: string
          status?: string
        }
        Update: {
          cache_hit?: boolean
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          provider?: string
          query?: string | null
          result_count?: number | null
          search_type?: string
          status?: string
        }
        Relationships: []
      }
      sudah_dibeli: {
        Row: {
          checked_at: string
          created_at: string
          domain: string
          dr: number | null
          id: string
          keyword: string | null
          notes: string | null
          price: number | null
          purchase_date: string | null
          research_status: string
          search_volume: number | null
          status: string
          target_page: string | null
          traffic: number | null
          user_id: string | null
        }
        Insert: {
          checked_at?: string
          created_at?: string
          domain: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          research_status?: string
          search_volume?: number | null
          status?: string
          target_page?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Update: {
          checked_at?: string
          created_at?: string
          domain?: string
          dr?: number | null
          id?: string
          keyword?: string | null
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          research_status?: string
          search_volume?: number | null
          status?: string
          target_page?: string | null
          traffic?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      traffic_nol: {
        Row: {
          checked_at: string
          created_at: string
          domain: string
          dr: number | null
          id: string
          notes: string | null
          research_status: string
          status: string
          traffic: number
          user_id: string | null
        }
        Insert: {
          checked_at?: string
          created_at?: string
          domain: string
          dr?: number | null
          id?: string
          notes?: string | null
          research_status?: string
          status?: string
          traffic?: number
          user_id?: string | null
        }
        Update: {
          checked_at?: string
          created_at?: string
          domain?: string
          dr?: number | null
          id?: string
          notes?: string | null
          research_status?: string
          status?: string
          traffic?: number
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      domain_price_totals: {
        Row: {
          table_name: string | null
          total_price: number | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      claim_unowned_rows: { Args: never; Returns: undefined }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
