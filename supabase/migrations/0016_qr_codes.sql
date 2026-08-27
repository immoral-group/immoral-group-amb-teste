-- Códigos QR dinámicos: el QR impreso codifica una URL corta propia
-- (/qr/<slug>) que redirige al target_url actual — cambiar el destino no
-- requiere reimprimir el QR. Panel nuevo: /qr-codes.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null,
  target_url text not null,
  is_active boolean not null default true,
  scan_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.qr_codes enable row level security;

create unique index if not exists qr_codes_slug_key on public.qr_codes (slug);

drop trigger if exists trg_qr_codes_updated_at on public.qr_codes;
create trigger trg_qr_codes_updated_at
  before update on public.qr_codes
  for each row
  execute function public.set_updated_at();

-- Lectura: cualquier persona del equipo autenticada (mismo criterio que el
-- resto del panel). El lookup público para la redirección real NO usa esta
-- política — lo hace api/qr.js con la service_role key, que se salta RLS
-- (igual que api/contact.js con tokens_validos), así que no hace falta una
-- política de select para anon.
create policy "qr_codes_select_authenticated_all"
  on public.qr_codes for select
  to authenticated
  using (true);

create policy "qr_codes_insert_admin_only"
  on public.qr_codes for insert
  to authenticated
  with check (public.is_admin());

create policy "qr_codes_update_admin_only"
  on public.qr_codes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "qr_codes_delete_admin_only"
  on public.qr_codes for delete
  to authenticated
  using (public.is_admin());
