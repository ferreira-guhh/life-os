alter table public.profiles
  add column if not exists box_progress integer not null default 0,
  add column if not exists social_coupon_count integer not null default 0,
  add column if not exists pass_free_count integer not null default 0,
  add column if not exists xp_multiplier_expires_at timestamptz;

alter table public.profiles
  alter column gold set default 0,
  alter column boxes_count set default 0,
  alter column streak set default 0;

update public.profiles
set
  gold = coalesce(gold, 0),
  boxes_count = coalesce(boxes_count, 0),
  streak = coalesce(streak, 0),
  box_progress = coalesce(box_progress, 0),
  social_coupon_count = coalesce(social_coupon_count, 0),
  pass_free_count = coalesce(pass_free_count, 0);
