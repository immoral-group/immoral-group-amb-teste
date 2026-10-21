import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

// Shared chrome for the inner pages built on the Prisma design (the approved
// home, index-prisma.html): smooth scroll, grain, nav + mobile menu, scroll
// progress, cursor label, magnetic buttons, section reveals, accordions and
// the blue closing card. Page-specific behaviour lives in src/page-*.js.
// Same behaviour as src/home-prisma.js; the home keeps its own copy for now.

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };
export const qs = (s, el = document) => el.querySelector(s);
export const qsa = (s, el = document) => [...el.querySelectorAll(s)];
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

const root = document.documentElement;
const body = document.body;

if (!reduced) root.classList.add('js-motion');

/* Smooth scroll ------------------------------------------------------ */
export let lenis = null;
if (!reduced) {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

/* Page intro: the brand line cuts the screen and the two halves open --- */
// Shorter cousin of the home intro. Resolves when the page content can start
// animating. Skipped with reduced motion or when the tab loads hidden.
export const introDone = (function pageIntro() {
    const intro = qs('.intro');
    if (!intro) return Promise.resolve();
    if (reduced || document.hidden) { intro.remove(); return Promise.resolve(); }
    intro.classList.add('is-running');
    body.classList.add('is-loading');
    lenis?.stop();
    return new Promise(resolve => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            intro.remove();
            body.classList.remove('is-loading');
            lenis?.start();
            resolve();
        };
        const tl = gsap.timeline({ onComplete: finish });
        tl.to('.intro__line', { clipPath: 'inset(0 0% 0 0)', duration: 0.75, ease: 'expo.inOut' })
            .to('.intro__half--top', { yPercent: -101, duration: 1.05, ease: 'expo.inOut' }, 0.6)
            .to('.intro__half--bottom', { yPercent: 101, duration: 1.05, ease: 'expo.inOut' }, 0.6)
            .to('.intro__line', { scaleY: 0, opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 0.8)
            .call(resolve, null, 0.95);
        setTimeout(() => { if (!done) tl.progress(1); }, 4000);
        const skip = () => tl.progress() < 0.9 && tl.timeScale(3);
        window.addEventListener('wheel', skip, { once: true, passive: true });
        window.addEventListener('keydown', skip, { once: true });
        document.addEventListener('visibilitychange', () => { if (document.hidden) tl.progress(1); }, { once: true });
    });
})();

function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMobileMenu();
    scrollToTarget(target);
    if (id === '#contenido') target.setAttribute('tabindex', '-1'), target.focus({ preventScroll: true });
});

/* Grain (off over elements marked [data-grain-off]) -------------------- */
(function grain() {
    const el = qs('.grain');
    if (!el) return;
    const c = document.createElement('canvas');
    c.width = c.height = 140;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
    qsa('[data-grain-off]').forEach(sec => {
        ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom 35%', toggleClass: { targets: el, className: 'is-off' } });
    });
})();

/* Navigation --------------------------------------------------------- */
const nav = qs('[data-nav]');
const groups = qsa('.nav__group');
const toggle = qs('.nav__toggle');
const mmenu = qs('#mobile-menu');
let closeTimer = 0;

function setGroup(group, open) {
    group.classList.toggle('is-open', open);
    qs('.nav__trigger', group).setAttribute('aria-expanded', String(open));
}
function closeGroups(except) { groups.forEach(g => { if (g !== except) setGroup(g, false); }); }

groups.forEach(group => {
    const trigger = qs('.nav__trigger', group);
    trigger.addEventListener('click', () => {
        const open = !group.classList.contains('is-open');
        closeGroups(group);
        setGroup(group, open);
    });
    if (finePointer) {
        group.addEventListener('mouseenter', () => { clearTimeout(closeTimer); closeGroups(group); setGroup(group, true); });
        group.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => setGroup(group, false), 180); });
    }
    group.addEventListener('focusout', e => { if (!group.contains(e.relatedTarget)) setGroup(group, false); });
});
document.addEventListener('click', e => { if (!e.target.closest('.nav__group')) closeGroups(); });

function openMobileMenu() {
    mmenu.hidden = false;
    body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    lenis?.stop();
    if (!reduced) gsap.fromTo(qsa('.mmenu__inner > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
}
function closeMobileMenu() {
    if (!mmenu || mmenu.hidden) return;
    mmenu.hidden = true;
    body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    lenis?.start();
}
if (toggle && mmenu) {
    toggle.addEventListener('click', () => (mmenu.hidden ? openMobileMenu() : closeMobileMenu()));
    mmenu.addEventListener('click', e => { if (e.target.closest('a')) closeMobileMenu(); });
}
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const wasOpen = mmenu && !mmenu.hidden;
    closeMobileMenu();
    closeGroups();
    if (wasOpen) toggle.focus();
});
matchMedia('(min-width: 1181px)').addEventListener('change', closeMobileMenu);

if (nav) {
    ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate(self) {
            const y = self.scroll();
            const hide = y > 160 && self.direction === 1 && !groups.some(g => g.classList.contains('is-open')) && (!mmenu || mmenu.hidden);
            nav.classList.toggle('is-hidden', hide);
        },
    });
}

gsap.to('.scroll-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

/* Cursor label + magnetic buttons -------------------------------------- */
if (finePointer && qs('.cursor')) {
    root.classList.add('has-cursor');
    const cursor = qs('.cursor');
    const label = qs('.cursor__label');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
    gsap.set(cursor, { x: -100, y: -100 });
    window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => {
        const el = e.target.closest('[data-cursor]');
        if (el) { label.textContent = el.dataset.cursor; cursor.classList.add('is-active'); }
        else cursor.classList.remove('is-active');
        cursor.classList.toggle('is-hidden', !!e.target.closest('a, button') && !el);
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-active'));
}

export function magnetic(scope = document) {
    if (!finePointer) return;
    qsa('[data-magnetic]', scope).forEach(el => {
        if (el.dataset.magneticReady) return;
        el.dataset.magneticReady = '1';
        const xm = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
        const ym = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
        el.addEventListener('pointermove', e => {
            const r = el.getBoundingClientRect();
            xm((e.clientX - (r.left + r.width / 2)) * 0.28);
            ym((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        el.addEventListener('pointerleave', () => { xm(0); ym(0); });
    });
}
magnetic();

/* Hero entrance ------------------------------------------------------- */
// [data-hero-title] lines rise and its marked word gets the brand bar,
// [data-hero-fade] fades up, [data-hero-pop] pops in. Starts after the page
// intro. Returns a promise with the timeline so each page can add to it.
export function heroIn(hero = qs('[data-hero]')) {
    if (!hero) return Promise.resolve(null);
    const title = qs('[data-hero-title]', hero);
    const bars = qsa('.mark__bar', hero);
    gsap.set(bars, { rotation: -2.45, transformOrigin: 'left center', scaleX: reduced ? 1 : 0 });
    if (reduced) return Promise.resolve(null);
    return Promise.all([fontsReady, introDone]).then(() => {
        const tl = gsap.timeline();
        if (title) {
            const st = new SplitText(title, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
            gsap.set(title, { visibility: 'visible' });
            tl.from(st.lines, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0.1);
        }
        if (bars.length) tl.to(bars, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' }, 0.75);
        const fades = qsa('[data-hero-fade]', hero);
        if (fades.length) tl.to(fades, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.5);
        const pops = qsa('[data-hero-pop]', hero);
        if (pops.length) tl.from(pops, { opacity: 0, yPercent: 30, scale: 0.9, duration: 1.4, ease: 'expo.out', stagger: 0.07 }, 0.3);
        return tl;
    });
}

// The brand bar draws under marked words in section titles as they arrive.
qsa('.mark__bar').forEach(bar => {
    if (bar.closest('[data-hero]')) return; // drawn by heroIn()
    gsap.set(bar, { rotation: -2.45, transformOrigin: 'left center', scaleX: reduced ? 1 : 0 });
    if (reduced) return;
    gsap.to(bar, {
        scaleX: 1, duration: 1.1, ease: 'expo.inOut',
        scrollTrigger: { trigger: bar.closest('h1, h2, h3, p') || bar, start: 'top 72%', once: true },
    });
});

/* Section reveals ------------------------------------------------------ */
// [data-split]: lines rise. [data-reveal]: fade up. [data-scrub-words]: words
// light up as the paragraph crosses the screen. [data-batch] > *: children
// enter in sequence.
fontsReady.then(() => {
    if (!reduced) {
        qsa('[data-split]').forEach(el => {
            const st = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
            gsap.from(st.lines, {
                yPercent: 112, duration: 1.3, ease: 'expo.out', stagger: 0.09,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                onComplete: () => st.revert(),
            });
        });
        qsa('[data-reveal]').forEach(el => {
            gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
        });
        qsa('[data-scrub-words]').forEach(p => {
            const st = new SplitText(p, { type: 'words', wordsClass: 'w' });
            gsap.to(st.words, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 48%', scrub: true } });
        });
        qsa('[data-batch]').forEach(group => {
            const items = [...group.children];
            gsap.set(items, { opacity: 0, y: 60 });
            ScrollTrigger.batch(items, {
                start: 'top 92%', once: true,
                onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08 }),
            });
        });
    }
    ScrollTrigger.refresh();
});

/* Accordions ----------------------------------------------------------- */
qsa('[data-accordion]').forEach(acc => {
    const items = qsa(':scope > div', acc);
    items.forEach(item => {
        const btn = qs('button[aria-controls]', item);
        const panel = qs('#' + btn.getAttribute('aria-controls'));
        btn.addEventListener('click', () => {
            const open = !item.classList.contains('is-open');
            items.forEach(other => {
                if (other === item || !other.classList.contains('is-open')) return;
                other.classList.remove('is-open');
                qs('button[aria-controls]', other).setAttribute('aria-expanded', 'false');
                qs('[role="region"]', other).inert = true;
            });
            item.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
            panel.inert = !open;
            setTimeout(() => ScrollTrigger.refresh(), 820);
        });
    });
});

/* Closing card: field of brand lines that turn toward the pointer ------ */
qsa('.talk__field').forEach(canvas => {
    const ctx = canvas.getContext('2d');
    const BASE = -0.0428;
    const GAP = 28;
    let w = 0, h = 0, pts = [], raf = 0, running = false, visible = false, t = 0, last = 0;
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

    function resize() {
        const r = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = r.width; h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        pts = [];
        for (let y = GAP / 2; y < h; y += GAP) {
            for (let x = GAP / 2; x < w; x += GAP) pts.push({ x, y, a: BASE });
        }
        draw(0);
    }
    function draw(dt) {
        t += dt;
        if (!m.active || !finePointer) {
            m.tx = w * (0.5 + 0.32 * Math.sin(t * 0.35));
            m.ty = h * (0.5 + 0.28 * Math.sin(t * 0.52 + 1.2));
        }
        m.x += (m.tx - m.x) * Math.min(1, dt * 6 || 1);
        m.y += (m.ty - m.y) * Math.min(1, dt * 6 || 1);
        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = 'round';
        const R = Math.max(w, h) * 0.22;
        for (const p of pts) {
            const dx = m.x - p.x, dy = m.y - p.y;
            const infl = Math.exp(-(dx * dx + dy * dy) / (2 * R * R));
            const wave = Math.sin(p.x * 0.006 + p.y * 0.004 - t * 0.7) * 0.25;
            const target = BASE + wave + wrap(Math.atan2(dy, dx) - (BASE + wave)) * infl;
            p.a += wrap(target - p.a) * 0.14;
            const len = 6 + infl * 18;
            const cx = Math.cos(p.a) * len * 0.5, cy = Math.sin(p.a) * len * 0.5;
            ctx.strokeStyle = `rgba(255,255,255,${0.16 + infl * 0.62})`;
            ctx.lineWidth = 1.3 + infl * 1.4;
            ctx.beginPath();
            ctx.moveTo(p.x - cx, p.y - cy);
            ctx.lineTo(p.x + cx, p.y + cy);
            ctx.stroke();
        }
    }
    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        draw(dt);
    }
    function start() {
        if (running || reduced || !visible) return;
        running = true; last = performance.now(); raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    const card = canvas.parentElement;
    card.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; m.active = true;
    });
    card.addEventListener('pointerleave', () => { m.active = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    new ResizeObserver(resize).observe(canvas);
});

// The closing card opens from the bottom with a rounded edge as it enters.
if (!reduced) {
    qsa('.talk__card').forEach(card => {
        gsap.timeline({ scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 25%', scrub: true } })
            .fromTo(card, { clipPath: 'inset(18% 4% 0% 4% round 80px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power1.inOut' }, 0)
            .fromTo(qs('.talk__content', card), { y: 80 }, { y: 0, ease: 'power1.out' }, 0);
    });
}

/* Hero lines: the ruled lines of the home hero, bent by a loupe under the pointer */
// <div class="hero-lines" data-hero-lines data-lines-x=".78" data-lines-y=".32">
// The optional data-lines-x/y set where the lines are densest (0–1).
qsa('[data-hero-lines]').forEach(box => {
    const hero = box.closest('[data-hero]') || box.parentElement;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    box.append(canvas);
    const CX = Number(box.dataset.linesX || 0.78), CY = Number(box.dataset.linesY || 0.32);
    const ctx = canvas.getContext('2d');
    const TAN = Math.tan(-0.0428); // brand bar angle (−2.45°)
    let w = 0, h = 0, raf = 0, running = false, visible = true, t = 0, last = 0, shift = 0;
    const m = { x: 0, y: 0, tx: 0, ty: 0, active: false };

    function resize() {
        const r = hero.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = r.width; h = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!m.active) { m.x = m.tx = w * CX; m.y = m.ty = h * CY; }
        draw(0);
    }
    // Lines fade out toward the bottom-left, where the title sits.
    const mask = (x, y) => {
        const nx = (x / w - CX) / 0.62, ny = (y / h - CY) / 0.7;
        return Math.max(0, 1 - Math.sqrt(nx * nx + ny * ny));
    };
    function draw(dt) {
        t += dt;
        if (!m.active || !finePointer) {
            m.tx = w * (CX - 0.08 + 0.16 * Math.sin(t * 0.32));
            m.ty = h * (CY + 0.04 + 0.18 * Math.sin(t * 0.45 + 1.1));
        }
        const k = Math.min(1, dt * 5 || 1);
        m.x += (m.tx - m.x) * k;
        m.y += (m.ty - m.y) * k;
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        const GAP = 42, STEP = 10, R2 = Math.pow(Math.min(w, h) * 0.2, 2);
        const off = ((shift % GAP) + GAP) % GAP;
        for (let base = -GAP * 2 + off; base < h + GAP * 2 + w * Math.abs(TAN); base += GAP) {
            ctx.beginPath();
            let started = false;
            for (let x = 0; x <= w + STEP; x += STEP) {
                let y = base + x * TAN;
                const dx = x - m.x, dy = y - m.y;
                const lens = Math.exp(-(dx * dx + dy * dy) / R2);
                y += dy * 0.75 * lens; // lines spread apart under the loupe
                const a = mask(x, y) * (0.55 + lens * 0.45);
                if (a <= 0.01) { started = false; continue; }
                ctx.strokeStyle = `rgba(150, 175, 230, ${a * 0.75})`;
                if (!started) { ctx.beginPath(); ctx.moveTo(x, y); started = true; continue; }
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        }
    }
    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        draw(dt);
    }
    function start() { if (running || reduced || !visible) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        m.tx = e.clientX - r.left; m.ty = e.clientY - r.top; m.active = true;
    });
    hero.addEventListener('pointerleave', () => { m.active = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);
    new ResizeObserver(resize).observe(hero);
    // The lines drift a little with the scroll, like the home backdrop.
    if (!reduced) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: s => { shift = s.progress * 160; if (!running) draw(0); } });
});

/* Cards dealt like a hand: rise over-rotated and settle into the fan --- */
if (!reduced) {
    qsa('[data-deal]').forEach(group => {
        gsap.from([...group.children], {
            y: 160, opacity: 0, scale: 0.92, rotation: i => (i % 2 ? 9 : -9), transformOrigin: '50% 100%',
            stagger: 0.09, duration: 1.3, ease: 'expo.out', clearProps: 'transform,opacity,transformOrigin',
            scrollTrigger: { trigger: group, start: 'top 85%' },
        });
    });
}

/* Pinned stack ("Cinco razones" of the home): one card at a time ------- */
qsa('[data-stack]').forEach(section => {
    const wrap = qs('.reasons__wrap', section);
    const items = qsa('.reason', section);
    const current = qsa('.reasons__current span', section);
    const bar = qs('.reasons__bar span', section);
    const n = items.length;
    const setIndex = i => {
        current.forEach(s => (s.style.transform = `translateY(${-i * 100}%)`));
        if (bar) bar.style.transform = `scaleX(${(i + 1) / n})`;
    };
    setIndex(0);
    if (reduced || innerHeight < 640) { current.forEach(s => (s.style.transform = 'none')); return; }
    section.classList.add('reasons--pinned');
    gsap.set(items, { transformOrigin: '50% 0' });
    gsap.set(items.slice(1), { opacity: 0, yPercent: 130 });
    const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
            trigger: wrap, start: 'top top', end: () => `+=${innerHeight * 0.8 * (n - 1)}`,
            pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: self => setIndex(Math.min(n - 1, Math.floor(self.progress * (n - 1) + 0.5))),
        },
    });
    items.forEach((it, i) => {
        if (!i) return;
        tl.to(it, { opacity: 1, duration: 0.35 }, i - 1)
            .to(it, { yPercent: 0, y: i * 24, duration: 1 }, i - 1)
            .to(items[i - 1], { scale: 0.93, duration: 1 }, i - 1);
    });
});

/* Footer: columns enter in sequence, the wordmark draws itself --------- */
if (!reduced) {
    const cols = qsa('.foot__col, .foot__claim, .faq__item');
    if (cols.length) {
        gsap.set(cols, { opacity: 0 });
        ScrollTrigger.batch(cols, {
            start: 'top 92%', once: true,
            onEnter: els => gsap.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.06 }),
        });
    }
    if (qs('.foot__mark svg')) {
        gsap.fromTo('.foot__mark svg', { clipPath: 'inset(0 100% 0 0)' }, {
            clipPath: 'inset(0 0% 0 0)', ease: 'none',
            scrollTrigger: { trigger: '.foot__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 },
        });
    }
}

window.addEventListener('load', () => ScrollTrigger.refresh());
