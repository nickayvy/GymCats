// Literal process.env reads so Next.js can inline NEXT_PUBLIC_* values.
// The publishable key (sb_publishable_…) supersedes the legacy anon key;
// either works with Supabase Auth and RLS.
export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseConfig(): { url: string; anonKey: string } {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config;
}
