# Project Context — Immoral Group

## Site

- **Base URL**: `https://www.immoral.es`
- **Type**: Static multi-page site
- **Stack**: Vite (multi-entry build) + TailwindCSS, vanilla JS
- **Hosting**: Vercel
- **Hosting output**: `dist/` with one `.html` per page
- **URL extensions**: clean URLs (no `.html`) via Vercel `cleanUrls: true` in `vercel.json`. Vercel auto-308-redirects `/page.html` → `/page`.
- **Languages**: Spanish only (no i18n)

## Page Structure

URLs are listed below grouped by section, with recommended sitemap priority and changefreq. Public URLs are clean (no `.html`); the source file in the repo keeps the `.html` extension.

### Homepage (priority 1.0, changefreq: weekly)

- `/` ← `index.html`

### Brand & Company (priority 0.8, changefreq: monthly)

- `/nuestra-historia` ← `nuestra-historia.html`
- `/equipo` ← `equipo.html`
- `/manifesto` ← `manifesto.html`
- `/contacto` ← `contacto.html`

### Services (priority 0.8, changefreq: monthly)

- `/automatizacion-de-procesos` ← `automatizacion-de-procesos.html`
- `/diseno-de-marca` ← `diseno-de-marca.html`
- `/email-marketing` ← `email-marketing.html`
- `/gestion-de-redes` ← `gestion-de-redes.html`
- `/influencer-marketing` ← `influencer-marketing.html`
- `/publicidad-en-medios` ← `publicidad-en-medios.html`

### Case Studies Hub (priority 0.9, changefreq: weekly)

- `/casos-de-exito` ← `casos-de-exito.html`

### Case Studies (priority 0.7, changefreq: monthly)

Gestionados desde `/casos-admin` (Supabase) — esta lista es la fotografía de los 19 casos existentes en el momento de migrar a ese panel; a partir de ahora crece/decrece según lo que se añada o desactive ahí, no hace falta mantenerla a mano aquí. Ver "Páginas auto-generadas" más abajo.

- `/caso-amlul` ← `caso-amlul.html`
- `/caso-angelanavarro` ← `caso-angelanavarro.html`
- `/caso-bobo` ← `caso-bobo.html`
- `/caso-coolbottles` ← `caso-coolbottles.html`
- `/caso-gabrielforsach` ← `caso-gabrielforsach.html`
- `/caso-grupomimara` ← `caso-grupomimara.html`
- `/caso-iventions` ← `caso-iventions.html`
- `/caso-lamanso` ← `caso-lamanso.html`
- `/caso-marcawell` ← `caso-marcawell.html`
- `/caso-munkombucha` ← `caso-munkombucha.html`
- `/caso-nutfruit` ← `caso-nutfruit.html`
- `/caso-oxpertacapital` ← `caso-oxpertacapital.html`
- `/caso-oxpertaexpress` ← `caso-oxpertaexpress.html`
- `/caso-teamder` ← `caso-teamder.html`
- `/caso-thecrewel` ← `caso-thecrewel.html`
- `/caso-travelperk` ← `caso-travelperk.html`
- `/caso-vasquiat` ← `caso-vasquiat.html`
- `/caso-velites` ← `caso-velites.html`
- `/caso-wetribu` ← `caso-wetribu.html`

### Legal (priority 0.3, changefreq: yearly)

- `/aviso-legal` ← `aviso-legal.html`
- `/cookies` ← `cookies.html`
- `/privacidad` ← `privacidad.html`

## Excluded from Sitemap

- `img1.html` — test/placeholder file (591 bytes), not real content. Also disallowed in robots.txt.
- `/api/*` — backend endpoints
- `/src/*`, `/public/imgs/*`, `/public/fonts/*` — static assets

## Páginas auto-generadas (casos de éxito)

`casos-de-exito.html` (bloques entre `<!-- CASOS_GRID_START/END -->` y `<!-- CASOS_FILTERS_START/END -->`) y todos los `caso-*.html` se regeneran en cada `npm run dev`/`npm run build` a partir de Supabase (`scripts/generate-case-studies.mjs`), gestionados desde `/casos-admin`. **No editar estos ficheros a mano** — cualquier cambio se pierde en la siguiente regeneración; cada `caso-*.html` generado lleva un comentario marcador al principio para dejarlo claro. El resto de `casos-de-exito.html` (header, filtros del CTA de Behance, etc.) sí es estático y se edita normalmente.

Se eligió generar HTML estático en vez de un fetch en el navegador (como equipo/ofertas/logos) para no perder el SEO propio de cada página (title/meta/canonical/JSON-LD individuales, indexables sin JavaScript) — el coste es que un cambio guardado en `/casos-admin` tarda 1-2 minutos en publicarse (dispara un redeploy en Vercel vía Deploy Hook, ver `supabase/README.md` paso 13) en vez de verse al instante.

## Known Issues to Flag

- Internal pages have no `<link rel="canonical">` or `<meta property="og:url">` — only `index.html` does. Add canonicals (pointing to clean URLs) before submitting the sitemap to Google Search Console.
- ~1,004 internal `<a href>` links across the HTMLs still point to `/page.html`. They work via Vercel's auto-redirect (308), but adding an extra hop. Consider a future find-and-replace to update them to clean URLs.
- Sin fichero `.env` local, `src/supabaseClient.js` lanza `Error: supabaseUrl is required.` al evaluarse el módulo — al ser un throw de nivel superior en una dependencia transitiva de `main.js`, esto rompe silenciosamente `initAll()` en **todas** las páginas (no solo las que usan Supabase). Cualquier clon/worktree nuevo necesita copiar `.env.example` a `.env` antes de `npm run dev` (ver `supabase/README.md`).
- Deuda de diseño: coexisten dos sistemas de "liquid glass" en `src/style.css` — `.liquid-glass` (distorsión SVG vía `feDisplacementMap`, para paneles siempre-cristal sobre fondo fijo; requiere inyectar el `<defs>` del filtro en el `<body>` de cada página que lo usa, ver `equipo.html`/`nuestra-historia.html`) y el de las tarjetas de "Plataformas que dominamos" en `publicidad-en-medios.html` (`color-mix()` + `backdrop-filter`, pensado para transicionar de negro sólido — o de un fondo claro — a cristal-de-color por tarjeta). No se han unificado — evaluar si conviene consolidarlos la próxima vez que se toque cualquiera de los dos.
- El segundo sistema (`color-mix()` + `backdrop-filter`, antes exclusivo de `.platform-card-inner` en el carrusel de plataformas) se extrajo a una clase reutilizable en `src/style.css`, `.brand-glass-card` — mismo fondo negro sólido en reposo que las tarjetas de plataformas, pero hover en tinte neutro blanco/gris (sin `color-mix`, sin `--brand`) en vez de un color por tarjeta. Usada en las tarjetas "¿Qué podemos hacer por tí?" de `gestion-de-redes.html` y `automatizacion-de-procesos.html`. Requiere las clases utilitarias `relative overflow-hidden` en el elemento (border-radius vía Tailwind, heredado por los pseudo-elementos `::before`/`::after`). Se probó también en "Nuestros Valores" de `manifesto.html` (con una variante `.brand-glass-hover` sobre fondo claro, con `--brand` tintado azul) pero se revirtió a petición del usuario tras verlo — esa sección se quedó con su diseño original (`hover:bg-black`, sin vidrio), solo con el texto (título + párrafo) pasado a negro puro en vez del azul/gris que tenía antes; los iconos siguen en su azul natural (el filtro `brightness-0` de Tailwind en esos `<img>` no llega a aplicarse porque `.fade-in-up` fija su propio `filter: blur(...)` con la misma especificidad y gana en el cascade — no editar esa clase esperando que los iconos se vuelvan negros, es un no-op conocido). El balanceo vertical continuo (`--wig-a`/`--wig-dur`, `platform-card-wave`) sigue siendo exclusivo del carrusel de plataformas, no se extendió.

## Lastmod Strategy

Use `git log -1 --format=%cs <file>` to derive `lastmod` per page (last commit date in `YYYY-MM-DD`). This avoids the `new Date()` anti-pattern (all URLs sharing the same timestamp).
