import { gsap, ScrollTrigger, qs, qsa, reduced, finePointer, heroIn, lenis } from './prisma-site.js';

// The service pages on the Prisma design (/publicidad-en-medios,
// /diseno-de-marca…), one script for all: each block below only acts if the
// page has it. Shared behaviour (nav, reveals, the card stack, the blue
// section that opens, accordions, closing card, footer) is in src/prisma-site.js.

/* ------------------------------------------------------------------ */
/* Hero: the copy scrolls past a glass object that stays (each page    */
/* picks its own with data-scene); the scroll of the hero drives it    */
/* ------------------------------------------------------------------ */
const SCENES = {
    funnel: () => import('./funnel-hero.js'),
    identity: () => import('./identity-hero.js'),
    social: () => import('./social-hero.js'),
    flow: () => import('./flow-hero.js'),
    target: () => import('./target-hero.js'),
    lens: () => import('./lens-hero.js'),
    creators: () => import('./creators-hero.js'),
};
const hero = qs('.hero-svc');
if (hero) {
    heroIn(hero);
    const steps = qsa('.hero-svc__step', hero);
    // A hero with a single block of copy has nothing to scroll past: its
    // object answers to the hero leaving the screen instead.
    const single = qsa('.hero-svc__block', hero).length < 2;
    let scene = null;
    const hasGL = (() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); })();
    const load = SCENES[hero.dataset.scene];
    if (!hasGL || !load) hero.classList.add('no-webgl');
    else {
        load()
            .then(({ createScene }) => { scene = createScene(qs('.hero-svc__canvas', hero), { reduced }); })
            .catch(err => { console.warn('Escena del hero:', err); hero.classList.add('no-webgl'); });
    }

    if (reduced) steps.forEach(s => s.classList.add('is-on'));
    else {
        const mm = gsap.matchMedia();
        // Side by side: the whole hero is one scroll, the object stays.
        mm.add('(min-width: 1025px)', () => {
            ScrollTrigger.create({
                trigger: hero, start: single ? 'top top' : 'top top', end: single ? 'bottom top' : 'bottom bottom',
                onUpdate: ({ progress: p }) => {
                    scene?.setProgress(p);
                    steps.forEach((s, i) => s.classList.toggle('is-on', p > 0.56 + i * 0.12));
                },
            });
        });
        // Stacked: each line lights up as it comes in, and pushes the object along.
        mm.add('(max-width: 1024px)', () => {
            if (single) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: ({ progress: p }) => scene?.setProgress(p) });
            steps.forEach((s, i) => ScrollTrigger.create({
                trigger: s, start: 'top 82%',
                onEnter: () => { s.classList.add('is-on'); scene?.setProgress((i + 1) / steps.length); },
                onLeaveBack: () => { s.classList.remove('is-on'); scene?.setProgress(i / steps.length); },
            }));
        });
    }
}

/* ------------------------------------------------------------------ */
/* Clips that play by themselves, only while their section is on screen */
/* ------------------------------------------------------------------ */
qsa('[data-play-visible]').forEach(section => {
    const videos = qsa('video', section);
    if (reduced) return;
    new IntersectionObserver(([en]) => videos.forEach(v => (en.isIntersecting ? v.play().catch(() => {}) : v.pause())), { rootMargin: '120px' }).observe(section);
});

/* Parallax: [data-speed] drifts against the scroll (more, the higher). */
if (!reduced) {
    qsa('[data-speed]').forEach(el => {
        gsap.fromTo(el, { yPercent: () => Number(el.dataset.speed) * 30 }, {
            yPercent: () => -Number(el.dataset.speed) * 30, ease: 'none',
            scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
    });
}

/* ------------------------------------------------------------------ */
/* Reel: a wall of clips that drifts sideways for ever, on a curve.     */
/* Each card is recycled from one end to the other (no copies of the    */
/* clips), and the drift follows the scroll's speed a little.           */
/* ------------------------------------------------------------------ */
qsa('[data-reel]').forEach(reel => {
    const items = qsa('.reel-svc__item', reel);
    if (!items.length || reduced) return;
    let w = 0, total = 0, offset = 0, boost = 0, raf = 0, running = false;
    const measure = () => { w = items[0].offsetWidth + parseFloat(getComputedStyle(reel).columnGap || 0); total = w * items.length; };
    const frame = () => {
        raf = requestAnimationFrame(frame);
        boost *= 0.92;
        offset = (offset + 0.45 + boost) % total;
        const mid = reel.clientWidth / 2;
        items.forEach((it, i) => {
            const x = ((i * w - offset) % total + total) % total - w;
            const d = (x + w / 2 - mid) / (reel.clientWidth / 2);   // -1 … 1 from the centre
            it.style.transform = `translate3d(${x}px, ${(d * d * 28).toFixed(1)}px, 0) rotateY(${(-d * 18).toFixed(2)}deg) scale(${(1 - Math.min(1, Math.abs(d)) * 0.12).toFixed(3)})`;
        });
    };
    measure();
    new ResizeObserver(measure).observe(reel);
    new IntersectionObserver(([en]) => {
        if (en.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); }
        else if (!en.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(reel);
    ScrollTrigger.create({ trigger: reel, start: 'top bottom', end: 'bottom top', onUpdate: s => { boost = Math.min(14, Math.abs(s.getVelocity()) / 220); } });
});

/* ------------------------------------------------------------------ */
/* Offerings: the work behind each service shows (and plays) on hover   */
/* ------------------------------------------------------------------ */
qsa('.offering').forEach(card => {
    const video = qs('video', card);
    if (!video) return;
    card.addEventListener('mouseenter', () => video.play().catch(() => {}));
    card.addEventListener('mouseleave', () => video.pause());
});

/* ------------------------------------------------------------------ */
/* Cómo lo hacemos: the ring is drawn arc by arc with the scroll        */
/* ------------------------------------------------------------------ */
const how = qs('.how-svc');
if (how) {
    const DATA = qsa('.how-svc__list li', how).map(li => ({ title: qs('h3', li).textContent, desc: qs('p', li).textContent }));
    if (reduced) how.classList.add('is-static');
    else {
        const track = qs('.how-svc__track', how);
        const fills = qsa('.how-svc__fill', how);
        const head = qs('.how-svc__head', how);
        const spin = qs('.how-svc__spin', how);
        const badge = qs('.how-svc__badge', how);
        const title = qs('.how-svc__title', how);
        const desc = qs('.how-svc__desc', how);
        const bar = qs('.how-svc__bar span', how);
        const pills = qsa('.how-svc__pill', how);
        // One arc per step, 8° apart (as drawn by the page: 360/n each).
        const n = DATA.length, SEG = 360 / n, ARC = SEG - 8;
        let current = 0, swap = 0;

        const show = i => {
            if (i === current) return;
            current = i;
            badge.textContent = String(i + 1).padStart(2, '0');
            pills.forEach((p, k) => p.classList.toggle('is-active', k === i));
            clearTimeout(swap);
            title.classList.add('is-out'); desc.classList.add('is-out');
            swap = setTimeout(() => {
                title.textContent = DATA[i].title; desc.textContent = DATA[i].desc;
                title.classList.remove('is-out'); desc.classList.remove('is-out');
            }, 260);
        };
        const draw = p => {
            const pos = Math.min(n - 1e-4, p * n);
            const i = Math.floor(pos), f = pos - i;
            // As a style (the CSS one would win over the attribute). An empty arc
            // is hidden: its round caps alone would still draw a dot.
            fills.forEach((c, k) => {
                const len = k < i ? ARC : k === i ? ARC * f : 0;
                c.style.strokeDasharray = `${len.toFixed(2)} 360`;
                c.style.opacity = len > 0.3 ? 1 : 0;
            });
            // The bright head rides the tip of the arc being drawn.
            const a = ((-90 + 4 + i * SEG + ARC * f) * Math.PI) / 180;
            head.setAttribute('cx', (200 + 170 * Math.cos(a)).toFixed(2));
            head.setAttribute('cy', (200 + 170 * Math.sin(a)).toFixed(2));
            spin.style.transform = `rotate(${(p * 24 - 12).toFixed(2)}deg)`;
            bar.style.transform = `scaleX(${p.toFixed(4)})`;
            show(i);
        };
        draw(0);
        ScrollTrigger.create({ trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: s => draw(s.progress) });

        // Each pill takes the scroll to the middle of its step.
        pills.forEach((pill, i) => pill.addEventListener('click', () => {
            const y = track.getBoundingClientRect().top + scrollY + ((i + 0.5) / n) * (track.offsetHeight - innerHeight);
            if (lenis) lenis.scrollTo(y, { duration: 1.2 });
            else scrollTo({ top: y, behavior: 'smooth' });
        }));
    }
}

/* ------------------------------------------------------------------ */
/* Results: the two halves of each figure come together and count up   */
/* ------------------------------------------------------------------ */
qsa('.kpis .cut').forEach((cut, i) => {
    const a = qs('.cut__half--a', cut), b = qs('.cut__half--b', cut);
    const counts = qsa('[data-count]', cut);
    // A figure that is not a number ("$€¥") does not count, it only comes together.
    const end = counts.length ? Number(counts[0].dataset.count) : 0;
    const o = { v: reduced ? end : 0 };
    const write = () => counts.forEach(c => (c.textContent = Math.round(o.v)));
    write();
    // Under the pointer the halves come slightly apart along the cut.
    if (finePointer) {
        const ax = gsap.quickTo(a, 'x', { duration: 0.7, ease: 'power3.out' });
        const bx = gsap.quickTo(b, 'x', { duration: 0.7, ease: 'power3.out' });
        const num = qs('.cut__num', cut);
        num.addEventListener('pointerenter', () => { ax(-14); bx(14); });
        num.addEventListener('pointerleave', () => { ax(0); bx(0); });
    }
    if (reduced) return;
    const dir = i % 2 ? -1 : 1;
    gsap.timeline({ scrollTrigger: { trigger: cut, start: 'top 92%', end: 'top 50%', scrub: 0.8 } })
        .fromTo(a, { xPercent: -26 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power3.out', duration: 1 }, 0)
        .fromTo(b, { xPercent: 26 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power3.out', duration: 1 }, 0)
        .to(o, { v: end, ease: 'power2.out', duration: 1, onUpdate: write }, 0)
        .fromTo(qs('.cut__label', cut), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5 }, 0.45);
});
