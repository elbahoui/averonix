export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      assessment_answers: {
        Row: {
          control_id: string;
          created_at: string;
          domain: string;
          evidence_note: string | null;
          id: string;
          maturity_level: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          control_id: string;
          created_at?: string;
          domain: string;
          evidence_note?: string | null;
          id?: string;
          maturity_level?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          control_id?: string;
          created_at?: string;
          domain?: string;
          evidence_note?: string | null;
          id?: string;
          maturity_level?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          data_types: string[];
          description: string | null;
          domain: string | null;
          id: string;
          name: string | null;
          onboarding_completed: boolean;
          organization_id: string | null;
          privacy_role: string | null;
          sector: string | null;
          size: string | null;
          tools: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          data_types?: string[];
          description?: string | null;
          domain?: string | null;
          id?: string;
          name?: string | null;
          onboarding_completed?: boolean;
          organization_id?: string | null;
          privacy_role?: string | null;
          sector?: string | null;
          size?: string | null;
          tools?: string[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          data_types?: string[];
          description?: string | null;
          domain?: string | null;
          id?: string;
          name?: string | null;
          onboarding_completed?: boolean;
          organization_id?: string | null;
          privacy_role?: string | null;
          sector?: string | null;
          size?: string | null;
          tools?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          created_by: string | null;
          domain: string | null;
          id: string;
          name: string;
          profile_completed: boolean;
          sector: string;
          size: string | null;
          slug: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          domain?: string | null;
          id?: string;
          name: string;
          profile_completed?: boolean;
          sector?: string;
          size?: string | null;
          slug?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          domain?: string | null;
          id?: string;
          name?: string;
          profile_completed?: boolean;
          sector?: string;
          size?: string | null;
          slug?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      assessment_sessions: {
        Row: {
          answered_count: number;
          completed_at: string | null;
          created_at: string;
          framework_id: string;
          id: string;
          model_version: string;
          organization_id: string;
          question_count: number;
          sector: string;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          answered_count?: number;
          completed_at?: string | null;
          created_at?: string;
          framework_id?: string;
          id?: string;
          model_version?: string;
          organization_id: string;
          question_count?: number;
          sector: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          answered_count?: number;
          completed_at?: string | null;
          created_at?: string;
          framework_id?: string;
          id?: string;
          model_version?: string;
          organization_id?: string;
          question_count?: number;
          sector?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      assessment_responses: {
        Row: {
          answered_by: string | null;
          domain_id: string;
          evidence_confidence: number;
          evidence_note: string | null;
          id: string;
          maturity_level: number;
          organization_id: string;
          question_id: string;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          answered_by?: string | null;
          domain_id: string;
          evidence_confidence: number;
          evidence_note?: string | null;
          id?: string;
          maturity_level: number;
          organization_id: string;
          question_id: string;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          answered_by?: string | null;
          domain_id?: string;
          evidence_confidence?: number;
          evidence_note?: string | null;
          id?: string;
          maturity_level?: number;
          organization_id?: string;
          question_id?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessment_results: {
        Row: {
          answered_count: number;
          created_at: string;
          critical_gaps: Json;
          domain_scores: Json;
          evidence_confidence: number;
          framework_id: string | null;
          id: string;
          model_version: string | null;
          organization_id: string;
          overall_score: number;
          question_count: number;
          recommendations: Json;
          response_hash: string | null;
          risk_level: string;
          sector: string | null;
          session_id: string;
          source: string;
          user_id: string | null;
          weak_evidence: Json;
        };
        Insert: {
          answered_count: number;
          created_at?: string;
          critical_gaps: Json;
          domain_scores: Json;
          evidence_confidence: number;
          framework_id?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id: string;
          overall_score: number;
          question_count: number;
          recommendations: Json;
          response_hash?: string | null;
          risk_level: string;
          sector?: string | null;
          session_id: string;
          source?: string;
          user_id?: string | null;
          weak_evidence?: Json;
        };
        Update: {
          answered_count?: number;
          created_at?: string;
          critical_gaps?: Json;
          domain_scores?: Json;
          evidence_confidence?: number;
          framework_id?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id?: string;
          overall_score?: number;
          question_count?: number;
          recommendations?: Json;
          response_hash?: string | null;
          risk_level?: string;
          sector?: string | null;
          session_id?: string;
          source?: string;
          user_id?: string | null;
          weak_evidence?: Json;
        };
        Relationships: [];
      };
      agent_scans: {
        Row: {
          agent_readiness_impact: number | null;
          checks: Json;
          created_at: string;
          critical_findings_count: number | null;
          domain_coverage: Json | null;
          evidence_confidence: number | null;
          findings: Json;
          id: string;
          limitations: Json | null;
          mapped_evidence: Json | null;
          normalized_domain: string;
          organization_id: string;
          risk_interpretation: string | null;
          sector: string | null;
          status: string;
          target_domain: string;
          user_id: string | null;
          verified_signal_score: number | null;
        };
        Insert: {
          agent_readiness_impact?: number | null;
          checks: Json;
          created_at?: string;
          critical_findings_count?: number | null;
          domain_coverage?: Json | null;
          evidence_confidence?: number | null;
          findings?: Json;
          id?: string;
          limitations?: Json | null;
          mapped_evidence?: Json | null;
          normalized_domain: string;
          organization_id: string;
          risk_interpretation?: string | null;
          sector?: string | null;
          status?: string;
          target_domain: string;
          user_id?: string | null;
          verified_signal_score?: number | null;
        };
        Update: {
          agent_readiness_impact?: number | null;
          checks?: Json;
          created_at?: string;
          critical_findings_count?: number | null;
          domain_coverage?: Json | null;
          evidence_confidence?: number | null;
          findings?: Json;
          id?: string;
          limitations?: Json | null;
          mapped_evidence?: Json | null;
          normalized_domain?: string;
          organization_id?: string;
          risk_interpretation?: string | null;
          sector?: string | null;
          status?: string;
          target_domain?: string;
          user_id?: string | null;
          verified_signal_score?: number | null;
        };
        Relationships: [];
      };
      report_snapshots: {
        Row: {
          assessment_result_id: string | null;
          created_at: string;
          created_by: string | null;
          framework_id: string | null;
          id: string;
          model_version: string | null;
          organization_id: string;
          report_type: string;
          snapshot: Json;
          title: string | null;
        };
        Insert: {
          assessment_result_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          framework_id?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id: string;
          report_type?: string;
          snapshot: Json;
          title?: string | null;
        };
        Update: {
          assessment_result_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          framework_id?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id?: string;
          report_type?: string;
          snapshot?: Json;
          title?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json | null;
          organization_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json | null;
          organization_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          created_at: string;
          id: string;
          last_synced_at: string | null;
          metadata: Json;
          provider: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          provider: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          provider?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          created_at: string;
          id: string;
          module: string;
          results: Json;
          score: number | null;
          status: string;
          summary: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          module: string;
          results?: Json;
          score?: number | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          module?: string;
          results?: Json;
          score?: number | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
