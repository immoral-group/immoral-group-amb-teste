# SPEC-08: Panel de administración interno — login, roles y gestión del equipo (`/equipo`)

**Versión:** 1.2
**Estado:** draft
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-29
**Owner:** Gregory Jaques

---

## Descripción

Se construye un panel interno con login para que el equipo de Immoral Group pueda modificar contenido de la web sin tocar código. Esta primera fase cubre la sección "Equipo" de `equipo.html` (crear personas, eliminarlas, y activar/desactivar si aparecen en la web) y un sistema básico de roles (admin / usuario) con una página de gestión de roles donde el admin decide quién más es admin. El panel y el sistema de login se diseñan para poder extenderse a otras secciones editables en specs futuras, pero esta spec no implementa esas otras secciones.

---

## Actores

- **Administrador (rol `admin` — de momento solo una persona: Gregory):** inicia sesión, gestiona las personas del equipo (crear, eliminar, activar/desactivar) y gestiona los roles de otros usuarios desde la página `/roles`.
- **Usuario autenticado sin rol admin (rol `usuario`):** cualquier persona que inicia sesión (incluido por Google) pero no ha sido promovida a admin. Puede entrar al panel en modo solo-lectura del listado del equipo; no puede crear, eliminar, activar/desactivar personas ni acceder a `/roles`.
- **Visitante de `https://immoral.es/equipo`:** ve el listado público de personas del equipo (solo las activas), sin login, sin poder modificarlo.
- **Rastreador de buscador (Googlebot, etc.):** no debe indexar `/admin` ni `/roles`.

---

## Flujos principales

### Flujo 1: Administrador inicia sesión (email/contraseña o Google)

1. El administrador navega a `/admin`.
2. Elige "Entrar con Google" o introduce email y contraseña.
3. Supabase Auth valida la identidad (OAuth de Google, o email/contraseña).
4. Un Auth Hook server-side comprueba que el dominio del email pertenece a la lista permitida (`@immoral.es`, `@immoral.marketing`). Si no pertenece, la creación de usuario/sesión se rechaza antes de llegar a `profiles` (ver CA-15) y se muestra "Solo se permiten cuentas de email @immoral.es o @immoral.marketing".
5. Si el dominio es válido y es la primera vez que ese usuario inicia sesión (por cualquiera de los dos métodos), se crea automáticamente su fila en `profiles` con rol `usuario` por defecto.
6. Si su rol es `admin`, ve el panel completo (gestión de equipo + acceso a `/roles`). Si es `usuario`, ve el panel en modo solo-lectura (ver Flujo 5).

### Flujo 2: Administrador añade una persona al equipo

1. Desde el panel, el administrador pulsa "Añadir persona".
2. Rellena nombre, cargo y sube una foto (jpg/png/webp).
3. Elige a qué fila del carrusel pertenece (Fila 1 o Fila 2).
4. Guarda. La foto se sube a Supabase Storage y el registro se inserta en `team_members` con la fila, la posición (al final de la fila elegida) y `is_active = true` por defecto.
5. La nueva persona aparece en `/equipo` en la siguiente carga de la página.

### Flujo 3: Administrador activa/desactiva a una persona (toggle de visibilidad)

1. Desde el panel, el administrador ve un interruptor (toggle) junto a cada persona de la lista.
2. Al desactivarlo, se actualiza `is_active = false` en `team_members`. La persona sigue existiendo en la base de datos pero deja de aparecer en `/equipo`.
3. Al reactivarlo, `is_active = true` y la persona vuelve a aparecer en `/equipo`.
4. Este toggle es la vía preferida para "quitar a alguien de la web" sin perder sus datos; el borrado (Flujo 4) es para cuando ya no hace falta conservar el registro.

### Flujo 4: Administrador elimina definitivamente a una persona

1. Desde el panel, el administrador pulsa "Eliminar" sobre una persona.
2. Se muestra un modal de confirmación con su nombre, dejando claro que la acción es irreversible (a diferencia del toggle).
3. Al confirmar, se elimina el registro de `team_members` y su foto de Storage.

### Flujo 5: Usuario con rol `usuario` entra al panel

1. Un usuario que inició sesión (por ejemplo, con Google) pero no ha sido promovido a admin entra a `/admin`.
2. Ve el listado de personas del equipo (agrupado por fila, con su estado activo/inactivo) pero sin ningún control de crear, activar/desactivar o eliminar.
3. No ve ningún enlace a `/roles`. Si intenta navegar directamente a `/roles`, ve un mensaje de acceso denegado (ver CA-11).

### Flujo 6: Administrador gestiona roles desde `/roles`

1. El administrador (único rol con acceso) navega a `/roles`.
2. Ve la lista de todas las personas que alguna vez han iniciado sesión (tabla `profiles`: email + rol actual).
3. Junto a cada una hay un toggle "Admin". Al activarlo, esa persona pasa a rol `admin`; al desactivarlo, pasa a `usuario`.
4. El cambio de rol tiene efecto inmediato: la próxima acción de esa persona en el panel ya respeta su nuevo rol.

### Flujo 7: Visitante carga `/equipo`

1. El visitante entra en `/equipo` (sin login).
2. La página pide a Supabase (clave pública `anon`, solo lectura) el listado de `team_members` con `is_active = true`, ordenado por fila y posición.
3. La página renderiza las dos filas del carrusel con esos datos, duplicando cada fila una vez en el DOM para mantener el scroll infinito ya existente.
4. Se inicializa `initTeamCarousel()` (en `scripts.js`) una vez el contenido dinámico ya está en el DOM.

---

## Flujos alternativos / Edge cases

- **El admin único intenta quitarse su propio rol de admin desde `/roles`:** bloqueado explícitamente (ver CA-12) — no puede quedar el sistema sin ningún admin. Si en el futuro hay más de un admin, la restricción pasa a ser "no puedes quitarte el rol si eres el último admin", no "nunca puedes quitártelo".
- **Alguien intenta iniciar sesión (Google o email/contraseña) con un email fuera de `@immoral.es`/`@immoral.marketing`:** rechazado antes de crear sesión o fila en `profiles` (CA-15). No entra en modo `usuario` ni en ningún otro modo — el filtro de dominio es la primera barrera, el rol `usuario` por defecto es la segunda (para cuentas del dominio correcto que aún no son admin).
- **Login con credenciales incorrectas repetidas (email/contraseña):** no hay bloqueo de cuenta propio; Supabase Auth aplica su rate limiting por defecto.
- **Sesión expirada mientras el admin edita:** al guardar, eliminar o cambiar un toggle, si Supabase devuelve error de autenticación, se muestra un aviso y se redirige al login.
- **Foto no subida o con formato/tamaño inválido:** validación en cliente (tipo `image/jpeg|png|webp`, máx. 5MB) antes de subir.
- **Fila que se queda sin personas activas:** esa fila del carrusel no se renderiza en `/equipo` (se oculta) en vez de mostrar un track vacío.
- **Fallo de red al cargar `/equipo`:** se oculta el carrusel en vez de mostrar un error visible.
- **Dos administradores editando a la vez:** no hay bloqueo optimista; gana la última escritura.
- **Un usuario `usuario` intenta llamar directamente a la API de Supabase para hacer un `UPDATE`/`INSERT`/`DELETE` sobre `team_members` o `profiles.role`:** rechazado por RLS (ver CA-10), igual que un usuario anónimo.

---

## Criterios de aceptación

- [ ] CA-01: Un usuario no autenticado que visita `/admin` ve un formulario de login (email/contraseña y botón "Entrar con Google") y no ve el listado ni ningún control.
- [ ] CA-02: Un usuario con rol `admin` autenticado en `/admin` ve las personas actuales agrupadas por Fila 1 / Fila 2, con su estado activo/inactivo, y los controles de añadir, activar/desactivar y eliminar.
- [ ] CA-03: Un usuario con rol `usuario` autenticado en `/admin` ve el mismo listado pero sin ningún control de añadir, activar/desactivar o eliminar.
- [ ] CA-04: Añadir una persona desde `/admin` (nombre + cargo + foto + fila) hace que aparezca en `/equipo` (activa por defecto) sin necesidad de un nuevo despliegue.
- [ ] CA-05: Desactivar el toggle de una persona hace que desaparezca de `/equipo` sin borrar su registro (sigue visible en `/admin` como inactiva); reactivarlo la devuelve a `/equipo`.
- [ ] CA-06: Eliminar una persona (con confirmación) borra su registro y su foto; deja de aparecer tanto en `/admin` como en `/equipo`.
- [ ] CA-07: Un primer login (Google o email/contraseña) de un usuario nuevo crea automáticamente su fila en `profiles` con rol `usuario`.
- [ ] CA-08: Solo un usuario con rol `admin` ve el enlace a `/roles` y puede acceder a esa página; un usuario `usuario` que navega directamente a `/roles` ve un mensaje de acceso denegado y no ve la lista de usuarios.
- [ ] CA-09: Desde `/roles`, el admin puede pasar a cualquier otro usuario de `usuario` a `admin` y viceversa mediante el toggle, con efecto inmediato verificable (el usuario afectado gana o pierde acceso a los controles de gestión en su siguiente acción).
- [ ] CA-10: Un usuario no autenticado o con rol `usuario` que intenta insertar, actualizar o eliminar directamente contra `team_members` o `profiles` vía la API pública de Supabase recibe un error de autorización (verificable con `curl`/Postman).
- [ ] CA-11: `/admin`, `/admin.html`, `/roles` y `/roles.html` están en `Disallow` dentro de `robots.txt`, con `<meta name="robots" content="noindex, nofollow">` en ambas páginas.
- [ ] CA-12: El único usuario con rol `admin` no puede quitarse su propio rol de admin desde `/roles` (el toggle sobre su propia fila está deshabilitado o la acción se rechaza server-side).
- [ ] CA-13: El carrusel de `/equipo` mantiene el efecto de scroll infinito continuo (Fila 1 y Fila 2) tras el cambio a contenido dinámico filtrado por `is_active`.
- [ ] CA-14: `npm run build` termina sin errores con `admin.html` y `roles.html` incluidos como entradas nuevas de Vite.
- [ ] CA-15: Un intento de login (Google o email/contraseña) con un email que no termina en `@immoral.es` ni `@immoral.marketing` es rechazado server-side (Auth Hook), sin crear usuario ni fila en `profiles`, mostrando un mensaje claro del motivo.

---

## Modelo de datos

### Entidades nuevas o modificadas

**Tabla `team_members` (Supabase / Postgres):**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `name` | `text` | not null |
| `role` | `text` | not null (cargo, ej. "Fundador & CEO") |
| `image_url` | `text` | not null — URL pública del objeto en Storage |
| `row_number` | `smallint` | not null, `check (row_number in (1,2))` — fila del carrusel |
| `position` | `integer` | not null — orden dentro de la fila |
| `is_active` | `boolean` | not null, `default true` — controla si aparece en `/equipo` |
| `created_at` | `timestamptz` | `default now()` |
| `updated_at` | `timestamptz` | `default now()` |

**Tabla `profiles` (Supabase / Postgres) — nueva, para roles:**

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, FK a `auth.users(id)` on delete cascade |
| `email` | `text` | not null — copia del email de `auth.users`, para mostrar en `/roles` sin joins complejos |
| `app_role` | `text` | not null, `default 'usuario'`, `check (app_role in ('admin','usuario'))` |
| `created_at` | `timestamptz` | `default now()` |

Se crea con un trigger `handle_new_user` sobre `auth.users` (patrón estándar de Supabase) que inserta la fila en `profiles` en cada alta nueva (email/contraseña o Google), siempre con `app_role = 'usuario'` — la promoción a `admin` se hace solo desde `/roles` o manualmente en el seed inicial.

**Bucket de Storage `team-photos`:** lectura pública, escritura solo para usuarios con `app_role = 'admin'`.

**Autenticación:** Supabase Auth con dos métodos: email/contraseña y Google OAuth. Un **Auth Hook "before user created"** (función Postgres registrada en la configuración de Auth Hooks de Supabase) valida que el dominio del email termine en `@immoral.es` o `@immoral.marketing`; si no, lanza una excepción que aborta la creación del usuario antes de que exista sesión o fila en `profiles`. La lista de dominios permitidos vive hardcodeada en esa función (dos dominios, sin necesidad de una tabla de configuración para este alcance).

### Relaciones

`profiles.id` → `auth.users.id` (uno a uno). `team_members` no tiene relaciones con otras tablas.

### Migraciones necesarias

- Migración inicial: tabla `team_members` (con `is_active`), tabla `profiles`, función `is_admin()` (security definer, evita recursión de RLS al comprobar el rol del usuario que hace la petición), trigger `handle_new_user`, políticas RLS de ambas tablas, bucket `team-photos` y sus políticas.
- Seed: las 14 personas actuales de `equipo.html` insertadas en `team_members` (`is_active = true`, fila y posición según su orden actual), con sus fotos migradas al bucket. Fila del usuario admin inicial (Gregory) insertada manualmente en `profiles` con `app_role = 'admin'` tras su primer login.

---

## UI / Páginas afectadas

### Páginas nuevas

- `admin.html` — login (email/contraseña + Google) y panel de gestión del equipo. El contenido visible depende del rol: `admin` ve controles completos, `usuario` ve solo lectura.
- `roles.html` — solo accesible para rol `admin`. Lista todos los usuarios registrados (`profiles`: email + rol) con un toggle "Admin" por fila.

### Páginas modificadas

- `equipo.html` — las dos filas de `team-member` se renderizan dinámicamente a partir de `team_members` (filtrando `is_active = true`) vía un módulo JS nuevo (patrón de `src/footer.js`), reutilizando las clases y estructura de card existentes.

### Componentes reutilizables

- Función de render de "team card" compartida entre `equipo.html` (público, sin controles) y `admin.html` (con toggle activo/inactivo y botón eliminar superpuestos).

### Breakpoints obligatorios

375px, 768px, 1280px — el panel (`admin.html`, `roles.html`) es una herramienta interna: debe ser usable en desktop y tablet como mínimo, sin garantía de optimización mobile.

### Estándar de calidad visual

Para `equipo.html`: resultado visual idéntico al actual (mismas clases, tamaño de card y animación) — el cambio es solo la fuente de datos. Para `admin.html`/`roles.html`: interfaz funcional simple, sin necesidad de aplicar las skills de diseño del proyecto.

---

## API / Endpoints

### Endpoints nuevos

No se crean endpoints propios en `/api`. Todo el acceso a datos se hace desde el cliente con `@supabase/supabase-js` contra la API autogenerada de Supabase (PostgREST), protegida por RLS, más `supabase.auth` para login (email/contraseña y OAuth de Google).

| Operación | Tabla/Bucket | Quién puede | Vía |
|---|---|---|---|
| `SELECT` (solo activos) | `team_members` | público (`anon`) | Supabase client SDK, RLS |
| `SELECT` (todos) | `team_members` | `authenticated` (admin y usuario) | Supabase client SDK, RLS |
| `INSERT` / `DELETE` / `UPDATE` (`is_active`, etc.) | `team_members` | solo `app_role = 'admin'` | Supabase client SDK, RLS vía `is_admin()` |
| `SELECT` propia fila | `profiles` | el propio usuario autenticado | Supabase client SDK, RLS |
| `SELECT` todas las filas | `profiles` | solo `app_role = 'admin'` | Supabase client SDK, RLS vía `is_admin()` |
| `UPDATE app_role` | `profiles` | solo `app_role = 'admin'`, y no sobre sí mismo si es el único admin | Supabase client SDK, RLS + validación de "último admin" |
| Login email/contraseña | Supabase Auth | público (con credenciales válidas) | `supabase.auth.signInWithPassword` |
| Login Google | Supabase Auth | público (cualquier cuenta Google) | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Upload/lectura objeto | Storage `team-photos` | escritura: admin / lectura: pública | Supabase client SDK |

### Endpoints modificados

Ninguno. `/api/send-email.js` no se toca en esta spec.

### Contratos de request/response

No aplica en el sentido de API propia — el contrato es el esquema de `team_members`/`profiles` y sus políticas RLS descritas arriba.

---

## Notas de seguridad

### Datos sensibles involucrados

Nombre, cargo y foto de empleados: ya públicos hoy en `equipo.html`. El email de cada usuario que ha iniciado sesión se guarda en `profiles` — visible únicamente para el/los admin desde `/roles`, no expuesto públicamente.

### Validaciones server-side requeridas

- Toda la autorización real vive en RLS (Postgres), no en el cliente: el panel puede ocultar botones a un `usuario`, pero si esa persona llama directamente a la API de Supabase, la base de datos debe rechazar la escritura igual (CA-10). Esto se implementa con una función `is_admin()` (`security definer`) que las políticas de `team_members` y `profiles` invocan para comprobar `app_role` sin caer en recursión de RLS sobre la propia tabla `profiles`.
- La protección de "no puede quitarse el rol de admin si es el único admin" (CA-12) se valida en una política RLS o en un trigger `BEFORE UPDATE` sobre `profiles`, no solo deshabilitando el botón en el cliente.

### Autenticación y autorización

- Dos métodos de login: email/contraseña y Google OAuth, ambos restringidos por dominio de email (`@immoral.es`, `@immoral.marketing`) vía Auth Hook server-side (CA-15) — no es un filtro solo de UI, se aplica antes de que Supabase cree el usuario.
- Dentro del dominio permitido, el control de acceso a funcionalidad sigue siendo el rol: todo usuario nuevo entra con `app_role = 'usuario'` (sin permisos de escritura ni acceso a `/roles`) hasta que el admin lo promueve explícitamente desde `/roles`.
- Rol binario por ahora: `admin` (gestión completa de equipo + roles) y `usuario` (solo lectura del panel, sin acceso a `/roles`). No hay roles intermedios.
- La clave `anon` de Supabase (usada para lectura pública desde `equipo.html`) no es un secreto — la seguridad real la dan las políticas RLS. La `service_role` key (secreta, salta RLS) no se usa en esta spec.

### Otros riesgos identificados

- 🔴 **RLS mal configurada dejaría escribir a cualquiera (incluido cambiar roles):** mitigado por CA-10 como criterio de aceptación explícito, verificado antes de dar la spec por cumplida.
- 🔴 **Lockout total (ningún admin queda en el sistema):** mitigado por CA-12 — no se permite que el único admin se autodegrade.
- 🟠 **El Auth Hook de dominio falla abierto (no bloquea) por un error de configuración:** mitigado por CA-15 como criterio de aceptación explícito, verificado con un intento real de login con un email fuera de los dominios permitidos antes de dar la spec por cumplida.
- 🟠 **Ausencia de rate limiting propio en login:** se confía en el de Supabase Auth por defecto.
- 🟡 **Borrado físico sin papelera:** sigue existiendo (Flujo 4) para cuando se quiere borrar de verdad, complementado ahora por el toggle (Flujo 3) para el caso común de "ocultar sin borrar".

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app". Los ítems de "Base de datos" y "Autenticación y autorización" aplican directamente.)*

---

## Plan de implementación

### Arquitectura propuesta

Requiere actualizar `PROJECT-CONSTITUTION.md` (stack, modelo de datos, variables de entorno, integraciones) para reflejar la incorporación de Supabase (BBDD + Auth) y Google OAuth — confirmado por el owner del proyecto, se aplica junto con esta spec.

- **Infraestructura Supabase:** proyecto, tablas `team_members`/`profiles`, función `is_admin()`, trigger `handle_new_user`, políticas RLS, bucket de Storage, configuración de Google OAuth provider.
- **Frontend público (`equipo.html`):** fetch + render dinámico filtrado por `is_active`.
- **Frontend admin (`admin.html`):** login (email/contraseña + Google), panel CRUD + toggle, condicionado por rol.
- **Frontend roles (`roles.html`):** listado de usuarios + toggle de rol, solo admin.
- **SEO/indexación:** exclusión de `/admin` y `/roles` en `robots.txt` + `noindex`.

### Desglose de tareas

1. Actualizar `PROJECT-CONSTITUTION.md` (stack, modelo de datos, variables de entorno, integraciones).
2. Crear el proyecto Supabase y las tablas `team_members` (con `is_active`) y `profiles`.
3. Crear la función `is_admin()`, el trigger `handle_new_user` y el Auth Hook "before user created" que restringe el login a `@immoral.es`/`@immoral.marketing`.
4. Definir y aplicar las políticas RLS de `team_members` y `profiles` (incluyendo la protección de "último admin" del CA-12).
5. Crear el bucket `team-photos` con sus políticas (lectura pública, escritura solo admin).
6. Configurar el proveedor de Google OAuth en Supabase Auth (credenciales de Google Cloud Console).
7. Cargar el seed inicial: 14 personas de `equipo.html` migradas a `team_members` con sus fotos; primer login de Gregory promovido manualmente a `app_role = 'admin'` en `profiles`.
8. Añadir `@supabase/supabase-js` como dependencia y las variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` en `.env` local y en Vercel.
9. Extraer la función de render de "team card" a un módulo compartido y sustituir el HTML hardcodeado de `equipo.html` por fetch + render dinámico (filtrado `is_active`), verificando que `initTeamCarousel()` se ejecuta después del render.
10. Construir `admin.html`: login (email/contraseña + botón Google) y detección de `app_role` tras autenticar.
11. Construir en `admin.html` el panel de gestión (visible solo si `app_role = 'admin'`): listado agrupado por fila con toggle activo/inactivo, botón eliminar con confirmación, formulario de alta.
12. Construir `roles.html`: listado de `profiles` con toggle de rol, protegido con la restricción de CA-12.
13. Añadir `admin.html` y `roles.html` a `vite.config.js` (`rollupOptions.input`) y excluirlos de `robots.txt`/sitemap con `noindex`.
14. Verificar manualmente los 15 criterios de aceptación, incluyendo los intentos de escritura no autorizados (CA-10), el intento de autodegradación del único admin (CA-12) y el intento de login con un email fuera de dominio (CA-15).

### Dependencias con otras specs

Ninguna spec existente depende de esta. Esta spec es la base técnica (Supabase + Auth + roles + patrón de panel admin) sobre la que se apoyarán futuras specs de edición de otras secciones de la web.

---

## Tests requeridos

### Tests unitarios

No aplica — proyecto sin suite de tests automatizados (PROJECT-CONSTITUTION.md, P9).

### Tests de integración

Verificación manual de los CA-01 a CA-14. CA-10 y CA-12 se verifican con peticiones directas a la API de Supabase (con clave `anon` y con un usuario `usuario` autenticado) confirmando que las escrituras no autorizadas son rechazadas.

### Tests E2E

No aplica en esta ronda (P9).

---

## Out of scope (explícito)

- Edición de otras secciones de la web (servicios, casos de éxito, home, etc.) — esta spec cubre únicamente `equipo.html` y el sistema base de login/roles.
- Edición in-place de los datos de una persona existente (nombre/cargo/foto) — se resuelve eliminando y volviendo a crear. El toggle activo/inactivo cubre el caso de "quitarla temporalmente" sin necesidad de editar.
- Reordenar personas dentro de una fila (drag & drop) — se añaden siempre al final de la fila elegida.
- Roles adicionales más allá de `admin`/`usuario` (ej. "editor solo de su propia fila").
- Gestionar la lista de dominios permitidos desde el panel (hoy vive hardcodeada en el Auth Hook; añadir/quitar dominios requiere editar esa función).
- Recuperación de contraseña gestionada desde el propio panel (se usa el flujo estándar de Supabase Auth).
- Rate limiting propio sobre el login.
- Soft-delete/papelera para personas eliminadas definitivamente (el toggle ya cubre el caso de ocultar sin borrar; el borrado sigue siendo permanente).
- Optimización mobile de `admin.html`/`roles.html`.
- Analítica o auditoría de quién hizo qué cambio y cuándo (no hay tabla de auditoría en esta spec).

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-29 | Versión inicial — draft a partir de la petición de construir un sistema interno de login para gestionar el equipo mostrado en `/equipo`, usando Supabase. | Gregory Jaques |
| 1.1 | 2026-07-29 | Añadido: toggle activo/inactivo (en vez de solo alta/baja), roles `admin`/`usuario`, página `/roles` para que el admin gestione roles, login con Google. Actualizados modelo de datos (tabla `profiles`, columna `is_active`), RLS, flujos, edge cases y criterios de aceptación en consecuencia. | Gregory Jaques |
| 1.2 | 2026-07-29 | Restringido el login (Google y email/contraseña) a los dominios `@immoral.es` y `@immoral.marketing` mediante un Auth Hook server-side. Añadido CA-15 y actualizados modelo de datos, notas de seguridad, tareas y out of scope en consecuencia. | Gregory Jaques |
