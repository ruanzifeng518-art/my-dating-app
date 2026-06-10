create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  age integer not null check (age between 18 and 99),
  avatar_url text,
  bio text default '',
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id bigint generated always as identity primary key,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'like' check (status in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  constraint likes_no_self_like check (from_user <> to_user),
  constraint likes_unique unique (from_user, to_user)
);

create table if not exists public.matches (
  id bigint generated always as identity primary key,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_no_self_match check (user_a <> user_b),
  constraint matches_order check (user_a < user_b),
  constraint matches_unique unique (user_a, user_b)
);

create index if not exists idx_profiles_gender on public.profiles(gender);
create index if not exists idx_likes_from_user on public.likes(from_user);
create index if not exists idx_likes_to_user on public.likes(to_user);
create index if not exists idx_matches_user_a on public.matches(user_a);
create index if not exists idx_matches_user_b on public.matches(user_b);

alter table public.profiles enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_public'
  ) then
    execute 'create policy "profiles_select_public" on public.profiles for select to anon, authenticated using (true);';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'likes'
      and policyname = 'likes_select_public'
  ) then
    execute 'create policy "likes_select_public" on public.likes for select to anon, authenticated using (true);';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'matches'
      and policyname = 'matches_select_public'
  ) then
    execute 'create policy "matches_select_public" on public.matches for select to anon, authenticated using (true);';
  end if;
end $$;

insert into public.profiles (id, nickname, gender, age, avatar_url, bio, interests)
values
  ('8d6d265f-86e9-4785-8947-7ca0ba4ff301', '林晚晴', 'female', 24, 'https://randomuser.me/api/portraits/women/44.jpg', '喜欢晨跑和周末探店，希望遇见一个真诚又有趣的人。', array['运动', '音乐', '咖啡', '旅行']),
  ('a8a25d89-2166-49b3-b71a-c5c5f7271202', '顾念', 'female', 26, 'https://randomuser.me/api/portraits/women/68.jpg', '慢热但很好相处，爱听 live house，也喜欢一起看电影。', array['音乐', '电影', '拍照', '夜跑']),
  ('d81d4a91-9f9c-4f86-868a-983b69ef8a03', '沈知意', 'female', 25, 'https://randomuser.me/api/portraits/women/65.jpg', '白天做平面设计，晚上喜欢做甜品，想找一个能分享生活的人。', array['烘焙', '展览', '运动', '宠物']),
  ('1faacac1-5b42-44b5-8faf-55f1be7e3204', '许安然', 'female', 23, 'https://randomuser.me/api/portraits/women/33.jpg', '喜欢阳光、海边和吉他，理想约会是傍晚散步加小酒馆。', array['吉他', '音乐', '海边', '美食']),
  ('6ed8bb0f-f15d-4720-88eb-726f6b173205', '周可心', 'female', 27, 'https://randomuser.me/api/portraits/women/75.jpg', '健身和读书都喜欢，希望认识情绪稳定、愿意认真相处的人。', array['健身', '读书', '瑜伽', '旅行'])
on conflict (id) do nothing;
