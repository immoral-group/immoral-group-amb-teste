let dispose;

// Native scroll snapping also supports touch and trackpads without custom drag handling.
export function initGeoBenefitsCarousel() {
    dispose?.();
    dispose = undefined;
    const root = document.querySelector('.geo-benefits-carousel');
    if (!root) return;

    const track = root.querySelector('.geo-benefits-track');
    const slides = [...track.querySelectorAll('.geo-benefit')];
    const dotsContainer = root.querySelector('.geo-benefit-dots');
    const status = root.querySelector('.geo-benefit-status');
    const section = root.closest('.geo-benefits');
    const controller = new AbortController();
    const options = { signal: controller.signal };
    let current = 0;
    let scrollTimer;

    dotsContainer.replaceChildren();
    const dots = slides.map((slide, index) => {
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'diapositiva');
        slide.setAttribute('aria-label', `${index + 1} de ${slides.length}`);
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'geo-benefit-dot';
        dot.setAttribute('aria-label', `Ver punto ${index + 1}: ${slide.querySelector('h3').textContent}`);
        dot.setAttribute('aria-controls', track.id);
        dot.addEventListener('click', () => goTo(index), options);
        dotsContainer.append(dot);
        return dot;
    });

    function render(announce = false) {
        section.style.setProperty('--geo-field-shift', `${[0, -38, 18, -20][current]}px`);
        section.style.setProperty('--geo-field-turn', `${[-7, -2, -10, 2][current]}deg`);
        slides.forEach((slide, index) => {
            slide.setAttribute('aria-hidden', String(index !== current));
            dots[index].setAttribute('aria-current', String(index === current));
        });
        if (announce) status.textContent = `Punto ${current + 1} de ${slides.length}: ${slides[current].querySelector('h3').textContent}`;
    }

    function slideOffset(index) {
        return slides[index].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
    }

    function goTo(index, instant = false) {
        current = (index + slides.length) % slides.length;
        render(!instant);
        track.scrollTo({
            left: slideOffset(current),
            behavior: instant || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
    }

    root.querySelector('[data-geo-prev]').addEventListener('click', () => goTo(current - 1), options);
    root.querySelector('[data-geo-next]').addEventListener('click', () => goTo(current + 1), options);
    root.addEventListener('keydown', event => {
        const destinations = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: slides.length - 1 };
        if (!(event.key in destinations) || event.altKey || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        goTo(destinations[event.key]);
    }, options);

    track.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            const nearest = slides.reduce((best, _, index) =>
                Math.abs(slideOffset(index) - track.scrollLeft) < Math.abs(slideOffset(best) - track.scrollLeft) ? index : best, 0);
            if (nearest !== current) {
                current = nearest;
                render(true);
            }
        }, 120);
    }, { ...options, passive: true });

    const observer = new ResizeObserver(() => goTo(current, true));
    observer.observe(track);
    root.classList.add('is-enhanced');
    root.querySelector('.geo-benefit-controls').hidden = false;
    goTo(0, true);

    dispose = () => {
        controller.abort();
        observer.disconnect();
        clearTimeout(scrollTimer);
    };
}
