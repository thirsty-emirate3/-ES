-- ユーザーごとの残り回数管理(初回1回無料 = 初期値1)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 1,
  plan text not null default 'free', -- free / pack / monthly
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "own profile read" on public.profiles
  for select using (auth.uid() = id);

-- 新規ユーザー登録時にprofileを自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 添削履歴
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qtype text,
  question text,
  body text,
  tags text[],
  result jsonb,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "own reviews read" on public.reviews
  for select using (auth.uid() = user_id);

-- 面接対策(幹枝シート)
create table if not exists public.interview_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qtype text,
  question text,
  body text,
  result jsonb,
  created_at timestamptz default now()
);
alter table public.interview_sheets enable row level security;
create policy "own sheets read" on public.interview_sheets
  for select using (auth.uid() = user_id);
