-- Ofertas activas mostradas en /equipo (sección "Ofertas activas").
-- Mismo patrón de RLS que team_members (0001_team_panel_schema.sql):
-- lectura pública de las activas, gestión completa solo para admin.
-- Ejecutar DESPUÉS de 0001_team_panel_schema.sql (usa la función public.is_admin()).

create table if not exists public.job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon_url text not null,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_openings enable row level security;

drop trigger if exists trg_job_openings_updated_at on public.job_openings;
create trigger trg_job_openings_updated_at
  before update on public.job_openings
  for each row
  execute function public.set_updated_at();

create policy "job_openings_select_public_active"
  on public.job_openings for select
  to anon
  using (is_active = true);

create policy "job_openings_select_authenticated_all"
  on public.job_openings for select
  to authenticated
  using (true);

create policy "job_openings_insert_admin_only"
  on public.job_openings for insert
  to authenticated
  with check (public.is_admin());

create policy "job_openings_update_admin_only"
  on public.job_openings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "job_openings_delete_admin_only"
  on public.job_openings for delete
  to authenticated
  using (public.is_admin());

-- Storage: bucket de iconos de las ofertas.
insert into storage.buckets (id, name, public)
values ('job-icons', 'job-icons', true)
on conflict (id) do nothing;

create policy "job_icons_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'job-icons');

create policy "job_icons_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'job-icons' and public.is_admin());

create policy "job_icons_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'job-icons' and public.is_admin())
  with check (bucket_id = 'job-icons' and public.is_admin());

create policy "job_icons_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'job-icons' and public.is_admin());
