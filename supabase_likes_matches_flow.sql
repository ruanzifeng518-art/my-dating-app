alter table public.likes
add column if not exists status text not null default 'like';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'likes_status_check'
  ) then
    alter table public.likes
    add constraint likes_status_check check (status in ('like', 'dislike'));
  end if;
end $$;

create index if not exists idx_likes_status on public.likes(status);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self"
on public.likes
for insert
to authenticated
with check (auth.uid() = from_user and status in ('like', 'dislike'));

drop policy if exists "likes_update_self" on public.likes;
create policy "likes_update_self"
on public.likes
for update
to authenticated
using (auth.uid() = from_user)
with check (auth.uid() = from_user and status in ('like', 'dislike'));

drop policy if exists "matches_insert_participant" on public.matches;
create policy "matches_insert_participant"
on public.matches
for insert
to authenticated
with check (auth.uid() = user_a or auth.uid() = user_b);
