import { gsap, ScrollTrigger, qs, qsa, reduced, finePointer, introDone, heroIn, talkWipe } from './prisma-site.js';
import { supabase } from './supabaseClient.js';

// /equipo on the Prisma design. People and job openings still come from
// Supabase (team_members / job_openings) and are managed from the internal
// panel, exactly as before: position picks the order.

const esc = str => {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
};

/* ------------------------------------------------------------------ */
/* Hero: the testimonials globe of the home, with the team               */
/* ------------------------------------------------------------------ */
// Same behaviour as the home (src/home-prisma.js): bubbles sit on an
// invisible sphere that turns around the title; it stops when a bubble is
// hovered and the pointer steers it. Here it opens on arrival (it is the
// hero) and spreads out as you scroll away. Each bubble is a post: the
// person, and on hover their portrait with the actions of a social feed.
const hero = qs('.hero-team');
const cloud = qs('[data-cloud]', hero);
const field = qs('.cloud__field', cloud);
heroIn(hero);

const icon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
    heart: icon('<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"/>'),
    comment: icon('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.4-4.5A8.4 8.4 0 1 1 20.5 11.6z"/>'),
    send: icon('<path d="M21.5 3 10.6 13.4"/><path d="M21.5 3 14.8 21l-4.2-7.6L3 9.3z"/>'),
    save: icon('<path d="M18.5 21 12 16.4 5.5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5z"/>'),
    dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
};

const bubbleHTML = m => `
    <article class="bubble bubble--person" role="listitem">
        <div class="bubble__par"><div class="bubble__float"><div class="bubble__card">
            <div class="bubble__head">
                <span class="bubble__ring"><img class="bubble__avatar" src="${esc(m.image_url)}" alt="" loading="lazy" decoding="async"></span>
                <span class="bubble__who"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small></span>
                <span class="bubble__dots">${ICONS.dots}</span>
            </div>
            <div class="bubble__more"><div>
                <img class="bubble__portrait" src="${esc(m.image_url)}" alt="${esc(m.name)}, ${esc(m.role)}" loading="lazy" decoding="async">
                <div class="bubble__actions">
                    <button class="bubble__like" type="button" aria-pressed="false" aria-label="Me gusta">${ICONS.heart}</button>
                    <span class="bubble__act" aria-hidden="true">${ICONS.comment}</span>
                    <span class="bubble__act" aria-hidden="true">${ICONS.send}</span>
                    <span class="bubble__act bubble__save" aria-hidden="true">${ICONS.save}</span>
                </div>
            </div></div>
        </div></div></div>
    </article>`;

// The heart works, like in a feed: it fills and pops.
field.addEventListener('click', e => {
    const like = e.target.closest('.bubble__like');
    if (!like) return;
    const on = like.getAttribute('aria-pressed') !== 'true';
    like.setAttribute('aria-pressed', String(on));
    if (on && !reduced) gsap.fromTo(like, { scale: 0.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
});

// Placeholders while the database answers (layout without the globe).
field.innerHTML = '<div class="bubble bubble--ghost" aria-hidden="true"><div class="bubble__card"></div></div>'.repeat(4);

function globe() {
    const originals = qsa('.bubble', field);
    if (!originals.length) return;
    const mq = matchMedia('(min-width: 861px)');
    // At least 12 points so the sphere reads as one; with fewer people some
    // repeat (decorative copies, as far as possible from their original).
    const N = Math.max(originals.length, 12);
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

    // Give each point a person so that copies of the same one end up as far
    // apart as possible (greedy, balanced).
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
        cloud.classList.add('cloud--live');
        const used = new Set();
        assign().forEach((t, i) => {
            let b;
            if (!used.has(t)) { b = originals[t]; used.add(t); }
            else {
                b = originals[t].cloneNode(true);
                b.classList.add('bubble--echo');
                b.setAttribute('aria-hidden', 'true');
                b.removeAttribute('role');
                qsa('button', b).forEach(btn => (btn.tabIndex = -1));
                field.appendChild(b);
            }
            items.push({ el: b, p: points[i], hover: false });
        });

        const state = { yaw: 0.4, pitch: -0.32, speed: 0.12, targetSpeed: 0.12, px: 0, py: 0, grow: reduced ? 1 : 0.35, alpha: reduced ? 1 : 0, exit: 0 };
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
            const r = cloud.getBoundingClientRect();
            state.px = (e.clientX - r.left) / r.width - 0.5;
            state.py = (e.clientY - r.top) / r.height - 0.5;
        };
        if (finePointer) { cloud.addEventListener('pointermove', onMove); cleanup.push(() => cloud.removeEventListener('pointermove', onMove)); }

        function render(dt) {
            const W = cloud.clientWidth, H = cloud.clientHeight;
            const R = Math.min(W * 0.3, H * 0.4) * state.grow * (1 + state.exit * 0.6);
            const alpha = state.alpha * (1 - state.exit);
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
                it.el.style.setProperty('--o', (0.16 + 0.84 * Math.pow(d, 1.5)) * alpha);
                it.el.style.setProperty('--a', alpha);
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
        io.observe(cloud);
        render(0);

        if (!reduced) {
            // On arrival the title comes first, slightly large; then it settles
            // and the globe of people opens around it (the home does the same
            // with the scroll). Scrolling away, the globe spreads and fades.
            const title = qs('.cloud__title', cloud);
            gsap.set(title, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
            const open = gsap.timeline({ delay: 0.35 })
                .fromTo(title, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0)
                .to(state, { grow: 1, alpha: 1, duration: 2, ease: 'expo.out' }, 0.25);
            const away = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
                .to(state, { exit: 1, ease: 'none' }, 0)
                .to(title, { y: -60, opacity: 0, ease: 'none' }, 0);
            cleanup.push(() => { open.kill(); away.scrollTrigger?.kill(); away.kill(); gsap.set(title, { clearProps: 'all' }); });
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
        cloud.classList.remove('cloud--live');
    }

    if (mq.matches) build();
    mq.addEventListener('change', () => { destroy(); if (mq.matches) build(); ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
}

async function loadCrew() {
    const { data, error } = await supabase
        .from('team_members')
        .select('name, role, image_url, position')
        .eq('is_active', true)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error cargando el equipo desde Supabase:', error);
        field.hidden = true;
        return;
    }
    const members = data || [];
    if (!members.length) { field.hidden = true; return; }
    field.innerHTML = members.map(bubbleHTML).join('');
    // The globe opens once the page intro has finished, like the rest of the hero.
    await introDone;
    globe();
}
loadCrew();

/* ------------------------------------------------------------------ */
/* Job openings                                                         */
/* ------------------------------------------------------------------ */
async function loadOffers() {
    const section = qs('#ofertas');
    const list = qs('#job-openings-list');
    const { data, error } = await supabase
        .from('job_openings')
        .select('title, icon_url, slug')
        .eq('is_active', true)
        .order('position', { ascending: true });

    if (error) { console.error('Error cargando ofertas activas desde Supabase:', error); return; }
    const offers = data || [];
    if (!offers.length) return; // the section stays hidden

    list.innerHTML = offers.map(o => `
        <a class="offer" href="/oferta.html?slug=${encodeURIComponent(o.slug)}" data-cursor="Ver oferta">
            <span class="offer__fill" aria-hidden="true"></span>
            ${o.icon_url ? `<img class="offer__icon" src="${esc(o.icon_url)}" alt="" loading="lazy">` : '<span></span>'}
            <span class="offer__title">${esc(o.title)}</span>
            <span class="offer__go">Ver oferta<i class="eco__arrow" aria-hidden="true"></i></span>
        </a>`).join('');
    section.hidden = false;
    // The closing card now enters over the offers, not over the join.
    talkWipe();
    ScrollTrigger.refresh();
    if (!reduced) {
        gsap.from(qsa('.offer', list), {
            opacity: 0, y: 50, duration: 1.1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: list, start: 'top 88%', once: true },
        });
    }
}
loadOffers();
