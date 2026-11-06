"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function leaveTeam(): Promise<void> {
  if (!getSupabaseConfig()) {
    redirect("/hub");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_couple");
  if (error) {
    throw new Error(`Failed to leave team: ${error.message}`);
  }

  revalidatePath("/", "layout");
  redirect("/hub");
}
