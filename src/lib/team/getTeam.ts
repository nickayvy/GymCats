import type { SupabaseClient } from "@supabase/supabase-js";
import { GOAL_PRESETS, goalPlanSchema, type GoalPlan } from "@/lib/onboarding/schema";
import type { Database } from "@/types/database";

const AVATAR_URL_TTL_SECONDS = 60 * 60;

export interface TeamMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  goalLabels: string[];
  goalFreeform: string;
  goalPlan: GoalPlan | null;
  workoutsPerWeek: number | null;
  onboarded: boolean;
  joinedAt: string | null;
}

export interface Team {
  me: TeamMember | null;
  partner: TeamMember | null;
  /** The couple's invite code, while the caller is still waiting for a partner. */
  inviteCode: string | null;
}

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "display_name"
  | "avatar_path"
  | "goal_presets"
  | "goal_freeform"
  | "goal_plan"
  | "workouts_per_week"
  | "onboarded_at"
>;

const PRESET_LABELS = new Map<string, string>(GOAL_PRESETS.map((p) => [p.id, p.label]));

function toMember(
  id: string,
  profile: ProfileRow | undefined,
  avatarUrl: string | null,
  joinedAt: string | null,
): TeamMember {
  const plan = goalPlanSchema.safeParse(profile?.goal_plan);
  return {
    id,
    // A partner who joined by link may not have finished onboarding yet.
    displayName: profile?.display_name ?? "Your partner",
    avatarUrl,
    goalLabels: (profile?.goal_presets ?? []).map((g) => PRESET_LABELS.get(g) ?? g),
    goalFreeform: profile?.goal_freeform ?? "",
    goalPlan: plan.success ? plan.data : null,
    workoutsPerWeek: profile?.workouts_per_week ?? null,
    onboarded: Boolean(profile?.onboarded_at),
    joinedAt,
  };
}

/**
 * Loads the caller and their partner. Every read goes through RLS, so the
 * caller can only ever see their own couple: other users' rows are invisible
 * to these queries even if the code asked for them.
 */
export async function getTeam(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Team> {
  const { data: members, error: membersError } = await supabase
    .from("couple_members")
    .select("couple_id, user_id, joined_at");
  if (membersError) {
    throw new Error(`Failed to load team: ${membersError.message}`);
  }

  const myMembership = members?.find((m) => m.user_id === userId) ?? null;
  const partnerMembership =
    members?.find((m) => m.user_id !== userId && m.couple_id === myMembership?.couple_id) ?? null;

  const ids = [userId, ...(partnerMembership ? [partnerMembership.user_id] : [])];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_path, goal_presets, goal_freeform, goal_plan, workouts_per_week, onboarded_at",
    )
    .in("id", ids);
  if (profilesError) {
    throw new Error(`Failed to load profiles: ${profilesError.message}`);
  }
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const avatarPaths = (profiles ?? [])
    .map((p) => p.avatar_path)
    .filter((p): p is string => Boolean(p));
  const avatarUrls = new Map<string, string>();
  if (avatarPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrls(avatarPaths, AVATAR_URL_TTL_SECONDS);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) avatarUrls.set(s.path, s.signedUrl);
    }
  }
  const urlFor = (id: string): string | null => {
    const path = byId.get(id)?.avatar_path;
    return path ? (avatarUrls.get(path) ?? null) : null;
  };

  let inviteCode: string | null = null;
  if (myMembership && !partnerMembership) {
    const { data: couple } = await supabase
      .from("couples")
      .select("invite_code")
      .eq("id", myMembership.couple_id)
      .maybeSingle();
    inviteCode = couple?.invite_code ?? null;
  }

  return {
    me: toMember(userId, byId.get(userId), urlFor(userId), myMembership?.joined_at ?? null),
    partner: partnerMembership
      ? toMember(
          partnerMembership.user_id,
          byId.get(partnerMembership.user_id),
          urlFor(partnerMembership.user_id),
          partnerMembership.joined_at,
        )
      : null,
    inviteCode,
  };
}
