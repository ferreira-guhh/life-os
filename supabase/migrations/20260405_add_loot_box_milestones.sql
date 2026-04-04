alter table public.profiles
  add column if not exists total_tasks_completed integer not null default 0,
  add column if not exists last_box_milestone_claimed integer not null default 0;

update public.profiles
set
  total_tasks_completed = coalesce(total_tasks_completed, 0),
  last_box_milestone_claimed = coalesce(last_box_milestone_claimed, 0);

update public.profiles
set
  total_tasks_completed = greatest(
    coalesce(total_tasks_completed, 0),
    coalesce(boxes_count, 0) * 10 + coalesce(box_progress, 0)
  ),
  last_box_milestone_claimed = greatest(
    coalesce(last_box_milestone_claimed, 0),
    coalesce(boxes_count, 0) * 10
  );
