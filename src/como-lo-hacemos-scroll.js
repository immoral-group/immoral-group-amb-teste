import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Motor compartido de la sección "Cómo lo hacemos" (scroll pineado con GSAP ScrollTrigger).
// El copy de cada paso vive en un <script type="application/json" id="chlh-steps-data">
// embebido en el HTML de cada página — este módulo es agnóstico al contenido.
export function initComoLoHacemosScroll() {
    const section = document.getElementById('chlh-pin');
    if (!section) return;

    const stepsData = document.getElementById('chlh-steps-data');
    if (!stepsData) return;

    let STEPS;
    try {
        STEPS = JSON.parse(stepsData.textContent);
    } catch (e) {
        console.error('Error parseando chlh-steps-data:', e);
        return;
    }
    if (!Array.isArray(STEPS) || STEPS.length === 0) return;

    const badgeEl = document.getElementById('chlh-badge');
    const titleEl = document.getElementById('chlh-title');
    const descriptionEl = document.getElementById('chlh-description');
    const ringStyles = STEPS.map((_, i) => document.getElementById(`chlh-style-${i}`));
    const pills = Array.from(document.querySelectorAll('.chlh-pill'));
    const progressFill = document.getElementById('chlh-progress-fill');

    if (!badgeEl || !titleEl || !descriptionEl || ringStyles.some(g => !g)) return;

    let currentIndex = -1;

    function updateStep(index) {
        if (index === currentIndex) return;
        currentIndex = index;
        const step = STEPS[index];

        badgeEl.textContent = step.badge;
        // El título trae &nbsp; embebido entre conectores cortos ("&", "de", "en"...) para que
        // nunca queden solos en su propia línea al hacer wrap — por eso se asigna vía innerHTML.
        titleEl.innerHTML = step.title;
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

        // Cada paso tiene su propio grupo de anillo (con su propio giro continuo en CSS);
        // aquí solo hacemos el cross-fade entre el grupo saliente y el entrante.
        ringStyles.forEach((group, i) => {
            gsap.killTweensOf(group);
            gsap.to(group, {
                opacity: i === index ? 1 : 0,
                duration: i === index ? 1.1 : 0.8,
                ease: 'power2.inOut',
            });
        });
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

    // Las pills son clicables: saltan al scroll correspondiente a ese paso (a mitad de su tramo)
    // dentro del rango pineado activo (desktop o mobile, el que esté vivo en ese momento).
    let activeTrigger = null;

    function scrollToStep(index) {
        if (!activeTrigger) return;
        const total = STEPS.length;
        const progress = (index + 0.5) / total;
        const target = activeTrigger.start + progress * (activeTrigger.end - activeTrigger.start);
        window.scrollTo({ top: target, behavior: 'smooth' });
    }

    pills.forEach((pill, i) => {
        pill.addEventListener('click', () => scrollToStep(i));
    });

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
        activeTrigger = trigger;

        return () => {
            if (activeTrigger === trigger) activeTrigger = null;
            trigger.kill();
        };
    });

    mm.add('(max-width: 767px)', () => {
        const trigger = ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: '+=150%',
            scrub: 1,
            onUpdate: handleProgress,
        });
        activeTrigger = trigger;

        return () => {
            if (activeTrigger === trigger) activeTrigger = null;
            trigger.kill();
        };
    });
}
