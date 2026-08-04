import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Galería de vídeos con scroll 3D en diseno-de-marca.html: cada vídeo parte
// del centro de la pantalla (lejos, en el eje Z) y se acerca/expande hacia
// afuera a medida que se hace scroll — profundidad real vía perspective +
// translateZ, no un parallax vertical. En mobile se simplifica a una lista
// vertical normal (sin pin ni 3D) por rendimiento/estabilidad de scroll-jack.
const ITEMS = [
    { width: 26, x: -32, y: -15, z: 220, scale: 1.05, rotate: -4 },
    { width: 20, x: 30, y: -17, z: 100, scale: 0.9, rotate: 5 },
    { width: 22, x: -28, y: 16, z: 60, scale: 0.85, rotate: 3 },
    { width: 18, x: 32, y: 15, z: 140, scale: 0.95, rotate: -3 },
    { width: 34, x: 0, y: 0, z: 280, scale: 1.15, rotate: 0 },
];

export function initDisenoScrollVideos() {
    const pinSection = document.getElementById('dsv-pin');
    const stage = document.getElementById('dsv-stage');
    if (!pinSection || !stage) return;

    const items = Array.from(stage.querySelectorAll('.dsv-item'));
    if (items.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
        items.forEach((item, i) => {
            const data = ITEMS[i] || ITEMS[ITEMS.length - 1];
            item.style.width = `${data.width}vw`;
            gsap.set(item, { xPercent: -50, yPercent: -50, x: 0, y: 0, z: -1600, scale: 0.25, opacity: 0, rotateZ: 0 });
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: pinSection,
                start: 'top top',
                end: '+=400%',
                scrub: 1,
                pin: true,
                anticipatePin: 1,
            },
        });

        items.forEach((item, i) => {
            const data = ITEMS[i] || ITEMS[ITEMS.length - 1];
            const start = i * 0.9;

            tl.to(item, { opacity: 1, duration: 0.15 }, start)
                .to(item, {
                    z: data.z,
                    x: () => (window.innerWidth * data.x) / 100,
                    y: () => (window.innerHeight * data.y) / 100,
                    scale: data.scale,
                    rotateZ: data.rotate,
                    duration: 0.85,
                    ease: 'power2.out',
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
