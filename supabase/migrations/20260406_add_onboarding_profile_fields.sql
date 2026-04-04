alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists productive_period text,
  add column if not exists focus_area text;

update public.profiles
set
  onboarding_completed = coalesce(onboarding_completed, false);
