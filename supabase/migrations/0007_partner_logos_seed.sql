-- Seed inicial de partner_logos: los 13 logos ya hardcodeados en index.html
-- (movidos de /imgs/brands/ a /imgs/barra-logos/) + los 9 nuevos aportados
-- por el usuario, todos ya en /imgs/barra-logos/ del propio sitio.
-- Ejecutar DESPUÉS de 0006_partner_logos.sql.
-- Los logos nuevos que se añadan desde el panel (/logos) sí se subirán al
-- bucket partner-logos.

insert into public.partner_logos (name, image_url, position, is_active) values
  ('Figma', '/imgs/barra-logos/Figma_Logo_0.svg', 1, true),
  ('Freepik', '/imgs/barra-logos/Freepik_id07UrLimP_1.svg', 2, true),
  ('LinkedIn', '/imgs/barra-logos/LinkedIn_Logo_0.svg', 3, true),
  ('n8n', '/imgs/barra-logos/N8n.io_Logo_0.svg', 4, true),
  ('TikTok', '/imgs/barra-logos/TikTok_Logo_0.svg', 5, true),
  ('Meta', '/imgs/barra-logos/Meta_id0D-m9C5l_0.svg', 6, true),
  ('Google', '/imgs/barra-logos/google.svg', 7, true),
  ('Spotify', '/imgs/barra-logos/spotify.svg', 8, true),
  ('ActiveCampaign', '/imgs/barra-logos/active.svg', 9, true),
  ('ClickUp', '/imgs/barra-logos/clickup.svg', 10, true),
  ('Analytics', '/imgs/barra-logos/analytics.png', 11, true),
  ('HeyGen', '/imgs/barra-logos/heygen.png', 12, true),
  ('WordPress', '/imgs/barra-logos/wordpress.svg', 13, true),
  ('Blender', '/imgs/barra-logos/Blender.svg', 14, true),
  ('Canva', '/imgs/barra-logos/Canva_Logo_0.svg', 15, true),
  ('Claude', '/imgs/barra-logos/Claude_Logo_0.svg', 16, true),
  ('ElevenLabs', '/imgs/barra-logos/ElevenLabs_Logo_0.svg', 17, true),
  ('Envato', '/imgs/barra-logos/Envato_Logo_0.svg', 18, true),
  ('GitHub', '/imgs/barra-logos/GitHub_Logo_0.svg', 19, true),
  ('Higgsfield', '/imgs/barra-logos/Higgsfield.svg', 20, true),
  ('Magnific', '/imgs/barra-logos/Magnific_Logo_0.svg', 21, true),
  ('Vercel', '/imgs/barra-logos/Vercel_Logo_0.svg', 22, true);
