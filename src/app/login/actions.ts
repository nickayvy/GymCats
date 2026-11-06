"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
  });

  if (error) {
    return { error: error.message, message: null };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return { error: null, message: "Check your email to confirm your account." };
}

export async function logout(): Promise<void> {
  if (getSupabaseConfig()) {
    await (await createClient()).auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
