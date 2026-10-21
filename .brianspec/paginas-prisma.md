# Páginas internas con el diseño Prisma

2026-10-20. El diseño de la home exploratoria Prisma (`index-prisma.html`, ver `home-prisma.md`) quedó aprobado y se extiende al resto de la web, empezando por "Quiénes somos": `/nuestra-historia` y `/equipo`.

## Arquitectura

- `src/home-prisma.css`: tokens, tipografía, botones, nav, footer y bloque de cierre (`.talk`). Lo cargan la home y todas las páginas internas.
- `src/prisma-pages.css`: componentes de las páginas internas (hero de página, origen, statement, pilares, valores, filas del equipo, ofertas).
- `src/prisma-site.js`: comportamiento común de las páginas internas: Lenis, grano, nav y menú móvil, progreso de scroll, cursor, botones magnéticos, revelados (`data-split`, `data-reveal`, `data-scrub-words`, `data-batch`), acordeones, campo de líneas y apertura del bloque de cierre. Es el mismo comportamiento que `src/home-prisma.js`; la home conserva su propia copia de momento (deuda: unificarla cuando el resto de páginas esté migrado).
- `src/page-*.js`: lo específico de cada página.
- Nav, menú móvil y footer son HTML estático copiado de `index-prisma.html` (convención del proyecto: sin componentes). Al cambiarlos hay que actualizar todas las páginas Prisma.

## Quiénes somos

- `/nuestra-historia` unifica Historia y Manifiesto con el texto de «Immoral_Quienes-somos_texto-unificado.pdf» (octubre 2026). Se mantiene la URL de Historia; `/manifesto` (y `/manifesto.html`) redirigen con 301 en `vercel.json`, sale de `vite.config.js` y de `public/sitemap.xml`, y del menú "Quiénes somos" (ahora: Nuestra historia, Equipo).
- Los cuatro puntos de "No queremos ser una agencia" usan iconos SVG de línea propios en lugar de `ico-historia-1..4.png` (64 px, se pixelaban al tamaño del diseño nuevo).

## Equipo

- Las personas siguen viniendo de Supabase (`team_members`: `name`, `role`, `image_url`, `row_number`, `position`, `is_active`) y se gestionan desde el panel `/admin`, sin cambios: `row_number` decide la fila (1 o 2) y `position` el orden. Las fotos se sirven desde Storage (`team-photos`).
- Ofertas activas desde `job_openings` (`title`, `icon_url`, `slug`), enlazando a `/oferta.html?slug=…`. Sin ofertas activas la sección no se muestra.
- Las dos filas se desplazan en sentidos opuestos, aceleran con el scroll y se detienen al pasar el ratón (aparecen nombre y cargo). Con `prefers-reduced-motion` las filas quedan estáticas con scroll horizontal.

## Contacto

- `/contacto` mantiene el contrato del formulario centralizado (ver `docs/ARQUITECTURA-CONTACTO-CENTRALIZADO.md`): `form#contactForm` con `nombre`, `email`, `empresa` y `mensaje`, `#formStatus` y `#submitBtn`; envío con `src/contactForm.js` (token `contacto-web-immoral`, gestionado en `/tokens`, y reCAPTCHA v3 `contact_form`). Verificado interceptando la petición en el navegador (sin enviar mensajes reales): mismo payload, mismas respuestas de éxito y error.
- Calendario de `discover.immoral.es`, mapa de Barcelona, oficinas de España y Argentina, FAQ con su JSON-LD. El footer va sin su bloque de CTA ("Hablemos"), que en esta página sería redundante.

## Detalle compartido (v2)

- Entrada de página con la línea de la marca (versión corta de la intro de la home).
- Líneas del hero en canvas que se curvan bajo el puntero, como el fondo de la home.
- Tarjetas repartidas en abanico (`data-deal`), pila fijada de "Cinco razones" (`data-stack`), logo del footer que se dibuja con el scroll.

## Heros y escala tipográfica (v3, 2026-10-21)

- Ningún título de las páginas internas supera la línea del manifiesto de la home (`.manifesto__lead`: 26–52 px, 700, −0.04em). Clase `prisma-page` en el `body`, variable `--t-title`. Lo grande es la imagen, no el texto.
- Cada página tiene su propio hero, no una plantilla común:
  - Historia (`.hero-story`): la barra de la marca cruza la pantalla por detrás del personaje, se inclina con el puntero; título abajo a la izquierda, nota al margen derecho.
  - Equipo (`.hero-team`): nube de fotos reales de `team_members` con profundidad (`--d`) y parallax, título centrado; el cursor muestra el nombre.
  - Contacto (`.hero-contact`): el personaje saludando y dos tarjetas de elección (llamada / escribir) en el lenguaje de las tarjetas de la home.
- Entrada común: `heroIn()` en `src/prisma-site.js` (`data-hero`, `data-hero-title`, `data-hero-fade`, `data-hero-pop`); líneas de fondo con `data-hero-lines` (+ `data-lines-x/y`).

## Criterios

- CA-01: las páginas internas no importan `main.js` ni `style.css`.
- CA-02: `npm run build` no se rompe; las páginas siguen indexables (canonical propio, sin `noindex`).
- CA-03: sin desbordamiento horizontal a 375 px; hero sin cortar contenido a 1280×760.
- CA-04: `prefers-reduced-motion` desactiva Lenis, revelados, filas en movimiento y apertura del bloque de cierre.

## Pendiente

- El logo del nav enlaza a `/`, que hoy sigue siendo la home antigua (`index.html`) hasta que Prisma pase a ser la home.
- Las páginas de casos que genera `scripts/generate-case-studies.mjs` y las páginas antiguas aún enlazan a `manifesto.html`; la redirección 301 las cubre hasta migrarlas.
