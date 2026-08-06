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

## 2026-08-05 — Cursor personalizado: círculo blanco/negro con inversión en hover

**Qué:** se añadió un cursor personalizado en todo el sitio (`src/custom-cursor.js`, ~40 líneas): un círculo fijo de 20px que sigue al ratón vía `mousemove`, blanco con borde negro por defecto ("positivo"), y que pasa a negro con borde blanco ("negativo") al pasar por encima de cualquier elemento interactivo (`a, button, input, textarea, select, label, [role="button"], [tabindex], .cursor-pointer`), detectado por delegación de eventos `mouseover`/`mouseout` en `document`. El cursor nativo se oculta (`cursor: none !important` en todos los elementos, con `!important` porque varias interacciones existentes —drag de carruseles— fijan `element.style.cursor` inline) solo en dispositivos con puntero fino (`@media (pointer: fine)`); en touch (`pointer: coarse`) el cursor personalizado no se crea y el nativo permanece intacto. Como la navegación de este sitio reemplaza `document.body.innerHTML` en cada cambio de página (SPA-like, ver `updateDOM`/`initAll` en `src/main.js`), `initCustomCursor()` recrea el elemento del círculo en cada llamada pero solo adjunta los listeners de `window`/`document` una vez (flag de módulo), para no acumular listeners duplicados tras varias navegaciones.

**Por qué:** petición explícita del usuario. Se confirmaron dos decisiones de diseño antes de implementar: el significado de "positivo/negativo" (blanco relleno → negro relleno, no inversión tipo `mix-blend-mode`) y el alcance del hover (solo elementos interactivos, no cualquier elemento de la página).

**Afecta:** `src/custom-cursor.js` (nuevo), `src/main.js` (import + llamada en `initAll()`), `src/style.css` (reglas `.custom-cursor`).

**Verificado en local:** preview con `npm run dev`; confirmado por inspección del DOM que el círculo sigue al cursor (`transform` se actualiza en cada `mousemove`) y que la clase `is-hover` se activa/desactiva correctamente al entrar/salir de un enlace; confirmado visualmente en captura que el círculo se ve blanco sobre fondo negro en reposo y negro con borde blanco al pasar sobre el nav; confirmado que en emulación móvil (`pointer: coarse`) el elemento no se crea y `cursor` del body vuelve a `auto`. Sin errores de consola nuevos.

---

## 2026-08-05 — Ajusta tamaño y transición del cursor personalizado

**Qué:** dos ajustes al cursor personalizado (`src/custom-cursor.js`, `src/style.css`) tras feedback visual del usuario: (1) el círculo se redujo de 20px a 12px; (2) la transición plana de color (0.15s linear) se sustituyó por una animación con rebote — se separó el punto visual (`.cc-dot`, un `<span>` interno) del contenedor que sigue la posición del ratón (`.custom-cursor`), para poder animar `transform: scale()` en el punto sin interferir con el `transform: translate()` que el JS actualiza en cada `mousemove`. Al hacer hover, el punto ahora escala a 1.8x con `cubic-bezier(0.34, 1.56, 0.64, 1)` (efecto de rebote/overshoot) en 0.45s, junto con el cambio de color en 0.35s.

**Por qué:** feedback explícito del usuario: el círculo era demasiado grande y la transición positivo→negativo se sentía plana, sin animación.

**Afecta:** `src/custom-cursor.js`, `src/style.css`.

**Verificado en local:** preview con `npm run dev`; confirmado por inspección del DOM que la estructura anidada (`.custom-cursor > .cc-dot`) existe y el tamaño en reposo es 12px; confirmado visualmente en captura que el punto crece notablemente con rebote al pasar sobre un enlace del nav. Sin errores de consola nuevos.

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

---

## 2026-08-05 — Actualiza el vídeo de fondo de "Historia Fundador" con la versión más reciente

**Qué:** en `nuestra-historia.html`, se sustituyó `public/imgs/nt-bg-2.mp4` (fondo en vídeo de la sección "Historia Fundador", introducido en la PR #18) por la versión actualizada del mismo vídeo ("GIF Marco.mp4") que el usuario dejó en la carpeta `Nuestra Historia/` del proyecto. Mismo nombre y ruta de archivo, no se tocó el HTML. El nuevo archivo es más ligero (7.6MB vs 10.2MB) y de menor duración (3.97s vs 5.33s).

**Por qué:** petición explícita del usuario tras actualizar el archivo fuente.

**Afecta:** `public/imgs/nt-bg-2.mp4`.

**Verificado en local:** preview con `npm run dev`; confirmado por `video.readyState`/`videoWidth`/`duration` que el nuevo vídeo carga correctamente (1920x1080, 3.97s, sin 404) en `/nuestra-historia.html`. Sin errores de consola nuevos.

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #26 (cursor personalizado)

**Qué:** tres conflictos reales: (1) el habitual y aditivo en `.claude/TASK-LOG.md` (las dos entradas de este PR — cursor personalizado y su ajuste de tamaño/transición — vs. las entradas de imágenes de Casos de Éxito y la resolución del PR #25). (2) En `src/main.js`, ambas ramas añadían un `import` nuevo en la misma línea (`initCustomCursor` de este PR vs. `initPlatformCarousel`/`initDisenoScrollVideos` de los PR #21/#24, ya en `main`) — de nuevo imports independientes, no alternativas; se conservaron los tres. (3) En `src/style.css`, el bloque de reglas `.custom-cursor` (este PR) y el bloque `.platform-carousel`/`.platform-card-*` (PR #24) se insertaron ambos al final del fichero en el mismo punto respecto al ancestro común, así que Git los marcó como un único conflicto aunque no se solapan — el bloque de HEAD llegó incompleto en el marcador (le faltaba la llave de cierre de `@media (pointer: coarse)`, que Git había desplazado justo después del separador `=======`); se reconstruyeron ambos bloques completos y balanceados, cursor primero y carrusel después, comprobando las llaves contra la versión original de cada rama.

**Por qué:** petición explícita del usuario para poder mergear el PR #26.

**Afecta:** `.claude/TASK-LOG.md`, `src/main.js`, `src/style.css` (los tres con conflicto real).

**Verificado en local:** `npm run build` sin errores (sin errores de sintaxis CSS). Confirmado en navegador: el cursor personalizado sigue al ratón, oculta el nativo (`cursor: none`) y activa `is-hover` correctamente al pasar sobre un enlace; `/publicidad-en-medios.html` sigue renderizando las 4 tarjetas del carrusel con sus estilos (`background-color: rgb(10, 10, 10)` en `.platform-card-inner`) intactos; `/diseno-de-marca.html` sigue generando los 14 `.dsv-item` de la galería 3D. Las tres funcionalidades, que tocan `main.js` y/o `style.css` desde PRs distintos, coexisten tras el merge. Sin errores de consola nuevos (los mensajes de fallo de HMR de `style.css` vistos durante la resolución eran residuales del estado a medio editar, no del resultado final — confirmado por navegación forzada tras terminar).

---

## 2026-08-05 — Fix: cursor invisible en el dashboard interno

**Qué:** la regla `cursor: none !important` que oculta el cursor nativo para el cursor personalizado (PR #26) vive en `src/style.css`, importado por **todas** las páginas — también `admin.js`, `ofertas.js`, `logosAdmin.js`, `roles.js` y `casosAdmin.js`, ninguna de las cuales llama a `initCustomCursor()` (eso solo pasa en `src/main.js`, el entrypoint del sitio público). Resultado: en todo el dashboard interno el cursor nativo se ocultaba sin que existiera ningún círculo que lo sustituyera — el ratón quedaba invisible. Se acotó la regla con `:has()` para que solo aplique cuando `.custom-cursor` existe de verdad en la página (`html:has(.custom-cursor) *`), en vez de tocar cada entrypoint del dashboard para excluirlo uno a uno.

**Por qué:** reporte del usuario ("no se ve el mouse dentro del dashboard").

**Afecta:** `src/style.css` únicamente.

**Verificado en local:** `npm run build` sin errores. En `/admin.html` (dashboard), `getComputedStyle(document.body).cursor` devuelve `auto` y no existe ningún `.custom-cursor` en el DOM — cursor nativo visible. En `/index.html` (sitio público), `cursor` devuelve `none` y `.custom-cursor` sí existe — el efecto se mantiene intacto donde corresponde. Sin errores de consola nuevos.

---

## 2026-08-05 — Influencer Marketing: sección "¿Qué podemos hacer por ti?" con el diseño de anillo scroll-driven

**Qué:** en `influencer-marketing.html`, la sección "¿Qué podemos hacer por ti?" (antes 5 paneles verticales con imagen de fondo que se expandían al hover) se sustituyó por el componente de anillo scroll-driven "Cómo lo hacemos" ya usado en `diseno-de-marca.html` y `email-marketing.html` (motor compartido en `src/como-lo-hacemos-scroll.js`, sin cambios en el JS). Se reutilizó el copy de los 5 pasos existentes (Selección, Estrategia, Análisis, Gestión, Contenido) mapeado a la estructura `chlh-badge`/`chlh-title`/`chlh-description`/pills + `chlh-steps-data`, y se añadió un 5º estilo de anillo (`chlh-style-4`) porque las otras dos páginas solo tenían 4 pasos. La etiqueta visible de la sección se dejó como "¿Qué podemos hacer por ti?" (no "Cómo lo hacemos", para no perder el título original de esta sección en esta página).

**Por qué:** petición explícita del usuario de unificar el diseño de esta sección con el patrón ya usado en otros servicios, en vez de mantener los paneles de imagen específicos de esta página.

**Afecta:** `influencer-marketing.html` (única página tocada; no se modificó `src/como-lo-hacemos-scroll.js` ni ninguna otra página).

**Verificado en local:** confirmado con `get_page_text` en el navegador de vista previa que la sección renderiza el badge "01", el título y descripción del primer paso, y las 5 pills en orden correcto, sin romper la sección siguiente ("¿Qué nos hace diferentes?"). No se pudo verificar visualmente la animación de scroll-pin en la herramienta de preview (el pin de GSAP ScrollTrigger no reacciona a scroll simulado por script en este entorno); se comprobó que `diseno-de-marca.html` — ya en producción con el mismo componente — presenta idéntica limitación ante la misma prueba, confirmando que es una limitación de la herramienta y no una regresión introducida.

---

## 2026-08-05 — CRUD de Casos de Éxito desde el dashboard interno

**Qué:** los 19 casos de éxito (hasta ahora 19 páginas HTML estáticas hechas a mano, `caso-*.html`, más el grid de `casos-de-exito.html`) pasan a gestionarse desde un panel nuevo, `/casos-admin`: añadir, editar y eliminar casos completos — portada + nombre + sector + resultado para el grid, y descripción/logo/reto/imagen intermedia/solución/resultados (KPIs, cantidad variable) para el detalle. Se añadió también un campo de testimonios opcional (no pedido explícitamente, pero necesario para no perder el contenido real de 10 de los 19 casos actuales, que sí tienen un carrusel de testimonios).

**Decisión de arquitectura (la más relevante de esta tarea):** en vez de renderizar el contenido en el navegador con un `fetch` a Supabase — el patrón que ya usan equipo/ofertas/logos — las páginas de casos de éxito se **siguen generando como HTML 100% estático**, ahora en build time a partir de Supabase, vía `scripts/generate-case-studies.mjs` (enganchado como `predev`/`prebuild` en `package.json`, así que corre solo con `npm run dev`/`npm run build`, sin plumbing extra). Se decidió así, preguntado explícitamente al usuario, porque estas son las páginas de más peso SEO del sitio: cada una necesita su propio `<title>`/meta/canonical/JSON-LD, indexable sin depender de que se ejecute JavaScript — justo lo que se pierde con el patrón de fetch-en-cliente. El coste: un cambio guardado en el admin tarda 1-2 min en publicarse (dispara un redeploy en Vercel vía Deploy Hook) en vez de verse al instante.

**Modelo de datos:** migración `supabase/migrations/0008_case_studies.sql` — tres tablas (`case_studies`, `case_study_results` con 2-3 KPIs por caso confirmado que varía, y `case_study_testimonials` opcional), mismo patrón de RLS que `job_openings` (lectura pública solo de lo activo, gestión completa solo admin), y un bucket de Storage único `case-study-media` con subcarpetas `covers/`/`logos/`/`mid/` (esta entidad tiene 3 campos de imagen, no 1 como las anteriores, así que un bucket por campo habría sido ruido).

**Migración del contenido existente:** los 19 casos actuales se extrajeron con un script de un solo uso (no commiteado, vivió en el scratchpad) que parseó los 19 `caso-*.html` + `casos-de-exito.html` por regex, generando `supabase/migrations/0009_case_studies_seed.sql`. Las imágenes existentes se dejaron con su ruta local original (`imgs/...`), sin re-subir a Storage.

**Verificación exhaustiva antes de dar por buena la migración:** en vez de solo revisar el SQL a ojo, se montó un arnés de prueba (copia del generador real apuntando a un directorio de scratchpad en vez de a Supabase/al repo) para generar las 19 páginas a partir de los datos extraídos y compararlas byte a byte (`diff --strip-trailing-cr`) contra las páginas reales actuales. Esto encontró y corrigió 4 bugs de fidelidad reales que una revisión manual del SQL no habría detectado:
- El nombre de marca se extraía en mayúsculas (de la tarjeta del grid, `<h3>NUTFRUIT</h3>`) y se reusaba tal cual en `<title>`/JSON-LD/`<h1>`, cuando el patrón real en 16 de los 19 casos es mostrar el nombre en mayúsculas **solo** en la tarjeta del grid y con su case natural (`Nutfruit`, `TravelPerk`, `iVentions`) en el resto. Corregido extrayendo el nombre del `<title>` en vez del `<h3>`, y quitando el `.toUpperCase()` forzado del `<h1>` del generador.
- El tamaño de fuente de los números de KPI en el generador (`text-4xl sm:text-6xl`) era en realidad el del caso minoritario (3 de 19); el patrón dominante (15 de 19) es `text-5xl sm:text-6xl`. Corregido al valor mayoritario.
- Faltaba la clase `reveal-group` en el contenedor del hero (presente en 16 de 19 casos), que agrupa el `<p>`/`<h1>` para que su animación de scroll-reveal salga escalonada (`src/main.js`, `initGsapAnimations`) en vez de cada uno por separado — sin ella el efecto sigue funcionando pero pierde el escalonado.
- El avatar de los testimonios llevaba `alt="Logo"` genérico en vez de `alt="Logo de <marca>"`.
- Se corrigió también el orden de los `<script type="application/ld+json">` (Organization antes que CreativeWork, como en el original) por limpieza, aunque no afecta a nada funcional.

**Detalle conocido, no corregido a propósito:** el logo de Velites y el avatar del testimonio de TravelPerk dependían de un filtro CSS `invert` puntual (imágenes de logo en blanco pensadas para fondo oscuro) que la plantilla generada no reproduce — quedarán con mal contraste hasta que se suba una versión oscura del logo desde `/casos-admin`. Documentado en el propio seed SQL. Añadir un campo `invert` al esquema por 2 casos de 19 (y 2 de 38 usos de logo) se consideró sobre-ingeniería para el problema real.

**Afecta:** `supabase/migrations/0008_case_studies.sql` y `0009_case_studies_seed.sql` (nuevos), `scripts/generate-case-studies.mjs` (nuevo), `casos-admin.html` + `src/casosAdmin.js` (nuevos), `casos-de-exito.html` (marcadores `CASOS_GRID_START/END` y `CASOS_FILTERS_START/END`), los 19 `caso-*.html` (pasan a ser artefactos auto-generados, marcados con un comentario al principio), `vite.config.js`, `public/robots.txt`, `src/dashboardShell.js` (nav item + icono `trophy`), `package.json` (`predev`/`prebuild`), `supabase/README.md` y `.env.example` (Deploy Hook), `.claude/project-context.md` (convención de páginas auto-generadas).

**Pendiente del lado del usuario (no soy yo quien lo ejecuta):** correr `0008_case_studies.sql` y `0009_case_studies_seed.sql` en el SQL Editor de Supabase (mismo flujo manual que las migraciones anteriores — no tengo acceso MCP a este proyecto concreto de Supabase, está en otra cuenta/organización), y crear el Deploy Hook de Vercel + variable `VITE_DEPLOY_HOOK_URL` (ver `supabase/README.md`, paso 13) para que guardar/eliminar un caso dispare el redeploy automáticamente.

**Verificado en local:** `npm run build` sin errores con `casos-admin` como entrada nueva de Rollup; el `predev`/`prebuild` falla con gracia y sin tocar ningún fichero cuando la tabla `case_studies` aún no existe (confirmado, ya que la migración no se ha corrido todavía). `casos-admin.html` carga correctamente y muestra la vista de login compartida (mismo componente que `/admin`/`/ofertas`). `casos-de-exito.html` y las páginas de detalle existentes siguen intactas (19 tarjetas, 9 pills de filtro) mientras la tabla no exista. La lógica de generación se verificó de forma exhaustiva mediante el arnés de prueba descrito arriba, con diffs prácticamente idénticos (solo diferencias de whitespace/comentarios decorativos y la descripción meta, ver más abajo) contra `caso-nutfruit.html` (caso simple), `caso-travelperk.html` (2 KPIs + 1 testimonio) y `caso-bobo.html` (2 testimonios).

**Limitación aceptada:** la meta description y el `about` del JSON-LD de cada caso se generan a partir del campo "descripción" (truncado a 300 caracteres), no de un resumen SEO redactado a mano con cifras concretas como tenían las páginas originales — el pedido del usuario no incluía un campo de meta description aparte, y añadirlo sin que lo pidieran habría sido alcance de más. Si se quiere igualar la calidad SEO original, es una mejora sencilla de añadir más adelante (un campo opcional más en el formulario).

---

## 2026-08-05 — Resuelto conflicto de merge en la rama del vídeo de Nuestra Historia

**Qué:** la rama `design/actualizar-video-nuestrahistoria` se creó desde `main` antes de que se mergearan la PR #26 (cursor personalizado) y todo el trabajo posterior (CRUD de Casos de Éxito desde el dashboard, fix del cursor invisible en el dashboard, sección de anillo en Influencer Marketing, entre otros — ver entradas anteriores). Al mergear `origin/main` en esta rama para traer esos cambios, único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (la entrada de esta rama sobre el vídeo actualizado vs. todas las entradas ya en `main` desde la resolución del PR #26 en adelante). Se conservaron todas, en orden cronológico. Ningún otro fichero tuvo conflicto real.

**Por qué:** el usuario reportó no ver el cambio del cursor en local; la causa era que esta rama no lo tenía todavía.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** tras el merge, `npm run dev` arranca correctamente (el `predev` nuevo, `generate-case-studies.mjs`, falla con gracia por falta de tabla/Node 20, como está documentado, sin bloquear Vite); confirmado en el navegador que `.custom-cursor`/`.cc-dot` existen y `cursor: none` está aplicado en `/index.html`; sin marcadores de conflicto restantes en ningún fichero (`grep` limpio). Sin errores de consola nuevos.

---

## 2026-08-06 — Reordena el CTA "El crecimiento real empieza..." en el home

**Qué:** en `index.html`, se movió la sección completa del CTA ("El crecimiento real empieza con una buena conversación." + fondo WebGL `#home-blackhole` + botón "SOLICITA UNA CONSULTORÍA") de su posición original (justo antes del footer, al final de la página) a justo antes de la sección "Why Us" ("No lo hacemos como los demás. Y por eso funciona."). Movimiento de bloque completo, sin cambios de contenido ni de estilos; `#home-blackhole` es autónomo (`src/home-blackhole.js` solo busca el elemento por id y no depende de su posición en el DOM), así que el cambio de orden no requirió tocar JS.

**Por qué:** petición explícita del usuario.

**Afecta:** `index.html` únicamente.

**Verificado en local:** preview con `npm run dev`; confirmado por `querySelectorAll('section')` que la sección del CTA precede inmediatamente a la de "Why Us"; confirmado también en el texto renderizado de la página (`get_page_text`) que ambos bloques aparecen consecutivos en ese orden. Sin errores de consola nuevos.

---

## 2026-08-05 — Efecto liquid glass en tarjetas de servicios + reducción del wiggle de "Plataformas que dominamos"

**Qué:** en `publicidad-en-medios.html` (sección "Plataformas que dominamos"), se redujo la amplitud y se ralentizó la duración del balanceo vertical continuo de cada tarjeta (`wig: [amplitud, duración]` en `src/platform-carousel.js`): de un rango de 5-8px/2.6-3.9s a uno de 2-3.5px/3.6-4.6s (amplitud máxima reducida en torno a un 55%). El fallback CSS de `--wig-a`/`--wig-dur` en `src/style.css` también se ajustó a los nuevos valores por defecto.

El efecto de vidrio esmerilado con tinte de marca que ya usaban esas tarjetas (`.platform-card-inner:hover`, con `color-mix()` sobre `--brand`) se extrajo a dos clases CSS reutilizables en `src/style.css`: `.brand-glass-card` (fondo negro sólido en reposo + vidrio esmerilado al hover — misma variante que las tarjetas de plataformas) y `.brand-glass-hover` (igual pero sin forzar el fondo negro en reposo, para tarjetas sobre fondo claro). Se aplicaron a:
- Las 4 tarjetas de "¿Qué podemos hacer por tí?" en `gestion-de-redes.html` y en `automatizacion-de-procesos.html`, sustituyendo el efecto anterior (borde con gradiente cónico girando + `box-shadow` de brillo) por el vidrio esmerilado, y simplificando la estructura de 3 divs anidados por tarjeta a un único div.
- Las 4 tarjetas de "Nuestros Valores" en `manifesto.html`, sustituyendo el `hover:bg-black` plano + `hover:rotate-2` por el mismo vidrio esmerilado, conservando el fondo claro (`bg-gray-50`) en reposo.

**Ajuste tras feedback visual del usuario (mismo día, antes de commitear):** la primera versión usaba `color-mix()` sobre un `--brand` por página (`#00c7e6` en las de servicio, `#4889eb` en manifesto, igual que el carrusel de plataformas) y dejaba el borde transparente en reposo. El usuario probó el resultado en local y pidió quitar "los colores raros" del hover y recuperar el reborde claro que las tarjetas tenían antes en reposo (en vez del negro sin borde que quedaba). Se corrigió: `.brand-glass-card`/`.brand-glass-hover` dejaron de depender de `--brand` — su hover ahora usa un tinte neutro blanco/gris (`rgba(255,255,255,.08-.22)` sobre `rgba(10,10,10,.55)`, sin `color-mix`) y llevan un `border-color` visible en reposo: blanco translúcido (`rgba(255,255,255,.3)`) para las tarjetas sobre fondo negro, gris (`rgba(0,0,0,.12)`) para las de manifesto sobre fondo claro. `.platform-card-inner` (el carrusel de plataformas) no se tocó — conserva su color por plataforma, que sí era el comportamiento deseado ahí. Se quitó el `style="--brand:...` inline de las 12 tarjetas afectadas al quedar sin uso.

**Por qué:** petición explícita del usuario: el balanceo permanente de las tarjetas de plataformas resultaba demasiado llamativo, y quería extender ese mismo efecto de vidrio a otras tarjetas del sitio para dar consistencia visual entre secciones/servicios — pero en su versión neutra/gris, no con los colores de marca del carrusel.

**Afecta:** `src/style.css`, `src/platform-carousel.js`, `gestion-de-redes.html`, `automatizacion-de-procesos.html`, `manifesto.html`, `.claude/project-context.md` (nueva convención `.brand-glass-card`/`.brand-glass-hover`). (Durante la verificación en local se cambió temporalmente el puerto de `vite-dev` en `.claude/launch.json` para evitar un conflicto con otra sesión — revertido antes de commitear, no forma parte de este cambio.)

**Verificado en local:** sin errores de consola nuevos en ninguna de las 3 páginas modificadas (los únicos errores presentes, `TypeError: Failed to fetch` en el handler de navegación SPA de `src/main.js`, son preexistentes y no relacionados con este cambio). Confirmado por inspección de CSSOM y estilos computados en las 3 páginas que: (1) los nuevos valores de `--wig-a`/`--wig-dur` se renderizan correctamente en `publicidad-en-medios.html`; (2) `.brand-glass-card`/`.brand-glass-hover` están presentes en las 12 tarjetas afectadas (4+4+4), sin `--brand` inline, con `border-color` visible en reposo (blanco translúcido en las de fondo negro, gris en las de manifesto) y fondo de reposo correcto; (3) al forzar `:hover` real (mouse move + espera), el gradiente de fondo pasa al tinte neutro blanco/gris esperado (sin `color-mix`), confirmado leyendo `getComputedStyle().backgroundImage`. La sesión de navegador de este agente no permitió capturas de pantalla (`the Browser pane is not displayed`), por lo que las transiciones animadas (elevación, blur) se verificaron por estado computado en vez de visualmente cuadro a cuadro — el propio usuario confirmó el resultado visual en su navegador tras el primer intento y pidió este ajuste, que quedó pendiente de una segunda confirmación suya.

---

## 2026-08-05 — Revertido el liquid glass en "Nuestros Valores" (manifesto.html), texto a negro

**Qué:** tras un segundo repaso visual, el usuario pidió quitar por completo el efecto de vidrio esmerilado de las 4 tarjetas de "Nuestros Valores" en `manifesto.html` (aplicado hace un momento en la misma sesión, ver entrada anterior) y dejarlas con su diseño original: `bg-gray-50 hover:bg-black`, `border border-gray-200 hover:border-black`, `hover:rotate-2`. Además, pidió que todo el texto (título "01. Servicio"/etc. y párrafo) pase de azul/gris a negro puro, dejando únicamente los iconos en azul. Se añadió `group-hover:text-white` al título (antes no lo tenía) para que siga siendo legible cuando el fondo cambia a negro al hover, ya que antes era azul sobre negro (buen contraste) y ahora sería negro sobre negro sin ese ajuste.

**Detalle no obvio, documentado en `project-context.md`:** los iconos (`<img class="... brightness-0 group-hover:invert">`) nunca han llegado a renderizarse en negro pese al `brightness-0` — `.fade-in-up` (para la animación de aparición al hacer scroll) fija su propio `filter: blur(...)` con la misma especificidad de selector, y gana en el cascade por orden de aparición en `style.css`. El resultado neto es que los iconos siempre se han visto en su color azul original del PNG, coincidiendo con lo que pedía el usuario sin necesidad de tocarlos.

Como `.brand-glass-hover` se queda sin ningún uso en el repo tras este revert, se eliminó por completo de `src/style.css` (no se deja como código muerto) — `.brand-glass-card` (usada en `gestion-de-redes.html`/`automatizacion-de-procesos.html`) no se tocó.

**Por qué:** feedback directo del usuario tras ver el resultado en `localhost`: quería quitar el vidrio de esta sección concreta y unificar el texto en negro, con el azul reservado solo para los iconos.

**Afecta:** `manifesto.html`, `src/style.css` (eliminada `.brand-glass-hover`), `.claude/project-context.md`.

**Verificado en local:** recargada `manifesto.html` en el servidor de desarrollo; confirmado por estilos computados que título y párrafo son `rgb(0,0,0)`, la tarjeta ya no tiene la clase `brand-glass-hover`, y el fondo/borde en reposo son los originales (`bg-gray-50`/`border-gray-200`). Sin errores de consola nuevos (los `Failed to fetch` presentes son preexistentes, ver entrada anterior).

---

## 2026-08-05 — "Nuestros Valores": título en negro y rediseño de iconos de Innovación/Resultados

**Qué:** en `manifesto.html`, el bloque de título a la izquierda de "Nuestros Valores" ("Nuestros"/"Valores" + los dos párrafos "No los repetimos porque suena bien."/"Lo vivimos cada día") pasa de azul (`text-[#4889eb]`) a negro puro. Los iconos PNG de las tarjetas 03 (Innovación, antes un icono combinado de cerebro+engranaje) y 04 (Resultados, antes un documento con signo de dólar) se sustituyeron por SVG inline minimalistas de una sola figura — una bombilla para Innovación y una flecha ascendente para Resultados — con el mismo trazo azul `#4889eb` y grosor fino que ya tenían los iconos 01 (engranaje) y 02 (círculos superpuestos), que sirvieron de referencia de estilo. Los iconos 01 y 02 no se tocaron (siguen siendo los PNG originales).

**Por qué:** petición explícita del usuario tras revisar el resultado en local: quería el texto del bloque de título también en negro (ya lo había pedido para las tarjetas en la entrada anterior), y consideró los iconos de Innovación/Resultados demasiado recargados frente a la sobriedad de los otros dos.

**Afecta:** `manifesto.html`.

**Verificado en local:** confirmado por estilos computados que los dos `<h2>` y los dos `<p>` del bloque de título, y los 4 `<h4>` de las tarjetas, son `rgb(0,0,0)`; los 2 SVG nuevos tienen sus `<path>` con `stroke="#4889eb"`. Capturas de pantalla del scroll por la sección confirman visualmente el resultado — título negro, iconos 03/04 simples y coherentes con 01/02, tarjeta en hover con texto blanco legible sobre fondo negro. Sin errores de consola nuevos.

---

## 2026-08-05 — Ajuste de grosor de trazo en los iconos nuevos de "Nuestros Valores"

**Qué:** los SVG de Innovación y Resultados (creados en la entrada anterior) usaban `stroke-width="1.5"`, visiblemente más fino que el trazo de los iconos PNG originales de Servicio/Transparencia. Se subió a `stroke-width="2.5"` en ambos SVG (las 4 `<path>` de los dos iconos) tras comparar visualmente varias capturas del navegador a distintos grosores (1.5 → 2 → 2.5) contra los iconos 01/02 en su tamaño real de render (48px).

**Por qué:** feedback directo del usuario tras ver el resultado: "se ven de distinto relleno" — el trazo más fino hacía que los iconos nuevos parecieran más débiles/ligeros que los dos originales pese a compartir color y estilo de línea.

**Afecta:** `manifesto.html`.

**Verificado en local:** comparación visual directa en capturas de pantalla de las 4 tarjetas en fila — a `stroke-width="2.5"` el peso visual de bombilla/flecha queda a la par de engranaje/círculos. Sin errores de consola nuevos.

---

## 2026-08-05 — Trazo de los iconos de Innovación/Resultados, mucho más fino

**Qué:** el `stroke-width="2.5"` de la entrada anterior resultó excesivo — el usuario lo vio "muy grueso" en el navegador. Se bajó a `stroke-width="1"` en los dos SVG (bombilla de Innovación, flecha de Resultados).

**Por qué:** feedback directo del usuario tras ver el resultado en `localhost`.

**Afecta:** `manifesto.html`.

**Verificado en local:** captura de pantalla de las 4 tarjetas — con `stroke-width="1"` el trazo queda fino y limpio. Sin errores de consola nuevos.

---

## 2026-08-05 — Unificar fondo blanco/texto negro en Publicidad en Medios

**Qué:** en `publicidad-en-medios.html`, las secciones "Impacto Real (KPIs)" ("La diferencia entre invertir en anuncios y construir resultados") y "Final CTA" ("¿Listo para dejar de quemar presupuesto...") pasaron de `bg-black`/texto blanco a `bg-white`/texto negro, dejando intactos todos los elementos azules (`#2f80ed`) del anillo, el botón y su hover.

**Por qué:** el resto de páginas de servicio (`diseno-de-marca.html`, `gestion-de-redes.html`, `email-marketing.html`, `automatizacion-de-procesos.html`) ya tenían estas dos secciones en fondo blanco/texto negro, formando una franja blanca continua hasta el final del CTA; `publicidad-en-medios.html` era la única que rompía ese patrón con fondo negro. Petición del usuario para igualarla usando `diseno-de-marca.html` como referencia.

**Afecta:** `publicidad-en-medios.html` (sección KPIs y sección Final CTA).

---

## 2026-08-05 — Resuelto conflicto de merge en el PR #32 (liquid glass en botones de servicios + wiggle del carrusel)

**Qué:** único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (las 5 entradas de este PR — liquid glass en tarjetas de servicios/valores, su ajuste de color tras feedback, el revert en manifesto.html, y los dos ajustes de grosor de trazo de iconos — vs. la entrada de "Unificar fondo blanco/texto negro en Publicidad en Medios", ya en `main`). Se conservaron todas, en orden cronológico. `publicidad-en-medios.html` y `src/style.css`, tocados por ambos lados, se automergearon sin conflicto real: cada PR editó regiones distintas del mismo fichero (el wiggle del carrusel y las clases `.brand-glass-*` por un lado, las secciones KPI/CTA por otro).

**Por qué:** petición explícita del usuario para poder mergear el PR #32.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores. Confirmado en navegador que en `/publicidad-en-medios.html` la sección KPI sigue en fondo blanco (`rgb(255, 255, 255)`, del PR ya mergeado) y el wiggle del carrusel de plataformas usa los valores reducidos (`--wig-a: 2.5px`, `--wig-dur: 4.2s`, dentro del rango nuevo); en `/gestion-de-redes.html` las 4 tarjetas `.brand-glass-card` están presentes sin `--brand` inline. Sin errores de consola en ninguna de las dos.

---

## 2026-08-06 — Cartoons de las 4 verticales junto al logo, en hover, en el home

**Qué:** en la sección "Ecosistema Immoral" del home (`#immoral-ecosystem`, los 4 logos imfashion/imfilms/imcontent/immoralia a la derecha del titular "No somos una agencia..."), se añadió el personaje/mascota ilustrado de cada vertical (aportados por el usuario en la carpeta `Cartoons/`) junto a su logo correspondiente. Cada cartoon es una `<img>` posicionada en `absolute right-full` respecto a `.brand-header` (así queda anclada verticalmente a la altura del logo, sin desplazarse cuando el acordeón de descripción se expande debajo), oculta por defecto (`opacity-0 translate-x-6 scale-90`) y revelada con una transición de 500ms (fade + slide + scale) exactamente al mismo tiempo que el acordeón se despliega hacia abajo — ambos toggles viven en los mismos listeners `mouseenter`/`mouseleave` de `initImmoralEcosystem()` (`src/main.js`), que ya controlaban el fondo, el acordeón y el brillo del logo, para garantizar la sincronía pedida sin depender de dos mecanismos distintos. Se corrigió de paso un bug que esta tarea habría introducido: el selector `item.querySelector('img')` usado para "resaltar el logo" habría capturado el nuevo cartoon (por ser ahora el primer `<img>` del contenedor) en vez del logo real; se acotó a `item.querySelector('img:not(.brand-cartoon)')`.

**Assets:** los 4 PNG originales (1080px de alto, 350-520KB cada uno, con transparencia) se redimensionaron a 700px de alto conservando el canal alfa (`public/imgs/cartoon-fashion.png`, `cartoon-films.png`, `cartoon-content.png`, `cartoon-immoralia.png`, 150-265KB cada uno).

**Por qué:** petición explícita del usuario.

**Afecta:** `index.html` (los 4 `.brand-item`), `src/main.js` (`initImmoralEcosystem`), 4 imágenes nuevas en `public/imgs/`.

**Verificado en local:** preview con `npm run dev`; confirmado visualmente con hover real (vía `computer.hover` sobre las coordenadas exactas de cada `.brand-item`, medidas con `getBoundingClientRect`) que los 4 cartoons se despliegan correctamente a la izquierda de su logo, en simultáneo con el acordeón y el cambio de fondo, para las 4 verticales. Sin errores de consola nuevos.

**Nota sobre la verificación:** durante la primera pasada, simular el hover con `dispatchEvent(new MouseEvent('mouseenter'))` y leer `getComputedStyle` inmediatamente después arrojó `opacity: 0` a pesar de que las clases correctas sí estaban aplicadas (confirmado por `classList`) — incluso forzando `!important` inline. Se descartó como bug real al reproducirse el mismo síntoma en el acordeón `.brand-body` preexistente (no tocado por este cambio) y al confirmar con elementos de control (`<div>`/`<img>` nuevos insertados en el DOM) que el motor de estilos del navegador de la sesión de pruebas funcionaba con normalidad — es decir, un artefacto puntual del entorno de automatización de esta sesión al leer estilos computados justo tras un evento sintético, no reproducible con una interacción de ratón real (`computer.hover`), que sí mostró el resultado esperado de forma consistente en las 4 verticales.

---

## 2026-08-06 — Centra los cartoons respecto a la altura del bloque desplegado completo

**Qué:** ajuste sobre el cambio anterior (cartoons de las 4 verticales en el home): el cartoon estaba centrado verticalmente respecto a `.brand-header` (solo la fila del logo), así que al abrirse el acordeón de descripción debajo, el personaje quedaba pegado arriba en vez de centrado en el bloque completo. Se movió cada `<img class="brand-cartoon">` de ser hijo de `.brand-header` a ser hijo directo de `.brand-item` (que pasa a `relative`), de forma que el `top-1/2 -translate-y-1/2` centra respecto a la altura total del ítem — que ya incluye el acordeón vía CSS grid, así que el centrado se recalcula solo, de forma animada, a medida que el acordeón se expande.

**Por qué:** feedback explícito del usuario tras el cambio anterior.

**Afecta:** `index.html` (los 4 `.brand-item`) únicamente; sin cambios en `src/main.js`.

**Verificado en local:** con hover real (`computer.hover` sobre las referencias de accesibilidad de cada logo, no coordenadas estimadas a mano) para las 4 verticales, confirmado visualmente que el cartoon queda centrado respecto al bloque completo (título + descripción + "Ver más"), no solo respecto al logo. Sin errores de consola nuevos.

---

## 2026-08-06 — Resuelto conflicto de merge en el PR #33 (reordena el CTA de crecimiento en el home)

**Qué:** único conflicto real, puramente aditivo en `.claude/TASK-LOG.md` (la entrada de este PR — mover el bloque del CTA "El crecimiento real empieza..." en `index.html` — vs. las entradas de liquid glass/wiggle y la resolución del PR #32, ya en `main`). Se conservaron todas, en orden cronológico. De paso se corrigió un desorden preexistente en el fichero: la entrada "Unificar fondo blanco/texto negro en Publicidad en Medios" se había quedado sin su línea `**Afecta:**` en su sitio (desplazada al final de la entrada siguiente por un merge anterior) — se recolocó donde corresponde. Ningún otro fichero tuvo conflicto real: este PR solo mueve un bloque dentro de `index.html`, sin relación con `publicidad-en-medios.html`, `src/style.css` ni `src/platform-carousel.js`.

**Por qué:** petición explícita del usuario para poder mergear el PR #33.

**Afecta:** `.claude/TASK-LOG.md` (único fichero con conflicto real).

**Verificado en local:** `npm run build` sin errores. Confirmado en el texto renderizado de `/index.html` que "El crecimiento real empieza con una buena conversación." aparece inmediatamente antes de "No lo hacemos como los demás. Y por eso funciona.", como se pedía. Sin errores de consola.

---

## 2026-08-06 — Hero de Automatización de Procesos: fondo shader con dithering + pixelado al mouse

**Qué:** en `automatizacion-de-procesos.html`, el iframe de Spline (robot 3D) del fondo del hero se sustituyó por un shader propio en WebGL2 puro (`src/automation-shader-scene.js`, inicializado desde `src/automatizacion-hero.js`): un "plasma" de color en movimiento (paleta negro→azul de marca `#3B82F6`→cian `#65fefa`→blanco, la misma que ya usa `design-shader-scene.js` en Diseño de Marca), cuantizado con dithering ordenado (matriz de Bayer 8x8 estándar aplicada a los 3 canales RGB), donde el cursor empuja una rejilla pequeña de desplazamiento (no un framebuffer — un `Float32Array` en JS que decae cada frame e inyecta un empuje en la celda más cercana al mouse) que curva las coordenadas de muestreo en saltos del tamaño de celda del dither — así el desplazamiento se ve a bloques/pixelado. El texto del hero (eyebrow + `<h1>` + párrafo) se pre-renderiza a un canvas 2D offscreen y se sube como textura, muestreada con esa misma coordenada curvada — por eso el pixelado también afecta al texto, no solo al fondo.

**Referencia investigada, no copiada:** el efecto está inspirado en el hero de https://codapress.co.uk/ (pedido explícito del usuario). Se inspeccionó su bundle JS (fetch de los ficheros `_astro/*.js`, no solo mirar la página) para entender la técnica real — confirmado que usan la misma idea de rejilla JS + textura RG8 + snap del offset al grano del dither — pero el shader de este repo es una reimplementación propia (ruido de plasma distinto, dither con quantize+threshold en vez de su tabla de grises más cercana, paleta de marca en color en vez de gris puro).

**Por qué:** petición explícita del usuario, con instrucción de usar GSAP. Se usa `gsap.ticker.add()` como loop de render (en vez de `requestAnimationFrame` a mano), `gsap.quickTo()` para suavizar la posición del cursor antes de inyectarla en la rejilla, y un `gsap.to(..., {repeat:-1, yoyo:true})` para una respiración lenta y constante del contraste del plasma, así el fondo nunca está del todo estático sin interacción.

**Arquitectura — por qué el texto real se pone a `opacity:0` en vez de tocar z-index:** `#spline-background` (donde vive el canvas) es `fixed -z-10`, detrás de todo el contenido (`.relative.z-10`, donde está el texto real). Poniendo el texto real a `opacity:0` (sigue en el árbol de accesibilidad y ocupa su espacio en el layout) no pinta nada, así que el canvas de detrás se ve perfectamente a través del hueco, sin tener que subir el z-index del canvas ni tocar el stacking del resto del sitio. Esto **solo se aplica si WebGL2 arranca bien** — si falla, el texto real se queda visible tal cual (nunca se oculta) y el fondo queda en negro liso, igual que el fallback ya existente en `design-shader-scene.js`. También se respeta `prefers-reduced-motion: reduce` — en ese caso no se inicializa el efecto en absoluto.

**Bug real encontrado y corregido durante la verificación:** `gsap.ticker` pasa a sus listeners los segundos transcurridos desde que arrancó el ticker global de GSAP (no desde que se creó esta escena) — en una pestaña abierta mucho tiempo ese número crece sin límite, y `sin()`/`cos()` con argumentos muy grandes pierden precisión en float32 en la GPU, degenerando el plasma a negro sólido. Se corrigió acumulando un tiempo propio a partir del `deltaTime` de cada frame y envolviéndolo cada 1000s (`elapsed = (elapsed + deltaMs/1000) % 1000`), en vez de usar el tiempo absoluto del ticker directamente.

**Afecta:** `src/automation-shader-scene.js` (nuevo), `src/automatizacion-hero.js` (nuevo), `automatizacion-de-procesos.html` (el `<iframe>` dentro de `#spline-background` se sustituye por `<div id="automation-shader">`, nada más cambia ahí), `src/main.js` (import + llamada en `initAll()`). `src/hero-animation.js` no se tocó — su transición de scroll (blur/ancho al salir del hero) sigue aplicándose igual sobre el contenedor, sea iframe o canvas.

**Verificado en local:** el panel de navegador de esta sesión no compone frames al no estar visible (mismo límite ya documentado repetidas veces en este proyecto), y adicionalmente `requestAnimationFrame`/`gsap.ticker` no llegan a dispararse solos en ese estado — así que se verificó invocando la función interna de render manualmente y leyendo píxeles en la misma ejecución síncrona (confirmado el bug de precisión de tiempo exactamente así: con un valor de tiempo pequeño el plasma se ve correctamente en la paleta azul/cian/verde esperada; con el tiempo real acumulado de esta sesión larga salía negro, lo que llevó a encontrar el bug de arriba). Se confirmó también, forzando manualmente la posición del cursor y llamando a render() varias veces: la rejilla de desplazamiento registra el empuje esperado (`dispX` no nulo en la celda correspondiente al movimiento simulado, con caída a las celdas vecinas) y decae exactamente al factor configurado (0.9 por frame). Confirmado que el texto real (`#hero-start .max-w-5xl`) queda con `opacity:0` computado tras la inicialización sin desaparecer del DOM, y que `#spline-background` sigue arrancando en `blur(10px)`/`width:1265px` (estado inicial de la transición de `hero-animation.js`, sin tocar ese fichero). `npm run build` sin errores. Sin errores de consola.

**No verificado en vivo (limitación de la herramienta, no del código):** el guard de `prefers-reduced-motion: reduce` se revisó por lectura de código (una única condición antes de crear el canvas) pero no se pudo forzar la media query en el navegador de esta sesión para confirmarlo visualmente.

---

## 2026-08-06 — Hero de Automatización de Procesos: corrección de bugs tras feedback en vivo (blur heredado, texto invertido, efecto de mouse casi imperceptible, texto recortado, opacidad de fondo)

**Qué:** ronda de fixes sobre el shader del hero de `automatizacion-de-procesos.html` (entrada anterior), todos reportados por el usuario probando el resultado real en su navegador:

1. **Texto illegible + blur al hacer scroll:** `src/hero-animation.js` (la animación de scroll de la era del iframe de Spline: `blur(10px)→blur(0px)` + ancho `100%→150%` sobre `#spline-background`) seguía aplicándose sobre el nuevo shader — el blur es incompatible con un efecto de dithering fino. Confirmado por `grep` que `automatizacion-de-procesos.html` era su único usuario (no compartido con `diseno-de-marca.html`, que usa su propio `#diseno-marca-shader` independiente). Se eliminó `src/hero-animation.js` por completo, se quitaron su import y sus dos llamadas de `src/main.js`, se renombró el contenedor `#spline-background` → `#automation-background` y se quitó la clase estática `blur-sm` (se mantuvo `scale-110`, inocua).
2. **Texto boca abajo:** `sampleText()` invertía la coordenada V (`1.0 - local.y`) asumiendo un flip que no existe — la textura se sube directamente desde el canvas 2D sin `UNPACK_FLIP_Y_WEBGL`, así que la fila 0 del canvas ya es V=0. Corregido a `vec2(local.x, local.y)`.
3. **Efecto de mouse casi no se notaba:** `sampleDisp()` mapeaba `screenPx / (uFieldSize * uCellSize)` — con `uFieldSize` (44×25) y `uCellSize` (~7px) eso solo cubre una región de ~300×175px cerca del origen; en el resto de la pantalla (la inmensa mayoría) el sampler con `CLAMP_TO_EDGE` leía siempre el mismo texel del borde, haciendo el desplazamiento prácticamente constante. Corregido a `screenPx / uResolution` (mapeo 0..1 a pantalla completa). Además, `injectField()` se llamaba con `canvas.width/height` (píxeles de dispositivo) contra `smoothedMouse.x/y` (píxeles CSS de `clientX/clientY`) — un desajuste de unidades que desalinea el efecto en pantallas con `devicePixelRatio != 1`; corregido a `injectField(container.clientWidth, container.clientHeight)`.
4. **Texto de la primera línea del `<h1>` recortado por los bordes (recuadro/máscara):** causa real: el `<h1>` usa `tracking-tight` (letter-spacing negativo, `-1.8px` en este tamaño) que `renderTextTexture()` nunca replicaba al medir/dibujar en el canvas 2D offscreen — `ctx.measureText()`/`ctx.fillText()` sin `letterSpacing` calculan el texto ~40px más ancho que el real, y al centrarlo se recorta contra los bordes del canvas/textura. Corregido fijando `textCtx.letterSpacing = style.letterSpacing` antes de medir y dibujar cada elemento. Adicionalmente, como red de seguridad para cualquier línea que aun así no quepa, las líneas de `<h1>`/`<h2>` (antes solo divididas por `<br>`, nunca envueltas) ahora también pasan por `wrapText()` por cada segmento — con la medida ya corregida, esto no cambia el resultado en este caso (las dos líneas ya caben exactas), pero evita que un futuro cambio de copy/tamaño vuelva a desbordar el canvas silenciosamente.
5. **Opacidad del fondo al 50%:** petición explícita del usuario para que el plasma/dithering se vea más sutil. Se atenúa `col` (el color del fondo, ya con paleta y dither aplicados) multiplicándolo por `0.5` **antes** de componer el texto encima — así el texto se sigue mezclando a fuerza plena (`mix(col, vec3(1.0), text.a)`) y queda igual de legible, solo el fondo se ve más oscuro/apagado.

**Por qué:** las 5 correcciones responden a tres rondas de feedback del usuario probando el resultado en su navegador real (el panel de esta sesión no compone frames visualmente, ver limitación ya documentada), más la petición explícita de atenuar el fondo.

**Limpieza:** se retiraron los dos bloques de debug temporal que se habían añadido para diagnosticar el bug del mouse (`{preserveDrawingBuffer:true}` en el contexto WebGL2, y `window.__automationDebug = {...}` al final de `createAutomationShaderScene`) — eran solo para inspección vía `gl.readPixels()` en esta sesión y no debían llegar a producción.

**Afecta:** `src/automation-shader-scene.js` (los 5 fixes + limpieza de debug), `src/main.js` (elimina import/llamadas a `initHeroAnimation`), `automatizacion-de-procesos.html` (renombra `#spline-background`→`#automation-background`, quita `blur-sm`). `src/hero-animation.js` eliminado.

**Verificado en local:** `npm run build` sin errores en ambos puntos (tras los fixes 1-4, y de nuevo tras el fix de letter-spacing). Confirmado con `getComputedStyle`/`measureText` en el navegador real (viewport 1920×1000, `lg:text-7xl`) que "Eficiencia Inteligente" mide 819.5px sin `letterSpacing` (desborda el `elRect.width` real de 779.9px, reproduciendo exactamente el bug reportado) y 779.9px con `letterSpacing` aplicado — coincide al píxel con el ancho real del elemento, confirmando la causa raíz y el fix. Los fixes 2 y 3 (flip de texto, mapeo de UV del mouse) se verificaron con el mismo método de la entrada anterior (hook temporal expuesto en `window`, invocación manual de `render()` y lectura síncrona de píxeles vía `gl.readPixels()`), confirmando que el píxel bajo un movimiento de mouse simulado cambia de color y que `dispX/dispY` en una celda lejana permanecen en `0`.

**Ajuste adicional pedido por el usuario:** el párrafo del subtexto del hero ("Diseñamos automatizaciones e inteligencia artificial...") se veía con las letras muy pegadas en el canvas — se le añadió la clase `tracking-wide` (ya usada en el eyebrow de esta misma sección) en `automatizacion-de-procesos.html`; al leer `style.letterSpacing` por elemento (fix nº4 de arriba), el canvas recoge este cambio automáticamente sin tocar `automation-shader-scene.js`.

---

## 2026-08-06 — Interacción de "red de nodos" extendida a todo el bloque negro de Nuestra Historia

**Qué:** en `nuestra-historia.html`, la animación de puntos interactiva (antes limitada a una caja fija dentro de la columna izquierda de la sección "Así nació la idea") ahora cubre como fondo las 3 secciones negras contiguas (Origen y Equipo, Immoral Statement, Más que una agencia), agrupadas en un `<div>` común hasta el borde donde empieza la sección blanca de contacto. En `src/main.js` (función `initEquipoNetwork`): el listener de ratón pasó de escuchar en el contenedor de la rejilla (bloqueado por el contenido transparente que queda por delante) a escuchar en `window` con comprobación manual de límites; se añadió un "foco" de desenfoque (`backdrop-filter: blur`) que sigue al cursor en una capa intermedia (`z-5`, entre el fondo `z-0` y el texto `z-10`) y solo se activa cuando `elementFromPoint` confirma que hay texto real bajo el cursor (párrafos, títulos, enlaces, el recuadro liquid-glass) — nunca sobre el fondo vacío de puntos; y se ajustó la densidad/tamaño de los puntos (espaciado y radios) tras varias iteraciones de feedback visual, terminando un 10% más de puntos y un 10% más pequeños respecto al ajuste base.

**Por qué:** petición del usuario para que la interacción "de bolitas" no quedara confinada a un recuadro pequeño sino que ocupara todo el espacio negro visible de la sección, con una capa de desenfoque sutil detrás del texto (sin afectar su legibilidad) y sin desenfocar las zonas vacías.

**Afecta:** `nuestra-historia.html` (estructura de las 3 secciones negras + contenedor de la red de nodos), `src/main.js` (lógica de `initEquipoNetwork`: listener de ratón, foco de desenfoque, constantes de densidad/tamaño de la rejilla).

---

## 2026-08-06 — Delimita la sección CTA "El crecimiento real empieza..." con borde y sube la opacidad base del fondo

**Qué:** en `index.html`, a la sección del CTA "El crecimiento real empieza con una buena conversación." (la que contiene `#home-blackhole`) se le añadió un borde de 1px en las 4 caras con degradado sutil azul→blanco→azul (`rgba(72,137,235,0.5)` → `rgba(255,255,255,0.5)` → `rgba(72,137,235,0.5)`, vía `border-image`) para delimitarla visualmente de las secciones vecinas. En `src/blackhole-scene.js` se bajó `BASE_DIM` de `0.9` a `0.8`, lo que sube la opacidad visible del fondo animado (el disco de acreción) en su estado de reposo, antes de que el cursor pase por encima — la interacción de fondo en sí (el brillo que sigue al mouse) no se tocó.

**Por qué:** petición explícita del usuario de reforzar la separación visual de esa sección con una línea delgada en los bordes, y de que el fondo animado se viera un poco más incluso sin hover, sin eliminar la interacción existente.

**Afecta:** `index.html` (sección CTA Home), `src/blackhole-scene.js` (constante `BASE_DIM`).

**Verificado en local:** servidor Vite en `localhost:5191` (puerto alterno porque el 5174 estaba en uso por otra sesión sobre el mismo worktree). Confirmado por `getComputedStyle` que la sección tiene `border-image-source: linear-gradient(135deg, rgba(72,137,235,0.5), rgba(255,255,255,0.5), rgba(72,137,235,0.5))` y `border-style: solid`; confirmado por fetch del módulo servido que `BASE_DIM = 0.8`. Sin errores de consola nuevos (los únicos errores presentes son de Supabase por falta de variables de entorno en local, preexistentes y no relacionados).

---

## 2026-08-06 — El grid de cubos de "Publicidad en medios" sustituye al anillo shader de "Diseño de Marca"

**Qué:** en `diseno-de-marca.html`, el fondo interactivo del hero (antes un shader WebGL2 raymarcheado en forma de anillo/escultura segmentada, paleta negro→azul→cian→blanco) se sustituyó por el mismo grid de cubos wireframe con nube de puntos brillantes que ya usa el hero de `publicidad-en-medios.html` (misma escena `three.js`, mismos colores blanco/negro, mismo comportamiento de auto-rotación y drag). `publicidad-en-medios.html` no se tocó. Se renombró el contenedor de `#diseno-marca-shader` a `#diseno-marca-cubes` y se reescribió `src/diseno-marca-hero.js` para montar `createHexCubesScene` (de `src/hex-cubes-scene.js`) en vez de `createDesignShaderScene`, replicando el wrapper de `src/publicidad-medios-cubes.js` (creación de `<canvas>`, espera de dimensiones del contenedor, `dispose()` en cleanup). El nombre de función exportado (`initDisenoMarcaHero`) y su import en `src/main.js` no cambiaron.

**Por qué:** petición explícita del usuario de llevar el elemento interactivo de "Publicidad en medios" tal cual a la sección "Diseño de Marca y Contenidos", quitando el anillo de colores. Confirmado con el usuario: duplicar el mismo grid en ambas páginas (no mover), y eliminar el shader del anillo por quedar sin uso en ninguna otra página.

**Afecta:** `diseno-de-marca.html` (id del contenedor del hero), `src/diseno-marca-hero.js` (reescrito). `src/design-shader-scene.js` eliminado (sin más referencias activas — solo quedaba mencionado en comentarios de `src/automation-shader-scene.js`, actualizados para no apuntar a un fichero inexistente).

**Verificado en local:** `npm install` (node_modules no estaba instalado en este worktree) + servidor Vite en `localhost:5174` con un `.env` local de placeholders (gitignored) para evitar el crash preexistente de `supabaseClient.js` sin credenciales reales. Confirmado vía `getElementById`/`querySelector` que ambas páginas (`diseno-de-marca.html` y `publicidad-en-medios.html`) montan un `<canvas>` con contexto `WebGL2RenderingContext` activo dentro de sus contenedores respectivos, y que la consola no registra errores nuevos tras el cambio.
