-- Barra de logos de partners/herramientas mostrada en la home (index.html).
-- Mismo patrón de RLS que job_openings (0004_job_openings.sql):
-- lectura pública de los activos, gestión completa solo para admin.
-- Ejecutar DESPUÉS de 0001_team_panel_schema.sql (usa la función public.is_admin()
-- y el trigger public.set_updated_at()).

create table if not exists public.partner_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_logos enable row level security;

drop trigger if exists trg_partner_logos_updated_at on public.partner_logos;
create trigger trg_partner_logos_updated_at
  before update on public.partner_logos
  for each row
  execute function public.set_updated_at();

create policy "partner_logos_select_public_active"
  on public.partner_logos for select
  to anon
  using (is_active = true);

create policy "partner_logos_select_authenticated_all"
  on public.partner_logos for select
  to authenticated
  using (true);

create policy "partner_logos_insert_admin_only"
  on public.partner_logos for insert
  to authenticated
  with check (public.is_admin());

create policy "partner_logos_update_admin_only"
  on public.partner_logos for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "partner_logos_delete_admin_only"
  on public.partner_logos for delete
  to authenticated
  using (public.is_admin());

-- Storage: bucket de logos subidos desde el panel (los del seed inicial
-- apuntan a /imgs/barra-logos/ del propio sitio, no a este bucket).
insert into storage.buckets (id, name, public)
values ('partner-logos', 'partner-logos', true)
on conflict (id) do nothing;

create policy "partner_logos_bucket_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'partner-logos');

create policy "partner_logos_bucket_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'partner-logos' and public.is_admin());

create policy "partner_logos_bucket_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'partner-logos' and public.is_admin())
  with check (bucket_id = 'partner-logos' and public.is_admin());

create policy "partner_logos_bucket_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'partner-logos' and public.is_admin());
