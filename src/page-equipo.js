import { gsap, ScrollTrigger, qs, qsa, reduced, finePointer, lenis, heroIn } from './prisma-site.js';
import { supabase } from './supabaseClient.js';

// /equipo on the Prisma design. People and job openings still come from
// Supabase (team_members / job_openings) and are managed from the internal
// panel, exactly as before: row_number picks the row, position the order.


const esc = str => {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
};

/* ------------------------------------------------------------------ */
/* Hero: the people float around the title, with depth                  */
/* ------------------------------------------------------------------ */
const hero = qs('.hero-team');
const slots = qsa('.tslot', hero);
heroIn(hero);

function fillCloud(members) {
    // Alternate the two rows so the cloud mixes the whole team.
    const [a, b] = [1, 2].map(n => members.filter(m => m.row_number === n));
    const mixed = [];
    for (let i = 0; mixed.length < members.length; i++) {
        if (a[i]) mixed.push(a[i]);
        if (b[i]) mixed.push(b[i]);
        if (i > members.length) break;
    }
    slots.forEach((slot, i) => {
        const m = mixed[i % mixed.length];
        if (!m) { slot.hidden = true; return; }
        slot.classList.remove('tslot--ghost');
        slot.dataset.cursor = m.name;
        qs('.tslot__card', slot).innerHTML = `<img src="${esc(m.image_url)}" alt="" decoding="async">`;
    });
}

if (!reduced) {
    // Each card sits at its own depth (--d): the deeper, the more it moves.
    const movers = slots.map(slot => {
        const d = parseFloat(getComputedStyle(slot).getPropertyValue('--d')) || 0.5;
        return { d, x: gsap.quickTo(slot, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(slot, 'y', { duration: 1.2, ease: 'power3.out' }) };
    });
    if (finePointer) {
        hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            movers.forEach(m => { m.x(px * -70 * m.d); m.y(py * -50 * m.d); });
        });
        hero.addEventListener('pointerleave', () => movers.forEach(m => { m.x(0); m.y(0); }));
    }
    // Scrolling away, the cloud opens up and the cards drift at their depth.
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    slots.forEach((slot, i) => {
        const d = movers[i].d;
        const sx = parseFloat(slot.style.getPropertyValue('--x')) < 50 ? -1 : 1;
        tl.to(qs('.tslot__card', slot), { yPercent: -60 * d - 20, xPercent: sx * 30 * d, ease: 'none' }, 0);
    });
    tl.to('.hero-team__center', { y: -40, opacity: 0, ease: 'none' }, 0.2);
}

/* ------------------------------------------------------------------ */
/* People: two rows drifting in opposite directions                     */
/* ------------------------------------------------------------------ */
const crew = qs('[data-crew]');
const rows = qsa('.crew__row', crew);
const tracks = rows.map(r => qs('.crew__track', r));

const memberHTML = (m, copy) => `
    <figure class="member"${copy ? ' aria-hidden="true"' : ''}>
        <img src="${esc(m.image_url)}" alt="${copy ? '' : esc(m.name)}" loading="lazy" decoding="async">
        <figcaption class="member__info"><span class="member__name">${esc(m.name)}</span><span class="member__role">${esc(m.role)}</span></figcaption>
    </figure>`;

// Placeholders while the database answers.
tracks.forEach(t => { t.innerHTML = '<div class="member member--ghost" aria-hidden="true"></div>'.repeat(7); });

function startDrift(row, track, dir) {
    // One loop = one full set of cards plus the gap before the first copy.
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const set = track.scrollWidth + gap;
    if (set <= gap) return;
    // Enough copies to cover the screen twice, so the loop never shows a gap.
    const copies = Math.max(1, Math.ceil((window.innerWidth * 2) / set));
    const originals = track.innerHTML;
    const copyHTML = originals.replace(/<figure class="member">/g, '<figure class="member" aria-hidden="true">').replace(/alt="[^"]*"/g, 'alt=""');
    track.insertAdjacentHTML('beforeend', copyHTML.repeat(copies));

    let x = dir < 0 ? 0 : -set;
    let speed = 1;
    let target = 1;
    const BASE = 38; // px per second
    row.addEventListener('pointerenter', () => { if (finePointer) target = 0; });
    row.addEventListener('pointerleave', () => { target = 1; });

    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(row);

    gsap.ticker.add((time, deltaMs) => {
        if (!visible) return;
        const dt = Math.min(0.05, deltaMs / 1000);
        // Scrolling pushes the rows a little faster, then they settle back.
        const boost = lenis ? Math.min(6, Math.abs(lenis.velocity) * 0.18) : 0;
        speed += (target * (1 + boost) - speed) * Math.min(1, dt * 4);
        x += dir * BASE * speed * dt;
        if (dir < 0 && x <= -set) x += set;
        if (dir > 0 && x >= 0) x -= set;
        track.style.transform = `translate3d(${x}px,0,0)`;
    });
}

async function loadCrew() {
    const { data, error } = await supabase
        .from('team_members')
        .select('name, role, image_url, row_number, position')
        .eq('is_active', true)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error cargando el equipo desde Supabase:', error);
        crew.hidden = true;
        slots.forEach(s => (s.hidden = true));
        return;
    }
    const members = data || [];
    const byRow = [1, 2].map(n => members.filter(m => m.row_number === n));
    if (!members.length) { crew.hidden = true; slots.forEach(s => (s.hidden = true)); return; }
    fillCloud(members);

    byRow.forEach((list, i) => {
        rows[i].hidden = !list.length;
        tracks[i].innerHTML = list.map(m => memberHTML(m, false)).join('');
    });

    if (reduced) { crew.classList.add('is-static'); ScrollTrigger.refresh(); return; }

    // Measure once the first images have a size (the cards have a fixed ratio,
    // so layout does not depend on the images loading).
    requestAnimationFrame(() => {
        byRow.forEach((list, i) => { if (list.length) startDrift(rows[i], tracks[i], i === 0 ? -1 : 1); });
        gsap.from(tracks, { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', stagger: 0.12 });
        ScrollTrigger.refresh();
    });
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
    ScrollTrigger.refresh();
    if (!reduced) {
        gsap.from(qsa('.offer', list), {
            opacity: 0, y: 50, duration: 1.1, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: list, start: 'top 88%', once: true },
        });
    }
}
loadOffers();
