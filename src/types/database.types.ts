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
      clients: {
        Row: {
          city: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          event_ids: number[] | null
          id: number
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          event_ids?: number[] | null
          id?: never
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          event_ids?: number[] | null
          id?: never
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          date: string
          festival_id: number | null
          file_name: string | null
          id: number
          staff_id: number
          url: string
        }
        Insert: {
          created_at?: string
          date: string
          festival_id?: number | null
          file_name?: string | null
          id?: never
          staff_id: number
          url: string
        }
        Update: {
          created_at?: string
          date?: string
          festival_id?: number | null
          file_name?: string | null
          id?: never
          staff_id?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          event_id: number
          staff_id: number
        }
        Insert: {
          event_id: number
          staff_id: number
        }
        Update: {
          event_id?: number
          staff_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          booth: string
          created_at: string
          date: string
          end_date: string | null
          expenses: Json
          hygiene_permit: string
          id: number
          income: number
          inventory_reported: Json
          location: string
          name: string
          organizer_contact: string
          status: string
          updated_at: string
        }
        Insert: {
          booth?: string
          created_at?: string
          date: string
          end_date?: string | null
          expenses?: Json
          hygiene_permit?: string
          id?: never
          income?: number
          inventory_reported?: Json
          location: string
          name: string
          organizer_contact?: string
          status: string
          updated_at?: string
        }
        Update: {
          booth?: string
          created_at?: string
          date?: string
          end_date?: string | null
          expenses?: Json
          hygiene_permit?: string
          id?: never
          income?: number
          inventory_reported?: Json
          location?: string
          name?: string
          organizer_contact?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          festival_id: number
          id: number
          image_url: string
          staff_id: number | null
          staff_name: string
          status: Database["public"]["Enums"]["expense_status_enum"]
          type: Database["public"]["Enums"]["expense_category_enum"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          festival_id: number
          id?: never
          image_url?: string
          staff_id?: number | null
          staff_name: string
          status?: Database["public"]["Enums"]["expense_status_enum"]
          type: Database["public"]["Enums"]["expense_category_enum"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          festival_id?: number
          id?: never
          image_url?: string
          staff_id?: number | null
          staff_name?: string
          status?: Database["public"]["Enums"]["expense_status_enum"]
          type?: Database["public"]["Enums"]["expense_category_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      food_templates: {
        Row: {
          group_name: string
          id: number
          item_type: string
          name: string
          sort_order: number
        }
        Insert: {
          group_name: string
          id?: number
          item_type: string
          name: string
          sort_order?: number
        }
        Update: {
          group_name?: string
          id?: number
          item_type?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          current: number
          id: number
          name: string
          threshold: number
          unit: Database["public"]["Enums"]["inventory_unit_enum"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current?: number
          id?: never
          name: string
          threshold?: number
          unit?: Database["public"]["Enums"]["inventory_unit_enum"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current?: number
          id?: never
          name?: string
          threshold?: number
          unit?: Database["public"]["Enums"]["inventory_unit_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          action: Database["public"]["Enums"]["inventory_log_action_enum"]
          created_at: string
          festival_id: number | null
          festival_name: string
          id: number
          item_id: number
          item_name: string
          qty: number
          submitted_by: string
          timestamp: string
          unit: Database["public"]["Enums"]["inventory_unit_enum"]
        }
        Insert: {
          action: Database["public"]["Enums"]["inventory_log_action_enum"]
          created_at?: string
          festival_id?: number | null
          festival_name?: string
          id?: never
          item_id: number
          item_name: string
          qty: number
          submitted_by: string
          timestamp: string
          unit: Database["public"]["Enums"]["inventory_unit_enum"]
        }
        Update: {
          action?: Database["public"]["Enums"]["inventory_log_action_enum"]
          created_at?: string
          festival_id?: number | null
          festival_name?: string
          id?: never
          item_id?: number
          item_name?: string
          qty?: number
          submitted_by?: string
          timestamp?: string
          unit?: Database["public"]["Enums"]["inventory_unit_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_festival_id_fkey"
            columns: ["festival_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: number
          keys: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: never
          keys?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: never
          keys?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          carte_vitale_name: string | null
          carte_vitale_number: string | null
          carte_vitale_uploaded_at: string | null
          carte_vitale_url: string | null
          city: string
          created_at: string
          dob: string
          id: number
          name: string
          phone: string | null
          staff_type: string
          titre_sejour_name: string | null
          titre_sejour_number: string | null
          titre_sejour_uploaded_at: string | null
          titre_sejour_url: string | null
          user_id: string | null
        }
        Insert: {
          carte_vitale_name?: string | null
          carte_vitale_number?: string | null
          carte_vitale_uploaded_at?: string | null
          carte_vitale_url?: string | null
          city: string
          created_at?: string
          dob: string
          id?: never
          name: string
          phone?: string | null
          staff_type?: string
          titre_sejour_name?: string | null
          titre_sejour_number?: string | null
          titre_sejour_uploaded_at?: string | null
          titre_sejour_url?: string | null
          user_id?: string | null
        }
        Update: {
          carte_vitale_name?: string | null
          carte_vitale_number?: string | null
          carte_vitale_uploaded_at?: string | null
          carte_vitale_url?: string | null
          city?: string
          created_at?: string
          dob?: string
          id?: never
          name?: string
          phone?: string | null
          staff_type?: string
          titre_sejour_name?: string | null
          titre_sejour_number?: string | null
          titre_sejour_uploaded_at?: string | null
          titre_sejour_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          department: string | null
          id: string
          name: string
          role: string
          status: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id: string
          name: string
          role: string
          status?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          name?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      my_staff_id: { Args: never; Returns: number }
    }
    Enums: {
      expense_category_enum: "V├⌐ t├áu/xe" | "Uber/Taxi" | "─én uß╗æng" | "Kh├íc"
      expense_status_enum: "pending" | "approved" | "rejected"
      inventory_log_action_enum: "set" | "created"
      inventory_unit_enum:
        | "kg"
        | "g"
        | "l├¡t"
        | "ml"
        | "c├íi"
        | "lon"
        | "hß╗Öp"
        | "xi├¬n"
        | "th├╣ng"
        | "phß║ºn"
        | "t├║i"
        | "g├│i"
        | "lß╗æc"
        | "con"
        | "miß║┐ng"
        | "thanh"
        | "vi├¬n"
        | "lß╗ì"
        | "b├¼nh"
        | "chiß║┐c"
        | "─æ├┤i"
        | "bß╗Ö"
        | "chai"
        | "cuß╗Ön"
        | "tß║Ñm"
        | "ß╗ò"
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
      expense_category_enum: ["V├⌐ t├áu/xe", "Uber/Taxi", "─én uß╗æng", "Kh├íc"],
      expense_status_enum: ["pending", "approved", "rejected"],
      inventory_log_action_enum: ["set", "created"],
      inventory_unit_enum: [
        "kg",
        "g",
        "l├¡t",
        "ml",
        "c├íi",
        "lon",
        "hß╗Öp",
        "xi├¬n",
        "th├╣ng",
        "phß║ºn",
        "t├║i",
        "g├│i",
        "lß╗æc",
        "con",
        "miß║┐ng",
        "thanh",
        "vi├¬n",
        "lß╗ì",
        "b├¼nh",
        "chiß║┐c",
        "─æ├┤i",
        "bß╗Ö",
        "chai",
        "cuß╗Ön",
        "tß║Ñm",
        "ß╗ò",
      ],
    },
  },
} as const
