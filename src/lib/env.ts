type PublicEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function getPublicEnv(key: PublicEnvKey): string | undefined {
  return process.env[key];
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseConfig(): { url: string; anonKey: string } {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return config;
}
