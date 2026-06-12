alter table public.profiles
add column if not exists is_verified boolean not null default false;

update public.profiles
set is_verified = false
where is_verified is null;

create index if not exists idx_profiles_is_verified on public.profiles (is_verified);
