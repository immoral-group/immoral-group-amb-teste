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
// Dirección de salida (fracción del viewport) y rotación de cada instancia.
// Se duplican los 5 vídeos (10 instancias en total) con trayectorias distintas.
const DIRECTIONS = [
    { dx: -0.95, dy: -0.55, rotate: -6 },
    { dx: 0.95, dy: -0.6, rotate: 7 },
    { dx: -0.9, dy: 0.65, rotate: 4 },
    { dx: 0.9, dy: 0.55, rotate: -5 },
    { dx: 0.35, dy: -0.9, rotate: -4 },
    { dx: -0.5, dy: -0.95, rotate: 8 },
    { dx: 0.55, dy: 0.9, rotate: -7 },
    { dx: -0.95, dy: 0.15, rotate: -3 },
    { dx: 0.9, dy: -0.2, rotate: 5 },
    { dx: 0.15, dy: 0.95, rotate: 2 },
];

const WIDTHS = [26, 20, 22, 18, 30, 24, 19, 23, 17, 21];

export function initDisenoScrollVideos() {
    const pinSection = document.getElementById('dsv-pin');
    const stage = document.getElementById('dsv-stage');
    if (!pinSection || !stage) return;

    const items = Array.from(stage.querySelectorAll('.dsv-item'));
    if (items.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
        items.forEach((item, i) => {
            item.style.width = `${WIDTHS[i % WIDTHS.length]}vw`;
            gsap.set(item, { xPercent: -50, yPercent: -50, x: 0, y: 0, z: -1600, scale: 0.25, opacity: 0, rotateZ: 0 });
        });

        const stagger = 0.3;
        const flightDuration = 0.9;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: pinSection,
                start: 'top top',
                end: '+=220%',
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
            const dir = DIRECTIONS[i % DIRECTIONS.length];
            const start = i * stagger;

            // Salida muy por fuera del viewport (150% de su mitad, en ambos
            // ejes) y con mucho z positivo — pasa muy cerca de la cámara y
            // sigue hasta desaparecer, en vez de frenar en un punto medio.
            tl.to(item, { opacity: 1, duration: flightDuration * 0.12 }, start)
                .to(item, {
                    z: 900,
                    x: () => window.innerWidth * dir.dx * 1.5,
                    y: () => window.innerHeight * dir.dy * 1.5,
                    scale: 2.4,
                    rotateZ: dir.rotate * 2,
                    duration: flightDuration,
                    ease: 'power1.in',
                }, start);
        });

        return () => {
            tl.scrollTrigger?.kill();
            tl.kill();
        };
    });

    mm.add('(max-width: 767px)', () => {
        items.forEach((item) => {
            gsap.set(item, { clearProps: 'all' });
        });

        const triggers = items.map((item) =>
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
        };
    });
}
