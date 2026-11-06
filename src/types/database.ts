export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          age: number;
          height_cm: number;
          weight_kg: number;
          unit_system: string;
          health_notes: string;
          weekly_free_minutes: number | null;
          goal_presets: string[];
          goal_freeform: string;
          goal_plan: Json | null;
          workouts_per_week: number;
          avatar_path: string | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          age: number;
          height_cm: number;
          weight_kg: number;
          unit_system?: string;
          health_notes?: string;
          weekly_free_minutes?: number | null;
          goal_presets?: string[];
          goal_freeform?: string;
          goal_plan?: Json | null;
          workouts_per_week: number;
          avatar_path?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          age?: number;
          height_cm?: number;
          weight_kg?: number;
          unit_system?: string;
          health_notes?: string;
          weekly_free_minutes?: number | null;
          goal_presets?: string[];
          goal_freeform?: string;
          goal_plan?: Json | null;
          workouts_per_week?: number;
          avatar_path?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          invite_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          couple_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          couple_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          couple_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          performed_at: string;
          spins_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          performed_at?: string;
          spins_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          performed_at?: string;
          spins_earned?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          user_id: string;
          position: number;
          exercise_name: string;
          exercise_key: string;
          sets: Json;
          set_count: number;
          total_reps: number;
          top_weight_lb: number;
          volume_lb: number;
          grew: boolean;
          spin_awarded: boolean;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          user_id: string;
          position: number;
          exercise_name: string;
          exercise_key: string;
          sets: Json;
          set_count: number;
          total_reps: number;
          top_weight_lb: number;
          volume_lb: number;
          grew?: boolean;
          spin_awarded?: boolean;
          performed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          user_id?: string;
          position?: number;
          exercise_name?: string;
          exercise_key?: string;
          sets?: Json;
          set_count?: number;
          total_reps?: number;
          top_weight_lb?: number;
          volume_lb?: number;
          grew?: boolean;
          spin_awarded?: boolean;
          performed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      spin_wallets: {
        Row: {
          user_id: string;
          spins: number;
          lifetime_spins: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          spins?: number;
          lifetime_spins?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          spins?: number;
          lifetime_spins?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      my_couple_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_couple: {
        Args: Record<string, never>;
        Returns: string;
      };
      join_couple: {
        Args: { p_code: string };
        Returns: string;
      };
      log_workout: {
        Args: { p_exercises: Json };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
