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
      ml_predictions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          model_name: string
          prediction_metadata: Json | null
          prediction_type: string
          prediction_value: number
          sensor_reading_id: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          model_name: string
          prediction_metadata?: Json | null
          prediction_type: string
          prediction_value: number
          sensor_reading_id?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          model_name?: string
          prediction_metadata?: Json | null
          prediction_type?: string
          prediction_value?: number
          sensor_reading_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_sensor_reading_id_fkey"
            columns: ["sensor_reading_id"]
            isOneToOne: false
            referencedRelation: "processed_sensor_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_training_datasets: {
        Row: {
          created_at: string | null
          created_by: string | null
          dataset_name: string
          dataset_type: string
          feature_columns: string[]
          id: string
          model_accuracy: number | null
          sample_count: number | null
          target_column: string | null
          training_period_end: string
          training_period_start: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dataset_name: string
          dataset_type: string
          feature_columns: string[]
          id?: string
          model_accuracy?: number | null
          sample_count?: number | null
          target_column?: string | null
          training_period_end: string
          training_period_start: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dataset_name?: string
          dataset_type?: string
          feature_columns?: string[]
          id?: string
          model_accuracy?: number | null
          sample_count?: number | null
          target_column?: string | null
          training_period_end?: string
          training_period_start?: string
          updated_at?: string | null
        }
        Relationships: []
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
      processed_sensor_readings: {
        Row: {
          accel_magnitude: number | null
          accel_x: number | null
          accel_y: number | null
          accel_z: number | null
          anomaly_score: number | null
          created_at: string | null
          gas_resistance: number | null
          gyro_magnitude: number | null
          gyro_x: number | null
          gyro_y: number | null
          gyro_z: number | null
          humidity: number | null
          id: number
          location: string | null
          maintenance_recommendation: string | null
          original_id: number
          pm1_0: number | null
          pm10: number | null
          pm2_5: number | null
          predicted_failure_probability: number | null
          pressure: number | null
          processed_at: string | null
          processing_version: string | null
          quality_score: number | null
          recorded_at: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          accel_magnitude?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          anomaly_score?: number | null
          created_at?: string | null
          gas_resistance?: number | null
          gyro_magnitude?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id?: number
          location?: string | null
          maintenance_recommendation?: string | null
          original_id: number
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          predicted_failure_probability?: number | null
          pressure?: number | null
          processed_at?: string | null
          processing_version?: string | null
          quality_score?: number | null
          recorded_at: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          accel_magnitude?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          anomaly_score?: number | null
          created_at?: string | null
          gas_resistance?: number | null
          gyro_magnitude?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id?: number
          location?: string | null
          maintenance_recommendation?: string | null
          original_id?: number
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          predicted_failure_probability?: number | null
          pressure?: number | null
          processed_at?: string | null
          processing_version?: string | null
          quality_score?: number | null
          recorded_at?: string
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processed_sensor_readings_duplicate: {
        Row: {
          accel_magnitude: number | null
          accel_x: number | null
          accel_y: number | null
          accel_z: number | null
          anomaly_score: number | null
          created_at: string | null
          gas_resistance: number | null
          gyro_magnitude: number | null
          gyro_x: number | null
          gyro_y: number | null
          gyro_z: number | null
          humidity: number | null
          id: number
          location: string | null
          maintenance_recommendation: string | null
          original_id: number
          pm1_0: number | null
          pm10: number | null
          pm2_5: number | null
          predicted_failure_probability: number | null
          pressure: number | null
          processed_at: string | null
          processing_version: string | null
          quality_score: number | null
          recorded_at: string
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          accel_magnitude?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          anomaly_score?: number | null
          created_at?: string | null
          gas_resistance?: number | null
          gyro_magnitude?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id?: number
          location?: string | null
          maintenance_recommendation?: string | null
          original_id: number
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          predicted_failure_probability?: number | null
          pressure?: number | null
          processed_at?: string | null
          processing_version?: string | null
          quality_score?: number | null
          recorded_at: string
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          accel_magnitude?: number | null
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          anomaly_score?: number | null
          created_at?: string | null
          gas_resistance?: number | null
          gyro_magnitude?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id?: number
          location?: string | null
          maintenance_recommendation?: string | null
          original_id?: number
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          predicted_failure_probability?: number | null
          pressure?: number | null
          processed_at?: string | null
          processing_version?: string | null
          quality_score?: number | null
          recorded_at?: string
          temperature?: number | null
          updated_at?: string | null
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
      sensor_data: {
        Row: {
          accel_x: number | null
          accel_y: number | null
          accel_z: number | null
          gas_resistance: number | null
          gyro_x: number | null
          gyro_y: number | null
          gyro_z: number | null
          humidity: number | null
          id: number
          local_date: string
          local_time: string
          pm1_0: number | null
          pm10: number | null
          pm2_5: number | null
          pressure: number | null
          temperature: number | null
          utc_timestamp: string
        }
        Insert: {
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          gas_resistance?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id: number
          local_date: string
          local_time: string
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          pressure?: number | null
          temperature?: number | null
          utc_timestamp: string
        }
        Update: {
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          gas_resistance?: number | null
          gyro_x?: number | null
          gyro_y?: number | null
          gyro_z?: number | null
          humidity?: number | null
          id?: number
          local_date?: string
          local_time?: string
          pm1_0?: number | null
          pm10?: number | null
          pm2_5?: number | null
          pressure?: number | null
          temperature?: number | null
          utc_timestamp?: string
        }
        Relationships: []
      }
      sensor_readings_aggregated: {
        Row: {
          aggregation_level: string
          avg_accel_magnitude: number | null
          avg_gas_resistance: number | null
          avg_gyro_magnitude: number | null
          avg_humidity: number | null
          avg_pm1_0: number | null
          avg_pm10: number | null
          avg_pm2_5: number | null
          avg_pressure: number | null
          avg_temperature: number | null
          created_at: string | null
          data_points_count: number | null
          id: string
          location: string | null
          max_temperature: number | null
          min_temperature: number | null
          time_bucket: string
        }
        Insert: {
          aggregation_level: string
          avg_accel_magnitude?: number | null
          avg_gas_resistance?: number | null
          avg_gyro_magnitude?: number | null
          avg_humidity?: number | null
          avg_pm1_0?: number | null
          avg_pm10?: number | null
          avg_pm2_5?: number | null
          avg_pressure?: number | null
          avg_temperature?: number | null
          created_at?: string | null
          data_points_count?: number | null
          id?: string
          location?: string | null
          max_temperature?: number | null
          min_temperature?: number | null
          time_bucket: string
        }
        Update: {
          aggregation_level?: string
          avg_accel_magnitude?: number | null
          avg_gas_resistance?: number | null
          avg_gyro_magnitude?: number | null
          avg_humidity?: number | null
          avg_pm1_0?: number | null
          avg_pm10?: number | null
          avg_pm2_5?: number | null
          avg_pressure?: number | null
          avg_temperature?: number | null
          created_at?: string | null
          data_points_count?: number | null
          id?: string
          location?: string | null
          max_temperature?: number | null
          min_temperature?: number | null
          time_bucket?: string
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
      vibration_monitoring_settings: {
        Row: {
          created_at: string
          created_by: string | null
          foundation_stress_threshold: number
          id: string
          location: string
          roof_stability_threshold: number
          updated_at: string
          wall_integrity_threshold: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          foundation_stress_threshold?: number
          id?: string
          location?: string
          roof_stability_threshold?: number
          updated_at?: string
          wall_integrity_threshold?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          foundation_stress_threshold?: number
          id?: string
          location?: string
          roof_stability_threshold?: number
          updated_at?: string
          wall_integrity_threshold?: number
        }
        Relationships: []
      }
    }
    Views: {
      sensor_dashboard_live: {
        Row: {
          avg_anomaly_score: number | null
          avg_failure_risk: number | null
          avg_humidity: number | null
          avg_pm25: number | null
          avg_pressure: number | null
          avg_temperature: number | null
          high_anomaly_count: number | null
          high_risk_count: number | null
          last_reading: string | null
          location: string | null
          total_readings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      aggregate_sensor_data_daily: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      aggregate_sensor_data_hourly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      aggregate_sensor_data_monthly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      aggregate_sensor_data_weekly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_rds_sensor_data_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          connection_status: string
          latest_timestamp: string
          total_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      postgres_fdw_disconnect: {
        Args: { "": string }
        Returns: boolean
      }
      postgres_fdw_disconnect_all: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      postgres_fdw_get_connections: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      postgres_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      run_all_sensor_aggregations: {
        Args: Record<PropertyKey, never>
        Returns: {
          daily_count: number
          hourly_count: number
          monthly_count: number
          weekly_count: number
        }[]
      }
      sync_sensor_data_from_rds: {
        Args: Record<PropertyKey, never>
        Returns: number
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
