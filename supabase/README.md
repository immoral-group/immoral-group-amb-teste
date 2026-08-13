# Supabase — panel interno de equipo (SPEC-08)

Este proyecto Supabase se usa **solo** para el panel interno de `/admin`, `/ofertas`, `/logos`, `/casos-admin` y `/roles`, y para servir los listados de `/equipo` (personas y ofertas activas) y la barra de logos de partners de la home. El resto de la web sigue siendo HTML estático — con una excepción: los casos de éxito (`casos-de-exito.html` y `caso-*.html`) también son HTML estático, pero generado automáticamente a partir de esta base de datos en cada `npm run dev`/`npm run build` (ver `scripts/generate-case-studies.mjs`), en vez de con un fetch en el navegador como el resto del panel — se decidió así para no perder el SEO propio de cada página.

## Pasos para dejarlo operativo (Dashboard → tu proyecto)

Ejecutar en este orden, en **SQL Editor → New query**, pegando el contenido completo de cada fichero y pulsando *Run*:

1. `migrations/0001_team_panel_schema.sql` — tablas, RLS, funciones y triggers.
2. `migrations/0002_team_panel_seed.sql` — carga las 14 personas actuales de `equipo.html`.
3. `migrations/0003_auth_hook_domain_restriction.sql` — crea la función que restringe el login a `@immoral.es` / `@immoral.marketing`.
4. `migrations/0004_job_openings.sql` — tabla y RLS de las ofertas activas mostradas en `/equipo`.
5. `migrations/0005_job_openings_seed.sql` — carga las 2 ofertas actuales de `equipo.html`.
6. `migrations/0006_partner_logos.sql` — tabla, RLS y bucket de Storage de la barra de logos de la home.
7. `migrations/0007_partner_logos_seed.sql` — carga los 22 logos actuales (13 previos + 9 nuevos) desde `/imgs/barra-logos/`.
8. `migrations/0008_case_studies.sql` — tablas (`case_studies`, `case_study_results`, `case_study_testimonials`), RLS y bucket de Storage de los casos de éxito.
9. `migrations/0009_case_studies_seed.sql` — carga los 19 casos actuales extraídos de `casos-de-exito.html`/`caso-*.html`. Nota: el logo de Velites (`velites_logo_letras_WHITE.avif`) dependía de un filtro CSS `invert` que la plantilla generada no reproduce — quedará invisible en su hero hasta que se suba una versión oscura del logo desde `/casos-admin`.
10. `migrations/0010_contact_messages_schema.sql` y `migrations/0011_contact_messages_seed.sql` — bandeja de mensajes de contacto (`/mensajes`).
11. `migrations/0012_tokens_validos_rls.sql` — RLS de `tokens_validos` para gestionarlos desde `/tokens`.
12. `migrations/0013_job_openings_details.sql` — añade `slug`/`description`/`survey_url` a `job_openings` para la página de detalle de cada oferta (`/oferta.html?slug=...`).
13. `migrations/0014_job_applications.sql` — tabla `job_applications`, RLS (solo admin, el CV es un dato personal sensible) y bucket privado `job-applications` para las candidaturas enviadas desde `/oferta.html`.
14. `migrations/0015_contact_messages_telefono_asunto.sql` — añade `telefono`/`asunto` (opcionales) a `contact_messages` para el formulario de imfashion.es, que tiene más campos que el resto de webs del grupo.

## Pasos manuales en el Dashboard (no se pueden hacer por SQL)

10. **Activar el Auth Hook:** Authentication → Hooks → "Before User Created" → seleccionar `public.restrict_email_domain` → Save.
11. **Habilitar login con Google:** Authentication → Providers → Google → activar y pegar el Client ID / Client Secret de un proyecto en Google Cloud Console (OAuth consent screen + credenciales tipo "Web application", con el Redirect URI que Supabase indica en esa misma pantalla).
12. **Crear el primer admin:** inicia sesión una vez en `/admin` con tu cuenta `@immoral.es` (email/contraseña o Google) para que se cree tu fila en `profiles` con rol `usuario` por defecto. Luego, en SQL Editor, ejecuta:
   ```sql
   update public.profiles set app_role = 'admin' where email = 'tu-email@immoral.es';
   ```
   A partir de ahí, ya puedes gestionar el resto de roles desde `/roles` sin volver a tocar SQL.
13. **Crear el Deploy Hook de Vercel** (solo para que `/casos-admin` pueda publicar cambios): en el proyecto de Vercel → Settings → Git → Deploy Hooks, crea uno apuntando a la rama `main` y copia la URL. Añádela como `VITE_DEPLOY_HOOK_URL` en las variables de entorno de Vercel (Production) y en tu `.env` local si quieres probarlo en local. Sin esto configurado, el admin sigue guardando los cambios en Supabase con normalidad, pero no se disparará ningún redeploy automático — la web no los reflejará hasta el siguiente build manual.

## Variables de entorno del proyecto (Vite)

`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — ver `.env.example` en la raíz del repo. Nunca se usa la `service_role key` / `secret key` en este proyecto: toda la seguridad la dan las políticas RLS de estos scripts.

`VITE_DEPLOY_HOOK_URL` (opcional) — URL del Deploy Hook de Vercel que dispara `/casos-admin` tras guardar o eliminar un caso de éxito, para que el redeploy que regenera `casos-de-exito.html`/`caso-*.html` empiece sin esperar al siguiente push. Ver paso 13 arriba.
