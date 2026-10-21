import { gsap, ScrollTrigger, SplitText, qs, qsa, reduced, fontsReady, introDone, openUnder } from './prisma-site.js';

// /nuestra-historia: Historia + Manifiesto in a single page (texto unificado,
// octubre 2026).

/* ------------------------------------------------------------------ */
/* Hero: "De hacer marketing" inside a glass bubble that bursts on      */
/* scroll into "a repensarlo por completo".                             */
/* ------------------------------------------------------------------ */
const hero = qs('.hero-bubble');
const canvas = qs('.hero-bubble__canvas', hero);
const t1 = qs('.hero-bubble__t1', hero);
const t2 = qs('.hero-bubble__t2', hero);
const note = qs('.hero-bubble__note', hero);
const center = qs('.hero-bubble__center', hero);
let bubble = null;

if (reduced) {
    hero.classList.add('is-static');
} else {
    const gl = document.createElement('canvas');
    const hasGL = !!(gl.getContext('webgl2') || gl.getContext('webgl'));
    if (!hasGL) hero.classList.add('no-webgl');
    const made = hasGL
        ? import('./bubble-hero.js').then(m => { bubble = m.createBubble(canvas); return bubble.ready; })
              .catch(err => { console.warn('Bubble fallback:', err); hero.classList.add('no-webgl'); })
        : Promise.resolve();

    Promise.all([fontsReady, introDone, made]).then(() => {
        // With WebGL the first line is drawn inside the bubble; the HTML
        // one stays (transparent) for screen readers. Without it, the HTML
        // letters do the same job.
        if (bubble) {
            const cs = getComputedStyle(t1);
            bubble.setTitle(['De hacer', 'marketing…'], { family: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), weight: cs.fontWeight });
            hero.classList.add('has-gl');
        }
        const chars = bubble ? [] : new SplitText(t1, { type: 'chars,words', charsClass: 'c' }).chars;
        const words = new SplitText(t2, { type: 'words', wordsClass: 'w2' }).words;
        gsap.set(t1, { visibility: 'visible' });
        gsap.set(words, { yPercent: 110, opacity: 0 });
        gsap.set([t2, note], { visibility: 'visible' });

        // The bubble inflates and the first line rises inside it.
        if (bubble) bubble.reform();
        else {
            gsap.from(chars, { yPercent: 120, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.025, delay: 0.25 });
            gsap.from('.hero-bubble__fallback', { scale: 0.4, opacity: 0, duration: 1.4, ease: 'expo.out' });
        }

        let burst = false;
        const pop = () => {
            burst = true;
            hero.classList.add('is-burst');
            gsap.killTweensOf([chars, words, center]);
            if (bubble) bubble.burst();
            else gsap.to(chars, {
                x: () => gsap.utils.random(-320, 320), y: () => gsap.utils.random(-240, 220),
                rotation: () => gsap.utils.random(-80, 80), scale: () => gsap.utils.random(0.4, 1.2),
                opacity: 0, duration: 1, ease: 'expo.out', stagger: { amount: 0.1, from: 'center' },
            });
            // Impact: the words slam in from big and blurred, from the centre
            // out, and the block recoils as they land.
            gsap.fromTo(words, { yPercent: 0, scale: 2.4, opacity: 0, filter: 'blur(18px)' }, {
                scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'expo.out',
                stagger: { each: 0.05, from: 'center' }, delay: 0.08, clearProps: 'filter',
            });
            gsap.fromTo(center, { y: -14 }, { y: 0, duration: 1.1, ease: 'elastic.out(1, 0.32)', delay: 0.3 });
        };
        const mend = () => {
            burst = false;
            hero.classList.remove('is-burst');
            gsap.killTweensOf([chars, words, center]);
            gsap.to(words, { yPercent: -60, scale: 1, opacity: 0, duration: 0.5, ease: 'power2.in', stagger: 0.03 });
            if (bubble) bubble.reform();
            else gsap.to(chars, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: { amount: 0.1, from: 'edges' }, delay: 0.1 });
        };

        // The surface tenses as you scroll; past the threshold it bursts. The
        // new line lands smaller and grows to its full size while the hero
        // lasts, and the note fades in under it. A gap between both
        // thresholds avoids flickering around the edge.
        // Individual `scale` / `translate`: the words keep their own transforms.
        const grow = v => { t2.style.scale = v.toFixed(4); };
        const showNote = v => { note.style.opacity = v.toFixed(3); note.style.translate = `0 ${((1 - v) * 24).toFixed(1)}px`; };
        showNote(0);
        ScrollTrigger.create({
            trigger: hero, start: 'top top', end: 'bottom bottom',
            onUpdate(self) {
                const p = self.progress;
                const tension = Math.min(1, p / 0.42);
                bubble?.setTension(tension);
                if (!bubble && !burst) gsap.set(t1, { scale: 1 + tension * 0.05 });
                const after = gsap.utils.clamp(0, 1, (p - 0.45) / 0.5);
                const from = innerWidth < 560 ? 0.84 : 0.6;
                grow(from + (1 - from) * after);
                showNote(burst ? gsap.utils.clamp(0, 1, (p - 0.55) / 0.25) : 0);
                if (!burst && p > 0.45) pop();
                else if (burst && p < 0.36) mend();
            },
        });
        ScrollTrigger.refresh();
    });
}

/* ------------------------------------------------------------------ */
/* El origen: Marco's clip only plays while it is on screen             */
/* ------------------------------------------------------------------ */
const marco = qs('.origin__figure video');
if (marco) {
    if (reduced) marco.removeAttribute('autoplay');
    else new IntersectionObserver(([en]) => { en.isIntersecting ? marco.play().catch(() => {}) : marco.pause(); }, { rootMargin: '120px' }).observe(marco);
    if (!reduced) {
        gsap.fromTo(marco, { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.origin', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
}

/* ------------------------------------------------------------------ */
/* El nombre: a field of dots that moves out of the cursor's way, and   */
/* an entrance (the blue opens to full bleed, the logo draws itself)    */
/* ------------------------------------------------------------------ */
const statement = qs('[data-statement]');
if (statement) {
    const field = qs('.statement__field', statement);
    const ctx = field.getContext('2d');
    let W = 0, H = 0, dots = [], running = false, visible = false, raf = 0;
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999, on: false };

    const build = () => {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        W = statement.clientWidth; H = statement.clientHeight;
        field.width = W * dpr; field.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#fff'; // reset by every resize of the canvas
        const gap = W < 760 ? 22 : 28;
        dots = [];
        for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) dots.push({ x, y, ox: 0, oy: 0, g: 0 });
        draw(0);
    };
    const R = () => (W < 760 ? 130 : 230);
    const draw = t => {
        ctx.clearRect(0, 0, W, H);
        const r = R();
        mouse.sx += (mouse.x - mouse.sx) * 0.14;
        mouse.sy += (mouse.y - mouse.sy) * 0.14;
        for (const d of dots) {
            const dx = d.x - mouse.sx, dy = d.y - mouse.sy;
            const dist = Math.hypot(dx, dy);
            const f = mouse.on && dist < r ? Math.pow(1 - dist / r, 2) : 0;
            const push = f * 34;
            const tx = dist ? (dx / dist) * push : 0, ty = dist ? (dy / dist) * push : 0;
            d.ox += (tx - d.ox) * 0.12; d.oy += (ty - d.oy) * 0.12; d.g += (f - d.g) * 0.12;
            // A slow diagonal swell keeps the field alive without the cursor.
            const wave = reduced ? 0 : (Math.sin((d.x + d.y) * 0.006 - t * 0.0011) + 1) * 0.5;
            ctx.globalAlpha = 0.16 + wave * 0.12 + d.g * 0.75;
            ctx.beginPath();
            ctx.arc(d.x + d.ox, d.y + d.oy, 1.1 + wave * 0.35 + d.g * 2.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    };
    const loop = t => { raf = requestAnimationFrame(loop); draw(t); };
    const start = () => { if (running || reduced || !visible) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    statement.addEventListener('pointermove', e => {
        const b = statement.getBoundingClientRect();
        mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
        if (!mouse.on) { mouse.sx = mouse.x; mouse.sy = mouse.y; }
        mouse.on = true;
    }, { passive: true });
    statement.addEventListener('pointerleave', () => { mouse.on = false; });
    new ResizeObserver(build).observe(statement);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(statement);

    if (!reduced) {
        const line = qs('.statement__line', statement);
        const text = qs('.statement__text', statement);
        // The blue arrives as a card and opens to full bleed with the scroll.
        openUnder(statement);
        gsap.fromTo(statement, { clipPath: 'inset(10% 5% 0% 5% round 56px 56px 0px 0px)' }, {
            clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'none',
            scrollTrigger: { trigger: statement, start: 'top bottom', end: 'top 15%', scrub: true },
        });

        // The logo animation ("i'm moral" → "immoral", then the bar) is played
        // by the scroll, frame by frame: a sequence of images seeks instantly,
        // a video does not. Loaded when the section gets close.
        const anim = qs('.statement__anim', statement);
        const actx = anim.getContext('2d');
        const total = +statement.dataset.logoFrames;
        const frames = [];
        let shown = -1, wanted = 0;
        const paint = i => {
            // Until a frame arrives, keep the nearest one already loaded.
            let k = i;
            while (k > 0 && !frames[k]?.complete) k--;
            if (!frames[k]?.complete || k === shown) return;
            shown = k;
            actx.clearRect(0, 0, anim.width, anim.height);
            actx.drawImage(frames[k], 0, 0, anim.width, anim.height);
        };
        new IntersectionObserver(([en], io) => {
            if (!en.isIntersecting) return;
            io.disconnect();
            for (let i = 0; i < total; i++) {
                const img = new Image();
                img.decoding = 'async';
                img.onload = () => { if (i <= wanted) { shown = -1; paint(wanted); } };
                img.src = `/imgs/logo-anim/f_${String(i).padStart(2, '0')}.webp`;
                frames[i] = img;
            }
        }, { rootMargin: '150% 0px' }).observe(statement);
        ScrollTrigger.create({
            trigger: statement, start: 'top 45%', end: 'top -10%', scrub: 0.4,
            onUpdate: self => { wanted = Math.round(self.progress * (total - 1)); paint(wanted); },
        });

        fontsReady.then(() => {
            const words = new SplitText(line, { type: 'words', mask: 'words', wordsClass: 'sw' }).words;
            gsap.set(words, { yPercent: 115 });
            gsap.set(text, { opacity: 0, y: 30 });
            gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 12%', once: true } })
                .to(words, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 0)
                .to(text, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' }, 0.4);
        });
    }
}

/* ------------------------------------------------------------------ */
/* Valores: pinned, one glass card at a time                            */
/* ------------------------------------------------------------------ */
const values = qs('.vals');
if (values) {
    const slides = qsa('.vals__slide', values);
    const dots = qsa('.vals__dot', values);
    // The number rolls like the counter of "Cinco razones" in the home.
    const digits = qsa('.vals__current span', values);
    let current = -1;
    const show = i => {
        if (i === current) return;
        const prev = current;
        current = i;
        slides.forEach((s, k) => {
            s.classList.toggle('is-active', k === i);
            s.classList.toggle('is-exit', k === prev);
        });
        if (prev >= 0) setTimeout(() => slides[prev]?.classList.remove('is-exit'), 600);
        dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
        digits.forEach(s => { s.style.transform = `translateY(${-i * 100}%)`; });
    };
    show(0);
    if (reduced) {
        values.classList.add('is-static');
    } else {
        ScrollTrigger.create({
            trigger: qs('.vals__track', values), start: 'top top', end: 'bottom bottom',
            onUpdate: self => show(Math.min(slides.length - 1, Math.floor(self.progress * slides.length))),
        });
    }
}
