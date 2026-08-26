-- CASA ALLEGRA · sincronización PC + iPhone
create table if not exists public.business_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.business_state enable row level security;

create policy "CASA ALLEGRA - own data select"
on public.business_state
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "CASA ALLEGRA - own data insert"
on public.business_state
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "CASA ALLEGRA - own data update"
on public.business_state
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.business_state to authenticated;
