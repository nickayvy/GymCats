# GymCats

## Database migrations

Migrations live in `supabase/migrations/<version>_<name>.sql`. The live database records each applied migration in `supabase_migrations.schema_migrations`, and that record must use the **same version as the file name**. Otherwise `supabase db push` treats the file as unapplied, and the history sorts in the wrong order.

- **Naming a new migration:** use a 14-digit version greater than the newest file in `supabase/migrations/`. Don't use the current time: the existing files are dated ahead of the calendar, so a "now" timestamp can sort before them.
- **Applying with the Supabase MCP `apply_migration` tool:** it records the migration under the time it ran, not the file's version. Right after applying, fix the record with `execute_sql`:

  ```sql
  update supabase_migrations.schema_migrations
  set version = '<file version>'
  where name = '<name>' and version = '<version apply_migration recorded>';
  ```

  The SQL editor in the Supabase dashboard records nothing at all. After using it, run `supabase migration repair --status applied <file version>`.
- **Checking:** run `npm run db:check` after any migration is applied. It compares the files with the recorded history and prints the fix for any mismatch. It needs `SUPABASE_ACCESS_TOKEN`. Without one, run `select version, name from supabase_migrations.schema_migrations order by version` and compare by hand.
- **Before shipping code that depends on a new migration,** make sure the migration is applied. Otherwise say so to the user.
- **Keep migrations re-runnable** (`create or replace`, `if not exists`), so applying one twice by mistake is harmless.
