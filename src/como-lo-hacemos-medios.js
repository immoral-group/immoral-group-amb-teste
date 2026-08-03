import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Mismo copy que ya existía en la sección "Cómo lo hacemos" de publicidad-en-medios.html
const STEPS = [
    {
        badge: '01',
        line1: 'Auditoría &',
        line2: 'Análisis Inteligente',
        description: 'Analizamos tu marca como un sastre mide a su cliente: con precisión, sin margen de error. Utilizamos smart data con inteligencia artificial para encontrar las oportunidades clave para tu negocio.',
        dashOffset: 0,
    },
    {
        badge: '02',
        line1: 'Planificación Estratégica',
        line2: 'Automatizada',
        description: 'Diseñamos una estrategia a medida, combinando inteligentemente el mix de medios entre Paid Social, Search, Native, Display y Video, con tecnología predictiva para que cada euro rinda al máximo.',
        dashOffset: 260,
    },
    {
        badge: '03',
        line1: 'Ejecución & Optimización',
        line2: 'en Tiempo Real',
        description: 'Cada campaña es un traje a medida. Ajustamos y optimizamos a mano, combinando nuestra experiencia con el poder del análisis de datos y la IA. No dejamos que los algoritmos decidan por sí solos: analizamos, interpretamos y tomamos decisiones estratégicas en tiempo real para maximizar cada euro invertido.',
        dashOffset: 540,
    },
    {
        badge: '04',
        line1: 'Adaptación & Escalamiento',
        line2: 'Inteligente',
        description: 'El mercado cambia constantemente y nosotros nos anticipamos. No dejamos que la IA tome el control, la usamos como nuestra aliada para detectar patrones, descubrir oportunidades y escalar campañas con precisión quirúrgica. Cada ajuste está debidamente meditado. No optimizamos en piloto automático.',
        dashOffset: 800,
    },
];

export function initComoLoHacemosMedios() {
    const section = document.getElementById('chlh-pin');
    if (!section) return;

    const badgeEl = document.getElementById('chlh-badge');
    const titleEl = document.getElementById('chlh-title');
    const descriptionEl = document.getElementById('chlh-description');
    const ring = document.getElementById('chlh-ring');
    const pills = Array.from(document.querySelectorAll('.chlh-pill'));
    const progressFill = document.getElementById('chlh-progress-fill');

    if (!badgeEl || !titleEl || !descriptionEl || !ring) return;

    let currentIndex = -1;

    function updateStep(index) {
        if (index === currentIndex) return;
        currentIndex = index;
        const step = STEPS[index];

        badgeEl.textContent = step.badge;
        titleEl.innerHTML = `${step.line1}<br>${step.line2}`;
        descriptionEl.textContent = step.description;

        pills.forEach((pill, i) => {
            if (i === index) {
                pill.classList.remove('bg-[#1f1f1f]', 'text-white');
                pill.classList.add('bg-white', 'text-black');
            } else {
                pill.classList.remove('bg-white', 'text-black');
                pill.classList.add('bg-[#1f1f1f]', 'text-white');
            }
        });

        // El giro continuo del anillo lo da la animación CSS (.chlh-ring-spin) del <svg>;
        // aquí solo variamos el patrón de huecos del trazo entre pasos.
        gsap.killTweensOf(ring);
        gsap.to(ring, {
            strokeDashoffset: step.dashOffset,
            duration: 1.4,
            ease: 'power2.inOut',
        });
        gsap.fromTo(ring,
            { opacity: 0.35, filter: 'blur(8px)' },
            { opacity: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power2.out' }
        );
    }

    updateStep(0);

    function handleProgress(self) {
        const total = STEPS.length;
        const index = Math.min(Math.floor(self.progress * total), total - 1);
        const perStep = 1 / total;
        const withinStep = (self.progress - index * perStep) / perStep;
        updateStep(index);
        if (progressFill) {
            progressFill.style.width = `${Math.min(Math.max(withinStep * 100, 0), 100)}%`;
        }
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
        const trigger = ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: '+=250%',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            onUpdate: handleProgress,
        });

        return () => trigger.kill();
    });

    mm.add('(max-width: 767px)', () => {
        const trigger = ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: '+=150%',
            scrub: 1,
            onUpdate: handleProgress,
        });

        return () => trigger.kill();
    });
}
