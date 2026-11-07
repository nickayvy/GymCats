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
      partner_gyms: {
        Row: { place_id: string; brand: string; region: string; added_at: string };
        Insert: { place_id: string; brand: string; region: string; added_at?: string };
        Update: { place_id?: string; brand?: string; region?: string; added_at?: string };
        Relationships: [];
      };
      bosses: {
        Row: { id: string; name: string; max_hp: number; rotation_order: number };
        Insert: { id: string; name: string; max_hp: number; rotation_order: number };
        Update: { id?: string; name?: string; max_hp?: number; rotation_order?: number };
        Relationships: [];
      };
      user_gyms: {
        Row: { user_id: string; name: string; lat: number; lng: number; place_id: string | null; set_at: string };
        Insert: {
          user_id: string;
          name: string;
          lat: number;
          lng: number;
          place_id?: string | null;
          set_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          lat?: number;
          lng?: number;
          place_id?: string | null;
          set_at?: string;
        };
        Relationships: [];
      };
      gym_sessions: {
        Row: {
          id: string;
          user_id: string;
          started_at: string;
          last_ping_at: string;
          ended_at: string | null;
          bonus_spin: boolean;
          credited_seconds: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          started_at?: string;
          last_ping_at?: string;
          ended_at?: string | null;
          bonus_spin: boolean;
          credited_seconds?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          started_at?: string;
          last_ping_at?: string;
          ended_at?: string | null;
          bonus_spin?: boolean;
          credited_seconds?: number;
        };
        Relationships: [];
      };
      boss_battles: {
        Row: {
          id: string;
          party_id: string;
          week_start: string;
          boss_id: string;
          max_hp: number;
          current_hp: number;
          defeated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          week_start: string;
          boss_id: string;
          max_hp: number;
          current_hp: number;
          defeated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          week_start?: string;
          boss_id?: string;
          max_hp?: number;
          current_hp?: number;
          defeated_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      boss_attacks: {
        Row: {
          id: string;
          battle_id: string;
          user_id: string;
          rarity: string;
          rolled_damage: number;
          damage: number;
          hp_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          user_id: string;
          rarity: string;
          rolled_damage: number;
          damage: number;
          hp_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          user_id?: string;
          rarity?: string;
          rolled_damage?: number;
          damage?: number;
          hp_after?: number;
          created_at?: string;
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
      my_party_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_battle_state: {
        Args: Record<string, never>;
        Returns: Json;
      };
      set_my_gym: {
        Args: { p_name: string; p_lat: number; p_lng: number; p_place_id?: string };
        Returns: undefined;
      };
      gym_check_in: {
        Args: { p_lat: number; p_lng: number; p_accuracy: number };
        Returns: undefined;
      };
      gym_heartbeat: {
        Args: { p_lat: number; p_lng: number; p_accuracy: number };
        Returns: undefined;
      };
      gym_check_out: {
        Args: { p_lat?: number; p_lng?: number; p_accuracy?: number };
        Returns: undefined;
      };
      roll_spin: {
        Args: Record<string, never>;
        Returns: Json;
      };
      log_workout: {
        Args: { p_exercises: Json };
        Returns: Json;
      };
      leave_couple: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_invite_preview: {
        Args: { p_code: string };
        Returns: {
          status: "open" | "full" | "own" | "invalid";
          inviter_name: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
