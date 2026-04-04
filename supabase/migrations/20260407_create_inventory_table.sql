create table if not exists public.inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null check (item_key in ('social_coupon', 'xp_boost', 'pass_free')),
  quantity integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, item_key)
);

grant all on table public.inventory to anon, authenticated, service_role;

insert into public.inventory (user_id, item_key, quantity)
select id, 'social_coupon', social_coupon_count
from public.profiles
where coalesce(social_coupon_count, 0) > 0
on conflict (user_id, item_key)
do update set
  quantity = greatest(public.inventory.quantity, excluded.quantity),
  updated_at = timezone('utc', now());

insert into public.inventory (user_id, item_key, quantity)
select id, 'pass_free', pass_free_count
from public.profiles
where coalesce(pass_free_count, 0) > 0
on conflict (user_id, item_key)
do update set
  quantity = greatest(public.inventory.quantity, excluded.quantity),
  updated_at = timezone('utc', now());
