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

// Una entrada por instancia: ancho (vw), dirección de salida (fracción del
// viewport) y rotación. El nº de instancias = longitud de este array.
const ITEMS = [
    { width: 34, dx: -0.95, dy: -0.55, rotate: -6 },
    { width: 27, dx: 0.95, dy: -0.6, rotate: 7 },
    { width: 30, dx: -0.9, dy: 0.65, rotate: 4 },
    { width: 25, dx: 0.9, dy: 0.55, rotate: -5 },
    { width: 38, dx: 0.35, dy: -0.9, rotate: -4 },
    { width: 32, dx: -0.5, dy: -0.95, rotate: 8 },
    { width: 26, dx: 0.55, dy: 0.9, rotate: -7 },
    { width: 31, dx: -0.95, dy: 0.15, rotate: -3 },
    { width: 24, dx: 0.9, dy: -0.2, rotate: 5 },
    { width: 29, dx: 0.15, dy: 0.95, rotate: 2 },
    { width: 36, dx: -0.7, dy: -0.8, rotate: 6 },
    { width: 23, dx: 0.75, dy: 0.75, rotate: -8 },
    { width: 33, dx: -0.25, dy: 0.95, rotate: 3 },
    { width: 28, dx: 0.95, dy: -0.85, rotate: -2 },
];

function buildItems(stage) {
    const frag = document.createDocumentFragment();
    const created = [];

    ITEMS.forEach((_, i) => {
        const wrapper = document.createElement('div');
        wrapper.className =
            'dsv-item relative md:absolute w-full md:w-auto md:top-1/2 md:left-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl';

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

        return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
            gsap.set(items, { clearProps: 'all' });
        };
    });

    mm.add('(max-width: 767px)', () => {
        const shown = items.slice(0, MOBILE_COUNT);
        const hidden = items.slice(MOBILE_COUNT);

        gsap.set(items, { clearProps: 'all' });
        hidden.forEach((item) => { item.style.display = 'none'; });

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
        };
    });
}
