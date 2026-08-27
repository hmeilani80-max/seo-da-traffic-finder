export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      check_logs: {
        Row: { created_at: string; domain: string; dr: number | null; hasil: string; id: string; pesan: string | null; traffic: number | null; user_id: string | null }
        Insert: { created_at?: string; domain: string; dr?: number | null; hasil: string; id?: string; pesan?: string | null; traffic?: number | null; user_id?: string | null }
        Update: { created_at?: string; domain?: string; dr?: number | null; hasil?: string; id?: string; pesan?: string | null; traffic?: number | null; user_id?: string | null }
        Relationships: []
      }
      domain_sudah_pernah: {
        Row: { checked_at: string; created_at: string; domain: string; dr: number | null; id: string; keyword: string | null; notes: string | null; price: number | null; purchase_date: string | null; status: string; target_page: string | null; traffic: number | null; user_id: string | null }
        Insert: { checked_at?: string; created_at?: string; domain: string; dr?: number | null; id?: string; keyword?: string | null; notes?: string | null; price?: number | null; purchase_date?: string | null; status?: string; target_page?: string | null; traffic?: number | null; user_id?: string | null }
        Update: { checked_at?: string; created_at?: string; domain?: string; dr?: number | null; id?: string; keyword?: string | null; notes?: string | null; price?: number | null; purchase_date?: string | null; status?: string; target_page?: string | null; traffic?: number | null; user_id?: string | null }
        Relationships: []
      }
      domain_price_totals: {
        Row: { table_name: "sudah_dibeli" | "domain_sudah_pernah"; total_price: number; updated_at: string }
        Insert: { table_name: "sudah_dibeli" | "domain_sudah_pernah"; total_price?: number; updated_at?: string }
        Update: { table_name?: "sudah_dibeli" | "domain_sudah_pernah"; total_price?: number; updated_at?: string }
        Relationships: []
      }
      sudah_dibeli: {
        Row: { checked_at: string; created_at: string; domain: string; dr: number | null; id: string; keyword: string | null; notes: string | null; price: number | null; purchase_date: string | null; status: string; target_page: string | null; traffic: number | null; user_id: string | null }
        Insert: { checked_at?: string; created_at?: string; domain: string; dr?: number | null; id?: string; keyword?: string | null; notes?: string | null; price?: number | null; purchase_date?: string | null; status?: string; target_page?: string | null; traffic?: number | null; user_id?: string | null }
        Update: { checked_at?: string; created_at?: string; domain?: string; dr?: number | null; id?: string; keyword?: string | null; notes?: string | null; price?: number | null; purchase_date?: string | null; status?: string; target_page?: string | null; traffic?: number | null; user_id?: string | null }
        Relationships: []
      }
      traffic_nol: {
        Row: { checked_at: string; created_at: string; domain: string; dr: number | null; id: string; notes: string | null; status: string; traffic: number; user_id: string | null }
        Insert: { checked_at?: string; created_at?: string; domain: string; dr?: number | null; id?: string; notes?: string | null; status?: string; traffic?: number | null; user_id?: string | null }
        Update: { checked_at?: string; created_at?: string; domain?: string; dr?: number | null; id?: string; notes?: string | null; status?: string; traffic?: number | null; user_id?: string | null }
        Relationships: []
      }
      search_history: {
        Row: { first_searched_at: string; id: string; last_searched_at: string; normalized_query: string; query: string; search_count: number; user_id: string }
        Insert: { first_searched_at?: string; id?: string; last_searched_at?: string; normalized_query: string; query: string; search_count?: number; user_id?: string }
        Update: { first_searched_at?: string; id?: string; last_searched_at?: string; normalized_query?: string; query?: string; search_count?: number; user_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { claim_unowned_rows: { Args: never; Returns: undefined } }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never : never

export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }, TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never : never

export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals }, EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]) : never = never> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never

export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals }, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals } ? keyof (DatabaseWithoutInternals[DefaultSchemaWithoutInternals["public"]]["CompositeTypes"]) : never = never> = never

export const Constants = { public: { Enums: {} } } as const
