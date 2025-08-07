export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          base_location: string
          created_at: string | null
          id: string
          organization: string
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          base_location: string
          created_at?: string | null
          id?: string
          organization: string
          updated_at?: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          base_location?: string
          created_at?: string | null
          id?: string
          organization?: string
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      receipts: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["receipt_category"]
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          receipt_date: string
          trip_id: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["receipt_category"]
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          receipt_date: string
          trip_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["receipt_category"]
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          receipt_date?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accommodation_info: Json | null
          accommodation_needed: boolean | null
          budget: number | null
          created_at: string | null
          departure_location: string
          destination: string
          distance_km: number | null
          end_date: string
          end_time: string | null
          id: string
          purpose: string
          spent: number | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["trip_status"] | null
          transportation: string | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accommodation_info?: Json | null
          accommodation_needed?: boolean | null
          budget?: number | null
          created_at?: string | null
          departure_location: string
          destination: string
          distance_km?: number | null
          end_date: string
          end_time?: string | null
          id?: string
          purpose: string
          spent?: number | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          transportation?: string | null
          trip_type: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accommodation_info?: Json | null
          accommodation_needed?: boolean | null
          budget?: number | null
          created_at?: string | null
          departure_location?: string
          destination?: string
          distance_km?: number | null
          end_date?: string
          end_time?: string | null
          id?: string
          purpose?: string
          spent?: number | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          transportation?: string | null
          trip_type?: Database["public"]["Enums"]["trip_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      receipt_category: "교통비" | "숙박비" | "식비" | "기타"
      trip_status: "planned" | "ongoing" | "completed" | "cancelled"
      trip_type: "관내" | "관외"
      user_type: "공무원" | "공공기관" | "기타"
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
      receipt_category: ["교통비", "숙박비", "식비", "기타"],
      trip_status: ["planned", "ongoing", "completed", "cancelled"],
      trip_type: ["관내", "관외"],
      user_type: ["공무원", "공공기관", "기타"],
    },
  },
} as const
