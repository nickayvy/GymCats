"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { INVITE_COOKIE, normalizeInviteCode } from "@/lib/team/inviteCode";

export type AuthFormState = { error: string | null; message: string | null };

function parseCredentials(
  formData: FormData,
): { email: string; password: string } | { error: string } {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  return { email, password };
}

export async function login(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!getSupabaseConfig()) {
    return {
      error: "Login is unavailable: Supabase is not configured.",
      message: null,
    };
  }

  const parsed = parseCredentials(formData);
  if ("error" in parsed) {
    return { error: parsed.error, message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  // Came in through a partner's invite link ("Accept & sign up")? They already
  // said yes on the invite screen, so join the team now and go straight to
  // onboarding instead of asking again.
  const cookieStore = await cookies();
  const pendingInvite = normalizeInviteCode(cookieStore.get(INVITE_COOKIE)?.value);
  if (pendingInvite) {
    const { error: joinError } = await supabase.rpc("join_couple", { p_code: pendingInvite });
    // On a full or dead invite, keep the cookie: "/" sends them to the invite
    // page, which explains what happened. Already on a team (theirs or this
    // one): nothing to do.
    if (!joinError || /already_paired|own_code/.test(joinError.message)) {
      cookieStore.delete(INVITE_COOKIE);
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!getSupabaseConfig()) {
    return {
      error: "Sign up is unavailable: Supabase is not configured.",
      message: null,
    };
  }

  const parsed = parseCredentials(formData);
  if ("error" in parsed) {
    return { error: parsed.error, message: null };
  }

  const confirm = String(formData.get("confirmPassword") ?? "");
  if (confirm !== parsed.password) {
    return { error: "Passwords don't match.", message: null };
  }

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: { emailRedirectTo: `${origin}/login?confirmed=1` },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  if (data.session) {
    await supabase.auth.signOut();
    redirect("/login?created=ready");
  }

  redirect("/login?created=confirm");
}

export async function logout(): Promise<void> {
  if (getSupabaseConfig()) {
    await (await createClient()).auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
