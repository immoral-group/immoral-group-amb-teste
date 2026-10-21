import { gsap, ScrollTrigger, qs, qsa, reduced, finePointer, introDone, heroIn, fitCalendar } from './prisma-site.js';

// /casos-de-exito on the Prisma design. The filters and the grid are generated
// from Supabase (scripts/generate-case-studies.mjs); everything here reads
// them from the DOM, so a case added in /casos-admin needs no wiring.

const hero = qs('.hero-cases');
const inner = qs('.hero-cases__inner', hero);
const copy = qs('.hero-cases__copy', hero);
const cards = qsa('#casos-grid .case-card');
heroIn(hero);

/* ------------------------------------------------------------------ */
/* Hero: a glass bubble per case, with its logo, rising (casos-hero)  */
/* ------------------------------------------------------------------ */
// These logos are nearly square: at the size of the rest they would touch the glass.
const SMALL_LOGOS = new Set(['munkombucha', 'amlul', 'marcawell']);
const section = qs('.cases');
let bubbles = null, poolReady = false, opening = null, clip = null;

// Desktop, where the head of the section peeks in under the hero: at first
// that strip is not the blue section but a slab of the bubbles' glass, the
// pool they are born from, drawn by the canvas underneath while the section
// is see-through (--fill 0). Scrolling, the section fills with its colour
// over the glass and ends exactly as it is.
const poolOn = () => poolReady && opening && innerWidth > 1024;
function syncPool() {
    if (!bubbles) return;
    if (!poolOn()) { bubbles.setPool(null); section.style.removeProperty('--fill'); return; }
    const p = opening.progress, q = clip ? clip.progress() : 0;
    const stage = qs('.hero-cases__stage', hero).getBoundingClientRect();
    bubbles.setPool({
        top: section.getBoundingClientRect().top - stage.top,
        inset: section.offsetWidth * 0.04 * (1 - q),
        radius: 64 * (1 - q),
    });
    section.style.setProperty('--fill', gsap.utils.clamp(0, 1, (p - 0.04) / 0.24).toFixed(3));
}
const hasGL = (() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); })();
if (!reduced && hasGL && window.Matter) {
    const cases = cards.map(card => {
        const slug = card.getAttribute('href').replace(/^caso-|\.html$/g, '');
        return { logo: card.dataset.logo, href: card.getAttribute('href'), small: SMALL_LOGOS.has(slug) };
    }).filter(c => c.logo);
    import('./casos-hero.js').then(({ createCaseBubbles }) => {
        bubbles = createCaseBubbles(qs('.hero-cases__stage', hero), qs('.hero-cases__canvas', hero), {
            cases,
            avoid: () => copy.getBoundingClientRect(),
            interactive: finePointer && innerWidth >= 768,
        });
        syncPool();
        // The strip of the section turns into glass as soon as the pool can be drawn.
        bubbles.ready.then(() => { poolReady = true; syncPool(); });
        // They start to rise once the title is in place.
        Promise.all([bubbles.ready, introDone]).then(() => setTimeout(() => { bubbles.relayout(); bubbles.release(); syncPool(); }, 300));
    }).catch(err => console.warn('Burbujas del hero:', err));
} else {
    hero.classList.add('is-static');
}

/* ------------------------------------------------------------------ */
/* The cases arrive over the hero: it stays and steps back while the  */
/* section slides up and opens to full bleed.                         */
/* ------------------------------------------------------------------ */
if (!reduced && innerHeight >= 600) {
    // From where the section rests at load (right under the hero, which on
    // desktop is shorter than the screen) to the top.
    const bounds = { trigger: section, start: () => `top ${hero.offsetHeight}px`, end: 'top top', scrub: true, invalidateOnRefresh: true };
    ScrollTrigger.create({ ...bounds, scrub: false, pin: hero, pinSpacing: false });
    // The hero steps back only once the glass has turned into the section
    // (the pool is drawn in the hero's canvas and has to stay in register).
    gsap.timeline({ scrollTrigger: bounds })
        .to(inner, { scale: 0.9, yPercent: -6, borderRadius: 48, ease: 'none', duration: 0.7 }, 0.3)
        .to(copy, { opacity: 0.25, ease: 'none', duration: 0.7 }, 0.3);
    clip = gsap.fromTo(section, { clipPath: 'inset(0% 4% 0% 4% round 64px 64px 0px 0px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none',
        scrollTrigger: { ...bounds, end: 'top 15%' },
    });
    // Created after the clip, so it reads the clip already updated.
    opening = ScrollTrigger.create({ ...bounds, scrub: false, onUpdate: syncPool, onRefresh: syncPool });

    // The cards are dealt in: they rise tilted and settle, row by row.
    gsap.set(cards, { opacity: 0, y: 140, rotation: i => (i % 2 ? 5 : -5), scale: 0.94, transformOrigin: '50% 100%' });
    ScrollTrigger.batch(cards, {
        start: 'top 94%', once: true,
        onEnter: els => gsap.to(els, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 1.3, ease: 'expo.out', stagger: 0.08, clearProps: 'transform,opacity' }),
    });
}

// The Behance button rises with the title, just after it: at load only a
// piece of it would show at the bottom of the screen.
if (!reduced) {
    gsap.fromTo('.cases__more', { opacity: 0, yPercent: 90 }, {
        opacity: 1, yPercent: 0, duration: 1.3, ease: 'expo.out', delay: 0.15,
        scrollTrigger: { trigger: '.cases__head', start: 'top 88%', once: true },
    });
}

/* ------------------------------------------------------------------ */
/* Filters: by sector and by result, combined                         */
/* ------------------------------------------------------------------ */
const filters = qs('#casos-filters');
const count = qs('#casos-count');
const empty = qs('#casos-empty');
if (filters && cards.length) {
    const active = { sector: 'todos', resultado: 'todos' };
    const apply = () => {
        const shown = [];
        cards.forEach(card => {
            const ok = (active.sector === 'todos' || card.dataset.sector === active.sector)
                && (active.resultado === 'todos' || card.dataset.resultado === active.resultado);
            if (ok && card.hidden) shown.push(card);
            card.hidden = !ok;
        });
        const n = cards.filter(c => !c.hidden).length;
        count.textContent = n === cards.length ? `${n} casos` : `${n} de ${cards.length} casos`;
        empty.hidden = n !== 0;
        if (!reduced && shown.length) {
            gsap.fromTo(shown, { opacity: 0, y: 40, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'expo.out', stagger: 0.04, clearProps: 'transform,opacity' });
        }
        ScrollTrigger.refresh();
    };
    filters.addEventListener('click', e => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        const { filterGroup: group, filterValue: value } = pill.dataset;
        active[group] = value;
        qsa(`.filter-pill[data-filter-group="${group}"]`, filters).forEach(btn => {
            btn.classList.toggle('is-active', btn === pill);
            btn.setAttribute('aria-pressed', String(btn === pill));
        });
        apply();
    });
    apply();
}

/* ------------------------------------------------------------------ */
/* Each card plays its clip only while the pointer is on it           */
/* ------------------------------------------------------------------ */
cards.forEach(card => {
    const video = qs('.case-card__video', card);
    if (!video) return;
    card.addEventListener('mouseenter', () => {
        video.currentTime = 0;
        // A case without a clip yet: play() rejects and the cover stays.
        video.play().then(() => card.classList.add('is-playing')).catch(() => {});
    });
    card.addEventListener('mouseleave', () => {
        card.classList.remove('is-playing');
        video.pause();
    });
});

fitCalendar(qs('.book__card iframe'));
