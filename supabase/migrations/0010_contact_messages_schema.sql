-- Mensajes del formulario de contacto — schema, RLS y triggers
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- Reemplaza el envío directo por email (Resend) del formulario de /contacto:
-- ahora /api/contact.js valida un token de esta tabla y guarda el mensaje en
-- contact_messages, visible desde el panel interno (/mensajes). El envío por
-- email/Slack se hará más adelante vía automatización n8n, no desde este API.
--
-- El token no es un secreto profundo (viaja en el bundle del cliente, como la
-- clave anon de Supabase): su función es identificar de qué web/formulario
-- viene cada envío ("etiqueta"), no autenticar a un usuario. La validación
-- real de que el INSERT es legítimo la hace /api/contact.js con la
-- service_role key (nunca expuesta al cliente), que se salta RLS.

create table if not exists public.tokens_validos (
  token text primary key,
  etiqueta text not null,
  created_at timestamptz not null default now()
);

alter table public.tokens_validos enable row level security;
-- Sin políticas para anon/authenticated: solo la service_role key (usada por
-- /api/contact.js) puede leer esta tabla. Ni el panel ni el cliente público
-- necesitan acceso directo.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  mensaje text not null,
  etiqueta text,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- El INSERT lo hace /api/contact.js con la service_role key (se salta RLS),
-- nunca el cliente directamente: por eso no hay política de insert para
-- anon/authenticated.

-- Cualquier persona del equipo autenticada (admin o usuario) puede ver la
-- bandeja de mensajes, igual que el resto de paneles internos.
create policy "contact_messages_select_authenticated_all"
  on public.contact_messages for select
  to authenticated
  using (true);

-- Marcar como leído/no leído: cualquier autenticado (bandeja compartida).
create policy "contact_messages_update_authenticated_leido"
  on public.contact_messages for update
  to authenticated
  using (true)
  with check (true);

-- Borrar un mensaje: solo admin (acción destructiva, mismo criterio que el
-- resto del panel).
create policy "contact_messages_delete_admin_only"
  on public.contact_messages for delete
  to authenticated
  using (public.is_admin());
