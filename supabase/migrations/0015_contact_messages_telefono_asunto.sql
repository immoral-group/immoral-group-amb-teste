-- Añade teléfono/asunto (opcionales) a contact_messages para soportar el
-- formulario de imfashion.es, que tiene más campos que el resto de webs del
-- grupo (nombre/email/mensaje). Nullable a propósito: las otras 3 webs
-- (immoral.es, immoralia.es, imcontent.es) siguen sin usarlos.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run

alter table public.contact_messages
  add column if not exists telefono text,
  add column if not exists asunto text;
