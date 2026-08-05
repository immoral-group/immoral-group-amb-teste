import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Galería de vídeos con scroll 3D en diseno-de-marca.html: cada vídeo parte
// del centro de la pantalla (lejos, en el eje Z) y viaja hacia la cámara y
// hacia afuera SIN detenerse — sigue creciendo/desplazándose hasta salir de
// los límites de la pantalla (el propio overflow-hidden de la sección lo
// recorta), en vez de quedarse parado en una posición final fija. En mobile
// se simplifica a una lista vertical normal (sin pin ni 3D) por
// rendimiento/estabilidad de scroll-jack.
//
// Los items se generan aquí en vez de escribirlos a mano en el HTML: son
// puramente decorativos (aria-hidden) y hay muchos más instancias que clips,
// así que tenerlos en JS permite ajustar cantidad/tamaño/trayectoria en un
// único sitio. Al reutilizar las mismas 5 URLs el navegador las cachea, así
// que 14 elementos siguen costando solo 5 descargas.
//
// Notas técnicas (dos bugs reales que costaron encontrar):
//  1. El trigger NO se fuerza a una altura manual (ej. 400vh) — se deja que
//     ScrollTrigger cree su propio spacer a partir de `end`. Forzar una altura
//     manual además de pin:true duplicaba el espacio reservado y dejaba un
//     bloque "fantasma" tras el des-pineado que se solapaba con la siguiente
//     sección, descuadrando todo el layout.
//  2. NUNCA llamar a ScrollTrigger.refresh() dentro del callback de
//     gsap.matchMedia(): re-evalúa las media queries a mitad del setup y puede
//     acabar aplicando la rama equivocada (se vio la rama mobile activa a
//     1280px de ancho). Para el orden de refresh entre secciones pineadas se
//     usa `refreshPriority` + el orden de init en main.js, no un refresh manual.
//  3. Los colores/bordes de los decorativos van en estilo inline, no en clases
//     de Tailwind: se comprobó que una clase de opacidad arbitraria escrita aquí
//     (`bg-white/[0.03]`) NO llegaba al CSS compilado, dejando los marcos sin
//     relleno. Las clases estructurales sí funcionan (`aspect-[9/16]` se genera
//     bien), pero para valores puntuales de elementos creados en runtime el
//     estilo inline evita depender del escaneo del JIT.

const CLIPS = [
    '/page-diseno/diseno-scroll-1.webm',
    '/page-diseno/diseno-scroll-2.webm',
    '/page-diseno/diseno-scroll-3.webm',
    '/page-diseno/diseno-scroll-4.webm',
    '/page-diseno/diseno-scroll-5.webm',
];

// En mobile solo se muestran los primeros N (una vez cada clip): la lista
// vertical no gana nada con repetirlos y evita 14 vídeos decodificando a la vez.
const MOBILE_COUNT = CLIPS.length;

// Una entrada por instancia: ancho (vw), orientación, dirección de salida
// (fracción del viewport) y rotación. El nº de instancias = longitud del array.
//
// Los 5 clips son 1920x1080 (horizontales); las instancias marcadas como
// `portrait` los encajan en un contenedor 9:16 y el object-cover del <video>
// recorta los lados. Sus anchos son mucho menores que los horizontales porque
// la altura crece con el ancho (9:16 -> alto = ancho * 16/9): a 22vw en un
// viewport 1280x720 ya ocupa ~70vh de alto.
const ITEMS = [
    { width: 44, dx: -0.95, dy: -0.55, rotate: -6 },
    { width: 21, portrait: true, dx: 0.95, dy: -0.6, rotate: 7 },
    { width: 38, dx: -0.9, dy: 0.65, rotate: 4 },
    { width: 32, dx: 0.9, dy: 0.55, rotate: -5 },
    { width: 50, dx: 0.35, dy: -0.9, rotate: -4 },
    { width: 23, portrait: true, dx: -0.5, dy: -0.95, rotate: 8 },
    { width: 34, dx: 0.55, dy: 0.9, rotate: -7 },
    { width: 18, portrait: true, dx: -0.95, dy: 0.15, rotate: -3 },
    { width: 40, dx: 0.9, dy: -0.2, rotate: 5 },
    { width: 24, portrait: true, dx: 0.15, dy: 0.95, rotate: 2 },
    { width: 47, dx: -0.7, dy: -0.8, rotate: 6 },
    { width: 19, portrait: true, dx: 0.75, dy: 0.75, rotate: -8 },
    { width: 42, dx: -0.25, dy: 0.95, rotate: 3 },
    { width: 36, dx: 0.95, dy: -0.85, rotate: -2 },
];

// Elementos decorativos que vuelan por el mismo espacio 3D que los vídeos para
// que el scroll no se sienta vacío entre uno y otro: partículas (puntos) y unos
// marcos translúcidos, en la línea de los "shapes" del portfolio de referencia.
// Solo en desktop — en mobile la sección es una lista vertical simple.
const PARTICLE_COUNT = 30;
const FRAME_COUNT = 6;

// PRNG con semilla en vez de Math.random(): así el campo de partículas es
// idéntico en cada carga y en cada re-init de la navegación SPA (si no, cada
// re-ejecución de initAll recolocaría todo y se vería un salto).
function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Radia cada elemento en un ángulo distinto para repartirlos en 360°.
function radialDirection(index, count, rng) {
    const angle = (index / count) * Math.PI * 2 + (rng() - 0.5) * 0.6;
    const reach = 0.75 + rng() * 0.55;
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach };
}

function buildDecor(stage) {
    const rng = makeRng(20260805);
    const frag = document.createDocumentFragment();
    const created = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'dsv-decor absolute top-1/2 left-1/2 rounded-full pointer-events-none';
        const size = 2 + Math.round(rng() * 5);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        // Un tercio en el azul de marca, el resto en blanco. Los colores van
        // inline y no como clases de Tailwind: son valores decorativos de un
        // elemento generado en runtime, y así no dependen de que el JIT los
        // detecte al escanear este fichero (ver nota 3 de la cabecera).
        el.style.backgroundColor = i % 3 === 0 ? '#4889eb' : '#ffffff';
        el.setAttribute('aria-hidden', 'true');

        const dir = radialDirection(i, PARTICLE_COUNT, rng);
        created.push({ el, ...dir, depth: -1900 + rng() * 900, peak: 0.15 + rng() * 0.35 });
        frag.appendChild(el);
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
        const el = document.createElement('div');
        // Sin backdrop-blur a propósito: son 6 elementos en movimiento sobre una
        // escena que ya reproduce 14 vídeos, y el blur de fondo animado es de lo
        // más caro que hay. Sobre el negro, borde + relleno muy tenue ya lee
        // como marco de cristal.
        el.className = 'dsv-decor absolute top-1/2 left-1/2 rounded-2xl pointer-events-none';
        const size = 9 + rng() * 8;
        el.style.width = `${size.toFixed(1)}vw`;
        el.style.height = `${(size * (0.7 + rng() * 0.6)).toFixed(1)}vw`;
        el.style.border = '1px solid rgba(255,255,255,0.1)';
        el.style.backgroundColor = 'rgba(255,255,255,0.03)';
        el.setAttribute('aria-hidden', 'true');

        const dir = radialDirection(i, FRAME_COUNT, rng);
        created.push({ el, ...dir, depth: -1500 + rng() * 700, peak: 0.2 + rng() * 0.25 });
        frag.appendChild(el);
    }

    stage.appendChild(frag);
    return created;
}

function buildItems(stage) {
    const frag = document.createDocumentFragment();
    const created = [];

    ITEMS.forEach((data, i) => {
        const wrapper = document.createElement('div');
        // Las dos variantes se escriben como cadenas literales completas para
        // que el JIT de Tailwind las detecte al escanear este fichero.
        wrapper.className = data.portrait
            ? 'dsv-item relative md:absolute w-full md:w-auto md:top-1/2 md:left-1/2 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl'
            : 'dsv-item relative md:absolute w-full md:w-auto md:top-1/2 md:left-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl';

        const video = document.createElement('video');
        video.className = 'w-full h-full object-cover';
        video.src = CLIPS[i % CLIPS.length];
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('aria-hidden', 'true');

        wrapper.appendChild(video);
        frag.appendChild(wrapper);
        created.push(wrapper);
    });

    stage.appendChild(frag);
    return created;
}

export function initDisenoScrollVideos() {
    const pinSection = document.getElementById('dsv-pin');
    const stage = document.getElementById('dsv-stage');
    if (!pinSection || !stage) return;

    // initAll() puede re-ejecutarse en la navegación tipo SPA de este sitio
    // (ver updateDOM en main.js), así que se parte siempre de cero.
    stage.innerHTML = '';
    // Los decorativos van primero en el DOM para quedar por detrás de los
    // vídeos cuando dos elementos coinciden en Z.
    const decor = buildDecor(stage);
    const items = buildItems(stage);
    if (items.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
        items.forEach((item, i) => {
            gsap.set(item, {
                width: `${ITEMS[i].width}vw`,
                xPercent: -50,
                yPercent: -50,
                x: 0,
                y: 0,
                z: -1600,
                scale: 0.25,
                opacity: 0,
                rotateZ: 0,
            });
        });

        // stagger bajo respecto a flightDuration = más vídeos solapados en
        // pantalla a la vez (≈ flightDuration / stagger).
        const stagger = 0.18;
        const flightDuration = 0.9;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: pinSection,
                start: 'top top',
                // Más recorrido de scroll para la misma animación = los vídeos
                // se desplazan más despacio.
                end: '+=320%',
                scrub: 0.4,
                pin: true,
                anticipatePin: 1,
                // Esta sección va antes en el DOM que la de "Cómo lo hacemos"
                // (que también está pineada). Sin un refreshPriority mayor,
                // esa otra sección calcula su rango antes de que el spacer de
                // este pin exista y ambas terminan solapándose a mitad de
                // scroll (ver nota de la cabecera).
                refreshPriority: 1,
            },
        });

        items.forEach((item, i) => {
            const data = ITEMS[i];
            const start = i * stagger;

            // Salida muy por fuera del viewport (150% de su mitad, en ambos
            // ejes) y con mucho z positivo — pasa muy cerca de la cámara y
            // sigue hasta desaparecer, en vez de frenar en un punto medio.
            tl.to(item, { opacity: 1, duration: flightDuration * 0.12 }, start)
                .to(item, {
                    z: 900,
                    x: () => window.innerWidth * data.dx * 1.5,
                    y: () => window.innerHeight * data.dy * 1.5,
                    scale: 2.4,
                    rotateZ: data.rotate * 2,
                    duration: flightDuration,
                    ease: 'power1.in',
                }, start);
        });

        // Los decorativos se reparten por TODA la duración del timeline de los
        // vídeos (no con el mismo stagger), para que siempre haya partículas en
        // vuelo rellenando los huecos entre un vídeo y el siguiente.
        const videoTimeline = (items.length - 1) * stagger + flightDuration;
        const decorFlight = 1.1;
        const decorSpread = Math.max(videoTimeline - decorFlight, 0.1);

        decor.forEach((d, i) => {
            const start = (i / Math.max(decor.length - 1, 1)) * decorSpread;

            gsap.set(d.el, { xPercent: -50, yPercent: -50, x: 0, y: 0, z: d.depth, scale: 0.4, opacity: 0 });

            tl.to(d.el, { opacity: d.peak, duration: decorFlight * 0.15 }, start)
                .to(d.el, {
                    z: 1000,
                    x: () => window.innerWidth * d.dx,
                    y: () => window.innerHeight * d.dy,
                    scale: 1.6,
                    duration: decorFlight,
                    ease: 'power1.in',
                }, start)
                // Se apagan antes de salir del borde, en vez de recortarse en seco.
                .to(d.el, { opacity: 0, duration: decorFlight * 0.3 }, start + decorFlight * 0.7);
        });

        return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
            gsap.set(items, { clearProps: 'all' });
            gsap.set(decor.map((d) => d.el), { clearProps: 'all' });
        };
    });

    mm.add('(max-width: 767px)', () => {
        const shown = items.slice(0, MOBILE_COUNT);
        const hidden = items.slice(MOBILE_COUNT);

        gsap.set(items, { clearProps: 'all' });
        hidden.forEach((item) => { item.style.display = 'none'; });
        // Las partículas y marcos solo tienen sentido en la escena 3D pineada.
        decor.forEach((d) => { d.el.style.display = 'none'; });

        const triggers = shown.map((item) =>
            gsap.fromTo(item,
                { opacity: 0, scale: 0.9, y: 40 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse',
                    },
                }
            ).scrollTrigger
        );

        return () => {
            triggers.forEach((t) => t?.kill());
            hidden.forEach((item) => { item.style.display = ''; });
            decor.forEach((d) => { d.el.style.display = ''; });
        };
    });
}
