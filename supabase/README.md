# Supabase — panel interno de equipo (SPEC-08)

Este proyecto Supabase se usa **solo** para el panel interno de `/admin`, `/ofertas` y `/roles`, y para servir los listados de `/equipo` (personas y ofertas activas). El resto de la web sigue siendo HTML estático.

## Pasos para dejarlo operativo (Dashboard → tu proyecto)

Ejecutar en este orden, en **SQL Editor → New query**, pegando el contenido completo de cada fichero y pulsando *Run*:

1. `migrations/0001_team_panel_schema.sql` — tablas, RLS, funciones y triggers.
2. `migrations/0002_team_panel_seed.sql` — carga las 14 personas actuales de `equipo.html`.
3. `migrations/0003_auth_hook_domain_restriction.sql` — crea la función que restringe el login a `@immoral.es` / `@immoral.marketing`.
4. `migrations/0004_job_openings.sql` — tabla y RLS de las ofertas activas mostradas en `/equipo`.
5. `migrations/0005_job_openings_seed.sql` — carga las 2 ofertas actuales de `equipo.html`.

## Pasos manuales en el Dashboard (no se pueden hacer por SQL)

6. **Activar el Auth Hook:** Authentication → Hooks → "Before User Created" → seleccionar `public.restrict_email_domain` → Save.
7. **Habilitar login con Google:** Authentication → Providers → Google → activar y pegar el Client ID / Client Secret de un proyecto en Google Cloud Console (OAuth consent screen + credenciales tipo "Web application", con el Redirect URI que Supabase indica en esa misma pantalla).
8. **Crear el primer admin:** inicia sesión una vez en `/admin` con tu cuenta `@immoral.es` (email/contraseña o Google) para que se cree tu fila en `profiles` con rol `usuario` por defecto. Luego, en SQL Editor, ejecuta:
   ```sql
   update public.profiles set app_role = 'admin' where email = 'tu-email@immoral.es';
   ```
   A partir de ahí, ya puedes gestionar el resto de roles desde `/roles` sin volver a tocar SQL.

## Variables de entorno del proyecto (Vite)

`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — ver `.env.example` en la raíz del repo. Nunca se usa la `service_role key` / `secret key` en este proyecto: toda la seguridad la dan las políticas RLS de estos scripts.
