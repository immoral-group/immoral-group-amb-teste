import { gsap, qs, reduced, finePointer, heroIn } from './prisma-site.js';

// /nuestra-historia: Historia + Manifiesto in a single page (texto unificado,
// octubre 2026). The hero takes the gesture of the home hero: the brand bar
// crosses the whole screen, here behind the Immoral character.

const hero = qs('.hero-story');
const bar = qs('.hero-story__bar', hero);
const toon = qs('.hero-story__toon', hero);
const halo = qs('.hero-story__halo', hero);

heroIn(hero).then(tl => {
    if (!tl) return;
    // The bar is drawn from the left edge before anything else arrives.
    tl.from(bar, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.5, ease: 'expo.inOut' }, 0);
    tl.from(halo, { scale: 0.6, opacity: 0, duration: 1.8, ease: 'expo.out' }, 0.2);
});

if (!reduced) {
    // Pointer: the bar tilts a little and the character turns its weight.
    if (finePointer) {
        const barR = gsap.quickTo(bar, 'rotation', { duration: 1.2, ease: 'power3.out' });
        const barY = gsap.quickTo(bar, 'y', { duration: 1.2, ease: 'power3.out' });
        const toonX = gsap.quickTo(toon, 'x', { duration: 1.4, ease: 'power3.out' });
        const haloX = gsap.quickTo(halo, 'x', { duration: 1.8, ease: 'power3.out' });
        const haloY = gsap.quickTo(halo, 'y', { duration: 1.8, ease: 'power3.out' });
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            barR(px * 1.6); barY(py * 26);
            toonX(px * -28);
            haloX(px * 60); haloY(py * 40);
        });
        hero.addEventListener('pointerleave', () => { barR(0); barY(0); toonX(0); haloX(0); haloY(0); });
    }

    // Scroll: the character rises over the bar, the copy steps back.
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to(toon, { yPercent: -10, ease: 'none' }, 0)
        .to('.hero-story__bar-wrap', { y: 90, ease: 'none' }, 0)
        .to('.hero-story__copy', { y: -60, opacity: 0, ease: 'none' }, 0);
}
