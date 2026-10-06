# Quinta home: Prisma

2026-10-06. Propuesta independiente pedida por el usuario: duplicar la home y rehacerla por completo con la misma información y la misma fuente, en clave clara, con el azul de marca y sin el negro de la web actual.

## Dirección

Concepto: la barra inclinada del logo es la firma. Abre la página (intro que corta la pantalla en dos por esa línea), atraviesa el hero como una barra 3D y reaparece como subrayado-firma en el titular, los servicios, el proceso y las tarjetas de casos. Solo cruza texto azul, como en el logo: sobre texto navy se leería como un tachado.

Hero: el monograma `im` (mismos trazados que `/imgs/favicon.svg`) extruido en three.js como cristal físico (transmisión, dispersión, iridiscencia) sobre un fondo de líneas que se refractan, con halo azul detrás, entorno de estudio propio, satélites, destello que recorre la barra, giro hacia el puntero, arrastre con inercia y reacción a la velocidad de scroll. Al hacer scroll el cristal se aparta y el manifiesto se revela palabra a palabra.

Paleta: base `#F4F6FB`, papel blanco, tinta navy `#0C1A3D`, azul `#1F5EFF`. Acentos de vertical solo en el ecosistema y las puertas. Las fotos de proceso (B/N oscuras) se tratan en duotono azul con `mix-blend-mode: screen`.

Tipografía: Lexend variable local, la misma de la web.

## Criterios

- CA-01: `index-prisma.html`, `src/home-prisma.css`, `src/home-prisma.js` y `src/home-prisma-hero.js` son independientes; no importan `main.js` ni `style.css`. Las variantes anteriores no se tocan.
- CA-02: se conservan textos, métricas, enlaces, testimonios, FAQ (con su JSON-LD) y footer de la home actual. Logos de clientes desde Supabase con `src/partnerLogos.js`, igual que la home.
- CA-03: predomina el claro; el único bloque de color pleno es el CTA en azul de marca.
- CA-04: `prefers-reduced-motion` desactiva intro, Lenis, revelados, cortina final, pin de razones y render continuo (el botón flotante de pausa se retiró en v3); sin WebGL hay un SVG de respaldo. Si la pestaña carga en segundo plano, la intro se salta.
- CA-05: navegación con teclado (dropdowns con `aria-expanded`, acordeones con `inert`, slider con botones), sin desbordamiento horizontal en móvil (comprobado a 375 px).
- CA-06: `noindex,follow` y canonical a la home real. No se publica.

## Dependencias

- Añade `lenis` (scroll suave compatible con `position: sticky`; `ScrollSmoother` rompe los sticky).

## Historial

v1: construcción y revisión visual en escritorio (1440×900) y móvil (375×812).

v2 (2026-10-06): se quitan los eyebrows (kickers numerados) de todos los títulos; el hero pierde el bloque meta, el "Arrastra el cristal" y la etiqueta "Arrastra" del cursor; la barra de logos pasa a ir justo antes del ecosistema; se eliminan los personajes que seguían al cursor en el ecosistema; "Servicios" se integra dentro de "Por dónde entras" con el título en tamaño menor (`h2--sm`); el bloque final (`.talk`) ocupa el alto de pantalla, con campo de líneas al 22 % de opacidad, y entra con una cortina (`pin` de `#puertas` + `clip-path` redondeado en scrub) como la landing de imbooking. Con `prefers-reduced-motion` o alto < 600 px no hay cortina.

v3 (2026-10-06): se quita el botón flotante de pausa; el monograma `im` ya no se mueve con el scroll (solo reacciona al puntero y al arrastre) y la barra azul va dentro de su mismo grupo 3D, así que gira con él; el badge circular sube (26 %); títulos de sección más pequeños; se elimina la sección "Misma casa, equipos distintos"; los títulos de los servicios pasan a peso 300 y menor tamaño; "Cinco razones" queda fijada en pantalla con las tarjetas centradas, apareciendo una a una con el scroll (estático con reduced motion o alto < 640 px).

v4 (2026-10-06): el `im` vuelve a moverse, pero solo entre dos posiciones compuestas (hero / manifiesto) con un tween de 1,5 s al entrar el manifiesto, sin scrub. La barra de logos deja de pausarse y de reaccionar al ratón. En "Por dónde entras" cada puerta baraja imágenes provisionales en duotono azul (mismo tratamiento que "Cómo lo hacemos") que frenan hasta la última; en táctil se abre al centrarla. "Cómo lo hacemos" queda oculta con `hidden` (no borrada). "Cinco razones" tiene un fondo distinto por razón (contabilidad, plano con ruta, diana, convergencia, trama de puntos). Resultados rehecho: cifras partidas por la línea del logo que encajan y cuentan con el scroll; casos repartidos desde un mazo, en duotono azul que se revela a color en hover, con inclinación 3D y una línea que cruza los tres. Testimonios pasan a nube de 12 burbujas alrededor del título (3 originales accesibles + 9 copias decorativas, sin dos iguales contiguas), que se despliegan en hover; en móvil, lista de los 3 originales.

v5 (2026-10-06): barajado de las puertas más corto en la frenada (≈0,85 s en total). Hero más corto (215vh) y el botón "Solicita tu auditoría" se mantiene en la fase del manifiesto. "Cinco razones": se quitan los fondos de sección y cada tarjeta lleva su textura (contabilidad con barras, papel milimetrado con ruta, diana, rayos que convergen, trama de puntos). Resultados: entra como cortina sobre la última pantalla (retenida) del pin de razones; las cifras aparecen de una en una en el centro, se colocan y terminan las tres juntas; después, galería horizontal fijada con los 6 primeros casos activos de Supabase (`case_studies` por `position`, mismo origen que /casos-de-exito), con su portada y su vídeo `/videos/casos/<slug>.mp4` en hover; el marcado estático es el respaldo. Testimonios: globo 3D invisible (15 burbujas en una esfera de Fibonacci, copias repartidas para maximizar la distancia entre iguales) que gira y se para en hover; el contenido de las burbujas del fondo baja de opacidad, la forma no; título más pequeño.

v6 (2026-10-06): intro sin logo: la línea se dibuja al instante (0,75 s) y la página se abre en cuanto el 3D está listo (máx. 1,6 s). Hero 250vh: más recorrido para el paso al manifiesto, el mismo para sus palabras. Barajado de puertas con la frenada al 65 %. Se elimina la cortina; la entrada a Resultados es el título "Resultados" escalado ~90× desde el palo de su R (calculado en canvas con la fuente real), que cubre la pantalla de navy y se encoge hasta su sitio. Cifras centradas en pantalla, sin línea de corte y más pequeñas en su posición final; los contadores se reescriben también en update/refresh del ScrollTrigger (el refresh restaura el progreso sin callbacks). El enlace de cabecera pasa a botón outline. Galería con título "Nuestros casos de éxito" encima; el hover mantiene el duotono azul (también el vídeo) y se quitan los números. Razones con números rellenos. Testimonios: burbujas más rectangulares y títulos menores; entrada fijada en la que primero se ve solo el título y luego se forma el globo.

v7 (2026-10-06): hero a 340vh; el titular sale por completo (0–0,37) antes de que entre el manifiesto (0,36–0,5) y las palabras mantienen su ritmo (0,48–0,86). Líneas del fondo del hero más finas y claras. Puertas con 4 imágenes cada una (aterriza en ~0,3 s). Resultados vuelve a entrar como cortina (como el CTA) sobre la última pantalla retenida de razones, y lo que sube es el título gigante, que después se encoge. Casos: sin línea que los cruza y sin capa de revelado; el vídeo arranca directamente sobre la portada (su primer fotograma) en el mismo duotono.

v8 (2026-10-06): casos: al reproducirse el vídeo la portada se oculta del todo (las dos capas en `screen` se sumaban). Se quita la barra de progreso bajo la galería. Servicios: fuera la banda sobre toda la frase y el desplazamiento en hover; cinco títulos cuentan una mini historia: frase inicial con una parte tachada (aria-hidden) que se pliega mientras entra la real, empujando el resto ("Más ventas con ~~más~~ → la misma inversión", "Una marca que ~~sea bonita~~ → se reconozca", "Redes que traigan ~~seguidores~~ → clientes", "Que ~~vean~~ → hablen de tu producto", "Aparecer ~~solo~~ cuando te buscan"); se reproduce al entrar en pantalla y otra vez en hover. Sin JS o con reduced motion solo se ve la frase final.

v9 (2026-10-06): servicios en CSS puro: la parte tachada se ve siempre (tachada) y la frase real se abre a su lado solo en hover, foco o con la fila abierta (`inline-grid` 0fr → 1fr). Se elimina el JS de los intercambios. El nombre accesible sigue siendo la frase final (lo tachado es aria-hidden).

v10 (2026-10-06): servicios: en reposo la frase inicial se lee limpia, sin tachar; en hover (foco o fila abierta) se dibuja el tachado y, 0,3 s después, se abre la frase real al lado.
