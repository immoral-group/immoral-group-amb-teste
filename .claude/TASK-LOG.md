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

## 2026-08-03 — Actualización de fondos/vídeos de la sección "¿Qué podemos hacer por ti?" en Diseño de Marca

**Qué:** se reemplazaron los fondos de hover de 8 de las 9 tarjetas de servicios de `diseno-de-marca.html` (Motion Design, Vídeos UGC, Creatividades para Paid Media, Contenido para redes, Copywriting y storytelling, Presentaciones, Diseño web y UX/UI, Pack de plantillas) por material nuevo aportado por el usuario, convertido de MP4/PNG/JPG a WebM (VP9, sin audio) / WebP para alinearlo con el formato ya usado en el resto del sitio. La tarjeta "Diseño web y UX/UI" pasó de imagen fija a vídeo de fondo (antes `design-hover-8.webp`, ahora `design-hover-8.webm`). Se ajustaron además opacidades de hover en varias tarjetas (Motion Design ×2, Copywriting al 100%), se añadió una franja con `backdrop-blur` sobre el cuarto superior del vídeo de Diseño web (para difuminar el texto incrustado en el propio vídeo sin afectar al resto del clip) y un ligero desenfoque (`blur-[2px]`) en la imagen de Pack de plantillas, y un zoom del 10% (`scale-110`) en el vídeo de Diseño web. La tarjeta "Rebranding" (`design-hover-1`) no se tocó — el usuario no dejó archivo de reemplazo para ella.

**Por qué:** petición explícita del usuario para renovar visualmente esa sección con material más reciente/de mejor calidad.

**Afecta:** `diseno-de-marca.html`, `public/imgs/design-hover-2.webm`, `design-hover-3.webm`, `design-hover-4.webp`, `design-hover-5.webp`, `design-hover-6.webp`, `design-hover-7.webp`, `design-hover-8.webm` (nuevo, reemplaza a `design-hover-8.webp` que se elimina), `design-hover-9.webp`.

---

## 2026-08-03 — Sección "Cómo lo hacemos" scroll-driven en Publicidad en Medios

**Qué:** sustituida la sección `#como-lo-hacemos` de `publicidad-en-medios.html` (acordeón horizontal de 4 paneles clicables, compartido vía clase `.accord-panel` y `window.toggleAccordion` en `src/main.js`) por un componente nuevo de scroll pineado (GSAP `ScrollTrigger`, `pin` + `scrub`), inspirado en el patrón de "Our strategic advantages" de `omc.com/about`. Al hacer scroll, el badge numérico, el título de dos líneas, la descripción y el anillo SVG (rotación + `stroke-dashoffset` + blur/opacity) cambian entre los 4 pasos, con una barra de progreso y 4 pills indicadoras (no clicables, solo indicador) resaltando el paso activo. El copy reutiliza literalmente el texto que ya existía en la sección (mismos 4 títulos y descripciones), sin inventar contenido nuevo. Nuevo módulo `src/como-lo-hacemos-medios.js` (`initComoLoHacemosMedios`), importado y llamado desde `src/main.js` sin tocar la lógica compartida del acordeón (que sigue intacta para las demás páginas que aún la usan, p. ej. `diseno-de-marca.html`).

**Por qué:** petición explícita del usuario tras pedir que se analizara y replicara la interacción de scroll de `omc.com/about`, empezando por esta página como piloto.

**Afecta:** `publicidad-en-medios.html`, `src/main.js`, `src/como-lo-hacemos-medios.js` (nuevo).

**Nota técnica:** verificado con servidor Vite local; el `node_modules` de este worktree estaba incompleto (faltaban `gsap`, `three`, `@supabase/supabase-js`) y se reinstaló con `npm install` — no relacionado con este cambio. La animación del anillo (GSAP `gsap.to`) depende del ticker de `requestAnimationFrame`; se verificó forzando el ticker manualmente en un entorno de previsualización sin compositing activo, confirmando que el pin, el cambio de texto/pills/progreso y la interpolación del anillo funcionan correctamente.

---

## 2026-08-03 — Ajustes de diseño de la sección scroll "Cómo lo hacemos"

**Qué:** iteración sobre el componente anterior a partir de feedback visual directo del usuario: (1) el único anillo reciclado se sustituyó por 4 grupos SVG distintos, uno por paso, con estilos propios — paso 1 anillo grueso con glow difuminado en las puntas (blanco), paso 2 anillo de puntos pequeños en movimiento (azul de marca `#2f80ed`), paso 3 cuatro arcos concéntricos a distintos radios/rotaciones (blanco, diseño propio inspirado en la referencia de OMC), paso 4 tres arcos cortos girando rápido dando sensación de "dibujar" el círculo constantemente (blanco); todos con giro continuo en CSS (`@keyframes chlh-spin`, independiente del scroll) y cross-fade por GSAP al cambiar de paso; (2) círculo y contenedor de texto ampliados (hasta 780px/760px en desktop) y columna izquierda estrechada para que ninguna descripción supere 3 líneas — verificado con las 4 descripciones reales (2, 2, 3 y 3 líneas); (3) barra de progreso movida de debajo de las pills a debajo del título de la columna izquierda.

**Por qué:** petición explícita del usuario tras ver capturas del resultado (texto muy "aglomerado", círculo azul monótono sin variación entre pasos, barra de progreso mal ubicada).

**Afecta:** `publicidad-en-medios.html`, `src/como-lo-hacemos-medios.js`.

**Nota técnica:** se detectó y corrigió un bug real durante la verificación: una regla CSS `transition: opacity` en `.chlh-ring-style` competía con el tween de GSAP sobre la misma propiedad en el mismo elemento — redundante y podía causar parpadeos en el cross-fade entre estilos de anillo; se eliminó, dejando el cross-fade únicamente a cargo de GSAP.

---

## 2026-08-03 — Corrección de desbordes y ajustes finos de los anillos

**Qué:** tres correcciones sobre feedback del usuario con capturas de la web real: (1) el texto de la descripción se salía visualmente del anillo en pasos con copy largo — se recalculó el ancho máximo del párrafo a partir del radio interior real del anillo (radio del trazo menos la mitad del grosor y un margen de seguridad), verificado con las 4 descripciones reales en los tres breakpoints; el texto ahora nunca desborda, aunque para las descripciones más largas ocupe hasta 4-5 líneas (se priorizó "nunca desborda" sobre "máximo 3 líneas" por petición explícita); (2) el difuminado del paso 1 cubría todo el trazo como un halo uniforme — se sustituyó por 4 manchas de glow cortas y difuminadas, centradas exactamente en cada uno de los 4 extremos donde el trazo sólido termina (ángulos calculados a partir del `stroke-dasharray`), dejando el resto del anillo nítido; (3) el paso 3 (arcos concéntricos) se redujo de 4 a 2 anillos, cada uno en su propio `<g>` con una clase de animación distinta (`chlh-spin-slow` / `chlh-spin-slow-rev`) para que giren en direcciones opuestas.

**Por qué:** petición explícita del usuario tras revisar capturas de la web corriendo en su Chrome real (confirmando que la sección sí funciona en producción, más allá de las limitaciones del panel de previsualización usado durante el desarrollo).

**Afecta:** `publicidad-en-medios.html` únicamente (markup y CSS del componente; no hizo falta tocar `src/como-lo-hacemos-medios.js`, el cross-fade por índice sigue funcionando igual sobre los mismos 4 grupos `#chlh-style-0..3`).

---

## 2026-08-03 — Anillo interior del paso 3 más fino y glow del paso 1 más sutil

**Qué:** dos correcciones más sobre capturas del usuario: (1) el ancho máximo del texto se había calculado solo a partir del anillo del paso 1, sin tener en cuenta que el anillo interior del paso 3 (arcos concéntricos) era más pequeño y grueso — el texto llegaba a tocarlo. Se adelgazó ese anillo interior (`stroke-width` 7→4) y se alejó del centro (radio 140→152), y se recalculó el ancho máximo del texto a partir del anillo más restrictivo de los 4 estilos (ahora el del paso 3), verificado de nuevo con las 4 descripciones reales; queda como regla general del componente que ningún trazo puede tocar el texto, sea cual sea el estilo activo. (2) el glow de las puntas del paso 1 se hizo más difuso (`stdDeviation` del blur 6→11, opacidad 0.7→0.4) y se le añadió un pequeño movimiento propio e independiente del giro del anillo: cada una de las 4 puntas oscila su `stroke-dashoffset` con una animación CSS propia, con un retraso distinto en cada una para que no se muevan sincronizadas.

**Por qué:** petición explícita del usuario tras ver capturas de la web corriendo en su Chrome (texto tocando el anillo interior del paso 3; glow de puntas del paso 1 demasiado marcado y estático).

**Afecta:** `publicidad-en-medios.html` únicamente.

---

## 2026-08-03 — Escalado general de la sección (círculo y texto principal más grandes)

**Qué:** aumento de escala pedido por el usuario porque el texto principal (badge + título de la izquierda) se veía pequeño frente al resto de la web. Círculo ampliado (820px en xl, antes 780px), columna izquierda ensanchada (320px en xl, antes 280px) con título subido de `text-4xl` a `text-5xl` y badge de `text-2xl` a `text-3xl`, y texto de la descripción subido de `text-sm` a `text-base`. Se recalculó el ancho máximo seguro de la descripción para el nuevo tamaño de círculo (a partir del anillo más restrictivo, el del paso 3) y se verificó de nuevo que ninguna de las 4 descripciones toca ningún anillo ni se solapa con la columna izquierda.

**Por qué:** petición explícita del usuario ("hagamos todo un poco más grande, el texto principal también, se ve muy chiquito respecto al resto de la web").

**Afecta:** `publicidad-en-medios.html` únicamente.

**Nota:** segunda vuelta sobre el mismo punto — el usuario pidió una subida adicional del texto principal (título 36px→48px en desktop, badge y columna izquierda también ampliados). Verificado sin solape con el círculo.

---

## 2026-08-03 — Revertido el último aumento de tamaño y añadido rótulo "Cómo lo hacemos"

**Qué:** el usuario no quedó conforme con la última subida de tamaño del texto principal (título a 48px) y pidió revertirla al valor anterior (36px en desktop). De paso pidió un rótulo fijo "CÓMO LO HACEMOS" en mayúsculas en la esquina superior izquierda de la sección — se añadió como una etiqueta (`text-transform: uppercase` vía Tailwind, no mayúsculas literales en el HTML) posicionada de forma absoluta sobre la sección, verificada sin solape con el resto del contenido (~234px de margen respecto al badge/título).

**Por qué:** feedback directo del usuario ("no me gustó, dejémoslo como estaba antes").

**Afecta:** `publicidad-en-medios.html` únicamente.

**Nota:** el rótulo "CÓMO LO HACEMOS" se aumentó adicionalmente de `text-sm/text-base` a `text-xl/text-2xl/text-3xl` a petición del usuario.

---

## 2026-08-03 — Sección scroll "Cómo lo hacemos" replicada en 4 páginas de servicio más

**Qué:** se llevó el mismo diseño de scroll pineado (círculo animado + badge/título/descripción + pills + barra de progreso) ya validado en `publicidad-en-medios.html` a las otras 4 páginas de servicio que tenían su propia sección "Cómo lo hacemos": `diseno-de-marca.html` (que aún conservaba el acordeón horizontal viejo con `.accord-panel`), `gestion-de-redes.html` (grid estático de 4 círculos con icono), `email-marketing.html` (columnas con imagen en hover) y `automatizacion-de-procesos.html` (tarjetas cuadradas con SVG). En los 4 casos se reutilizó literalmente el copy que ya existía en cada sección (títulos y descripciones de sus 4 pasos), sin inventar contenido nuevo.

Para evitar 5 copias del mismo módulo JS con el contenido hardcodeado, se refactorizó `src/como-lo-hacemos-medios.js` a un motor genérico y compartido: **`src/como-lo-hacemos-scroll.js`** (`initComoLoHacemosScroll()`), que ya no trae el copy embebido en JS — lo lee de un `<script type="application/json" id="chlh-steps-data">` embebido en el HTML de cada página. Esto permite que las 5 páginas compartan exactamente el mismo motor (una sola llamada en `initAll()`) sin colisionar entre sí, ya que cada página tiene su propia instancia de los elementos `#chlh-pin`/`#chlh-badge`/etc. y su propio JSON de pasos.

Como consecuencia, `diseno-de-marca.html` dejó de ser la última página con el acordeón `.accord-panel` — se eliminó por completo el código ya muerto de `initDesignAccordion()` / `window.toggleAccordion` de `src/main.js`.

**Por qué:** petición explícita del usuario ("apliquemoslo en todos los servicios en donde esta la parte de cómo lo hacemos, repliquemos el mismo diseño"), tras confirmar el alcance (4 páginas adicionales) mediante pregunta directa.

**Afecta:** `diseno-de-marca.html`, `gestion-de-redes.html`, `email-marketing.html`, `automatizacion-de-procesos.html`, `src/main.js` (import + llamada actualizados, `initDesignAccordion` eliminada), `src/como-lo-hacemos-scroll.js` (nuevo, sustituye a `src/como-lo-hacemos-medios.js` que se elimina), `publicidad-en-medios.html` (se le añadió su propio `<script id="chlh-steps-data">` ya que el JS dejó de traer el copy hardcodeado).

**Nota técnica:** verificado en las 5 páginas que: no hay solape entre el círculo y la columna de texto, ninguna descripción se sale del anillo más restrictivo (recalculado por página, aunque la fórmula geométrica es la misma para todas), y el cross-fade entre pasos funciona (verificado forzando el motor de animación, igual que en las verificaciones anteriores). Los títulos largos de `automatizacion-de-procesos.html` se condensaron a 2 líneas para encajar en la columna izquierda.

---

## 2026-08-03 — Títulos: más espacio y conectores nunca huérfanos en las 5 páginas

**Qué:** dos correcciones sobre feedback del usuario a partir de una captura de `automatizacion-de-procesos.html`, donde el título se partía en demasiadas líneas dejando "de" y "&" solos en su propia línea. (1) Se ensanchó la columna de texto principal (de `320px`→`420px` en desktop en 4 páginas, y hasta `460px` en `automatizacion-de-procesos.html` por tener los títulos más largos) reduciendo el círculo en la misma proporción para compensar, de forma que el título quede en 3-4 líneas como máximo en vez de 5-7. (2) Se cambió el esquema de datos de `line1`/`line2` (dos líneas fijas con `<br>`) a un único campo `title` con `&nbsp;` insertado entre conectores cortos ("&", "de", "en", "la") y la palabra siguiente, de forma que el navegador nunca pueda partir la línea justo ahí — el título ahora fluye de forma natural según el ancho disponible, sin quedar nunca un conector solo. Esto se aplicó en las 5 páginas (no solo en la que motivó el cambio), incluyendo `src/como-lo-hacemos-scroll.js` (ahora hace `titleEl.innerHTML = step.title` en vez de concatenar `line1`/`line2`).

**Por qué:** petición explícita del usuario ("no me separes los 'de' o los '&'... aplícalo en todos los servicios y corrígelo").

**Afecta:** `src/como-lo-hacemos-scroll.js`, `publicidad-en-medios.html`, `diseno-de-marca.html`, `gestion-de-redes.html`, `email-marketing.html`, `automatizacion-de-procesos.html`.

**Nota técnica:** verificado en las 5 páginas que el título queda en 2-4 líneas (antes hasta 5-7 en el caso más largo) y que no hay solape ni overflow horizontal con las columnas ensanchadas.

**Bug introducido y corregido en la misma tanda:** el cambio anterior escribió `&nbsp;` para representar "el símbolo & seguido de un espacio irrompible", pero `&nbsp;` es en sí mismo la entidad HTML del espacio en blanco — no contiene ningún `&` visible. Como resultado, todos los conectores "&" desaparecieron de los títulos en las 5 páginas (ej. "Análisis & Estrategia Visual" se renderizaba sin el "&"). Detectado por el usuario tras ver el resultado. Corregido reemplazando cada `" &nbsp;"` (con espacio delante, que representaba un "&" comido) por `" &amp;&nbsp;"` (entidad de ampersand real + espacio irrompible) en los 5 archivos — los usos de `&nbsp;` que unían dos palabras sin símbolo "&" de por medio (ej. `de&nbsp;Contenidos`) no se tocaron, ya estaban bien. Verificado que el "&" vuelve a aparecer en las 5 páginas.

---

## 2026-08-03 — Pills clicables en las 5 páginas de "Cómo lo hacemos"

**Qué:** las 4 pills indicadoras de paso (antes solo decorativas, con `pointer-events-none`) ahora son clicables en las 5 páginas: al hacer clic, la página hace scroll suave hasta el punto medio del tramo de scroll correspondiente a ese paso dentro de la sección pineada, permitiendo saltar directamente a cualquier paso sin tener que scrollear manualmente por todos los anteriores. En `src/como-lo-hacemos-scroll.js` se guarda una referencia al `ScrollTrigger` activo (desktop o mobile, el que esté vivo según el breakpoint) y se añade un listener de clic por pill que calcula el scroll objetivo a partir de `trigger.start`/`trigger.end` y hace `window.scrollTo({ top, behavior: 'smooth' })`. En el HTML de las 5 páginas se quitó `pointer-events-none` de las pills y se añadió `cursor-pointer`.

**Por qué:** petición explícita del usuario ("hagamos que sea cliqueable esos botones, así si el usuario quiere ir a alguna info en particular podría hacerlo"), aplicado a las 5 páginas por indicación suya.

**Afecta:** `src/como-lo-hacemos-scroll.js`, `publicidad-en-medios.html`, `diseno-de-marca.html`, `gestion-de-redes.html`, `email-marketing.html`, `automatizacion-de-procesos.html`.

**Nota técnica:** verificado en 2 páginas forzando el scroll a instantáneo (el `behavior:'smooth'` no avanza en el panel de previsualización usado durante el desarrollo, igual que las animaciones GSAP — no compone frames en esta sesión) que el clic en una pill efectivamente posiciona el scroll dentro del tramo correcto y el motor de scroll detecta el paso esperado tras forzar su actualización.

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

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #16 (fondos/vídeos de Diseño de Marca)

**Qué:** la rama `actualizacion-fondo-videos-servicios` (PR #16, de Angie) se creó antes de la reescritura de la sección "Cómo lo hacemos" (PR #15, todavía sin mergear a `main` en el momento de esta resolución) y solo toca la sección de tarjetas "¿Qué podemos hacer por ti?" — una parte distinta de `diseno-de-marca.html`. El único conflicto real fue, de nuevo, puramente aditivo en `.claude/TASK-LOG.md`. El acordeón viejo de "Cómo lo hacemos" sigue presente en el resultado de este merge porque el PR #15 aún no está mergeado a `main` — no es una regresión de este PR ni contenido perdido, es el estado real y esperado de `main` en este momento. Se verificaron explícitamente los 4 cambios propios del PR #16 tras el merge (opacidad de Motion Design y del ítem 6, vídeo+blur+zoom del ítem 8 "Diseño web y UX/UI", blur del ítem 9) y todos están intactos.

**Por qué:** petición explícita del usuario para poder mergear el PR #16 tras resolver su conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Nota de orden de merge:** los PR #15 y #16 tocan `diseno-de-marca.html` en secciones distintas y no colisionan entre sí, pero cada uno se resolvió por separado contra el `main` vigente en ese momento. El que se mergee primero no tendrá problema; el que se mergee después probablemente vuelva a mostrar "Merge conflicts" en GitHub (mismo patrón ya visto con los PR #8/#11/#12/#14) y necesitará una nueva pasada de resolución — es esperable, no un error.

**Verificado en local:** `npm run build` sin errores; los 5 `<video>` de `diseno-de-marca.html` cargan correctamente (`readyState: 4`), incluido `design-hover-8.webm` con el nuevo blur y zoom.

---

## 2026-08-03 — Resuelto conflicto de merge en el PR #15 (scroll "Cómo lo hacemos")

**Qué:** la rama `modificacion` (PR #15, de Angie) llevaba varios commits documentando en `.claude/TASK-LOG.md` toda la iteración de la nueva sección scroll-driven "Cómo lo hacemos" (reemplazo del acordeón viejo en 5 páginas de servicio, motor compartido `src/como-lo-hacemos-scroll.js`, ajustes de anillos, títulos, pills clicables). El único conflicto real fue, otra vez, puramente aditivo en `.claude/TASK-LOG.md` — 8 entradas nuevas de este PR por un lado y 8 entradas de `main` (barra de logos + resoluciones de los PR #8/#11/#12/#14) por el otro, en el mismo punto del historial. Se conservaron las 16, en orden cronológico. Los 5 ficheros HTML de servicio y `src/main.js` (tocados por ambas ramas: accesibilidad WCAG de `main` vs. el nuevo scroll de este PR) se automergearon sin conflicto — verificado explícitamente que ambos cambios coexisten (p. ej. `aria-expanded` del PR #11 y `#chlh-pin` de este PR presentes a la vez en las 5 páginas).

**Por qué:** petición explícita del usuario para poder mergear el PR #15 tras resolver su conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; `publicidad-en-medios.html` y `diseno-de-marca.html` cargando la sección scroll nueva correctamente (badge, título y pills presentes; el acordeón viejo `.accord-panel` ya no existe en el DOM); sin errores de consola.

---

## 2026-08-03 — Segunda resolución del PR #16 (el PR #15 se mergeó a `main` en el intermedio)

**Qué:** justo después de resolver el conflicto del PR #16 contra `main`, el usuario mergeó el PR #15 a `main` — tal como se anticipó en la nota de la resolución anterior, el PR #16 volvió a mostrar "Merge conflicts" en GitHub. Se repitió el proceso: mergear `origin/main` (ya con el PR #15 dentro) en la rama `actualizacion-fondo-videos-servicios`. Único conflicto real, de nuevo puramente aditivo en `.claude/TASK-LOG.md`. Esta vez sí se pudo verificar en `diseno-de-marca.html` que ambos cambios coexisten correctamente: la sección scroll nueva del PR #15 (`chlh-pin` presente, acordeón viejo ausente) y los 5 vídeos de hover del PR #16 (incluido `design-hover-8.webm` con blur y zoom), sin que ninguno de los dos se pisara.

**Por qué:** petición explícita del usuario para poder mergear el PR #16 tras resolver su (segundo) conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; en `diseno-de-marca.html`, `chlh-pin` presente con el título correcto y los 5 `<video>` (incluido `design-hover-8.webm`) cargando correctamente tras el merge.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Nutfruit en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó `public/imgs/nutfruit-portada.jpg` (imagen de la tarjeta del caso NUTFRUIT en el grid de casos de éxito) por una nueva imagen aportada por el usuario (los 4 personajes/mascotas de frutos secos de Nutfruit sobre fondo verde). No se tocó el HTML, solo el contenido del archivo de imagen (mismo nombre y ruta).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `public/imgs/nutfruit-portada.jpg`.

**Verificado en local:** preview con `npm run dev`; la tarjeta NUTFRUIT en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Cool Bottles en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso COOL BOTTLES (antes `imgs/cool.svg`) por una nueva foto aportada por el usuario (senderista con bidón en montaña). Al cambiar de formato vectorial a fotografía, se convirtió el PNG original (10MB, 3840x2160) a JPEG optimizado (`public/imgs/cool-portada.jpg`, ~1.4MB) en vez de servir el PNG sin comprimir, y se actualizó el `src` en el HTML. Se eliminó `public/imgs/cool.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/cool-portada.jpg` (nuevo), `public/imgs/cool.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta COOL BOTTLES en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Velites en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso VELITES (antes `imgs/calum-4.webp`) por una nueva foto aportada por el usuario (atleta en remo, estética HYROX), guardada como `public/imgs/velites-portada.jpg`. Se eliminó `public/imgs/calum-4.webp` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/velites-portada.jpg` (nuevo), `public/imgs/calum-4.webp` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta VELITES en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Mun Kombucha en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso MUN KOMBUCHA (antes `imgs/mun.png`) por una nueva foto aportada por el usuario (dos latas chocando en la playa), guardada como `public/imgs/munkombucha-portada.jpg`. Se eliminó `public/imgs/mun.png` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/munkombucha-portada.jpg` (nuevo), `public/imgs/mun.png` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta MUN KOMBUCHA en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso La Marca Well en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso LA MARCA WELL por una nueva foto aportada por el usuario (las dos hermanas fundadoras). A diferencia de los cambios anteriores, no se reutilizó el nombre de archivo existente (`imgs/port-well3.jpg`) porque ese mismo archivo también lo usa `caso-marcawell.html` (la página de detalle del caso) y el cambio pedido era solo para la tarjeta del grid de Casos de Éxito. Se creó un archivo nuevo y distinto, `public/imgs/marcawell-portada.jpg` (PNG original de 18MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~240KB), y solo se actualizó el `src` en `casos-de-exito.html`. `port-well3.jpg` queda intacto y sigue usándose en `caso-marcawell.html`.

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta, sin afectar la página de detalle del caso.

**Afecta:** `casos-de-exito.html`, `public/imgs/marcawell-portada.jpg` (nuevo). `public/imgs/port-well3.jpg` no se toca.

**Verificado en local:** preview con `npm run dev`; la tarjeta LA MARCA WELL en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos; `caso-marcawell.html` no se ve afectado. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Bobo Choses en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso BOBO CHOSES (antes `imgs/port-bobo.png`) por una nueva foto aportada por el usuario (modelo con prenda de rayas de la colección), guardada como `public/imgs/bobo-portada.jpg` (PNG original de 18MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~380KB). Se eliminó `public/imgs/port-bobo.png` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/bobo-portada.jpg` (nuevo), `public/imgs/port-bobo.png` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta BOBO CHOSES en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Grupo Mimara en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso GRUPO MIMARA (antes `imgs/mimara.svg`) por una nueva foto aportada por el usuario (personas mayores jugando a cartas), guardada como `public/imgs/mimara-portada.jpg` (JPG original de 12.8MB/6000x4000 redimensionado a 2000px de ancho y recomprimido, ~425KB). Se eliminó `public/imgs/mimara.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/mimara-portada.jpg` (nuevo), `public/imgs/mimara.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta GRUPO MIMARA en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Gabriel For Sach en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso GABRIEL FOR SACH (antes `imgs/gabriel.svg`) por una nueva foto aportada por el usuario (dos modelos con tops y bolsos de la colección), guardada como `public/imgs/gabrielforsach-portada.jpg` (PNG original de 20.6MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~335KB). Se eliminó `public/imgs/gabriel.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/gabrielforsach-portada.jpg` (nuevo), `public/imgs/gabriel.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta GABRIEL FOR SACH en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso iVentions en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso IVENTIONS (antes `imgs/iventions.svg`) por una nueva imagen aportada por el usuario (mockup de laptop con la marca "IVENTIONS" y foto del evento "Meetup 2025"), guardada como `public/imgs/iventions-portada.jpg`. Se eliminó `public/imgs/iventions.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/iventions-portada.jpg` (nuevo), `public/imgs/iventions.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta IVENTIONS en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Sustituye la imagen de portada del caso Oxperta Capital en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso OXPERTA CAPITAL (antes `imgs/ocapital.svg`) por una nueva foto aportada por el usuario (apretón de manos en reunión de negocios), guardada como `public/imgs/oxpertacapital-portada.jpg`. Se eliminó `public/imgs/ocapital.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/oxpertacapital-portada.jpg` (nuevo), `public/imgs/ocapital.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta OXPERTA CAPITAL en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-04 — Reducir el celeste de marca en Nuestra Historia, Equipo y Casos de Éxito + efecto Liquid Glass

**Qué:** dos cambios sobre la rama `reducir-celeste-en-la-web`:

1. **Reemplazo del celeste (`#3B82F6`/`#4889eb`/`bg-blue-500`) en tres puntos del sitio**, a petición de Angie: en `nuestra-historia.html` las dos cajas (cita de Marco y "No éramos nosotros") pasan de fondo celeste a gris claro con texto negro; en `equipo.html` la sección "¿No ves tu rol?" pasa de celeste a fondo blanco/texto negro con el botón invertido a negro/blanco para mantener contraste; y en las **19 páginas `caso-*.html`** la franja "Reto" pasa de `bg-blue-500` a `bg-black` (el texto ya era blanco). El botón celeste de navegación/footer (color de marca del sitio) se dejó intacto — no era parte de lo pedido.
2. **Efecto "Liquid Glass"** en la caja "No éramos nosotros" (`nuestra-historia.html`) y en las cards de "Ofertas activas" (`equipo.html`/`src/jobOpenings.js`): se probó primero con backdrop-filter + distorsión SVG (rechazado por plano), después con la librería WebGL real `@ybouane/liquidglass` (refracción/aberración cromática/especular reales vía shaders) — se abandonó tras encontrar dos bugs de la librería: su `postinstall` requería `patch-package` sin declararlo como dependencia (rompía `npm install` para cualquiera; se probó añadiéndolo como devDependency, funcionaba, pero el segundo bug hizo descartar la librería del todo) y, más grave, la captura del fondo (`html-to-image`) devolvía un panel sólido blanco sin lanzar error ni warning, y re-inicializar el efecto (necesario por la navegación tipo SPA de este sitio, ver `updateDOM`/`initAll` en `src/main.js`) colgaba la promesa indefinidamente. Se revirtió la dependencia por completo y se reconstruyó el efecto en CSS puro (clase `.liquid-glass` en `src/style.css`): `backdrop-filter` con blur+saturate+brightness, el mismo filtro SVG `feDisplacementMap` pero más marcado, aberración cromática falsa (doble borde rojo/cian desenfocado vía `::before`) y brillo especular diagonal (`::after` con `mix-blend-mode: overlay`). El hover de "crecer" se movió del texto "No éramos nosotros" (que ya no lo tiene) a la caja completa (`hover:scale-[1.03]` en el panel, `hover:scale-105` en las cards de ofertas).

**Por qué:** petición explícita del usuario para reducir el uso del celeste de marca en esas tres zonas y para que el efecto de vidrio se viera más realista que un backdrop-blur plano.

**Afecta:** `nuestra-historia.html`, `equipo.html`, `src/jobOpenings.js`, `src/style.css`, las 19 páginas `caso-*.html` (franja "Reto"). `package.json`/`package-lock.json` sin cambios netos (se instaló y desinstaló `@ybouane/liquidglass` + `patch-package` en el proceso).

**Verificado en local:** sin errores de consola en `/nuestra-historia` y `/equipo` tras cada cambio; confirmado por `getComputedStyle` que el `backdrop-filter` incluye el filtro SVG de distorsión (`url("#liquid-glass-distortion")`) y que la regla `.liquid-glass:hover` está registrada en la hoja de estilos. No se pudo verificar visualmente el estado `:hover` en este entorno (el panel del navegador de la sesión no renderiza capturas) — pendiente de confirmación visual del usuario en su propio navegador.

---

## 2026-08-04 — Edición in-place de personas del equipo + vista en grid

**Qué:** dos cambios en `/admin` (panel de Equipo): (1) el listado de cada fila pasó de lista vertical (`space-y-2`) a grid de tarjetas (`grid-cols-2 sm:grid-cols-3 xl:grid-cols-5`, foto cuadrada arriba); (2) se añadió un botón "Editar" por tarjeta que abre un modal (nombre, cargo, fila, foto opcional — se conserva la actual si no se sube una nueva) y guarda con `UPDATE` sobre `team_members` en vez de forzar borrar-y-recrear. Si se cambia la fila desde el modal, la posición se recalcula al final de la nueva fila (misma lógica que al añadir); si la fila no cambia, la posición actual se conserva. Al reemplazar la foto, se sube la nueva a Storage y se borra la anterior solo tras confirmar el `UPDATE`.

**Por qué:** petición explícita del usuario — la spec original (SPEC-08) dejaba la edición in-place fuera de alcance a propósito ("se resuelve eliminando y volviendo a crear"), pero en el uso real del panel resultó insuficiente.

**Afecta:** `src/admin.js` únicamente.

**Verificado en local:** `npm run build` sin errores; verificado con datos simulados en navegador que el grid renderiza 5 columnas en la misma fila y que el modal de edición se pre-rellena correctamente con los datos de la persona.

---

## 2026-08-04 — Estilo consistente para los botones "Seleccionar archivo" del panel

**Qué:** los 4 `<input type="file">` del panel interno (`/admin` ×2, `/ofertas`, `/logos`) usaban el botón nativo del navegador (blanco, sin relación visual con el resto del dashboard oscuro). Se añadió un token compartido `T.fileInput` en `src/dashboardShell.js` (vía las pseudo-clases `file:*` de Tailwind) que estiliza el botón para que coincida con el resto de la UI (fondo `#1C1C1C`, borde `#2E2E2E` sólido, texto claro, hover `#2E2E2E`) y aplica a los 4 inputs.

**Por qué:** feedback visual explícito del usuario sobre el botón "Seleccionar archivo" del formulario "Añadir persona" en `/admin`; se corrigió en los 4 sitios donde aparece el mismo patrón para no dejar 3 inconsistentes.

**Afecta:** `src/dashboardShell.js` (nuevo token `T.fileInput`), `src/admin.js`, `src/ofertas.js`, `src/logosAdmin.js`.

**Verificado en local:** `npm run build` sin errores; confirmado por `getComputedStyle` que el pseudo-elemento `::file-selector-button` toma el color/borde/radio correctos (incluyendo `border-style: solid` en vez del `outset` nativo); sin errores de consola en `/admin` ni `/ofertas`.

---

## 2026-08-04 — Sustituye la imagen de fondo de la sección "Historia Fundador" por vídeo

**Qué:** en `nuestra-historia.html`, la sección "Historia Fundador" usaba una imagen estática (`imgs/nt-bg-2.webp`, "Marco Fundador") como fondo. Se sustituyó por un `<video>` (`imgs/nt-bg-2.mp4`, autoplay/muted/loop/playsinline) con las mismas clases de encuadre (`object-cover object-[80%_center]`) para que el fundador siga siempre visible en el mismo punto. Se borró `public/imgs/nt-bg-2.webp` (ya sin referencias en el repo) y se añadió `public/imgs/nt-bg-2.mp4`.

**Por qué:** petición explícita del usuario de sustituir ese fondo concreto por un vídeo que aportó.

**Afecta:** `nuestra-historia.html`, `public/imgs/nt-bg-2.mp4` (nuevo), `public/imgs/nt-bg-2.webp` (eliminado).

**Verificado en local:** preview con `npm run dev`; el vídeo carga (`readyState: 4`, 1920x1080), reproduce en loop con el mismo encuadre que tenía la imagen, y el resto de la sección (tarjeta de texto, layout) no se ve afectado. Sin errores de consola.

---

## 2026-08-04 — CTA a Behance en Casos de éxito

**Qué:** en `casos-de-exito.html`, se sustituyó visualmente el contador "Mostrando X de Y casos" (justo debajo de los filtros) por una barra ancha y llamativa (`bg-[#4889eb]`, el azul de marca ya usado en los filter-pills activos) que invita a ver más proyectos en Behance (`https://www.behance.net/immoralgroup`, `target="_blank"`), con el icono de Behance (reutilizado de `src/footer.js`) y una flecha animada al hover. El contador original se mantiene en el DOM como `sr-only` (visualmente oculto, accesible para lectores de pantalla) en vez de eliminarse, para no romper `initCasosFilter()` en `src/main.js` (que sigue escribiendo el texto ahí) y conservar esa información para accesibilidad.

**Por qué:** petición explícita del usuario para añadir un CTA a Behance justo en el hueco visual donde antes estaba el contador.

**Afecta:** `casos-de-exito.html` únicamente.

**Verificado en local:** `npm run build` sin errores; enlace con `href`/`target="_blank"`/`rel="noopener noreferrer"` correctos; contador sigue actualizándose (`sr-only`) al aplicar un filtro (`Mostrando 8 de 19 casos`); sin errores de consola.

---

## 2026-08-04 — Logo real de Behance en el CTA de Casos de éxito

**Qué:** se sustituyó el icono de Behance dibujado a mano (un `<svg>` inline) en la barra CTA de `casos-de-exito.html` por el logo oficial que el usuario dejó en `public/imgs/barra-logos/Behance_Logo_0.svg` (wordmark completo, ya en blanco). Se ajustó el texto de la barra ("...nuestro Behance" → "...nuestro perfil") para no repetir la palabra "Behance" dos veces, ya que ahora la muestra el propio logo.

**Por qué:** petición explícita del usuario tras subir el archivo del logo real.

**Afecta:** `casos-de-exito.html` únicamente.

**Verificado en local:** `npm run build` sin errores; el logo carga correctamente (`naturalWidth: 300`, sin 404); sin errores de consola.

---

## 2026-08-04 — Ancho del CTA de Behance ajustado al contenido

**Qué:** la barra CTA de `casos-de-exito.html` ocupaba todo el ancho de la sección (`w-full`); se cambió a `inline-flex` (ancho ajustado al contenido, ~526px en vez de ~1217px) para que se vea como una pastilla compacta en vez de una barra que estira todo el layout.

**Por qué:** feedback visual explícito del usuario con una captura de referencia.

**Afecta:** `casos-de-exito.html` únicamente.

**Verificado en local:** `npm run build` sin errores; ancho del enlace confirmado en ~526px; sin errores de consola.

---

## 2026-08-04 — Resuelto conflicto de merge en el PR #19 (edición de equipo + grid)

**Qué:** único conflicto real, de nuevo puramente aditivo en `.claude/TASK-LOG.md` (las 2 entradas de este PR vs. las 3 entradas del CTA de Behance en `main`). Se conservaron las 5, en orden cronológico. `src/admin.js` y `src/dashboardShell.js` no tuvieron conflicto (`main` no tocaba esos ficheros en su rango de commits nuevos).

**Por qué:** petición explícita del usuario para poder mergear el PR #19.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; confirmado que el CTA de Behance (PR #17) y la edición de equipo + botón de archivo (este PR) coexisten sin pisarse tras el merge.

---

## 2026-08-04 — Resuelto conflicto de merge en el PR #18 (vídeo de fondo en Historia Fundador)

**Qué:** único conflicto real, de nuevo puramente aditivo en `.claude/TASK-LOG.md` (la entrada de este PR vs. las 3 entradas del CTA de Behance en `main`). Se conservaron las 4, en orden cronológico. `nuestra-historia.html` no tuvo conflicto.

**Por qué:** petición explícita del usuario para poder mergear el PR #18.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; el vídeo de fondo (`nt-bg-2.mp4`) carga correctamente (`readyState: 4`, 1920x1080) tras el merge; sin errores de consola.

---

## 2026-08-04 — Segunda resolución del PR #19 (el PR #18 se mergeó en el intermedio)

**Qué:** justo después de resolver el conflicto anterior del PR #19, el usuario mergeó el PR #18 a `main` — mismo patrón ya visto con el PR #16. Se repitió el proceso: mergear `origin/main` (ya con el PR #18 dentro) en la rama `feature/editar-equipo-grid`. Dos bloques de conflicto, ambos puramente aditivos en `.claude/TASK-LOG.md` (las entradas propias de este PR + su resolución anterior, vs. la entrada del PR #18 + su resolución). Se conservaron todas, en orden cronológico.

**Por qué:** petición explícita del usuario para poder mergear el PR #19 tras resolver su (segundo) conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; confirmado que la edición de equipo + grid + botón de archivo (este PR) y el vídeo de "Historia Fundador" (PR #18) coexisten sin pisarse tras el merge.

---

## 2026-08-04 — Resuelto conflicto de merge en el PR #20 (reducir celeste + liquid glass)

**Qué:** único conflicto real, de nuevo puramente aditivo en `.claude/TASK-LOG.md` (la entrada de este PR vs. las entradas de `main` a través de la resolución del PR #19). Se conservaron todas, en orden cronológico. Ningún otro fichero tuvo conflicto real — este PR no toca ninguno de los ficheros modificados por los PR #18/#19 (`nuestra-historia.html` sí lo comparte con el #18, pero en zonas distintas del archivo: el vídeo de fondo por un lado, las cajas de texto y el efecto liquid glass por otro).

**Por qué:** petición explícita del usuario para poder mergear el PR #20.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; confirmado en navegador que el efecto `.liquid-glass` sigue aplicado (`backdrop-filter` con la distorsión SVG) en `/nuestra-historia` tras el merge; sin errores de consola en `/nuestra-historia` ni `/equipo`; confirmado que el botón celeste de navegación/footer (fuera del alcance de este PR) sigue intacto.

---

## 2026-08-04 — Carrusel "Plataformas que dominamos" en Publicidad en Medios + ajuste de recuadro en Nuestra Historia

**Qué:** sustituido el grid estático de plataformas (Meta/Google/LinkedIn/TikTok/YouTube/Pinterest/Spotify) en `publicidad-en-medios.html` por un carrusel tipo "flip caterpillar" (GSAP Flip: captura estado → reordena DOM → anima la diferencia) que muestra 4 tarjetas a la vez con botones Anterior/Siguiente. En reposo cada tarjeta muestra solo el logo centrado con un balanceo vertical continuo y suave, distinto por tarjeta y desfasado entre ellas. Al hover, el logo y la descripción se centran juntos como bloque y la tarjeta pasa de negro sólido a vidrio esmerilado con tinte del color de marca (`color-mix()` + `backdrop-filter`). Nuevo módulo `src/platform-carousel.js`, registrado en `src/main.js`; estilos nuevos en `src/style.css`. Número de tarjetas visibles adaptado por ancho de viewport.

Adicionalmente, en `nuestra-historia.html` se realineó el recuadro de texto ("Al principio nos llamamos ADMK Team...") con la columna de texto superior (antes centrado de forma independiente) y se ajustó su fondo `.liquid-glass` a un tinte oscuro con padding reducido, tras varias iteraciones en vivo con el usuario.

**Por qué:** petición explícita del usuario, iterada en vivo sobre un prototipo (`proto-plataformas.html` + `src/proto-platform-carousel.js`, ya eliminados) antes de tocar la página real: probó primero un layout en abanico (rechazado), luego el carrusel Flip inspirado en una demo de GSAP, y ajustó el hover (revelado del texto, wiggle vertical continuo, "liquid glass", colores) hasta aprobar la versión de producción.

**Afecta:** `publicidad-en-medios.html`, `src/platform-carousel.js` (nuevo), `src/main.js`, `src/style.css`, `nuestra-historia.html`.

**Deuda técnica documentada (no resuelta en este PR):** ver nota en `project-context.md` — coexisten ahora dos sistemas de "liquid glass": `.liquid-glass` (distorsión SVG, para paneles siempre-cristal) y el `color-mix()` de las tarjetas de plataformas (para tarjetas que transicionan negro→cristal-de-color). No se unificaron porque el resultado visual de cada uno ya estaba aprobado por el usuario antes de detectarse el solapamiento.

**Bug de entorno local encontrado y corregido:** este worktree no tenía fichero `.env` (solo `.env.example`), por lo que `createClient()` en `src/supabaseClient.js` lanzaba `Error: supabaseUrl is required.` al evaluarse el módulo — al ser un throw de nivel superior en una dependencia transitiva de `main.js`, rompía silenciosamente la ejecución de `initAll()` en todas las páginas (no solo la sección nueva), sin generar ningún error visible hasta aislarlo. Se creó `.env` local a partir de `.env.example` (gitignorado, no se sube) para desbloquear las pruebas — necesario en cualquier clon nuevo del repo, ver `supabase/README.md`.

**Verificado en local:** servidor `npm run dev`; confirmado en `/publicidad-en-medios.html` que el carrusel renderiza 4 tarjetas en el orden esperado, que el hover activa el degradado con el color de marca correcto y que "Siguiente"/"Anterior" reordenan el DOM correctamente; confirmado en `/nuestra-historia.html` que el recuadro quedó alineado con el texto y con el nuevo tinte/tamaño. Sin errores de consola propios de estos cambios (solo el error preexistente y esperado de logos de partners por credenciales de Supabase de ejemplo).

---

## 2026-08-04 — Nuevo personaje animado en el banner de cookies

**Qué:** sustituido el vídeo del personaje que acompaña al aviso de cookies (`public/imgs/personaje1.webm`, referenciado desde `src/bottom-panel.js`) por una nueva animación entregada por el usuario (`COOKIES.mov`, códec QuickTime Animation con canal alpha nativo). Conversión con `ffmpeg` a VP9/WebM con transparencia (`-pix_fmt yuva420p -auto-alt-ref 0`), mismo método de codificación que ya usaba el archivo anterior, manteniendo la resolución nativa del vídeo fuente (1928×1072, antes 1920×1080) y una duración de ~5s a 24fps. Tamaño final 573 KB (antes 708 KB).

**Por qué:** petición del usuario de reemplazar el personaje de esa sección concreta por una pieza de vídeo nueva, sin tocar el resto del banner ni otras apariciones del personaje en el sitio (no las hay: `personaje1.webm` solo se usa en `bottom-panel.js`).

**Afecta:** `public/imgs/personaje1.webm` (reemplazado; mismo nombre de archivo, mismo punto de referencia, sin cambios en `src/bottom-panel.js`).

**Verificado en local:** servidor de dev de Vite; forzada la aparición del banner de cookies (`initBottomPanel()`) y confirmado por lectura de píxeles vía `<canvas>`/`getImageData` que el vídeo se decodifica con canal alpha real en el navegador (~71% de los píxeles muestreados con alpha < 10, consistente con fondo transparente alrededor del personaje). No se pudo tomar captura de pantalla porque el panel de vista previa no estaba visible en esta sesión.

---

## 2026-08-04 — Galería de vídeos con scroll 3D en Diseño de Marca

**Qué:** en `diseno-de-marca.html`, la segunda sección (un único vídeo de fondo, `imgs/hero-imcontent.mp4`) se sustituyó por una galería de 5 vídeos con un efecto de scroll pineado (GSAP `ScrollTrigger`) en 3D real: cada vídeo parte del centro de la pantalla —lejos, en el eje Z (`translateZ(-1600px)`, `scale(0.25)`, invisible)— y a medida que se hace scroll se acerca y se desplaza hacia afuera (radiando desde el centro hacia las 4 esquinas + uno central grande), usando `perspective` en el contenedor y `translateZ`/`scale`/`rotateZ` por vídeo — profundidad real, no un parallax vertical. Nuevo módulo `src/diseno-scroll-videos.js` (`initDisenoScrollVideos`), importado y llamado desde `src/main.js`. En mobile (`gsap.matchMedia`, `max-width: 767px`) se simplifica a una lista vertical normal sin pin ni 3D (cada vídeo hace fade/scale-in al entrar en viewport), evitando el scroll-jacking pesado en dispositivos táctiles.

Los 5 vídeos fuente (`public/page-diseno/*.mp4`, aportados por el usuario, ~126MB en total) se convirtieron a WebM (VP9, sin audio, reescalados a 1280px de ancho) — `diseno-scroll-1.webm` a `diseno-scroll-5.webm`, ~6.4MB en total (–95%) — y los `.mp4` originales se borraron tras confirmar la conversión.

**Por qué:** petición explícita del usuario, inspirada en un efecto de su portfolio personal (`gregoryjaques.com` / `K:\Gregory\Portfolio`, componente `Mastering.jsx`) pero pidiendo explícitamente que el movimiento fuera en profundidad (eje Z, 3D real) en vez del parallax vertical de esa referencia.

**Afecta:** `diseno-de-marca.html`, `src/main.js`, `src/diseno-scroll-videos.js` (nuevo), `public/page-diseno/diseno-scroll-1.webm` a `-5.webm` (nuevos, reemplazan a los 5 `.mp4` originales que se eliminaron).

**Bug real encontrado y corregido durante la verificación:** la primera versión posicionaba cada `.dsv-item` con `top-1/2`/`left-1/2` pero dejaba el contenedor `#dsv-stage` como `flex flex-col` (sin `md:block`) y cada item en `position: relative` (sin `md:absolute`) en desktop — con eso, el `top`/`left` porcentual se aplicaba sobre la posición de flujo normal (cada vídeo apilado debajo del anterior), no sobre el centro real del contenedor, resultando en vídeos posicionados muy por debajo del viewport visible. Corregido añadiendo `md:block` a `#dsv-stage` y `md:absolute` a cada `.dsv-item`.

**Verificado en local:** `npm run build` sin errores; verificado en navegador forzando `ScrollTrigger.update()` en varios puntos de progreso (0%, 50%, 95%, 100%) que: el estado inicial deja los 5 vídeos invisibles y centrados en Z=-1600; a mitad de scroll los primeros vídeos ya están visibles y posicionados mientras los últimos siguen esperando su turno; al final del scroll los 5 quedan dentro de los límites del viewport (`getBoundingClientRect` con `top`/`bottom` dentro de 0–928px), distribuidos en las 4 esquinas + uno central grande. En mobile (375px) se confirmó que los vídeos NO quedan pineados (`position: relative`, altura de sección natural en vez de `400vh`) y que el `ScrollTrigger` de cada item avanza su progreso correctamente con el scroll; no se pudo confirmar visualmente el fade-in real (esta sesión de navegador no compone frames de animaciones no-scrub, mismo límite ya documentado en entradas anteriores) — pendiente de confirmación visual del usuario en mobile real. Sin errores de consola en desktop ni mobile.

---

## 2026-08-05 — Vuelo continuo, doble de vídeos y arreglo del layout roto en la galería 3D

**Qué:** tres cambios sobre la galería de scroll 3D de `diseno-de-marca.html`, a partir de feedback del usuario con capturas: (1) **el doble de vídeos** — de 5 a 10 instancias (los 5 clips se reutilizan duplicados, cada uno con su propio ancho, trayectoria y rotación); (2) **los vídeos ya no frenan en una posición final fija** — antes cada uno terminaba parado en un punto (4 esquinas + centro), ahora cada uno sigue su trayectoria hasta salir por completo del viewport (`z: 900`, desplazamiento del 150% de la mitad del viewport en ambos ejes, `scale: 2.4`, `ease: power1.in`), dando un flujo continuo de 2-3 vídeos en pantalla a la vez; (3) **duración del scroll muy reducida** — de `+=2400%` (un cálculo mío erróneo: ~22.300px de scroll) a `+=220%` (~1.580px) y `scrub` de 1 → 0.4, que era la causa de que se sintiera "muy larga y muy lenta".

**Por qué:** petición explícita del usuario tras probar la primera versión en su navegador.

**Afecta:** `diseno-de-marca.html` (10 `.dsv-item` en vez de 5; se quitó el wrapper `sticky` intermedio y la altura fija `md:h-[400vh]`), `src/diseno-scroll-videos.js`, `src/main.js` (orden de inicialización).

**Tres bugs reales encontrados y corregidos:**

- **Bloque "fantasma" que descuadraba toda la página tras la animación** (el que el usuario reportó con captura): la sección mezclaba `position: sticky` (CSS) con `pin: true` (GSAP) *y además* declaraba una altura fija `md:h-[400vh]`. Como el pin de ScrollTrigger ya inserta su propio spacer, el espacio quedaba duplicado: al des-pinear quedaba un bloque de ~400vh vacío solapándose con la sección siguiente. Corregido eliminando tanto el `sticky` como la altura manual, dejando que ScrollTrigger gestione el spacer a partir de `end`.
- **La sección "Cómo lo hacemos" aparecía a mitad de la animación de los vídeos:** ambas secciones están pineadas, pero `initComoLoHacemosScroll()` se ejecutaba *antes* que `initDisenoScrollVideos()` pese a ir *después* en el DOM, así que calculaba su rango de scroll antes de que existiera el pin spacer de la galería y los rangos se solapaban (verificado: `chlh.start` quedaba 1.770px *antes* del `dsv.end`). Corregido invirtiendo el orden de init en `main.js` para que coincida con el orden del DOM, más `refreshPriority: 1` en el trigger de la galería. Tras el arreglo, `chlh` empieza 2.655px *después* de que termina `dsv`.
- **`ScrollTrigger.refresh()` dentro del callback de `gsap.matchMedia()` rompía la detección de breakpoint:** se probó como intento de arreglar el punto anterior y provocó que a 1280px de ancho se activara la rama *mobile* (10 triggers por item en vez del pin de desktop). Documentado como anti-patrón en la cabecera del módulo para no repetirlo.

**Verificado en local:** `npm run build` sin errores. En desktop (1280×720), recorriendo el scroll en 0/20/40/60/80/100%: en 0% no hay ningún vídeo visible, entre 20% y 80% hay siempre 2-3 en pantalla, y en 100% los **10 han salido del viewport** (0 visibles) — el vuelo ya no se detiene. Confirmado que 300px después del final del pin no queda ningún vídeo visible filtrándose en la sección siguiente, que la sección se comporta con su altura natural (720px, sin bloque fantasma) y que no hay scroll horizontal. En mobile (375px) confirmado que se activa la rama correcta (sin pin, 10 triggers por item, `position: relative`) y sin overflow horizontal. Sin errores de consola en ninguno de los dos.

---

## 2026-08-05 — Ajuste de tamaño, velocidad y densidad de la galería 3D

**Qué:** tres ajustes de sensación sobre la galería, pedidos por el usuario tras validar la versión anterior: (1) **vídeos más grandes** — anchos subidos ~35% (de un rango de 17-30vw a 23-38vw); (2) **desplazamiento más lento** — el recorrido de scroll pasa de `+=220%` a `+=320%` (de ~1.580px a ~2.300px), así la misma animación se reparte sobre más scroll; (3) **más elementos en pantalla a la vez** — de 10 a 14 instancias y `stagger` de 0.3 a 0.18 (el nº de vídeos solapados en vuelo es ≈ `flightDuration / stagger`, así que pasa de ~3 a ~5), que era la queja de que "aparecen pocos elementos durante el scroll".

**Refactor asociado:** los `.dsv-item` ya no se escriben a mano en el HTML — se generan en `src/diseno-scroll-videos.js` desde un array `ITEMS` (ancho + trayectoria + rotación por instancia) reutilizando los 5 clips. Con 14 instancias, mantener el markup a mano significaba 14 bloques duplicados de 4 líneas cada uno para elementos puramente decorativos (`aria-hidden`); ahora cantidad, tamaño y trayectoria se ajustan en un único sitio. Al reutilizar las mismas 5 URLs el navegador las cachea, así que 14 elementos siguen costando **solo 5 descargas** (verificado). En mobile solo se muestran los 5 primeros (uno por clip): la lista vertical no gana nada repitiéndolos y evita 14 vídeos decodificando a la vez.

**Por qué:** feedback explícito del usuario tras probar la versión anterior en su navegador.

**Afecta:** `src/diseno-scroll-videos.js`, `diseno-de-marca.html` (los 10 bloques `.dsv-item` se sustituyen por un `#dsv-stage` vacío con un comentario que apunta al módulo).

**Verificado en local:** `npm run build` sin errores. En desktop (1280×720): 14 items, recorrido de 2.304px (antes 1.584px), entre el 20% y el 80% del scroll hay siempre **3-4 vídeos en pantalla** (antes 2-3) y al 100% los 14 han salido del viewport. Confirmado el gradiente de profundidad a mitad de vuelo (el más cercano ocupa el 31% del ancho del viewport, el más lejano el 4%), que los 14 `<video>` cargan (`readyState: 4`) con **solo 5 URLs únicas**, y que sigue habiendo 2.655px de separación entre el final de esta sección y el inicio de "Cómo lo hacemos" (sin regresión del solapamiento). En mobile (375px): 14 items en el DOM pero solo 5 visibles, sin pin, sin overflow horizontal. Sin errores de consola en ninguno de los dos.

---

## 2026-08-05 — Vídeos aún más grandes y mezcla de formato vertical en la galería 3D

**Qué:** dos ajustes más sobre la galería, pedidos por el usuario: (1) **tamaños subidos otra vez** — los horizontales pasan de 23-38vw a 32-50vw; (2) **mezcla de orientaciones** — 5 de las 14 instancias pasan a formato vertical (contenedor `aspect-[9/16]` en vez de `aspect-video`), quedando 9 horizontales + 5 verticales. Los 5 clips fuente son 1920×1080 (horizontales), así que en las instancias verticales el `object-cover` del `<video>` recorta los lados — no hace falta material nuevo. Las entradas verticales llevan anchos mucho menores (18-24vw) porque en 9:16 la altura crece con el ancho: a 22vw en un viewport de 1280×720 ya ocupa ~70vh de alto.

**Por qué:** feedback explícito del usuario ("que sean más grandes aún y que algunos vídeos tengan formato vertical").

**Afecta:** `src/diseno-scroll-videos.js` únicamente (nuevo flag `portrait` por entrada del array `ITEMS`; las dos variantes de `className` se escriben como cadenas literales completas para que el JIT de Tailwind las detecte al escanear el módulo — `src/**/*.js` ya está en el `content` de `tailwind.config.js`).

**Verificado en local:** `npm run build` sin errores y `.aspect-\[9\/16\]` presente en el CSS compilado (confirmado que Tailwind genera la clase desde el JS). En desktop (1280×720): 14 items con exactamente dos ratios distintos — 1.78 (16:9) en 9 items y 0.56 (9:16) en 5 —, tamaño máximo en pantalla del 52% del ancho del viewport a un 20% del scroll (antes 31%) y hasta un 127% del ancho / 151% del alto al pasar junto a la cámara justo antes de salir (efecto buscado, recortado por el `overflow-hidden` de la sección); al 100% del scroll los 14 siguen saliendo del viewport. En mobile (375px): 5 items visibles, uno de ellos vertical (523px de alto en un viewport de 812px), sin overflow horizontal. Sin errores de consola en ninguno de los dos.

---

## 2026-08-05 — Partículas y marcos decorativos en la galería 3D

**Qué:** se añadieron 36 elementos decorativos que vuelan por el mismo espacio 3D que los vídeos, para que el scroll no se sienta vacío en los huecos entre un vídeo y el siguiente: **30 partículas** (puntos de 2-7px, un tercio en el azul de marca `#4889eb` y el resto en blanco) y **6 marcos translúcidos** (rectángulos de 9-17vw con borde y relleno muy tenues), en la línea de los "shapes" que ya usaba el portfolio de referencia del usuario. Se reparten por toda la duración del timeline de los vídeos (no con el mismo stagger), así que siempre hay varios en vuelo rellenando los huecos, y se apagan con un fade antes de llegar al borde en vez de recortarse en seco. Solo en desktop: en mobile la sección es una lista vertical simple y quedan ocultos.

Las posiciones/tamaños salen de un **PRNG con semilla** (`makeRng`) en vez de `Math.random()`: `initAll()` se re-ejecuta en la navegación tipo SPA de este sitio, y con random puro el campo de partículas se recolocaría en cada re-init produciendo un salto visible.

**Por qué:** petición explícita del usuario ("¿podemos adicionar algunas partículas u otros elementos que no sea el vídeo para rellenar un poco más mientras sucede este scroll?").

**Afecta:** `src/diseno-scroll-videos.js` únicamente.

**Decisión de rendimiento:** los marcos van **sin** `backdrop-filter`, aunque el efecto de cristal sería más rico: son 6 elementos en movimiento sobre una escena que ya reproduce 14 vídeos simultáneos, y el blur de fondo animado es de lo más caro de componer. Sobre el negro de la sección, borde + relleno muy tenue ya lee como marco de cristal.

**Bug real encontrado y corregido:** los colores/bordes de los decorativos se escribieron primero como clases de Tailwind y se comprobó que **`bg-white/[0.03]` no llegaba al CSS compilado** (0 ocurrencias de `0.03` en el bundle), dejando los marcos completamente sin relleno. Las clases estructurales sí se generan bien desde el JS (`aspect-[9/16]` está en el CSS), así que no es que el fichero no se escanee. Se movieron los valores de color/borde a estilo inline, que además es más apropiado para valores puntuales de elementos creados en runtime. Documentado en la cabecera del módulo.

**Verificado en local:** `npm run build` sin errores. En desktop (1280×800): 36 decorativos en el DOM, con los estilos inline efectivamente aplicados (`rgb(72, 137, 235)` en las partículas azules, `rgba(255,255,255,0.03)` de relleno y `rgba(255,255,255,0.1)` de borde en los marcos). Densidad a lo largo del scroll: 15% → 3 vídeos + 8 decorativos, 35% → 4 + 14, 55% → 4 + 14, 75% → 4 + 9. En mobile (375px): los 36 decorativos siguen en el DOM pero con `display: none` (0 visibles) y los 5 vídeos de la lista intactos, sin overflow horizontal. Sin errores de consola en ninguno de los dos.

**Detalle conocido (no corregido a propósito):** el último ~6% del scroll pineado (~150px) queda sin elementos en pantalla, porque los últimos vídeos y partículas salen del viewport antes de que sus tweens terminen. El vaciado es gradual desde el 78% del scroll, así que funciona como respiro antes de la sección "Cómo lo hacemos"; forzar que coincidan exactamente obligaría a acortar los recorridos de salida y haría las salidas más abruptas.

**No verificado:** el framerate real de la escena (14 vídeos + 36 elementos animados con scrub). El panel de navegador de esta sesión no compone frames, así que no se pudo medir — conviene una pasada en un equipo modesto antes de dar por buena la densidad.

---

## 2026-08-05 — Fix: el footer no aparecía en diseno-de-marca.html

**Qué:** el `<footer>` que monta `src/footer.js` no tenía `z-index` propio (`class="relative bg-black py-16 text-white overflow-hidden"`). En `diseno-de-marca.html` la sección Hero es `position: fixed` con `z-[1]` y permanece fija durante todo el scroll de la página; al no tener el footer ningún z-index (`z-index: auto`), las reglas de stacking de CSS hacen que el Hero (con z-index positivo explícito) se pinte por encima de él sin importar el orden en el DOM, dejándolo tapado de forma permanente. Se añadió `z-10` al footer (`relative z-10 bg-black ...`), en línea con el resto de secciones de esta página, que ya usan `z-10` precisamente para quedar por encima de ese mismo Hero fijo.

**Por qué:** reporte del usuario ("el pie de página no está apareciendo en esta página").

**Afecta:** `src/footer.js` (componente compartido por todas las páginas del sitio). Se comprobó que `diseno-de-marca.html` es la única página con este patrón de Hero `fixed` + `z-[1]`, así que el bug era exclusivo de esa página; el fix es seguro en el resto del sitio porque ahí no hay ningún elemento con z-index superior al del footer con el que pueda competir.

**Verificado en local:** `npm run build` sin errores. En `diseno-de-marca.html`, tras hacer scroll hasta el final, `getComputedStyle` confirma `z-index: 10` en el footer frente a `z-index: 1` en el Hero (`position: fixed`), y el contenido del footer (enlaces, dirección, copyright) aparece en el árbol de accesibilidad de la página en su posición esperada dentro del viewport.

---

## 2026-08-04 — Resuelto conflicto de merge en el PR #22 (imágenes de portada de 10 casos de éxito)

**Qué:** único conflicto real, de nuevo puramente aditivo en `.claude/TASK-LOG.md` (las 10 entradas de este PR, sobre las portadas de Nutfruit/Cool Bottles/Velites/Mun Kombucha/La Marca Well/Bobo Choses/Grupo Mimara/Gabriel For Sach/iVentions/Oxperta Capital, vs. todo el trabajo entrado en `main` mientras tanto: reducción del celeste + liquid glass, edición de equipo en grid, estilo de botones de archivo, vídeo de fondo en Historia Fundador, y el CTA de Behance con sus tres iteraciones). Se conservaron todas, en orden cronológico. `casos-de-exito.html` se automergeó sin conflicto — el PR #17 (CTA de Behance) tocó la cabecera de la sección (contador → barra CTA) y este PR tocó únicamente los `src` de las `<img>` de las tarjetas del grid, sin solaparse.

**Por qué:** petición explícita del usuario para poder mergear el PR #22 tras resolver su conflicto.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run dev`; confirmadas visualmente en `/casos-de-exito.html` las 10 tarjetas con sus imágenes nuevas coexistiendo con la barra CTA de Behance (PR #17) tras el merge; sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso Teamder en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso TEAMDER (antes `imgs/teamder.png`) por una nueva imagen aportada por el usuario (logo de Teamder sobre fondo degradado con grano), guardada como `public/imgs/teamder-portada.jpg` (PNG original de 4.4MB redimensionado a 2000px de ancho y convertido a JPEG, ~1MB). Se eliminó `public/imgs/teamder.png` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/teamder-portada.jpg` (nuevo), `public/imgs/teamder.png` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta TEAMDER en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola nuevos (los errores de Supabase presentes son preexistentes por falta de credenciales locales, no relacionados con este cambio).

---

## 2026-08-05 — Sustituye la imagen de portada del caso Oxperta Express en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso OXPERTA EXPRESS (antes `imgs/oexpress.svg`) por una nueva foto aportada por el usuario (repartidor con cajas frente a furgoneta de reparto), guardada como `public/imgs/oxpertaexpress-portada.jpg` (PNG original de 20MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~420KB). Se eliminó `public/imgs/oexpress.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/oxpertaexpress-portada.jpg` (nuevo), `public/imgs/oexpress.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta OXPERTA EXPRESS en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso TravelPerk en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso TRAVELPERK (antes `imgs/travelperk.png`) por una nueva foto aportada por el usuario (interior de oficina moderna con cabinas telefónicas y zona de descanso), guardada como `public/imgs/travelperk-portada.jpg`. Se eliminó `public/imgs/travelperk.png` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/travelperk-portada.jpg` (nuevo), `public/imgs/travelperk.png` (eliminado).

**Verificado en local:** preview con `npm run dev`; la tarjeta TRAVELPERK en `/casos-de-exito.html` muestra la nueva imagen con el mismo encuadre (`object-cover`) y badges intactos. Sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso Vasquiat en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso VASQUIAT (antes `imgs/vasquiat.svg`) por una nueva foto editorial de moda aportada por el usuario, guardada como `public/imgs/vasquiat-portada.jpg` (PNG original de 19.5MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~365KB). Se eliminó `public/imgs/vasquiat.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/vasquiat-portada.jpg` (nuevo), `public/imgs/vasquiat.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; confirmado por `img.complete`/`naturalWidth` que la imagen carga correctamente (2000x1116, sin 404) en la tarjeta VASQUIAT de `/casos-de-exito.html`; sin errores de consola. (La captura visual del panel de preview no renderizó en este entorno puntualmente; verificación hecha por inspección del DOM en vez de captura de pantalla.)

---

## 2026-08-05 — Sustituye la imagen de portada del caso WeTribu en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso WETRIBU (antes `imgs/wetribu.svg`) por una nueva foto aportada por el usuario (evento de la comunidad WeTribu, círculo de sillas con banners de marca), guardada como `public/imgs/wetribu-portada.jpg` (PNG original de 19.7MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~490KB). Se eliminó `public/imgs/wetribu.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/wetribu-portada.jpg` (nuevo), `public/imgs/wetribu.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; confirmado que `/imgs/wetribu-portada.jpg` responde 200 y carga correctamente (2000x1116) al solicitarlo directamente; el `<img>` de la tarjeta no disparó su lazy-load durante la sesión de pruebas automatizada (artefacto del entorno, no del sitio), pero el `src` en el HTML y el archivo servido son correctos. Sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso The Crewel Work Company en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso THE CREWEL WORK COMPANY (antes `imgs/crewel.svg`) por una nueva foto de detalle de bordado aportada por el usuario, guardada como `public/imgs/crewel-portada.jpg` (PNG original de 22MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~645KB). Se eliminó `public/imgs/crewel.svg` (sin más referencias en el repo).

**Por qué:** petición explícita del usuario de cambiar esa imagen de portada concreta.

**Afecta:** `casos-de-exito.html`, `public/imgs/crewel-portada.jpg` (nuevo), `public/imgs/crewel.svg` (eliminado).

**Verificado en local:** preview con `npm run dev`; confirmado que `/imgs/crewel-portada.jpg` responde 200 y el `src` en el HTML es correcto; sin errores de consola en la pestaña del sitio.

---

## 2026-08-05 — Corrige el nombre de marca incorrecto en la página de detalle de Crewel Work

**Qué:** en `caso-thecrewel.html`, el `<h1>` de la cabecera ("Caso de Éxito: ...") decía "La Manso" en vez del nombre correcto — un error de copy-paste preexistente, ajeno al cambio de portada de la tarea anterior. Se corrigió a "Crewel Work", el nombre que ya usa el resto de la misma página (title, meta description, JSON-LD y cuerpo del texto). Se revisó el `<h1>` equivalente de las 19 páginas `caso-*.html` y no se encontró ningún otro caso con el nombre incorrecto.

**Por qué:** feedback explícito del usuario tras revisar la página del caso.

**Afecta:** `caso-thecrewel.html` únicamente.

**Verificado:** grep sobre las 19 páginas `caso-*.html` confirmando que cada `<h1>` de cabecera coincide con la marca correspondiente.

---

## 2026-08-05 — Sustituye la imagen ilustrativa del caso Nutfruit

**Qué:** en `caso-nutfruit.html`, se sustituyó `public/imgs/nut-img1.jpg` (imagen de la franja horizontal entre el hero y la sección de Solución/Resultados) por una nueva imagen aportada por el usuario (los personajes/mascotas de Nutfruit en un bosque). Mismo nombre y ruta de archivo, no se tocó el HTML; PNG original de 22MB/6336x2688 redimensionado a 2200px de ancho y convertido a JPEG (~700KB).

**Por qué:** petición explícita del usuario de cambiar esa imagen concreta dentro del caso.

**Afecta:** `public/imgs/nut-img1.jpg`.

**Verificado en local:** preview con `npm run dev`; confirmado por `img.complete`/`naturalWidth` (2200, sin 404) que la nueva imagen carga correctamente en `/caso-nutfruit.html`; sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso AMLUL en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso AMLUL por una nueva imagen aportada por el usuario (visualmente idéntica a la que ya estaba puesta — mismo encuadre, confirmado con el usuario antes de proceder). Igual que con La Marca Well, no se reutilizó `imgs/port-amlul.png` porque ese archivo también lo usa `caso-amlul.html` (la página de detalle) y el cambio pedido era solo para la tarjeta del grid. Se creó `public/imgs/amlul-portada.jpg` (PNG original de 18.6MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~345KB) y solo se actualizó el `src` en `casos-de-exito.html`. `port-amlul.png` no se toca.

**Por qué:** petición explícita del usuario, confirmada tras señalar que la imagen aportada coincidía con la ya existente.

**Afecta:** `casos-de-exito.html`, `public/imgs/amlul-portada.jpg` (nuevo). `public/imgs/port-amlul.png` no se toca.

**Verificado en local:** preview con `npm run dev`; confirmado que `/imgs/amlul-portada.jpg` carga correctamente (2000x1116); sin errores de consola.

---

## 2026-08-05 — Sustituye la imagen de portada del caso La Manso en Casos de Éxito

**Qué:** en `casos-de-exito.html`, se sustituyó la portada del caso LA MANSO por una nueva imagen aportada por el usuario (de nuevo visualmente idéntica a la ya existente, mismo patrón que AMLUL en la tarea anterior). No se reutilizó `imgs/port-manso.jpg` porque también lo usa `caso-lamanso.html` (página de detalle); se creó `public/imgs/lamanso-portada.jpg` (PNG original de 19MB/5504x3072 redimensionado a 2000px de ancho y convertido a JPEG, ~345KB) y solo se actualizó el `src` en `casos-de-exito.html`. `port-manso.jpg` no se toca.

**Por qué:** petición explícita del usuario; se aplicó el mismo criterio ya confirmado en el cambio anterior de AMLUL (sustituir aunque la imagen coincida con la existente).

**Afecta:** `casos-de-exito.html`, `public/imgs/lamanso-portada.jpg` (nuevo). `public/imgs/port-manso.jpg` no se toca.

**Verificado en local:** preview con `npm run dev`; confirmado que `/imgs/lamanso-portada.jpg` responde 200 y el `src` en el HTML es correcto; sin errores de consola.

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #21 (galería 3D en Diseño de Marca)

**Qué:** único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (las entradas de este PR — galería 3D, sus ajustes sucesivos y el fix del footer — vs. la entrada de resolución del PR #22, ya mergeado en `main`, sobre las 10 portadas de casos de éxito). Se conservaron todas, en orden cronológico. Ningún otro fichero tuvo conflicto real: el PR #22 solo tocó `src` de imágenes en `casos-de-exito.html` y ficheros en `public/imgs/`, sin relación con `diseno-de-marca.html`, `src/diseno-scroll-videos.js`, `src/main.js` ni `src/footer.js`.

**Por qué:** petición explícita del usuario para poder mergear el PR #21.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; confirmado en navegador que en `/casos-de-exito.html` las 10 portadas nuevas del PR #22 y el CTA de Behance (PR #17) siguen coexistiendo tras el merge; sin errores de consola.

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #23 (personaje del banner de cookies)

**Qué:** único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (la entrada de este PR, con fecha 2026-08-04, vs. todo el trabajo entrado en `main` mientras tanto: galería 3D de Diseño de Marca con sus ajustes sucesivos, el fix del footer, y la resolución de conflicto del PR #22). Se conservaron todas, ordenadas cronológicamente por fecha de la entrada. Ningún otro fichero tuvo conflicto real: este PR solo toca `public/imgs/personaje1.webm`, que ningún otro PR mergeado ha tocado.

**Por qué:** petición explícita del usuario para poder mergear el PR #23.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores; confirmado en navegador (banner de cookies forzado tras limpiar `localStorage`) que el nuevo vídeo del personaje (`/imgs/personaje1.webm`, 1928×1072) carga y decodifica correctamente tras el merge; sin errores de consola.

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #24 (carrusel Flip de plataformas + recuadro de Nuestra Historia)

**Qué:** dos conflictos reales: (1) el habitual y puramente aditivo en `.claude/TASK-LOG.md` (la entrada de este PR, con fecha 2026-08-04, vs. todo lo entrado en `main` mientras tanto — galería 3D, fix de footer, y las resoluciones de los PR #22/#23); se conservaron todas en orden cronológico. (2) En `src/main.js`, ambas ramas añadían un `import` nuevo en la misma línea (`initPlatformCarousel` de este PR vs. `initDisenoScrollVideos` del PR #21, ya en `main`) — no eran alternativas sino dos imports independientes, así que se conservaron ambos. Los puntos donde cada uno se invoca (`initAll()`) ya estaban en líneas distintas del fichero y se automergearon sin conflicto.

**Por qué:** petición explícita del usuario para poder mergear el PR #24.

**Afecta:** `.claude/TASK-LOG.md`, `src/main.js` (ambos con conflicto real).

**Verificado en local:** `npm run build` sin errores. Confirmado en navegador que `/publicidad-en-medios.html` renderiza las 4 tarjetas del carrusel Flip, que `/diseno-de-marca.html` sigue generando los 14 `.dsv-item` de la galería 3D, y que `/nuestra-historia.html` carga sin errores — las tres funcionalidades, entradas por PRs distintos que tocan `main.js`, coexisten tras el merge. Sin errores de consola en ninguna de las tres.

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #25 (más portadas de Casos de Éxito + fix de nombre)

**Qué:** único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (las 8 entradas de este PR — portadas de Teamder, Oxperta Express, TravelPerk, Vasquiat, WeTribu, The Crewel Work Company, AMLUL y La Manso, más el fix del nombre de marca en `caso-thecrewel.html` — vs. las resoluciones de conflicto de los PR #21, #23 y #24 ya integradas en `main`). Se conservaron todas, en orden cronológico. Ningún otro fichero tuvo conflicto real: este PR solo toca imágenes de `public/imgs/` y el `<h1>` de `caso-thecrewel.html`, sin relación con `src/main.js`, `src/footer.js` ni la galería 3D.

**Por qué:** petición explícita del usuario para poder mergear el PR #25.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores. Confirmado en navegador que `/caso-thecrewel.html` muestra el `<h1>` corregido ("Crewel Work") y que las 8 nuevas portadas (`teamder-portada`, `oxpertaexpress-portada`, `travelperk-portada`, `vasquiat-portada`, `wetribu-portada`, `crewel-portada`, `amlul-portada`, `lamanso-portada`) están presentes en `/casos-de-exito.html` junto con el CTA de Behance. Sin errores de consola en ninguna de las dos.
