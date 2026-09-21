-- 토끼마켓 1단계: 사용자 프로필
-- (가계부와 같은 Supabase 프로젝트를 쓰므로 market_ 접두사로 구분한다)

create table if not exists public.market_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_emoji text not null default '🐰',
  region text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_profiles_nickname_lower_idx
  on public.market_profiles (lower(nickname));

alter table public.market_profiles enable row level security;

create policy "market_profiles_select_public"
  on public.market_profiles for select to anon, authenticated using (true);

create policy "market_profiles_insert_own"
  on public.market_profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "market_profiles_update_own"
  on public.market_profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.market_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger market_profiles_touch_updated_at
  before update on public.market_profiles
  for each row execute function public.market_touch_updated_at();

-- 회원가입 시 프로필 자동 생성. 닉네임이 겹치면 뒤에 숫자를 붙인다.
create or replace function public.handle_new_market_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base_nickname text;
  candidate text;
  suffix int := 0;
begin
  base_nickname := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    '토끼' || substr(replace(new.id::text, '-', ''), 1, 6)
  );
  candidate := base_nickname;

  while exists (
    select 1 from public.market_profiles p where lower(p.nickname) = lower(candidate)
  ) loop
    suffix := suffix + 1;
    candidate := base_nickname || suffix::text;
  end loop;

  insert into public.market_profiles (id, nickname)
  values (new.id, candidate)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created_market
  after insert on auth.users
  for each row execute function public.handle_new_market_user();
