-- Corrige en el dato los valores de sector/resultado de case_studies que el
-- commit e53f817 ("Aplica textos y ajustes técnicos de la propuesta V4")
-- solo corrigió en el HTML generado, sin tocar Supabase (que es la fuente
-- real: casos-de-exito.html y caso-*.html se regeneran desde aquí en cada
-- npm run dev/build vía scripts/generate-case-studies.mjs). Sin este UPDATE,
-- cualquier regeneración local o en build revierte las etiquetas a los
-- valores viejos del seed (0009_case_studies_seed.sql) — reproducido en
-- local el 2026-09-24.
-- Ejecutar DESPUÉS de 0009_case_studies_seed.sql.

update public.case_studies set sector = 'Alimentación y bebidas' where sector = 'Alimentación & Bebidas';
update public.case_studies set sector = 'Moda y lifestyle' where sector = 'Moda & Lifestyle';
update public.case_studies set sector = 'Salud y bienestar' where sector = 'Salud & Bienestar';
update public.case_studies set sector = 'Servicios B2B y software' where sector = 'Servicios B2B & SaaS';

update public.case_studies set resultado = 'Notoriedad' where resultado = 'Awareness';
