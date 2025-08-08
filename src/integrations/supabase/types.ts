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
      accommodations: {
        Row: {
          개방서비스명: string | null
          개방서비스아이디: string | null
          개방자치단체코드: number | null
          건물소유구분명: string | null
          건물지상층수: string | null
          건물지하층수: string | null
          관리번호: string | null
          남성종사자수: string | null
          다중이용업소여부: string | null
          데이터갱신구분: string | null
          데이터갱신일자: string | null
          도로명우편번호: string | null
          도로명전체주소: string | null
          번호: number | null
          사업장명: string | null
          사용끝지상층: string | null
          사용끝지하층: string | null
          사용시작지상층: string | null
          사용시작지하층: string | null
          상세영업상태명: string | null
          상세영업상태코드: number | null
          소재지면적: string | null
          소재지우편번호: string | null
          소재지전체주소: string | null
          소재지전화: string | null
          양실수: string | null
          업태구분명: string | null
          여성종사자수: string | null
          영업상태구분코드: number | null
          영업상태명: string | null
          위생업태명: string | null
          인허가일자: string | null
          인허가취소일자: string | null
          재개업일자: string | null
          조건부허가시작일자: string | null
          조건부허가신고사유: string | null
          조건부허가종료일자: string | null
          "좌표정보x(epsg5174)": string | null
          "좌표정보y(epsg5174)": string | null
          최종수정시점: string | null
          폐업일자: string | null
          한실수: string | null
          휴업시작일자: string | null
          휴업종료일자: string | null
        }
        Insert: {
          개방서비스명?: string | null
          개방서비스아이디?: string | null
          개방자치단체코드?: number | null
          건물소유구분명?: string | null
          건물지상층수?: string | null
          건물지하층수?: string | null
          관리번호?: string | null
          남성종사자수?: string | null
          다중이용업소여부?: string | null
          데이터갱신구분?: string | null
          데이터갱신일자?: string | null
          도로명우편번호?: string | null
          도로명전체주소?: string | null
          번호?: number | null
          사업장명?: string | null
          사용끝지상층?: string | null
          사용끝지하층?: string | null
          사용시작지상층?: string | null
          사용시작지하층?: string | null
          상세영업상태명?: string | null
          상세영업상태코드?: number | null
          소재지면적?: string | null
          소재지우편번호?: string | null
          소재지전체주소?: string | null
          소재지전화?: string | null
          양실수?: string | null
          업태구분명?: string | null
          여성종사자수?: string | null
          영업상태구분코드?: number | null
          영업상태명?: string | null
          위생업태명?: string | null
          인허가일자?: string | null
          인허가취소일자?: string | null
          재개업일자?: string | null
          조건부허가시작일자?: string | null
          조건부허가신고사유?: string | null
          조건부허가종료일자?: string | null
          "좌표정보x(epsg5174)"?: string | null
          "좌표정보y(epsg5174)"?: string | null
          최종수정시점?: string | null
          폐업일자?: string | null
          한실수?: string | null
          휴업시작일자?: string | null
          휴업종료일자?: string | null
        }
        Update: {
          개방서비스명?: string | null
          개방서비스아이디?: string | null
          개방자치단체코드?: number | null
          건물소유구분명?: string | null
          건물지상층수?: string | null
          건물지하층수?: string | null
          관리번호?: string | null
          남성종사자수?: string | null
          다중이용업소여부?: string | null
          데이터갱신구분?: string | null
          데이터갱신일자?: string | null
          도로명우편번호?: string | null
          도로명전체주소?: string | null
          번호?: number | null
          사업장명?: string | null
          사용끝지상층?: string | null
          사용끝지하층?: string | null
          사용시작지상층?: string | null
          사용시작지하층?: string | null
          상세영업상태명?: string | null
          상세영업상태코드?: number | null
          소재지면적?: string | null
          소재지우편번호?: string | null
          소재지전체주소?: string | null
          소재지전화?: string | null
          양실수?: string | null
          업태구분명?: string | null
          여성종사자수?: string | null
          영업상태구분코드?: number | null
          영업상태명?: string | null
          위생업태명?: string | null
          인허가일자?: string | null
          인허가취소일자?: string | null
          재개업일자?: string | null
          조건부허가시작일자?: string | null
          조건부허가신고사유?: string | null
          조건부허가종료일자?: string | null
          "좌표정보x(epsg5174)"?: string | null
          "좌표정보y(epsg5174)"?: string | null
          최종수정시점?: string | null
          폐업일자?: string | null
          한실수?: string | null
          휴업시작일자?: string | null
          휴업종료일자?: string | null
        }
        Relationships: []
      }
      business_trip_allowances: {
        Row: {
          created_at: string
          daily_lodging_allowance: number
          daily_meal_allowance: number
          id: string
          organization: string
          region: string
          transportation_rate_per_km: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_lodging_allowance?: number
          daily_meal_allowance?: number
          id?: string
          organization: string
          region: string
          transportation_rate_per_km?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_lodging_allowance?: number
          daily_meal_allowance?: number
          id?: string
          organization?: string
          region?: string
          transportation_rate_per_km?: number
          updated_at?: string
        }
        Relationships: []
      }
      certified_restaurant: {
        Row: {
          개방서비스ID: string | null
          개방자치단체코드: number | null
          관리번호: string | null
          데이터갱신구분: string | null
          데이터갱신일자: string | null
          도로명주소: string | null
          번호: number | null
          불가사유: string | null
          불가일자: string | null
          소재지주소: string | null
          신청일자: number | null
          업소명: string | null
          영업상태구분코드: number | null
          영업상태명: string | null
          음식의유형: string | null
          인허가번호: number | null
          재지정일자: string | null
          전화번호: string | null
          주된음식종류: string | null
          지정일자: number | null
          지정취소사유: string | null
          지정취소일자: string | null
          최종수정일자: string | null
          폐업일자: string | null
        }
        Insert: {
          개방서비스ID?: string | null
          개방자치단체코드?: number | null
          관리번호?: string | null
          데이터갱신구분?: string | null
          데이터갱신일자?: string | null
          도로명주소?: string | null
          번호?: number | null
          불가사유?: string | null
          불가일자?: string | null
          소재지주소?: string | null
          신청일자?: number | null
          업소명?: string | null
          영업상태구분코드?: number | null
          영업상태명?: string | null
          음식의유형?: string | null
          인허가번호?: number | null
          재지정일자?: string | null
          전화번호?: string | null
          주된음식종류?: string | null
          지정일자?: number | null
          지정취소사유?: string | null
          지정취소일자?: string | null
          최종수정일자?: string | null
          폐업일자?: string | null
        }
        Update: {
          개방서비스ID?: string | null
          개방자치단체코드?: number | null
          관리번호?: string | null
          데이터갱신구분?: string | null
          데이터갱신일자?: string | null
          도로명주소?: string | null
          번호?: number | null
          불가사유?: string | null
          불가일자?: string | null
          소재지주소?: string | null
          신청일자?: number | null
          업소명?: string | null
          영업상태구분코드?: number | null
          영업상태명?: string | null
          음식의유형?: string | null
          인허가번호?: number | null
          재지정일자?: string | null
          전화번호?: string | null
          주된음식종류?: string | null
          지정일자?: number | null
          지정취소사유?: string | null
          지정취소일자?: string | null
          최종수정일자?: string | null
          폐업일자?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          doc_title: string | null
          document_id: string
          embedding: string
          id: string
          source_path: string | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          doc_title?: string | null
          document_id: string
          embedding: string
          id?: string
          source_path?: string | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          doc_title?: string | null
          document_id?: string
          embedding?: string
          id?: string
          source_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          base_location: string
          created_at: string | null
          id: string
          organization: string
          updated_at: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
        }
        Insert: {
          base_location: string
          created_at?: string | null
          id?: string
          organization: string
          updated_at?: string | null
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username?: string | null
        }
        Update: {
          base_location?: string
          created_at?: string | null
          id?: string
          organization?: string
          updated_at?: string | null
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
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
          image_path: string | null
          image_size_bytes: number | null
          mime_type: string | null
          ocr_confidence: number | null
          ocr_text: string | null
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
          image_path?: string | null
          image_size_bytes?: number | null
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
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
          image_path?: string | null
          image_size_bytes?: number | null
          mime_type?: string | null
          ocr_confidence?: number | null
          ocr_text?: string | null
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_username_availability: {
        Args: { username_to_check: string }
        Returns: boolean
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_count: number
          filter_document_id?: string
        }
        Returns: {
          id: string
          content: string
          doc_title: string
          source_path: string
          chunk_index: number
          similarity: number
          document_id: string
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
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
