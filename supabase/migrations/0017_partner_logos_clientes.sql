-- Reemplaza la barra de logos de la home: eran herramientas que usamos
-- (Figma, n8n, Meta...), pasan a ser las marcas de nuestros clientes —
-- reutiliza los mismos archivos de logo ya usados en cada tarjeta de
-- casos-de-exito.html (data-logo), sin subir nada nuevo.
-- Ejecutar DESPUÉS de 0006_partner_logos.sql.
--
-- Nota: Grupo Mimara queda FUERA de este seed a propósito — su tarjeta en
-- case_studies apunta por error al logo de La Manso (manso-logo.png) y no
-- existe ningún archivo de logo propio de Mimara en /imgs (solo la foto de
-- portada/testimonio). Añadirlo aquí cuando se suba el logo real.

delete from public.partner_logos;

insert into public.partner_logos (name, image_url, position, is_active) values
  ('Nutfruit', '/imgs/nutfruit-negro.png', 1, true),
  ('Velites', '/imgs/velites_logo_letras_WHITE.avif', 2, true),
  ('Amlul', '/imgs/amlul-logo.png', 3, true),
  ('Bobo Choses', '/imgs/bobo-logo.svg', 4, true),
  ('La Manso', '/imgs/manso-logo.png', 5, true),
  ('La Marca Well', '/imgs/well-logo.png', 6, true),
  ('Ángela Navarro', '/imgs/angela-logo-dark.png', 7, true),
  ('Cool Bottles', '/imgs/cool-logo-dark.avif', 8, true),
  ('Gabriel For Sach', '/imgs/gabriel-logo-dark.png', 9, true),
  ('Iventions', '/imgs/iventions-logo.svg', 10, true),
  ('Mun Kombucha', '/imgs/mun-logo.png', 11, true),
  ('Oxperta Capital', '/imgs/Oxperta-logo-dark.png', 12, true),
  ('Oxperta Express', '/imgs/oxperta-logo.svg', 13, true),
  ('Teamder', '/imgs/Imagotipo-Vertical-Blanco_1.png', 14, true),
  ('Crewel Work', '/imgs/crewel-logo-white.png', 15, true),
  ('TravelPerk', '/imgs/travel-logo-white.png', 16, true),
  ('Vasquiat', '/imgs/vasquiat-logo.png', 17, true),
  ('Wetribu', '/imgs/wetribu-logo.avif', 18, true);
