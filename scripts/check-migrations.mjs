#!/usr/bin/env node
// Compares supabase/migrations/*.sql with the migration history recorded on
// the linked Supabase project, and exits non-zero if they disagree.
//
// Why: migrations applied any way other than `supabase db push` (the SQL
// editor, or an AI agent's apply_migration tool) get recorded under the
// time they ran, not the version in the file name. `db push` then thinks
// the file was never applied, and the history sorts in the wrong order.
//
// Usage: npm run db:check
// Needs SUPABASE_ACCESS_TOKEN (a personal access token from
// https://supabase.com/dashboard/account/tokens). The project ref comes from
// SUPABASE_PROJECT_REF, else NEXT_PUBLIC_SUPABASE_URL, else .mcp.json.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const migrationsDir = join(root, "supabase", "migrations");

function projectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fromUrl = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  if (fromUrl && fromUrl !== "your-project-ref") return fromUrl;
  try {
    const mcp = JSON.parse(readFileSync(join(root, ".mcp.json"), "utf8"));
    const ref = new URL(mcp.mcpServers.supabase.url).searchParams.get("project_ref");
    if (ref) return ref;
  } catch {
    // Fall through.
  }
  return null;
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => {
    const match = f.match(/^(\d{14})_(.+)\.sql$/);
    if (!match) {
      console.error(`✗ ${f}: migration files must be named <14 digit version>_<name>.sql`);
      process.exit(1);
    }
    return { version: match[1], name: match[2], file: f };
  });

const ref = projectRef();
if (!ref) {
  console.error("✗ No project ref. Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // In a Claude Code cloud session the proxy supplies the real token.
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || "proxy-injected"}`,
  },
  body: JSON.stringify({
    query: "select version, name from supabase_migrations.schema_migrations order by version",
  }),
});
if (!res.ok) {
  console.error(`✗ Couldn't read the migration history (${res.status}): ${(await res.text()).slice(0, 300)}`);
  if (res.status === 401) console.error("  Set SUPABASE_ACCESS_TOKEN to a personal access token.");
  process.exit(1);
}
const applied = await res.json();

const fileByVersion = new Map(files.map((f) => [f.version, f]));
const appliedByVersion = new Map(applied.map((m) => [m.version, m]));
const problems = [];

for (const m of applied) {
  if (fileByVersion.has(m.version)) continue;
  const file = files.find((f) => f.name === m.name);
  problems.push(
    file
      ? `${m.version}_${m.name} is recorded under the wrong version; the file is ${file.file}.\n` +
          `    Fix: update supabase_migrations.schema_migrations set version = '${file.version}' where version = '${m.version}';`
      : `${m.version}_${m.name} is recorded on the database but has no file in supabase/migrations/.`,
  );
}

const pending = files.filter((f) => !appliedByVersion.has(f.version) && !applied.some((m) => m.name === f.name));
for (const f of pending) problems.push(`${f.file} hasn't been applied to the database.`);

for (const f of files) {
  const m = appliedByVersion.get(f.version);
  if (m && m.name !== f.name) problems.push(`${f.version} is recorded as "${m.name}" but the file is ${f.file}.`);
}

if (problems.length > 0) {
  console.error(`✗ Migrations on project ${ref} don't match supabase/migrations/:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ All ${files.length} migrations in supabase/migrations/ are applied to ${ref}, under matching versions.`);
