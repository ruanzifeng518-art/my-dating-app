alter table public.profiles
add column if not exists latitude double precision;

alter table public.profiles
add column if not exists longitude double precision;

alter table public.profiles
add column if not exists location_updated_at timestamptz;

create index if not exists profiles_latitude_idx on public.profiles (latitude);
create index if not exists profiles_longitude_idx on public.profiles (longitude);
