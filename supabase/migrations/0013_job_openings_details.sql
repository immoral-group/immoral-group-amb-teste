-- Añade slug/descripción/encuesta a job_openings para la página de detalle
-- de cada oferta (/oferta.html?slug=...), enlazada desde las cards de
-- "Ofertas activas" en /equipo.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- survey_url es opcional (columna nullable): la página de detalle solo
-- muestra el botón "Responder encuesta" cuando el admin la rellena desde
-- /ofertas, es una encuesta externa (Google Forms/Typeform), no un formulario
-- propio.

alter table public.job_openings
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists survey_url text;

-- Backfill de las 2 ofertas seed (0005_job_openings_seed.sql), mismo criterio
-- de slugify (minúsculas, sin espacios/acentos) que casosAdmin.js.
update public.job_openings set slug = 'paidmediaspecialist', description = 'Buscamos un/a Paid Media Specialist para planificar y optimizar campañas de publicidad digital (Meta, Google Ads, TikTok) para las cuentas de nuestros clientes, con foco en resultados medibles.'
  where title = 'Paid Media Specialist' and slug is null;
update public.job_openings set slug = 'emailmarketingautomationspecialist', description = 'Buscamos un/a Email & Marketing Automation Specialist para diseñar flujos de email marketing y automatizaciones que acompañen a los usuarios a lo largo del funnel de nuestros clientes.'
  where title = 'Email & Marketing Automation Specialist' and slug is null;

alter table public.job_openings
  alter column slug set not null,
  alter column description set not null;

create unique index if not exists job_openings_slug_key on public.job_openings (slug);
