-- SPEC-08: Seed inicial — las 14 personas actualmente hardcodeadas en equipo.html
-- Ejecutar DESPUÉS de 0001_team_panel_schema.sql
-- image_url apunta a los ficheros ya existentes en /imgs/equipo/ del propio sitio
-- (no requiere subir nada a Supabase Storage todavía; las fotos nuevas que se
-- añadan desde el panel sí se subirán al bucket team-photos).

insert into public.team_members (name, role, image_url, row_number, position, is_active) values
  ('Marco Sapiña', 'Fundador & CEO', '/imgs/equipo/marco.webp', 1, 1, true),
  ('Yurema Valverde', 'Chief Client & Growth Officer - CCO', '/imgs/equipo/yure.webp', 1, 2, true),
  ('Florencia Gomez', 'Head of Imcontent', '/imgs/equipo/florencia.webp', 1, 3, true),
  ('Mery González', 'Head of Finanzas', '/imgs/equipo/mery.webp', 1, 4, true),
  ('Angie Corpas', 'Motion Designer', '/imgs/equipo/angie.webp', 1, 5, true),
  ('Daniel Parra', 'Responsable administrativo', '/imgs/equipo/daniel.webp', 1, 6, true),
  ('Manel Lara', 'Automation & AI Specialist', '/imgs/equipo/manel.webp', 1, 7, true),
  ('Angie Corpas', 'Motion Designer', '/imgs/equipo/angie.webp', 2, 1, true),
  ('Bruno Azzi', 'Senior Graphic Designer', '/imgs/equipo/bruno.webp', 2, 2, true),
  ('Gregory Jaques', 'Senior Graphic Designer', '/imgs/equipo/grego.webp', 2, 3, true),
  ('Andres Barrios', 'Paid Media Specialist', '/imgs/equipo/andres.webp', 2, 4, true),
  ('Leidy Puentes', 'Paid Media Specialist', '/imgs/equipo/leidy.webp', 2, 5, true),
  ('Silvia Vera', 'Content Creator & Community Manager', '/imgs/equipo/silvia.webp', 2, 6, true),
  ('David Navarrete', 'Automation & AI Specialist', '/imgs/equipo/david.webp', 2, 7, true);
