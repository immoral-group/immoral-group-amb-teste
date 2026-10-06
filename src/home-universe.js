import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const motionButton = document.querySelector('.motion-toggle');
let userMotion = null;
let animationContext;
const motionAllowed = () => userMotion ?? !reduced.matches;

// Navigation remains native links and disclosures; only the mobile shell is toggled.
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#universe-nav');
function closeMenu() {
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
}
menu.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
nav.querySelectorAll('details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) nav.querySelectorAll('details').forEach(other => { if (other !== item) other.open = false; });
}));
document.addEventListener('click', event => {
    if (!event.target.closest('.color-header')) nav.querySelectorAll('details[open]').forEach(item => item.open = false);
});
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const wasOpen = document.body.classList.contains('menu-open');
    closeMenu();
    nav.querySelectorAll('details[open]').forEach(item => item.open = false);
    if (wasOpen) menu.focus();
});
matchMedia('(max-width: 850px)').addEventListener('change', closeMenu);

// A keyboard-operable specialty selector. Without JS all three panels remain readable.
const tabs = [...document.querySelectorAll('.specialty-tabs [role=tab]')];
const panels = [...document.querySelectorAll('.specialty-panel')];
function selectSpecialty(index, animate = true) {
    tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
    });
    gsap.killTweensOf(panels.flatMap(panel => [...panel.children]));
    if (animate && motionAllowed()) {
        gsap.fromTo(panels[index].children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .06, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    ScrollTrigger.refresh();
}
tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectSpecialty(index));
    tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); selectSpecialty(next); tabs[next].focus();
    });
});
selectSpecialty(0, false);

function createRail(selector, previousSelector, nextSelector, progress) {
    const rail = document.querySelector(selector);
    const move = direction => {
        const max = rail.scrollWidth - rail.clientWidth;
        const children = [...rail.children];
        const step = children[1].offsetLeft - children[0].offsetLeft;
        const next = direction > 0 && rail.scrollLeft >= max - 2 ? 0 : direction < 0 && rail.scrollLeft <= 2 ? max : rail.scrollLeft + step * direction;
        rail.scrollTo({ left: Math.max(0, Math.min(max, next)), behavior: motionAllowed() ? 'smooth' : 'instant' });
    };
    document.querySelector(previousSelector).addEventListener('click', () => move(-1));
    document.querySelector(nextSelector).addEventListener('click', () => move(1));
    rail.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
        }
    });
    if (progress) {
        const update = () => {
            const max = rail.scrollWidth - rail.clientWidth;
            document.querySelector(progress).style.setProperty('--progress', `${max > 0 ? rail.scrollLeft / max * 300 : 0}%`);
        };
        rail.addEventListener('scroll', update, { passive: true });
        new ResizeObserver(update).observe(rail);
        update();
    }
}
createRail('.doors-track', '[data-door-prev]', '[data-door-next]', '.rail-progress');
createRail('.testimonials-track', '[data-testimonial-prev]', '[data-testimonial-next]');

// Split the original statement into visual words without changing its content.
const statement = document.querySelector('.intro-statement');
const statementText = statement.textContent.trim();
statement.textContent = '';
statementText.split(/\s+/).forEach((word, index) => {
    if (index) statement.append(document.createTextNode(' '));
    const span = document.createElement('span');
    span.className = 'ink-word'; span.textContent = word; statement.append(span);
});

function animatePage(entrance = false) {
    animationContext?.revert();
    animationContext = undefined;
    document.documentElement.classList.toggle('motion-paused', !motionAllowed());
    motionButton.setAttribute('aria-pressed', String(!motionAllowed()));
    motionButton.setAttribute('aria-label', motionAllowed() ? 'Pausar animaciones' : 'Activar animaciones');
    motionButton.firstElementChild.textContent = motionAllowed() ? 'Ⅱ' : '▷';
    if (!motionAllowed()) {
        document.querySelectorAll('[data-pointer-scene]').forEach(el => { el.style.setProperty('--mx','0px'); el.style.setProperty('--my','0px'); });
        return;
    }
    animationContext = gsap.context(() => {
        if (entrance) {
            gsap.from('.hero-heading h1>span', { y: 50, opacity: 0, duration: 1.05, stagger: .13, ease: 'power3.out', clearProps: 'transform,opacity' });
            gsap.from('.team-stage', { y: 50, opacity: 0, duration: 1.25, ease: 'power3.out', delay: .22, clearProps: 'transform,opacity' });
            gsap.from('.hero-bottom', { y: 20, opacity: 0, duration: .8, delay: .75, clearProps: 'transform,opacity' });
        }
        document.querySelectorAll('[data-reveal]').forEach(el => {
            gsap.from(el, { y: 28, opacity: 0, duration: .8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 94%', once: true }, clearProps: 'transform,opacity' });
        });
        gsap.fromTo('.ink-word', { color: '#647184' }, { color: '#17191b', stagger: .08, ease: 'none', scrollTrigger: { trigger: statement, start: 'top 85%', end: 'bottom 48%', scrub: .5 } });
        const mm = gsap.matchMedia();
        mm.add('(min-width: 851px)', () => {
            document.querySelectorAll('.team-character').forEach((character, i) => {
                gsap.to(character, { x: (i - 1.5) * 35, y: [25,-15,-30,15][i], rotation: (i - 1.5) * 4, ease: 'none', scrollTrigger: { trigger: '.universe-hero', start: 'top top', end: 'bottom top', scrub: 1 } });
            });
            const cards = [...document.querySelectorAll('.case-card')];
            cards.slice(0,-1).forEach((card,index) => gsap.to(card, { scale: .955, filter: 'brightness(.82)', ease: 'none', scrollTrigger: { trigger: cards[index+1], start: 'top 92%', end: 'top 108px', scrub: true } }));
            gsap.from('.reason', { y: 45, duration: .85, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.reasons-list', start: 'top 83%', once: true }, clearProps: 'transform' });
            const route = document.querySelector('.process-route');
            const walker = route.querySelector('img');
            gsap.to(walker, { x: () => route.clientWidth - walker.getBoundingClientRect().width, ease: 'none', scrollTrigger: { trigger: '.process-section', start: 'top 75%', end: 'bottom 35%', scrub: 1.2, invalidateOnRefresh: true } });
            gsap.fromTo('.contact-cast img', { y: 65, rotation: i => i % 2 ? -6 : 6 }, { y: -30, rotation: 0, ease: 'none', stagger: .06, scrollTrigger: { trigger: '.contact-section', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
        });
        document.querySelectorAll('[data-count]').forEach(el => {
            const count = { value: 0 };
            gsap.to(count, { value: Number(el.dataset.count), duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 93%', once: true }, onUpdate: () => el.textContent = Math.round(count.value) });
        });
        return () => {
            mm.revert();
            document.querySelectorAll('[data-count]').forEach(el => el.textContent = el.dataset.count);
        };
    });
}
motionButton.addEventListener('click', () => { userMotion = !motionAllowed(); animatePage(); });
reduced.addEventListener('change', () => { userMotion = null; animatePage(); });

// Pointer movement is event-driven, limited to a few pixels, and never changes layout.
document.querySelectorAll('.team-stage, .contact-section').forEach(scene => {
    scene.setAttribute('data-pointer-scene','');
    let frame = 0;
    let mx = 0, my = 0;
    scene.addEventListener('pointermove', event => {
        if (!motionAllowed() || !finePointer.matches || event.pointerType !== 'mouse') return;
        const bounds = scene.getBoundingClientRect();
        mx = ((event.clientX - bounds.left)/bounds.width - .5)*22;
        my = ((event.clientY - bounds.top)/bounds.height - .5)*12;
        if (frame) return;
        frame = requestAnimationFrame(() => { scene.style.setProperty('--mx',`${mx}px`); scene.style.setProperty('--my',`${my}px`); frame = 0; });
    }, { passive: true });
    scene.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); frame = 0; scene.style.setProperty('--mx','0px'); scene.style.setProperty('--my','0px'); });
});
animatePage(true);
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
window.addEventListener('pagehide', event => { if (!event.persisted) animationContext?.revert(); });
