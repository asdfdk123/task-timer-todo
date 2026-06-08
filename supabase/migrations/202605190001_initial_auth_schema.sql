create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.todos (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  local_todo_id bigint not null,
  title text not null check (char_length(trim(title)) > 0),
  completed boolean not null default false,
  total_elapsed_sec integer not null default 0 check (total_elapsed_sec >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_todo_id)
);

create index if not exists todos_user_id_updated_at_idx
  on public.todos (user_id, updated_at desc);

create table if not exists public.timer_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  local_session_id text not null,
  local_todo_id bigint,
  todo_title text not null,
  duration_sec integer not null check (duration_sec > 0),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  date_key text not null check (date_key ~ '^\d{4}-\d{2}-\d{2}$'),
  weekday_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_session_id)
);

create index if not exists timer_sessions_user_id_completed_at_idx
  on public.timer_sessions (user_id, completed_at desc);

create table if not exists public.user_settings (
  id text primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  completion_sound_enabled boolean not null default true,
  notification_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

drop trigger if exists set_timer_sessions_updated_at on public.timer_sessions;
create trigger set_timer_sessions_updated_at
before update on public.timer_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

alter table public.todos enable row level security;
alter table public.timer_sessions enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read own todos"
on public.todos
for select
using (auth.uid() = user_id);

create policy "Users can insert own todos"
on public.todos
for insert
with check (auth.uid() = user_id);

create policy "Users can update own todos"
on public.todos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own todos"
on public.todos
for delete
using (auth.uid() = user_id);

create policy "Users can read own timer sessions"
on public.timer_sessions
for select
using (auth.uid() = user_id);

create policy "Users can insert own timer sessions"
on public.timer_sessions
for insert
with check (auth.uid() = user_id);

create policy "Users can update own timer sessions"
on public.timer_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own timer sessions"
on public.timer_sessions
for delete
using (auth.uid() = user_id);

create policy "Users can read own user settings"
on public.user_settings
for select
using (auth.uid() = user_id);

create policy "Users can insert own user settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own user settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own user settings"
on public.user_settings
for delete
using (auth.uid() = user_id);
