-- CASA ALLEGRA · conexiones por usuario/negocio
-- Ejecutar una vez en Supabase SQL Editor.
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  credential jsonb not null,
  provider_user_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

-- Migración segura para instalaciones que ya tenían el check anterior.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'integration_connections_provider_check'
      and conrelid = 'public.integration_connections'::regclass
  ) then
    alter table public.integration_connections drop constraint integration_connections_provider_check;
  end if;
end $$;

alter table public.integration_connections
  add constraint integration_connections_provider_check
  check (provider in ('mercadopago','mercadolibre','andreani','correoargentino'));

alter table public.integration_connections enable row level security;

-- Reaplicación idempotente de políticas para evitar errores al ejecutar más de una vez.
drop policy if exists "CASA ALLEGRA - own integration select" on public.integration_connections;
drop policy if exists "CASA ALLEGRA - own integration insert" on public.integration_connections;
drop policy if exists "CASA ALLEGRA - own integration update" on public.integration_connections;
drop policy if exists "CASA ALLEGRA - own integration delete" on public.integration_connections;

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

create policy "CASA ALLEGRA - own integration delete"
on public.integration_connections for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.integration_connections to authenticated;
