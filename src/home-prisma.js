import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

// Exploration page: deliberately does not import main.js / style.css.
gsap.registerPlugin(ScrollTrigger, SplitText);

const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const body = document.body;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => window.innerWidth > 1024;


if (!reduced) root.classList.add('js-motion');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ------------------------------------------------------------------ */
/* Smooth scroll                                                       */
/* ------------------------------------------------------------------ */
let lenis = null;
if (!reduced) {
    lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

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

/* ------------------------------------------------------------------ */
/* Grain                                                               */
/* ------------------------------------------------------------------ */
(function grain() {
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
    qs('.grain').style.backgroundImage = `url(${c.toDataURL('image/png')})`;
})();

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
const nav = qs('[data-nav]');
const groups = qsa('.nav__group');
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

const toggle = qs('.nav__toggle');
const mmenu = qs('#mobile-menu');
function openMobileMenu() {
    mmenu.hidden = false;
    body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    lenis?.stop();
    if (!reduced) gsap.fromTo(qsa('.mmenu__inner > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.7, ease: 'expo.out' });
}
function closeMobileMenu() {
    if (mmenu.hidden) return;
    mmenu.hidden = true;
    body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    lenis?.start();
}
toggle.addEventListener('click', () => (mmenu.hidden ? openMobileMenu() : closeMobileMenu()));
mmenu.addEventListener('click', e => { if (e.target.closest('a')) closeMobileMenu(); });
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const wasOpen = !mmenu.hidden;
    closeMobileMenu();
    closeGroups();
    if (wasOpen) toggle.focus();
});
matchMedia('(min-width: 1181px)').addEventListener('change', closeMobileMenu);

ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
        const y = self.scroll();
        const hide = y > 160 && self.direction === 1 && !groups.some(g => g.classList.contains('is-open')) && mmenu.hidden;
        nav.classList.toggle('is-hidden', hide);
    },
});

gsap.to('.scroll-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

/* ------------------------------------------------------------------ */
/* Cursor label + magnetic buttons                                     */
/* ------------------------------------------------------------------ */
if (finePointer) {
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

    qsa('[data-magnetic]').forEach(el => {
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

/* ------------------------------------------------------------------ */
/* Hero (three.js) + intro                                             */
/* ------------------------------------------------------------------ */
let hero = null;
const heroCanvas = qs('.hero__canvas');

const heroReady = (async () => {
    try {
        const test = document.createElement('canvas');
        if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('no webgl');
        const { createPrismaHero } = await import('./home-prisma-hero.js');
        hero = createPrismaHero(heroCanvas, { reduced });
        await hero.ready;
    } catch (err) {
        console.warn('Prisma hero fallback:', err);
        root.classList.add('no-webgl');
    }
})();

// Title split: chars rise inside each line (lines clip, descenders included).
const titleLines = qsa('.hero__line');
qsa('.hero__line').forEach(l => { l.style.overflow = 'clip'; l.style.paddingBottom = '.14em'; l.style.marginBottom = '-.14em'; });
let titleChars = [];

function splitTitle() {
    titleChars = [];
    titleLines.forEach(line => {
        const st = new SplitText(line, { type: 'words,chars', wordsClass: 'wd', charsClass: 'c' });
        titleChars.push(...st.chars);
    });
}

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

let introDone = false;
function showFinalState() {
    if (introDone) return;
    introDone = true;
    gsap.killTweensOf(['.intro__line', '.intro__half', titleChars, '.mark__bar', '.nav__bar', '[data-hero-fade]']);
    qs('.intro')?.remove();
    body.classList.remove('is-loading');
    lenis?.start();
    titleLines.forEach(l => (l.style.visibility = 'visible'));
    gsap.set(titleChars, { yPercent: 0 });
    gsap.set('.mark__bar', { scaleX: 1 });
    gsap.set('[data-hero-fade]', { opacity: 1, y: 0 });
    gsap.set('.nav__bar', { yPercent: 0 });
    heroReady.then(() => { hero?.setIntro(1); hero?.setBarIntro(1); });
    ScrollTrigger.refresh();
}

async function runIntro() {
    await fontsReady;
    splitTitle();
    gsap.set('.mark__bar', { rotation: -2.45, scaleX: 0, transformOrigin: 'left center' });

    // Reduced motion, or a tab opened in the background (rAF is frozen there):
    // go straight to the composed hero.
    if (reduced || document.hidden) { showFinalState(); return; }

    const intro = qs('.intro');
    intro.classList.add('is-running');
    body.classList.add('is-loading');
    lenis?.stop();
    const onHidden = () => { if (document.hidden) showFinalState(); };
    document.addEventListener('visibilitychange', onHidden);

    gsap.set(titleChars, { yPercent: 118 });
    titleLines.forEach(l => (l.style.visibility = 'visible'));
    gsap.set('[data-hero-fade]', { opacity: 0, y: 24 });
    gsap.set('.nav__bar', { yPercent: -160 });

    // The line draws straight away; the page opens as soon as it is drawn and
    // the 3D scene is ready (or after 1.6 s at most).
    const lineDrawn = new Promise(r => gsap.to('.intro__line', { clipPath: 'inset(0 0% 0 0)', duration: 0.75, ease: 'expo.inOut', delay: 0.05, onComplete: r }));
    await Promise.all([lineDrawn, Promise.race([heroReady, new Promise(r => setTimeout(r, 1600))])]);
    if (introDone) return;

    const finish = () => {
        document.removeEventListener('visibilitychange', onHidden);
        if (introDone) return;
        introDone = true;
        intro.remove();
        body.classList.remove('is-loading');
        lenis?.start();
        ScrollTrigger.refresh();
    };
    setTimeout(() => { if (!introDone) showFinalState(); }, 6000);

    const iv = { intro: 0, bar: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to('.intro__half--top', { yPercent: -101, duration: 1.1, ease: 'expo.inOut' }, 0)
        .to('.intro__half--bottom', { yPercent: 101, duration: 1.1, ease: 'expo.inOut' }, 0)
        .to('.intro__line', { scaleY: 0, opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.25)
        .to(iv, { bar: 1, duration: 1.3, ease: 'expo.inOut', onUpdate: () => hero?.setBarIntro(iv.bar) }, 0.1)
        .to(iv, { intro: 1, duration: 2, ease: 'expo.out', onUpdate: () => hero?.setIntro(iv.intro) }, 0.25)
        .to(titleChars, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.022 }, 0.4)
        .to('.mark__bar', { scaleX: 1, duration: 1, ease: 'expo.inOut' }, 1)
        .to('.nav__bar', { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.6)
        .to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.8);

    // Skip on interaction.
    const skip = () => tl.progress() < 0.9 && tl.timeScale(3);
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('keydown', skip, { once: true });
}

runIntro().then(initHeroScroll);

function initHeroScroll() {
    const words = [];
    qsa('[data-scrub-words]').forEach(p => {
        const st = new SplitText(p, { type: 'words', wordsClass: 'w' });
        words.push(...st.words);
    });
    if (reduced) gsap.set(words, { opacity: 1 });

    // The glass travels to its second position when the manifesto comes in, as
    // one eased move (not scrubbed), and back when scrolling up again.
    const stage = { v: 0, target: 0 };
    const goStage = target => {
        if (stage.target === target) return;
        stage.target = target;
        gsap.to(stage, {
            v: target,
            duration: reduced ? 0 : 1.5,
            ease: 'expo.inOut',
            overwrite: true,
            onUpdate: () => hero?.setStage(stage.v),
        });
    };

    const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom bottom',
            scrub: reduced ? true : 0.6,
            onUpdate: self => {
                hero?.setProgress(Math.min(1, self.progress / 0.42));
                goStage(self.progress > 0.2 ? 1 : 0);
            },
        },
    });
    if (reduced) {
        tl.to('.hero__title', { opacity: 0, duration: 0.1 }, 0.04)
            .to('.hero__badge', { opacity: 0, duration: 0.08 }, 0)
            .set('.hero__manifesto', { visibility: 'visible' }, 0.12)
            .fromTo('.hero__manifesto', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.12)
            .to({}, { duration: 0.1 }, 0.9);
        return;
    }
    // 0 → .48: unhurried hand-over (title fully out first, then the manifesto
    // comes in) · .48 → .86: the words, at the pace that already worked.
    tl.to(titleChars, { yPercent: -175, duration: 0.24, stagger: 0.004, ease: 'power1.in' }, 0.02)
        .to('.hero__title', { opacity: 0, duration: 0.04 }, 0.34)
        .to('.mark__bar', { scaleX: 0, transformOrigin: 'right center', duration: 0.16 }, 0.04)
        .to('.hero__badge', { opacity: 0, y: -24, duration: 0.18 }, 0)
        .set('.hero__manifesto', { visibility: 'visible' }, 0.36)
        .fromTo('.hero__manifesto', { y: 140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.14, ease: 'power2.out' }, 0.36)
        .to(words, { opacity: 1, duration: 0.04, stagger: { amount: 0.34 } }, 0.48)
        .to({}, { duration: 0.1 }, 0.9);
}

/* ------------------------------------------------------------------ */
/* Section reveals                                                     */
/* ------------------------------------------------------------------ */
fontsReady.then(() => {
    qsa('[data-split]').forEach(el => {
        if (reduced) return;
        const st = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        gsap.from(st.lines, {
            yPercent: 112,
            duration: 1.3,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onComplete: () => st.revert(),
        });
    });
    qsa('[data-reveal]').forEach(el => {
        if (reduced) return;
        gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    ScrollTrigger.refresh();
});

if (!reduced) {
    // Lists and cards enter in sequence.
    const batchIn = (selector, vars = {}) => ScrollTrigger.batch(selector, {
        start: 'top 92%',
        once: true,
        onEnter: els => gsap.fromTo(els, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, ...vars }),
    });
    gsap.set('.door, .svc__item, .faq__item, .foot__col, .foot__claim', { opacity: 0 });
    batchIn('.door');
    batchIn('.svc__item', { stagger: 0.05 });
    batchIn('.faq__item', { stagger: 0.05 });
    batchIn('.foot__col, .foot__claim');
}

/* ------------------------------------------------------------------ */
/* Partner logos (Supabase, same source as the live home)               */
/* ------------------------------------------------------------------ */
(async function partnerLogos() {
    const section = qs('#partner-logos-section');
    const track = qs('#partner-logos-track');
    try {
        const { renderPartnerLogos } = await import('./partnerLogos.js');
        await renderPartnerLogos(track);
        if (!track.children.length) section.style.display = 'none';
        ScrollTrigger.refresh();
    } catch (err) {
        console.warn('Partner logos unavailable:', err);
        section.style.display = 'none';
    }
})();

/* ------------------------------------------------------------------ */
/* Accordions (services + FAQ)                                          */
/* ------------------------------------------------------------------ */
let refreshTimer = 0;
const refreshSoon = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 820); };

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
            refreshSoon();
        });
    });
});

/* ------------------------------------------------------------------ */
/* Doors: images shuffle behind the open door, slow down, stop on last  */
/* ------------------------------------------------------------------ */
(function doorShuffle() {
    qsa('.door').forEach(door => {
        const imgs = qsa('.door__media img', door);
        if (!imgs.length) return;
        const last = imgs.length - 1;
        // Two passes through the deck, then land on the last image.
        const seq = [...imgs.keys()].slice(0, last).concat([...imgs.keys()].slice(0, last), [last]);
        // Fast start, short braking: only the last few frames slow down.
        const delay = k => 40 + 70 * Math.pow(k / (seq.length - 1), 3.4);
        let timer = 0;
        const show = (i, final) => {
            imgs.forEach((im, k) => { im.classList.toggle('is-on', k === i); im.classList.remove('is-final'); });
            if (final) { void imgs[i].offsetWidth; imgs[i].classList.add('is-final'); }
        };
        const play = () => {
            clearTimeout(timer);
            if (reduced) { show(last, false); return; }
            let k = 0;
            const step = () => {
                show(seq[k], k === seq.length - 1);
                if (++k < seq.length) timer = setTimeout(step, delay(k));
            };
            step();
        };
        const stop = () => clearTimeout(timer);

        if (finePointer) {
            door.addEventListener('pointerenter', play);
            door.addEventListener('pointerleave', stop);
        } else {
            // Touch: the door opens while it sits in the middle of the screen.
            new IntersectionObserver(([en]) => {
                door.classList.toggle('is-active', en.isIntersecting);
                if (en.isIntersecting) play(); else stop();
            }, { rootMargin: '-35% 0px -35% 0px' }).observe(door);
        }
        door.addEventListener('focus', play);
        door.addEventListener('blur', stop);
    });
})();

/* ------------------------------------------------------------------ */
/* Talk: field of short brand lines that turn toward the pointer        */
/* ------------------------------------------------------------------ */
(function talkField() {
    const canvas = qs('.talk__field');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const BASE = -0.0428;
    const GAP = 28;
    let w = 0, h = 0, pts = [], raf = 0, running = false, visible = false, t = 0, last = 0;
    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

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
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

    function draw(dt) {
        t += dt;
        if (!m.active || !finePointer) {
            // A phantom pointer keeps the field alive on touch / idle.
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
            const d2 = dx * dx + dy * dy;
            const infl = Math.exp(-d2 / (2 * R * R));
            const wave = Math.sin(p.x * 0.006 + p.y * 0.004 - t * 0.7) * 0.25;
            const toward = Math.atan2(dy, dx);
            const target = BASE + wave + wrap(toward - (BASE + wave)) * infl;
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
})();

/* ------------------------------------------------------------------ */
/* Talk: the closing card rises over the previous section               */
/* ------------------------------------------------------------------ */
(function talkWipe() {
    const entry = qs('.talk-entry');
    const talk = qs('.talk');
    const under = qs('#puertas');
    if (reduced || !entry || !talk || !under || innerHeight < 600) return;

    // The previous section stays put while the card slides over it: the card is
    // held fixed in the viewport and revealed from the bottom with a rounded edge.
    const bounds = { trigger: entry, start: 'top bottom', end: 'top top', invalidateOnRefresh: true };
    ScrollTrigger.create({ ...bounds, id: 'talk-underlay', pin: under, pinSpacing: false, anticipatePin: 1 });
    gsap.timeline({ scrollTrigger: { ...bounds, id: 'talk-wipe', scrub: true } })
        .fromTo(talk, { y: () => -innerHeight }, { y: 0, duration: 1, ease: 'none' }, 0)
        .fromTo(talk, { clipPath: 'inset(100% 0% 0% 0% round 80px 80px 0px 0px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', duration: 1, ease: 'power1.inOut' }, 0)
        .fromTo('.talk__content', { y: 75 }, { y: 0, duration: 1, ease: 'power1.inOut' }, 0);
})();

/* ------------------------------------------------------------------ */
/* Reasons: pinned, one card at a time + counter                        */
/* ------------------------------------------------------------------ */
(function reasons() {
    const section = qs('.reasons');
    const wrap = qs('.reasons__wrap');
    const items = qsa('.reason');
    const current = qsa('.reasons__current span');
    const bar = qs('.reasons__bar span');
    const setIndex = i => {
        current.forEach(s => (s.style.transform = `translateY(${-i * 100}%)`));
        if (bar) bar.style.transform = `scaleX(${(i + 1) / items.length})`;
    };
    setIndex(0);
    // Without motion (or on very short screens) the cards are a plain list.
    if (reduced || innerHeight < 640) { current.forEach(s => (s.style.transform = 'none')); return; }

    section.classList.add('reasons--pinned');
    const n = items.length;
    // On desktop the pin holds one extra screen at the end: "Resultados" rises
    // over it as a curtain (see results()). Nothing transforms this section
    // itself, so its fixed pin stays intact.
    const curtain = innerWidth > 860 && innerHeight >= 600;
    if (curtain) section.dataset.curtain = '1';
    const STEP = 24; // px each new card sits below the previous one
    gsap.set(items, { transformOrigin: '50% 0' });
    gsap.set(items.slice(1), { opacity: 0, yPercent: 130 });

    const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: () => `+=${innerHeight * 0.8 * (n - 1) + (curtain ? innerHeight : 0)}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: self => setIndex(Math.min(n - 1, Math.floor(self.progress * self.animation.duration() + 0.5))),
        },
    });
    items.forEach((it, i) => {
        if (!i) return;
        tl.to(it, { opacity: 1, duration: 0.35 }, i - 1)
            .to(it, { yPercent: 0, y: i * STEP, duration: 1 }, i - 1)
            .to(items[i - 1], { scale: 0.93, duration: 1 }, i - 1);
    });
    if (curtain) tl.to({}, { duration: 1.25 }); // one screen, at 0.8 screen per card
})();

/* ------------------------------------------------------------------ */
/* How we do it: scrollytelling                                         */
/* ------------------------------------------------------------------ */
(function how() {
    const section = qs('.how');
    if (!section || section.hidden) return; // section kept in the markup but hidden
    const steps = qsa('.how__step');
    const verbs = qsa('.how__verb');
    const imgs = qsa('.how__frame img');
    let active = 0;
    const set = i => {
        if (i === active) return;
        active = i;
        steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
        verbs.forEach((v, k) => v.classList.toggle('is-active', k === i));
        imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    };
    steps[0].classList.add('is-active');
    steps.forEach((step, i) => {
        ScrollTrigger.create({
            trigger: step,
            start: 'top 62%',
            end: 'bottom 62%',
            onToggle: self => { if (self.isActive) set(i); },
        });
    });
})();

/* ------------------------------------------------------------------ */
/* Results: title zoom, one figure at a time, horizontal case gallery    */
/* ------------------------------------------------------------------ */
(function results() {
    const section = qs('.results');
    if (!section) return;
    const stage = qs('.results__stage', section);
    const stageIn = qs('.results__stage-in', section);
    const cutsEl = qs('.cuts', section);
    const cuts = qsa('.cut', section);

    const figure = cut => {
        const counts = qsa('[data-count]', cut);
        const o = { v: 0 };
        return {
            a: qs('.cut__half--a', cut),
            b: qs('.cut__half--b', cut),
            label: qs('.cut__label', cut),
            o,
            end: Number(counts[0].dataset.count),
            write: () => counts.forEach(c => (c.textContent = Math.round(o.v))),
        };
    };

    // The halves come slightly apart under the pointer, and close again.
    if (finePointer) {
        cuts.forEach(cut => {
            const { a, b } = figure(cut);
            const ax = gsap.quickTo(a, 'x', { duration: 0.7, ease: 'power3.out' });
            const bx = gsap.quickTo(b, 'x', { duration: 0.7, ease: 'power3.out' });
            const num = qs('.cut__num', cut);
            num.addEventListener('pointerenter', () => { ax(-14); bx(14); });
            num.addEventListener('pointerleave', () => { ax(0); bx(0); });
        });
    }

    const lead = qs('[data-scrub-read]');
    if (lead && !reduced) {
        fontsReady.then(() => {
            const st = new SplitText(lead, { type: 'words', wordsClass: 'w' });
            gsap.to(st.words, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: lead, start: 'top 85%', end: 'bottom 45%', scrub: true } });
        });
    }

    initCases();
    if (reduced) return;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 861px) and (min-height: 600px)', () => {
        // 0 · Curtain, like "El crecimiento real empieza…": the section rises
        // over the held last screen of the reasons with its content still, so
        // what comes up is the giant title filling the screen.
        if (qs('#razones')?.dataset.curtain === '1') {
            section.classList.add('results--curtain');
            const bounds = { trigger: section, start: 'top bottom', end: 'top top', invalidateOnRefresh: true };
            gsap.timeline({ scrollTrigger: { ...bounds, scrub: true } })
                .fromTo(section, { clipPath: 'inset(0% 0% 0% 0% round 80px 80px 0px 0px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'power1.inOut', duration: 1 }, 0)
                .fromTo(stageIn, { y: () => -innerHeight }, { y: 0, ease: 'none', duration: 1 }, 0)
                .fromTo('.reasons__wrap', { scale: 1, opacity: 1 }, { scale: 0.94, opacity: 0.3, transformOrigin: '50% 40%', ease: 'power1.in', duration: 1 }, 0);
        }

        // 1 · "Resultados" starts so large that one stroke of its R fills the
        // screen, then shrinks into place.
        const title = qs('.results__head .h2', section);
        const headBtn = qs('.results__head-btn', section);
        let stem = stemPoint(title);
        fontsReady.then(() => { stem = stemPoint(title); ScrollTrigger.refresh(); });
        const zoom = () => Math.max(40, (Math.max(innerWidth, innerHeight) / Math.max(4, stem.w)) * 1.25);

        // 2 · Each figure appears alone in the middle of the screen, locks and
        // counts, then shrinks into its place in the row; the three end up together.
        // Scale origin is the column's top-left corner, so the scaled figure
        // (not the whole column) is what lands in the middle.
        const SCALE = 2;
        const centre = cut => {
            const num = qs('.cut__num', cut);
            return {
                x: stageIn.clientWidth / 2 - (cutsEl.offsetLeft + cut.offsetLeft + (num.offsetWidth * SCALE) / 2),
                y: stageIn.clientHeight * 0.5 - (cutsEl.offsetTop + cut.offsetTop + (cut.offsetHeight * SCALE) / 2),
            };
        };
        // ScrollTrigger restores progress silently on refresh (no callbacks), so
        // the counters are also rewritten on every update/refresh of the trigger.
        const figs = cuts.map(figure);
        const writeAll = () => figs.forEach(f => f.write());
        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: stage, start: 'top top', end: () => `+=${innerHeight * 3.2}`,
                pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
                onUpdate: writeAll, onRefresh: writeAll,
            },
        });
        tl.fromTo(title, {
            scale: () => zoom(),
            x: () => stageIn.clientWidth / 2 - (title.offsetLeft + stem.x),
            y: () => innerHeight / 2 - (title.offsetTop + stem.y),
            transformOrigin: () => `${stem.x}px ${stem.y}px`,
        }, { scale: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.inOut', force3D: false }, 0)
            .fromTo(headBtn, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.95);

        const T0 = 1.3;
        cuts.forEach((cut, i) => {
            const f = figs[i];
            f.write();
            const t0 = T0 + i * 1.5;
            tl.set(cut, { x: () => centre(cut).x, y: () => centre(cut).y, scale: SCALE, transformOrigin: '0% 0%', opacity: 0 }, 0)
                .to(cut, { opacity: 1, duration: 0.12 }, t0)
                .fromTo(f.a, { xPercent: -26 }, { xPercent: 0, duration: 0.55, ease: 'power3.out' }, t0)
                .fromTo(f.b, { xPercent: 26 }, { xPercent: 0, duration: 0.55, ease: 'power3.out' }, t0)
                .to(f.o, { v: f.end, duration: 0.55, ease: 'power2.out', onUpdate: f.write }, t0)
                .fromTo(f.label, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.25 }, t0 + 0.45)
                .to(cut, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power3.inOut' }, t0 + 0.9);
        });
        // Finally the row of three settles in the middle of the stage.
        tl.to(cutsEl, { y: () => stageIn.clientHeight * 0.56 - (cutsEl.offsetTop + cutsEl.offsetHeight / 2), duration: 0.6, ease: 'power2.inOut' })
            .to({}, { duration: 0.6 });

        // 3 · Cases travel horizontally while the panel is pinned.
        const pin = qs('.gallery__pin');
        const track = qs('.gallery__track');
        const vp = qs('.gallery__viewport');
        const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
        const h = gsap.to(track, {
            x: () => -dist(), ease: 'none',
            scrollTrigger: {
                trigger: pin, start: 'top top', end: () => `+=${dist() * 1.1}`,
                pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
            },
        });
        qsa('.case', track).forEach(c => {
            gsap.from(c, {
                rotation: 7, yPercent: 16, ease: 'none',
                scrollTrigger: { trigger: c, containerAnimation: h, start: 'left 105%', end: 'left 62%', scrub: true },
            });
        });
    });

    mm.add('(max-width: 860px), (max-height: 599px)', () => {
        cuts.forEach((cut, i) => {
            const f = figure(cut);
            f.write();
            const dir = i % 2 ? -1 : 1;
            gsap.timeline({ scrollTrigger: { trigger: cut, start: 'top 94%', end: 'top 45%', scrub: 0.8 } })
                .fromTo(f.a, { xPercent: -24 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power3.out', duration: 1 }, 0)
                .fromTo(f.b, { xPercent: 24 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power3.out', duration: 1 }, 0)
                .to(f.o, { v: f.end, ease: 'power2.out', duration: 1, onUpdate: f.write }, 0);
        });
    });
})();

// Finds the middle of the first letter's vertical stem by drawing it on a
// canvas with the element's own font; falls back to Lexend's proportions.
function stemPoint(el) {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const letter = el.textContent.trim()[0] || 'R';
    const lineH = parseFloat(cs.lineHeight) || size * 0.95;
    const fallback = { x: size * 0.17, y: lineH * 0.62, w: size * 0.18 };
    try {
        const W = Math.ceil(size * 1.3), H = Math.ceil(size * 1.5);
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
        const m = ctx.measureText(letter);
        const base = Math.round(size * 1.1);
        ctx.fillText(letter, 0, base);
        const cap = m.actualBoundingBoxAscent;
        const row = Math.round(base - cap * 0.22); // low enough to miss the bowl of an R
        const px = ctx.getImageData(0, row, W, 1).data;
        let start = -1, end = -1;
        for (let x = 0; x < W; x++) {
            if (px[x * 4 + 3] > 200) { if (start < 0) start = x; end = x; }
            else if (start >= 0) break;
        }
        if (start < 0 || !m.fontBoundingBoxAscent) return fallback;
        const baseline = (lineH - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
        return { x: (start + end) / 2, y: baseline - cap * 0.22, w: end - start + 1 };
    } catch (_) {
        return fallback;
    }
}

/* Cases: hover video + tilt; data refreshed from Supabase (same source and
   order as /casos-de-exito, which is generated from the case_studies table). */
function initCases() {
    const cards = qsa('[data-cases] .case');

    cards.forEach(c => {
        const video = qs('video', c);
        if (video) {
            c.addEventListener('pointerenter', () => {
                video.play().then(() => c.classList.add('is-playing')).catch(() => {});
            });
            c.addEventListener('pointerleave', () => { video.pause(); c.classList.remove('is-playing'); });
        }
        if (!finePointer || reduced) return;
        const inner = qs('.case__inner', c);
        const media = qs('.case__media', c);
        gsap.set(inner, { transformPerspective: 1200 });
        const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.7, ease: 'power3.out' });
        const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const mx = gsap.quickTo(media, 'x', { duration: 0.9, ease: 'power3.out' });
        const my = gsap.quickTo(media, 'y', { duration: 0.9, ease: 'power3.out' });
        c.addEventListener('pointermove', e => {
            const r = c.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            ry(px * 12); rx(-py * 10); mx(-px * 24); my(-py * 24);
        });
        c.addEventListener('pointerleave', () => { rx(0); ry(0); mx(0); my(0); });
    });

    (async () => {
        try {
            const { supabase } = await import('./supabaseClient.js');
            const { data, error } = await supabase
                .from('case_studies')
                .select('slug, brand_name, sector, resultado, cover_image_url, cover_image_alt')
                .eq('is_active', true)
                .order('position', { ascending: true })
                .limit(cards.length);
            if (error || !data?.length) return;
            const src = url => (/^(https?:)?\//.test(url) ? url : `/${url}`);
            cards.forEach((c, i) => {
                const cs = data[i];
                if (!cs) { c.hidden = true; return; }
                c.href = `caso-${cs.slug}.html`;
                c.dataset.slug = cs.slug;
                const img = qs('.case__duo', c);
                img.src = src(cs.cover_image_url);
                img.alt = cs.cover_image_alt || `Caso de éxito ${cs.brand_name}`;
                qs('.case__video', c).src = `/videos/casos/${cs.slug}.mp4`;
                qs('.case__name', c).textContent = cs.brand_name;
                const [sector, result] = qsa('.case__tag', c);
                sector.textContent = cs.sector;
                result.textContent = cs.resultado;
            });
            ScrollTrigger.refresh();
        } catch (err) {
            console.warn('Casos de éxito: se mantiene el respaldo estático.', err);
        }
    })();
}

if (!reduced) {
    gsap.fromTo('.foot__mark svg', { clipPath: 'inset(0 100% 0 0)' }, {
        clipPath: 'inset(0 0% 0 0)', ease: 'none',
        scrollTrigger: { trigger: '.foot__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 },
    });
}

/* ------------------------------------------------------------------ */
/* Testimonials: an invisible 3D globe of bubbles around the title       */
/* ------------------------------------------------------------------ */
(function globe() {
    const el = qs('[data-cloud]');
    if (!el) return;
    const field = qs('.cloud__field', el);
    const originals = qsa('.bubble', field);
    const mq = matchMedia('(min-width: 861px)');
    const N = 15;
    const GOLDEN = Math.PI * (3 - Math.sqrt(5));

    let items = [];
    let raf = 0;
    let visible = false;
    let io = null;
    let cleanup = [];

    // Points evenly spread on a sphere (Fibonacci lattice).
    const points = [...Array(N)].map((_, i) => {
        const y = 1 - ((i + 0.5) * 2) / N;
        const r = Math.sqrt(1 - y * y);
        return { x: Math.cos(i * GOLDEN) * r, y, z: Math.sin(i * GOLDEN) * r };
    });

    // Give each point a testimonial so that copies of the same one end up as
    // far apart as possible (greedy, balanced: at most ceil(N/3) each).
    function assign() {
        const k = originals.length;
        const cap = Math.ceil(N / k);
        const byT = [...Array(k)].map(() => []);
        return points.map(p => {
            let best = -1, bestScore = -Infinity;
            for (let t = 0; t < k; t++) {
                if (byT[t].length >= cap) continue;
                const near = byT[t].reduce((m, q) => Math.min(m, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z)), 4);
                const score = near - byT[t].length * 0.01;
                if (score > bestScore) { bestScore = score; best = t; }
            }
            byT[best].push(p);
            return best;
        });
    }

    function build() {
        el.classList.add('cloud--live');
        const used = new Set();
        assign().forEach((t, i) => {
            let b;
            if (!used.has(t)) { b = originals[t]; used.add(t); }
            else {
                b = originals[t].cloneNode(true);
                b.classList.add('bubble--echo');
                b.setAttribute('aria-hidden', 'true');
                qsa('a', b).forEach(a => (a.tabIndex = -1));
                field.appendChild(b);
            }
            items.push({ el: b, p: points[i], hover: false });
        });

        const state = { yaw: 0.4, pitch: -0.32, speed: 0.12, targetSpeed: 0.12, px: 0, py: 0, grow: reduced ? 1 : 0.35, alpha: reduced ? 1 : 0 };
        const anyHover = () => items.some(it => it.hover);

        items.forEach(it => {
            const enter = () => { it.hover = true; };
            const leave = () => { it.hover = false; };
            it.el.addEventListener('pointerenter', enter);
            it.el.addEventListener('pointerleave', leave);
            it.el.addEventListener('focusin', enter);
            it.el.addEventListener('focusout', leave);
        });
        const onMove = e => {
            const r = el.getBoundingClientRect();
            state.px = (e.clientX - r.left) / r.width - 0.5;
            state.py = (e.clientY - r.top) / r.height - 0.5;
        };
        if (finePointer) { el.addEventListener('pointermove', onMove); cleanup.push(() => el.removeEventListener('pointermove', onMove)); }

        function render(dt) {
            const W = el.clientWidth, H = el.clientHeight;
            const R = Math.min(W * 0.3, H * 0.4) * state.grow;
            const cx = W / 2, cy = H / 2;
            state.targetSpeed = anyHover() ? 0 : 0.12 + state.px * 0.5;
            state.speed += (state.targetSpeed - state.speed) * Math.min(1, dt * 3);
            state.yaw += state.speed * dt;
            const pitch = state.pitch + state.py * 0.35;
            const cyw = Math.cos(state.yaw), syw = Math.sin(state.yaw);
            const cp = Math.cos(pitch), sp = Math.sin(pitch);
            items.forEach(it => {
                const { x, y, z } = it.p;
                // Rotate around Y (yaw) then X (pitch).
                const x1 = x * cyw + z * syw;
                const z1 = -x * syw + z * cyw;
                const y2 = y * cp - z1 * sp;
                const z2 = y * sp + z1 * cp;
                const d = (z2 + 1) / 2; // 0 back … 1 front
                const s = it.hover ? 1 : 0.6 + 0.4 * d; // a hovered bubble comes forward
                const X = cx + x1 * R * 1.6;
                const Y = cy + y2 * R;
                it.el.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
                it.el.style.zIndex = it.hover ? 200 : Math.round(d * 100);
                it.el.style.setProperty('--o', (0.16 + 0.84 * Math.pow(d, 1.5)) * state.alpha);
                it.el.style.setProperty('--a', state.alpha);
            });
        }

        let last = performance.now();
        const loop = now => {
            raf = requestAnimationFrame(loop);
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            render(dt);
        };
        io = new IntersectionObserver(([en]) => {
            visible = en.isIntersecting;
            cancelAnimationFrame(raf);
            if (visible && !reduced) { last = performance.now(); raf = requestAnimationFrame(loop); }
            else render(0);
        });
        io.observe(el);
        render(0);

        if (!reduced) {
            // First only the title, large, to be read; then, while the section
            // is held, it shrinks and the globe of testimonials opens around it.
            const title = qs('.cloud__title', el);
            gsap.set(title, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
            const intro = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: { trigger: el, start: 'top top', end: '+=90%', pin: true, scrub: 0.8, anticipatePin: 1 },
            });
            intro.fromTo(title, { scale: 1.9 }, { scale: 1, duration: 0.5, ease: 'power2.inOut' }, 0.25)
                .to(state, { grow: 1, alpha: 1, duration: 0.6, ease: 'power2.out' }, 0.4);
            cleanup.push(() => { intro.scrollTrigger?.kill(); intro.kill(); gsap.set(title, { clearProps: 'all' }); });
        }
    }

    function destroy() {
        cancelAnimationFrame(raf);
        io?.disconnect();
        cleanup.forEach(fn => fn());
        cleanup = [];
        items.forEach(({ el: b }) => {
            if (b.classList.contains('bubble--echo')) { b.remove(); return; }
            b.removeAttribute('style');
        });
        items = [];
        el.classList.remove('cloud--live');
    }

    if (mq.matches) build();
    mq.addEventListener('change', () => { destroy(); if (mq.matches) build(); ScrollTrigger.refresh(); });
})();

window.addEventListener('load', () => ScrollTrigger.refresh());
