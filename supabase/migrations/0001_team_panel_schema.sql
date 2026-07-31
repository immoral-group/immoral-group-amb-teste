-- SPEC-08: Panel de administración interno — schema, RLS y triggers
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run

-- ============================================================
-- profiles (rol de cada usuario que ha iniciado sesión)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  app_role text not null default 'usuario' check (app_role in ('admin', 'usuario')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Función auxiliar (security definer) para comprobar el rol del usuario
-- que hace la petición, sin caer en recursión de RLS sobre la propia tabla.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and app_role = 'admin'
  );
$$;

-- Cada usuario puede ver su propia fila (para saber su propio rol).
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Un admin puede ver todas las filas (necesario para /roles).
create policy "profiles_select_admin_all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Solo un admin puede cambiar el rol de cualquier usuario (incluido el suyo,
-- salvo que sea el último admin — ver trigger prevent_last_admin_demotion).
create policy "profiles_update_admin_only"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Protección anti-lockout: el último admin no puede autodegradarse.
create or replace function public.prevent_last_admin_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.app_role = 'admin' and NEW.app_role <> 'admin' then
    if (select count(*) from public.profiles where app_role = 'admin') <= 1 then
      raise exception 'No se puede quitar el rol de admin al último administrador del sistema';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_last_admin_demotion on public.profiles;
create trigger trg_prevent_last_admin_demotion
  before update on public.profiles
  for each row
  execute function public.prevent_last_admin_demotion();

-- Crea automáticamente la fila de profiles en cada alta nueva de auth.users
-- (email/contraseña o Google), siempre con rol 'usuario' por defecto.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, app_role)
  values (new.id, new.email, 'usuario')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- team_members (personas mostradas en /equipo)
-- ============================================================

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  image_url text not null,
  row_number smallint not null check (row_number in (1, 2)),
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at
  before update on public.team_members
  for each row
  execute function public.set_updated_at();

-- Lectura pública: solo las personas activas (lo que ve /equipo sin login).
create policy "team_members_select_public_active"
  on public.team_members for select
  to anon
  using (is_active = true);

-- Cualquier usuario autenticado (admin o usuario) ve el listado completo
-- desde el panel, incluidas las inactivas.
create policy "team_members_select_authenticated_all"
  on public.team_members for select
  to authenticated
  using (true);

-- Solo admin puede crear, modificar (incl. el toggle is_active) o borrar.
create policy "team_members_insert_admin_only"
  on public.team_members for insert
  to authenticated
  with check (public.is_admin());

create policy "team_members_update_admin_only"
  on public.team_members for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "team_members_delete_admin_only"
  on public.team_members for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- Storage: bucket de fotos del equipo
-- ============================================================

insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

create policy "team_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'team-photos');

create policy "team_photos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'team-photos' and public.is_admin());

create policy "team_photos_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'team-photos' and public.is_admin())
  with check (bucket_id = 'team-photos' and public.is_admin());

create policy "team_photos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'team-photos' and public.is_admin());
