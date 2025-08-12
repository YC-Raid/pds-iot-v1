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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alert_notes: {
        Row: {
          alert_id: string
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          text: string
        }
        Insert: {
          alert_id: string
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          alert_id?: string
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_notes_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assigned_to: string | null
          category: string
          corrective_actions: string[] | null
          cost: number
          created_at: string
          created_by: string | null
          description: string
          dismissed_at: string | null
          dismissed_by: string | null
          duration: number | null
          equipment: string
          escalated: boolean | null
          id: string
          impact: string | null
          location: string
          priority: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          sensor: string
          sensor_location: string | null
          sensor_type: string | null
          sensor_value: number | null
          severity: string
          status: string
          threshold: string | null
          threshold_value: number | null
          title: string
          unit: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          category: string
          corrective_actions?: string[] | null
          cost?: number
          created_at?: string
          created_by?: string | null
          description: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          duration?: number | null
          equipment: string
          escalated?: boolean | null
          id?: string
          impact?: string | null
          location: string
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          sensor: string
          sensor_location?: string | null
          sensor_type?: string | null
          sensor_value?: number | null
          severity: string
          status: string
          threshold?: string | null
          threshold_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to?: string | null
          category?: string
          corrective_actions?: string[] | null
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string
          dismissed_at?: string | null
          dismissed_by?: string | null
          duration?: number | null
          equipment?: string
          escalated?: boolean | null
          id?: string
          impact?: string | null
          location?: string
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          sensor?: string
          sensor_location?: string | null
          sensor_type?: string | null
          sensor_value?: number | null
          severity?: string
          status?: string
          threshold?: string | null
          threshold_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      maintenance_tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          equipment: string | null
          id: string
          labor_hours: number
          labor_rate: number
          other_cost: number
          parts_cost: number
          priority: string
          status: string
          task_type: string
          title: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          equipment?: string | null
          id?: string
          labor_hours?: number
          labor_rate?: number
          other_cost?: number
          parts_cost?: number
          priority?: string
          status?: string
          task_type?: string
          title: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          equipment?: string | null
          id?: string
          labor_hours?: number
          labor_rate?: number
          other_cost?: number
          parts_cost?: number
          priority?: string
          status?: string
          task_type?: string
          title?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          alert_threshold_humidity: number | null
          alert_threshold_temp: number | null
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold_humidity?: number | null
          alert_threshold_temp?: number | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold_humidity?: number | null
          alert_threshold_temp?: number | null
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nickname: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
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
      app_role: ["admin", "viewer"],
    },
  },
} as const
