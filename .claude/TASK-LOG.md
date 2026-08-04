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
