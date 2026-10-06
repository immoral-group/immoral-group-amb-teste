import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// This exploration deliberately does not import main.js or its SPA/global styles.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
let userPaused = false;
const motionAllowed = () => !reduced.matches && !userPaused;
let animationContext;


const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#color-nav');
function closeMenu() {
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
}
menu.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const wasOpen = document.body.classList.contains('menu-open');
    closeMenu();
    nav.querySelectorAll('details[open]').forEach(item => item.open = false);
    if (wasOpen) menu.focus();
});
document.addEventListener('click', event => {
    if (!event.target.closest('.color-header')) nav.querySelectorAll('details[open]').forEach(item => item.open = false);
});
nav.querySelectorAll('details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) nav.querySelectorAll('details').forEach(other => { if (other !== item) other.open = false; });
}));
const mobile = matchMedia('(max-width: 850px)');
mobile.addEventListener('change', closeMenu);

const track = document.querySelector('.testimonials-track');
function moveTestimonial(direction) {
    const cards = [...track.children];
    const maximum = track.scrollWidth - track.clientWidth;
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    const atEnd = track.scrollLeft >= maximum - 2;
    const atStart = track.scrollLeft <= 2;
    const next = direction > 0 && atEnd ? 0 : direction < 0 && atStart ? maximum : track.scrollLeft + direction * step;
    track.scrollTo({ left: Math.max(0, Math.min(maximum, next)), behavior: motionAllowed() ? 'smooth' : 'instant' });
}
document.querySelector('[data-testimonial-prev]').addEventListener('click', () => moveTestimonial(-1));
document.querySelector('[data-testimonial-next]').addEventListener('click', () => moveTestimonial(1));
track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); moveTestimonial(event.key === 'ArrowRight' ? 1 : -1);
    }
});

function animatePage(entrance = false) {
    animationContext?.revert();
    animationContext = undefined;
    document.documentElement.classList.toggle('motion-paused', !motionAllowed());
    motionButton.setAttribute('aria-pressed', String(!motionAllowed()));
    motionButton.setAttribute('aria-label', motionAllowed() ? 'Pausar animaciones' : 'Activar animaciones');
    motionButton.firstElementChild.textContent = motionAllowed() ? 'Ⅱ' : '▷';
    if (!motionAllowed()) return;
    animationContext = gsap.context(() => {
        if (entrance) {
            gsap.from('.hero-intro, .hero-megatype', { y: 70, opacity: 0, duration: 1.2, stagger: .13, ease: 'power3.out', clearProps: 'transform,opacity' });
            gsap.from('.hero-contact-sheet', { clipPath: 'inset(100% 0 0)', duration: 1.4, delay: .2, ease: 'power3.inOut', clearProps: 'clipPath' });
            gsap.from('.bold-hero-bottom', { y: 20, opacity: 0, duration: .9, delay: .65, clearProps: 'transform,opacity' });
        }
        document.querySelectorAll('[data-reveal]').forEach(el => {
            gsap.from(el, { y: 42, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, clearProps: 'transform,opacity' });
        });
        const mm = gsap.matchMedia();
        mm.add('(min-width: 851px)', () => {
            gsap.to('.hero-contact-sheet', { y: -55, ease: 'none', scrollTrigger: { trigger: '.bold-hero', start: 'top top', end: 'bottom top', scrub: 1 } });
            gsap.fromTo('.hero-baseline', { scaleX: .75 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.bold-hero', start: 'top top', end: 'bottom center', scrub: 1 } });
            gsap.to('.service-symbol', { rotation: 90, ease: 'none', scrollTrigger: { trigger: '.services-section', start: 'top center', end: 'bottom center', scrub: 1 } });
            gsap.from('.sector-card', { y: i => 70 + i * 35, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.sector-grid', start: 'top 85%', once: true }, clearProps: 'transform' });
            gsap.from('.case-card', { y: 70, opacity: 0, duration: 1.1, stagger: .12, scrollTrigger: { trigger: '.cases-grid', start: 'top 85%', once: true }, clearProps: 'transform,opacity' });
            const colors = ['#a8ffff', '#73c2f1', '#aed8e6', '#a8ffff'];
            document.querySelectorAll('.process-steps article').forEach((step, index) => {
                const activate = () => {
                    document.querySelector('.process-visual').style.backgroundColor = colors[index];
                    document.querySelector('.process-number').textContent = `0${index + 1}`;
                    document.querySelectorAll('.process-steps article').forEach(item => item.classList.toggle('is-active', item === step));
                };
                ScrollTrigger.create({ trigger: step, start: 'top 60%', end: 'bottom 60%', onEnter: activate, onEnterBack: activate });
            });
        });
        document.querySelectorAll('[data-count]').forEach(el => {
            const count = { value: 0 };
            gsap.to(count, { value: Number(el.dataset.count), duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 95%', once: true }, onUpdate: () => { el.textContent = Math.round(count.value); } });
        });
        return () => { mm.revert(); document.querySelectorAll('[data-count]').forEach(el => el.textContent = el.dataset.count); };
    });
    
}
motionButton.addEventListener('click', () => { userPaused = !userPaused; animatePage(); });
reduced.addEventListener('change', () => animatePage());
animatePage(true);
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });


// Campaign imagery lives inside the headline, following the pointer without obscuring its text.
const megatype = document.querySelector('.hero-megatype');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
megatype.addEventListener('pointermove', event => {
    if (!motionAllowed() || !finePointer.matches) return;
    const bounds = megatype.getBoundingClientRect();
    megatype.style.setProperty('--pointer-x', (event.clientX - bounds.left) + 'px');
    megatype.style.setProperty('--pointer-y', (event.clientY - bounds.top) + 'px');
    megatype.classList.add('is-exploring');
}, { passive: true });
megatype.addEventListener('pointerleave', () => megatype.classList.remove('is-exploring'));
window.addEventListener('pagehide', event => { if (!event.persisted) animationContext?.revert(); });
