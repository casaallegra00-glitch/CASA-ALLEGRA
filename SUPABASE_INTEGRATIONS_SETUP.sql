-- CASA ALLEGRA · conexiones OAuth por usuario
-- Ejecutar una vez en Supabase SQL Editor.
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('mercadopago','mercadolibre')),
  credential jsonb not null,
  provider_user_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.integration_connections enable row level security;

create policy "CASA ALLEGRA - own integration select"
on public.integration_connections for select to authenticated
using ((select auth.uid()) = user_id);

create policy "CASA ALLEGRA - own integration insert"
on public.integration_connections for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "CASA ALLEGRA - own integration update"
on public.integration_connections for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.integration_connections to authenticated;
