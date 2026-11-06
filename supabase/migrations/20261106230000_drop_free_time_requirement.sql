-- Onboarding no longer asks for weekly free time or health notes.
-- Keep the columns (existing data stays), but stop requiring free time.
alter table public.profiles alter column weekly_free_minutes drop not null;
