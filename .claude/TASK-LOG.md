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

## 2026-08-03 — Auditoría de accesibilidad WCAG (más allá del alt-text)

**Qué:** tras sincronizar `main` local con `origin/main` (7 commits atrasados, incluyendo el PR #10 de un compañero con nuevas escenas WebGL decorativas), análisis y corrección de hallazgos de accesibilidad en las 35 páginas públicas: (1) acordeón de FAQ sin estado accesible — se añadió `aria-expanded` (toggle real en el click handler) y un indicador de foco visible (`focus-visible:outline`) en 6 páginas de servicio más `src/faq-accordion.js`, y se corrigió el icono de flecha de `alt="Abrir"` (texto engañoso/redundante) a `alt=""`; (2) `<html lang="en">` incorrecto en 3 páginas (`index.html`, `contacto.html`, `manifesto.html`), corregido a `lang="es"`; (3) textarea de mensaje en `contacto.html` sin `<label>` asociado (solo `placeholder`), se añadió `<label for="mensaje" class="sr-only">`; (4) `<iframe>` de Calendly sin `title` descriptivo en `calendly.html`; (5) 3 contenedores de canvas puramente decorativos añadidos por el PR #10 (`#home-blackhole` en `index.html`, `#diseno-marca-shader` en `diseno-de-marca.html`, `#publi-medios-cubes` en `publicidad-en-medios.html`) sin `aria-hidden`; (6) ~266 de los 277 enlaces `target="_blank"` del sitio sin `rel="noopener noreferrer"` (riesgo de tabnabbing, no es estrictamente WCAG), corregidos vía regex con negative lookahead para no duplicar `rel` en los ~11 que ya lo tenían correctamente (`cookies.html`).

**Por qué:** petición explícita del usuario de auditar y corregir toda la accesibilidad del sitio más allá del alt-text ya resuelto.

**Afecta:** `automatizacion-de-procesos.html`, `diseno-de-marca.html`, `email-marketing.html`, `gestion-de-redes.html`, `influencer-marketing.html`, `publicidad-en-medios.html`, `src/faq-accordion.js`, `index.html`, `contacto.html`, `manifesto.html`, `calendly.html`, y `rel="noopener noreferrer"` en las 35 páginas públicas con enlaces externos.
