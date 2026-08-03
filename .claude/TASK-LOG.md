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

**Afecta:** ningún fichero modificado todavía — solo análisis. Pendiente de decisión del usuario sobre si se corrige en esta misma rama o como SPEC aparte.

---

## 2026-07-31 — Página `/logs` en el panel interno

**Qué:** nueva página `/logs` en el dashboard (visible para `admin` y `usuario`, sin controles — es de solo lectura) que renderiza en vivo el contenido de este mismo fichero. Se aclaró la regla de `CLAUDE.md`: este changelog documenta cambios de código hechos por agentes, no acciones de usuarios del panel (eso no se audita en esta app). Se añadió un renderizador markdown minimalista (`src/changelog.js`, sin librería externa) que soporta encabezados, negrita, código inline con backticks, enlaces, listas y `---` como separador — el mismo subconjunto que ya usa este archivo.

**Por qué:** petición explícita del usuario tras aclarar que "Logs" no debía ser una auditoría de acciones de usuarios, sino la superficie visible de esta misma regla de documentación.

**Afecta:** `logs.html`, `src/logs.js`, `src/changelog.js`, `src/dashboardShell.js` (nuevo item de nav), `vite.config.js`, `public/robots.txt`, `CLAUDE.md`.

**Nota de seguridad:** el contenido de `TASK-LOG.md` se compila dentro del bundle JS público de `/logs` (import `?raw` en build time). El login solo evita que un visitante normal lo vea en pantalla — no impide que el texto viaje en el JS servido a cualquiera. No escribir aquí datos de clientes, credenciales, ni nada que no deba ser públicamente inspeccionable.

---

## 2026-08-03 — Actualización del vídeo hero del home (escritorio)

**Qué:** se reemplazó el vídeo hero de escritorio de la home por un nuevo archivo aportado por el usuario, convertido de MP4 a WebM (VP9, sin audio) para alinearlo con el formato ya usado en otros vídeos del sitio (`CASOS-DE-EXITO.webm`, `CONTACTO.webm`, etc.).

**Por qué:** petición explícita del usuario de actualizar el vídeo de la home. El vídeo mobile (`home-video2-mobile.mp4`) se dejó sin tocar a petición suya.

**Afecta:** `index.html` (línea del hero de escritorio, ahora apunta a `home-video2.webm`), `public/imgs/home-video2.webm` (nuevo). El `home-video2.mp4` original queda sin usar en `public/imgs/`, igual que el patrón ya existente con `design-hover-3` (mp4 + webm, solo se referencia el webm).

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
