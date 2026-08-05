-- Casos de éxito gestionables desde /casos-admin.
-- Tres tablas: case_studies (portada + contenido del detalle),
-- case_study_results (KPIs, 2-3 por caso, cantidad variable) y
-- case_study_testimonials (opcional, algunos casos no llevan). Mismo patrón
-- de RLS que team_members/job_openings (0001/0004): lectura pública solo de
-- lo activo, gestión completa solo para admin. Reutiliza public.is_admin()
-- y public.set_updated_at() ya creadas en 0001_team_panel_schema.sql.
-- Ejecutar DESPUÉS de 0001_team_panel_schema.sql.

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand_name text not null,
  sector text not null,
  resultado text not null,
  cover_image_url text not null,
  cover_image_alt text not null,
  logo_url text not null,
  description text not null,
  challenge_text text not null,
  mid_image_url text not null,
  mid_image_alt text not null,
  solution_text text not null,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.case_studies enable row level security;

drop trigger if exists trg_case_studies_updated_at on public.case_studies;
create trigger trg_case_studies_updated_at
  before update on public.case_studies
  for each row
  execute function public.set_updated_at();

create policy "case_studies_select_public_active"
  on public.case_studies for select
  to anon
  using (is_active = true);

create policy "case_studies_select_authenticated_all"
  on public.case_studies for select
  to authenticated
  using (true);

create policy "case_studies_insert_admin_only"
  on public.case_studies for insert
  to authenticated
  with check (public.is_admin());

create policy "case_studies_update_admin_only"
  on public.case_studies for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "case_studies_delete_admin_only"
  on public.case_studies for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- case_study_results (KPIs del bloque "Resultados")
-- ============================================================

create table if not exists public.case_study_results (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  value text not null,
  label text not null,
  position integer not null,
  created_at timestamptz not null default now()
);

alter table public.case_study_results enable row level security;

-- Las tablas hijas necesitan sus propias policies de RLS (no heredan las del
-- padre): la lectura pública se filtra comprobando que el caso padre esté
-- activo, vía subconsulta.
create policy "case_study_results_select_public_active"
  on public.case_study_results for select
  to anon
  using (
    exists (
      select 1 from public.case_studies cs
      where cs.id = case_study_id and cs.is_active = true
    )
  );

create policy "case_study_results_select_authenticated_all"
  on public.case_study_results for select
  to authenticated
  using (true);

create policy "case_study_results_insert_admin_only"
  on public.case_study_results for insert
  to authenticated
  with check (public.is_admin());

create policy "case_study_results_update_admin_only"
  on public.case_study_results for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "case_study_results_delete_admin_only"
  on public.case_study_results for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- case_study_testimonials (opcional — no todos los casos llevan)
-- ============================================================

create table if not exists public.case_study_testimonials (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  highlight text not null,
  quote text not null,
  author_name text not null,
  author_role text,
  position integer not null,
  created_at timestamptz not null default now()
);

alter table public.case_study_testimonials enable row level security;

create policy "case_study_testimonials_select_public_active"
  on public.case_study_testimonials for select
  to anon
  using (
    exists (
      select 1 from public.case_studies cs
      where cs.id = case_study_id and cs.is_active = true
    )
  );

create policy "case_study_testimonials_select_authenticated_all"
  on public.case_study_testimonials for select
  to authenticated
  using (true);

create policy "case_study_testimonials_insert_admin_only"
  on public.case_study_testimonials for insert
  to authenticated
  with check (public.is_admin());

create policy "case_study_testimonials_update_admin_only"
  on public.case_study_testimonials for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "case_study_testimonials_delete_admin_only"
  on public.case_study_testimonials for delete
  to authenticated
  using (public.is_admin());

-- ============================================================
-- Storage: bucket único para las 3 imágenes por caso (portada/logo/imagen
-- intermedia), con prefijos de carpeta (covers/, logos/, mid/) en vez de un
-- bucket por campo — esta entidad tiene más campos de imagen que cualquier
-- otra ya existente y un bucket por campo sería ruido innecesario.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('case-study-media', 'case-study-media', true)
on conflict (id) do nothing;

create policy "case_study_media_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'case-study-media');

create policy "case_study_media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'case-study-media' and public.is_admin());

create policy "case_study_media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'case-study-media' and public.is_admin())
  with check (bucket_id = 'case-study-media' and public.is_admin());

create policy "case_study_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'case-study-media' and public.is_admin());
