-- Postulaciones a ofertas activas: tabla, RLS y bucket de Storage para el CV.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- El INSERT lo hace /api/job-application.js con la service_role key (se
-- salta RLS), nunca el cliente directamente — mismo patrón que
-- contact_messages (0010_contact_messages_schema.sql): valida reCAPTCHA v3 y
-- que la oferta exista/esté activa antes de guardar. Por eso no hay política
-- de insert para anon/authenticated.
--
-- A diferencia de contact_messages, aquí el CV es un dato personal sensible,
-- así que a diferencia del resto de tablas del panel (donde "usuario" ve en
-- modo lectura) el acceso queda restringido a admin, misma decisión que ya se
-- tomó para tokens_validos.

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_opening_id uuid references public.job_openings(id) on delete set null,
  job_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  cv_path text not null,
  cv_filename text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;

create policy "job_applications_select_admin_only"
  on public.job_applications for select
  to authenticated
  using (public.is_admin());

create policy "job_applications_update_admin_only"
  on public.job_applications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "job_applications_delete_admin_only"
  on public.job_applications for delete
  to authenticated
  using (public.is_admin());

-- Storage: bucket de CVs — privado (a diferencia de job-icons/team-photos),
-- solo accesible para admin vía URL firmada desde /postulaciones.
insert into storage.buckets (id, name, public)
values ('job-applications', 'job-applications', false)
on conflict (id) do nothing;

create policy "job_applications_storage_admin_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'job-applications' and public.is_admin());

create policy "job_applications_storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'job-applications' and public.is_admin());
