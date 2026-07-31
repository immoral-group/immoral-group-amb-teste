-- Seed: las 2 ofertas actualmente hardcodeadas en equipo.html.
-- icon_url apunta a los ficheros ya existentes en /imgs/ del propio sitio.

insert into public.job_openings (title, icon_url, position, is_active) values
  ('Paid Media Specialist', '/imgs/ico-mani-box-1.png', 1, true),
  ('Email & Marketing Automation Specialist', '/imgs/ico-mani-box-2.png', 2, true);
