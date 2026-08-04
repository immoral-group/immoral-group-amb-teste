# TASK-LOG.md

Registro cronológico de todo el trabajo realizado en este repositorio por agentes de Claude Code. Ver la regla obligatoria en [`CLAUDE.md`](../CLAUDE.md): ninguna tarea se da por terminada sin una entrada aquí.

Formato de cada entrada: fecha, qué se hizo, por qué, ficheros/áreas afectadas.

---

## 2026-07-30/31 — Panel interno de administración (SPEC-08)

**Qué:** sistema completo de gestión interna sobre Supabase: login (email/contraseña + Google OAuth) restringido a dominios `@immoral.es`/`@immoral.marketing`, roles `admin`/`usuario` con página de gestión (`/roles`) y protección anti-lockout, panel de Equipo (`/admin`) y panel de Ofertas activas (`/ofertas`) con alta/baja/toggle activo-inactivo. `/equipo` pasa de contenido hardcodeado a renderizado dinámico desde Supabase. Shell de dashboard compartido (header + sidebar). Pantalla de login rediseñada con animación de marca en vídeo.

**Por qué:** petición del usuario para poder editar el equipo y las ofertas de empleo mostradas en `/equipo` sin tocar código, con control de acceso propio.

**Afecta:** `admin.html`, `ofertas.html`, `roles.html`, `src/admin.js`, `src/adminAuth.js`, `src/dashboardShell.js`, `src/loginView.js`, `src/ofertas.js`, `src/roles.js`, `src/supabaseClient.js`, `src/team.js`, `src/jobOpenings.js`, `equipo.html`, `src/main.js`, `vite.config.js`, `public/robots.txt`, `supabase/migrations/0001-0005`, `supabase/README.md`, `specs/08-panel-admin-equipo.md`, `PROJECT-CONSTITUTION.md` (v2.0, incorpora Supabase al stack).

**Estado:** mergeado a `main` vía [PR #6](https://github.com/immoral-group/immoral-group-amb-teste/pull/6). Migraciones `0001`-`0005` ejecutadas contra el proyecto Supabase real. Pendiente: variables de entorno `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` en Vercel para que el sitio desplegado funcione.

---

## 2026-07-31 — Regla de documentación obligatoria

**Qué:** creación de `CLAUDE.md` (raíz) y este fichero (`.claude/TASK-LOG.md`), estableciendo que toda tarea futura debe documentarse aquí sin excepción.

**Por qué:** petición explícita del usuario para que cualquier colaborador o agente que retome el proyecto tras un merge tenga visibilidad del trabajo realizado.

**Afecta:** `CLAUDE.md`, `.claude/TASK-LOG.md`.

---

## 2026-07-31 — Auditoría completa de alt-text

**Qué:** análisis sistemático de los 737 `<img>` del sitio (35 páginas públicas + panel interno). Ver el informe completo en la conversación con el usuario del 2026-07-31; resumen: contaminación cruzada de alt-text en 17 de 19 páginas de casos de éxito (heredada de una plantilla común, nunca actualizada), enlace del logo del nav sin alternativa textual en la mitad de las implementaciones del header, 5 iconos decorativos en `gestion-de-redes.html` sin atributo `alt` en absoluto, y un grupo de imágenes de hover en `diseno-de-marca.html`/`influencer-marketing.html`/`email-marketing.html` con `alt=""` pendientes de revisión de contenido.

**Por qué:** petición del usuario a partir de un análisis previo (no de este repo) que solo cubría 2 de los ~34 casos reales.

**Afecta:** análisis únicamente. **Corregido y mergeado** vía [PR #9](https://github.com/immoral-group/immoral-group-amb-teste/pull/9): ~85 correcciones de alt-text cruzado en 18 páginas de casos de éxito, `aria-label` en el enlace del logo del nav en las 35 páginas públicas, y `alt=""` explícito en los 5 iconos decorativos de `gestion-de-redes.html`.

---

## 2026-07-31 — Página `/logs` en el panel interno

**Qué:** nueva página `/logs` en el dashboard (visible para `admin` y `usuario`, sin controles — es de solo lectura) que renderiza en vivo el contenido de este mismo fichero. Se aclaró la regla de `CLAUDE.md`: este changelog documenta cambios de código hechos por agentes, no acciones de usuarios del panel (eso no se audita en esta app). Se añadió un renderizador markdown minimalista (`src/changelog.js`, sin librería externa) que soporta encabezados, negrita, código inline con backticks, enlaces, listas y `---` como separador — el mismo subconjunto que ya usa este archivo.

**Por qué:** petición explícita del usuario tras aclarar que "Logs" no debía ser una auditoría de acciones de usuarios, sino la superficie visible de esta misma regla de documentación.

**Afecta:** `logs.html`, `src/logs.js`, `src/changelog.js`, `src/dashboardShell.js` (nuevo item de nav), `vite.config.js`, `public/robots.txt`, `CLAUDE.md`.

**Nota de seguridad:** el contenido de `TASK-LOG.md` se compila dentro del bundle JS público de `/logs` (import `?raw` en build time). El login solo evita que un visitante normal lo vea en pantalla — no impide que el texto viaje en el JS servido a cualquiera. No escribir aquí datos de clientes, credenciales, ni nada que no deba ser públicamente inspeccionable.
---

## 2026-08-03 — Eliminación de API key de Resend hardcodeada

**Qué:** `api/send-email.js` tenía una API key de Resend en texto plano como fallback si `process.env.RESEND_API_KEY` no estaba definida, presente en al menos 2 commits del historial. Se eliminó el fallback: el handler ahora usa exclusivamente la variable de entorno y devuelve un error 500 explícito si no está configurada, en vez de degradar silenciosamente a una key hardcodeada. Se añadió `RESEND_API_KEY` como placeholder en `.env.example`.

**Por qué:** hallazgo de un reporte de seguridad — cualquier secreto en texto plano dentro de código versionado es explotable por quien tenga acceso al repo, independientemente de que la función sea server-side.

**Afecta:** `api/send-email.js`, `.env.example`.

**Pendiente (fuera del alcance de este agente):** la key sigue siendo la misma tras este fix — el usuario decidió no rotarla por ahora. Sigue presente en el historial de git (no se purgó, decisión explícita del usuario) y debe estar configurada como variable de entorno `RESEND_API_KEY` en Vercel (Production y Preview) para que el formulario de contacto siga funcionando en producción.

---

## 2026-08-03 — Actualización del vídeo hero del home (escritorio)

**Qué:** se reemplazó el vídeo hero de escritorio de la home por un nuevo archivo aportado por el usuario, convertido de MP4 a WebM (VP9, sin audio) para alinearlo con el formato ya usado en otros vídeos del sitio (`CASOS-DE-EXITO.webm`, `CONTACTO.webm`, etc.).

**Por qué:** petición explícita del usuario de actualizar el vídeo de la home. El vídeo mobile (`home-video2-mobile.mp4`) se dejó sin tocar a petición suya.

**Afecta:** `index.html` (línea del hero de escritorio, ahora apunta a `home-video2.webm`), `public/imgs/home-video2.webm` (nuevo). El `home-video2.mp4` original queda sin usar en `public/imgs/`, igual que el patrón ya existente con `design-hover-3` (mp4 + webm, solo se referencia el webm).

---

## 2026-08-03 — Panel de gestión de la barra de logos (home)

**Qué:** la barra de logos de partners/herramientas de la home (carrusel infinito bajo el hero) pasa de HTML hardcodeado a datos dinámicos en Supabase, con un panel nuevo (`/logos`) para añadir, activar/desactivar y eliminar logos sin tocar código — mismo patrón que `/admin` (equipo) y `/ofertas`. Se consolidaron todos los logos (los 13 ya existentes + 9 nuevos aportados por el usuario: Blender, Canva, Claude, ElevenLabs, Envato, GitHub, Higgsfield, Magnific, Vercel) en una sola carpeta `public/imgs/barra-logos/` (antes estaban en `public/imgs/brands/`, ahora vacía y sin referencias). Los logos se muestran en blanco mediante el filtro CSS ya existente (`brightness-0 invert`) aplicado al `<img>`, por lo que no fue necesario recolorear los SVG de origen (algunos, como Blender o Envato, son multicolor en su archivo original) — el filtro fuerza cualquier color de entrada a blanco puro al renderizar.

**Por qué:** petición explícita del usuario de añadir los 9 logos nuevos, consolidar la carpeta de assets, y poder gestionar la barra completa desde el dashboard igual que el resto del contenido editable del sitio.

**Afecta:** `supabase/migrations/0006_partner_logos.sql` (tabla `partner_logos`, RLS vía `is_admin()`, bucket de Storage `partner-logos`), `supabase/migrations/0007_partner_logos_seed.sql` (seed de los 22 logos apuntando a `/imgs/barra-logos/`), `src/partnerLogos.js` (render dinámico en la home, patrón de `jobOpenings.js`), `src/main.js` (`initPartnerLogos()`), `index.html` (carrusel ahora vacío + `id="partner-logos-section"`/`id="partner-logos-track"`, se rellena en runtime), `logos.html` + `src/logosAdmin.js` (panel CRUD, patrón de `ofertas.html`/`ofertas.js`), `src/dashboardShell.js` (nuevo item de nav "Barra de logos"), `vite.config.js`, `public/robots.txt`, `public/imgs/barra-logos/` (22 archivos), `public/imgs/brands/` (eliminada, vacía).

**Pendiente (fuera del alcance de este agente):** las migraciones `0006` y `0007` deben ejecutarse manualmente en el SQL Editor del proyecto Supabase real — el conector de Supabase de esta sesión está autenticado contra una cuenta/organización distinta a la que usa este proyecto (mismo motivo por el que las migraciones `0001`-`0005` de SPEC-08 se ejecutaron a mano). Hasta que se ejecuten, la barra de logos de la home queda oculta (no rota — el código detecta la ausencia de la tabla y oculta la sección en vez de mostrar un error visible).

---

## 2026-08-03 — Botón "Ver la web" en el header del dashboard

**Qué:** se añadió un enlace "Ver la web" en la barra superior del shell compartido de todo el panel interno (entre el logo y el bloque de email/rol/Salir), que abre la home (`/`) en una pestaña nueva.

**Por qué:** petición explícita del usuario para poder saltar a ver el sitio público sin perder la sesión del panel.

**Afecta:** `src/dashboardShell.js` (visible en `/admin`, `/ofertas`, `/logos`, `/logs` y `/roles`, al ser el shell compartido).

---

## 2026-08-03 — Corregido tamaño de los logos de Meta y ActiveCampaign en la barra

**Qué:** en `public/imgs/barra-logos/Meta_id0D-m9C5l_0.svg` y `active.svg` (ActiveCampaign), el `viewBox` original heredado del export de Illustrator era mucho más grande que el contenido visible real (el "artboard" completo, no el bounding box del logo) — Meta usaba solo el 33% de la altura de su `viewBox` (1000 de 3000) y ActiveCampaign solo el 28% (25.4 de 91). Como la barra fija la altura del `<img>` (`h-6`) y escala en base al `viewBox`, ambos logos se veían visiblemente más chicos que el resto pese a tener la misma altura de contenedor. Se recortó el `viewBox` de los dos ficheros al bounding box real del contenido (con un margen de ~5%), sin tocar los `path` del dibujo.

**Por qué:** feedback visual explícito del usuario tras ver la barra en el dashboard.

**Afecta:** `public/imgs/barra-logos/Meta_id0D-m9C5l_0.svg`, `public/imgs/barra-logos/active.svg`.

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #8 (grid de casos de éxito)

**Qué:** la rama `design/cambio-diagrama-casosdeexito` (PR #8, de Bruno Azzi) estaba 13 commits detrás de `main` y tenía un conflicto real en `src/main.js` al intentar mergear. Se mergeó `origin/main` dentro de esa rama y se resolvió el único conflicto de contenido: en el punto de inserción tras `initTeamCarousel()`, el PR añadía `initCasosFilter()` (para el nuevo grid filtrable) mientras `main` había añadido por separado `initJobOpenings()` (ofertas activas, de SPEC-08) — ambas funciones son independientes y no se solapan, así que se conservaron las dos. Además, `main` seguía teniendo `initPortfolioCarousel()` (el carrusel viejo que el PR reemplaza), pero el propio PR ya lo había eliminado intencionalmente junto con su HTML (`.portfolio-carousel-container` no existe en ninguna página tras este cambio) — se respetó esa eliminación en vez de resucitar una función que habría quedado muerta (guard clause que nunca se cumple). Se ajustó `initAll()` para llamar a `initJobOpenings()` + `initCasosFilter()`, sin `initPortfolioCarousel()`.

**Por qué:** petición explícita del usuario para poder mergear el PR #8 antes que el resto de PRs abiertos.

**Afecta:** `src/main.js` (único fichero con conflicto real; el resto de los ~85 ficheros del catch-up con `main` se automergearon sin intervención).

**Verificado en local:** `npm run build` sin errores; grid de casos de éxito con filtros funcionando (19→8 casos al aplicar un filtro de sector); `equipo.html` (carrusel de equipo + ofertas activas) sin errores de consola tras el merge.

---

## 2026-08-03 — Auditoría de accesibilidad WCAG (más allá del alt-text)

**Qué:** tras sincronizar `main` local con `origin/main` (7 commits atrasados, incluyendo el PR #10 de un compañero con nuevas escenas WebGL decorativas), análisis y corrección de hallazgos de accesibilidad en las 35 páginas públicas: (1) acordeón de FAQ sin estado accesible — se añadió `aria-expanded` (toggle real en el click handler) y un indicador de foco visible (`focus-visible:outline`) en 6 páginas de servicio más `src/faq-accordion.js`, y se corrigió el icono de flecha de `alt="Abrir"` (texto engañoso/redundante) a `alt=""`; (2) `<html lang="en">` incorrecto en 3 páginas (`index.html`, `contacto.html`, `manifesto.html`), corregido a `lang="es"`; (3) textarea de mensaje en `contacto.html` sin `<label>` asociado (solo `placeholder`), se añadió `<label for="mensaje" class="sr-only">`; (4) `<iframe>` de Calendly sin `title` descriptivo en `calendly.html`; (5) 3 contenedores de canvas puramente decorativos añadidos por el PR #10 (`#home-blackhole` en `index.html`, `#diseno-marca-shader` en `diseno-de-marca.html`, `#publi-medios-cubes` en `publicidad-en-medios.html`) sin `aria-hidden`; (6) ~266 de los 277 enlaces `target="_blank"` del sitio sin `rel="noopener noreferrer"` (riesgo de tabnabbing, no es estrictamente WCAG), corregidos vía regex con negative lookahead para no duplicar `rel` en los ~11 que ya lo tenían correctamente (`cookies.html`).

**Por qué:** petición explícita del usuario de auditar y corregir toda la accesibilidad del sitio más allá del alt-text ya resuelto.

**Afecta:** `automatizacion-de-procesos.html`, `diseno-de-marca.html`, `email-marketing.html`, `gestion-de-redes.html`, `influencer-marketing.html`, `publicidad-en-medios.html`, `src/faq-accordion.js`, `index.html`, `contacto.html`, `manifesto.html`, `calendly.html`, y `rel="noopener noreferrer"` en las 35 páginas públicas con enlaces externos.

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #11 (accesibilidad WCAG)

**Qué:** la rama `fix/accesibilidad-wcag-general` (PR #11) quedó detrás de `main` tras el merge del PR #8 (grid de casos de éxito) y del commit del vídeo hero. El único conflicto real fue en `.claude/TASK-LOG.md` — puramente aditivo, dos entradas nuevas e independientes añadidas al mismo punto del historial (la del PR #11 por un lado, las del vídeo hero y de la resolución del PR #8 por el otro). Se conservaron las tres, en orden cronológico.

**Por qué:** petición explícita del usuario para poder mergear el PR #11 tras resolver su conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto).

**Verificado en local:** `npm run build` sin errores; confirmado que los fixes de accesibilidad del PR #11 sobrevivieron el merge con los cambios del PR #8 sobre los mismos ficheros (`rel="noopener"` en los 8 enlaces externos del nuevo grid de `casos-de-exito.html`, `aria-expanded` en el acordeón de FAQ, `lang="es"` en las 3 páginas corregidas); sin errores de consola en `casos-de-exito.html`.

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #12 (API key de Resend)

**Qué:** la rama `fix/resend-api-key-hardcoded` (PR #12) quedó detrás de `main` tras el merge de los PR #8 y #11. Mismo patrón que los dos conflictos anteriores: el único conflicto real fue en `.claude/TASK-LOG.md`, puramente aditivo (la entrada del PR #12 por un lado, las cuatro entradas posteriores de `main` por el otro). Se conservaron todas, en orden cronológico.

**Por qué:** petición explícita del usuario para poder mergear el PR #12 tras resolver su conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto).

**Verificado en local:** `npm run build` sin errores; confirmado que el fix de la key de Resend sobrevivió el merge intacto (`api/send-email.js` sin fallback hardcodeado, `.env.example` con el placeholder).

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #14 (barra de logos)

**Qué:** la rama `feature/panel-barra-logos` (PR #14) se creó antes de que se mergeara el PR #8, así que en `src/main.js` seguía llamando a la función vieja `initPortfolioCarousel()` (ya reemplazada en `main` por `initCasosFilter()`, ver resolución del PR #8) en el mismo punto donde este PR añadía `initPartnerLogos()`. Mismo criterio que en esa resolución: se conservó `initPartnerLogos()` (de este PR) + `initCasosFilter()` (de `main`), sin resucitar `initPortfolioCarousel()`. El otro conflicto, en `.claude/TASK-LOG.md`, fue puramente aditivo (igual que en los PR #11 y #12) — se conservaron todas las entradas de ambos lados en orden cronológico.

**Por qué:** petición explícita del usuario para poder mergear el PR #14 tras resolver sus conflictos.

**Afecta:** `src/main.js`, `.claude/TASK-LOG.md`.

**Verificado en local:** `npm run build` sin errores; confirmado en navegador que la barra de logos de la home ya carga los 22 logos reales desde Supabase (el usuario ya había ejecutado las migraciones `0006`/`0007` fuera de esta sesión) con el tamaño de Meta/ActiveCampaign corregido; grid de casos de éxito (`19 de 19`) y `/logos` (panel admin) sin errores de consola tras el merge.
