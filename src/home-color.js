import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// This exploration deliberately does not import main.js or its SPA/global styles.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
let userPaused = false;
const motionAllowed = () => !reduced.matches && !userPaused;
const cleanup = [];
let animationContext;
let sculptureSync = () => {};

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
    if (!motionAllowed()) { sculptureSync(); return; }
    animationContext = gsap.context(() => {
        if (entrance) {
            gsap.from('.color-hero h1 > span', { y: 65, opacity: 0, duration: 1.2, stagger: .12, ease: 'power3.out', clearProps: 'transform,opacity' });
            gsap.from('.hero-photo', { y: 50, opacity: 0, duration: 1.3, delay: .35, stagger: .15, ease: 'power3.out', clearProps: 'opacity' });
            gsap.from('.hero-bottom', { y: 20, opacity: 0, duration: .9, delay: .65, clearProps: 'transform,opacity' });
        }
        document.querySelectorAll('[data-reveal]').forEach(el => {
            gsap.from(el, { y: 42, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, clearProps: 'transform,opacity' });
        });
        const mm = gsap.matchMedia();
        mm.add('(min-width: 851px)', () => {
            gsap.to('.hero-photo-one', { y: -80, rotation: -8, ease: 'none', scrollTrigger: { trigger: '.color-hero', start: 'top top', end: 'bottom top', scrub: 1.1 } });
            gsap.to('.hero-photo-two', { y: 65, rotation: 7, ease: 'none', scrollTrigger: { trigger: '.color-hero', start: 'top top', end: 'bottom top', scrub: 1.1 } });
            gsap.to('.service-symbol', { rotation: 90, ease: 'none', scrollTrigger: { trigger: '.services-section', start: 'top center', end: 'bottom center', scrub: 1 } });
            gsap.from('.sector-card', { y: i => 70 + i * 35, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.sector-grid', start: 'top 85%', once: true }, clearProps: 'transform' });
            gsap.from('.case-card', { y: 70, opacity: 0, duration: 1.1, stagger: .12, scrollTrigger: { trigger: '.cases-grid', start: 'top 85%', once: true }, clearProps: 'transform,opacity' });
            const colors = ['#c9c9f5', '#a8ffff', '#d9f29e', '#73c2f1'];
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
    sculptureSync();
}
motionButton.addEventListener('click', () => { userPaused = !userPaused; animatePage(); });
reduced.addEventListener('change', () => animatePage());
animatePage(true);
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

async function createSculpture() {
    const host = document.getElementById('color-sculpture');
    try {
        const THREE = await import('three');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
        renderer.setClearColor(0, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
        camera.position.z = 8.3;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        const environment = pmrem.fromScene(room, .04);
        scene.environment = environment.texture;
        room.dispose(); pmrem.dispose();
        const group = new THREE.Group(); scene.add(group);
        const geometry = new THREE.TorusKnotGeometry(1.48, .46, 180, 28, 2, 3);
        const material = new THREE.MeshPhysicalMaterial({ color: 0x3980e4, metalness: .42, roughness: .2, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.6 });
        const knot = new THREE.Mesh(geometry, material);
        group.add(knot); group.rotation.set(.2, -.45, -.55);
        const light = new THREE.DirectionalLight(0xd3ffff, 3);light.position.set(-3, 5, 5);scene.add(light);
        const blueLight = new THREE.DirectionalLight(0x3655ff, 2);blueLight.position.set(3,-2,2);scene.add(blueLight);
        host.append(renderer.domElement);host.classList.add('is-webgl');
        let frame = 0, visible = true, time = 0, previous = 0, pointerX = 0, pointerY = 0, x = 0, y = 0;
        const events = new AbortController();
        const resize = () => {
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height, false);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.render(scene,camera);
        };
        const draw = now => {
            frame = 0;
            time += Math.max(0,Math.min((now-previous)/1000,.05)); previous = now;
            x += (pointerX-x)*.04;y += (pointerY-y)*.04;
            group.rotation.y = -.45 + Math.sin(time*.18)*.2 + x*.3;
            group.rotation.x = .2 + y*.18;
            group.rotation.z = -.55 + Math.sin(time*.12)*.08;
            group.position.y = Math.sin(time*.55)*.09;
            renderer.render(scene,camera);
            if (visible && !document.hidden && motionAllowed()) frame=requestAnimationFrame(draw);
        };
        sculptureSync = () => {
            cancelAnimationFrame(frame); frame=0;
            if (visible && !document.hidden && motionAllowed()) { previous=performance.now();frame=requestAnimationFrame(draw); }
            else renderer.render(scene,camera);
        };
        const size = new ResizeObserver(resize);size.observe(host);
        const intersection = new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;sculptureSync();});intersection.observe(host);
        document.querySelector('.color-hero').addEventListener('pointermove',event=>{
            if(event.pointerType!=='mouse' || !motionAllowed())return;
            const r=host.getBoundingClientRect();pointerX=(event.clientX-r.left)/r.width-.5;pointerY=(event.clientY-r.top)/r.height-.5;
        },{passive:true,signal:events.signal});
        document.querySelector('.color-hero').addEventListener('pointerleave',()=>{pointerX=pointerY=0;},{signal:events.signal});
        document.addEventListener('visibilitychange',sculptureSync,{signal:events.signal});
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(frame);host.classList.remove('is-webgl');},{signal:events.signal});
        renderer.domElement.addEventListener('webglcontextrestored',()=>{host.classList.add('is-webgl');resize();sculptureSync();},{signal:events.signal});
        resize();sculptureSync();
        cleanup.push(()=>{events.abort();size.disconnect();intersection.disconnect();cancelAnimationFrame(frame);geometry.dispose();material.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();});
    } catch(error) {
        // The CSS sculpture remains visible when WebGL is unavailable.
        console.warn('La escultura usa su alternativa CSS.', error.message);
    }
}
createSculpture();
window.addEventListener('pagehide',event=>{if(event.persisted)return;animationContext?.revert();cleanup.forEach(fn=>fn());},{once:true});
