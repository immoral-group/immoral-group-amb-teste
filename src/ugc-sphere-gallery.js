// Galería esférica de UGC con personas reales (influencer-marketing.html).
// Las tarjetas de video se colocan en puntos fijos de una esfera invisible
// (theta = giro horizontal, phi = giro vertical, r = radio relativo para dar
// variación de profundidad) alrededor de un centro donde está la "cámara" —
// el usuario queda adentro del globo. Mover el mouse (o arrastrar el dedo en
// touch) rota la escena ENTERA en sentido contrario al desplazamiento, dando
// la sensación de mirar alrededor desde dentro, en vez de que las tarjetas
// se muevan independientes unas de otras.
//
// Es un dome (no una esfera completa 360°): con perspective de CSS, una
// tarjeta que cruza detrás del plano de la cámara se proyecta rota/gigante
// en vez de desaparecer con un clipping limpio como haría un motor 3D real.
// Con 9 tarjetas repartidas en un rango de ±55° horizontal / ±30° vertical
// nunca se acercan a ese límite, y ya alcanza para sentirse "rodeado".
import gsap from 'gsap';

const RADIUS = 280;
const MAX_ROTATE_Y = 30; // giro horizontal máximo de la escena (grados)
const MAX_ROTATE_X = 20; // giro vertical máximo de la escena (grados)
const DAMPING = 0.07; // 0-1: más chico = giro más suave/con más "lag"
const IDLE_SPEED = 0.15; // deg/frame del barrido automático cuando no hay mouse encima

// Posiciones a mano (mismo criterio que ITEMS en ugc-card-flow.js): un reparto
// disperso pero compuesto a ojo, no una fórmula genérica — así se evita que
// dos tarjetas queden pegadas o that el conjunto se vea como una grilla.
const POSITIONS = [
    { theta: -55, phi: -16, r: 1.15 },
    { theta: -34, phi: 18, r: 0.85 },
    { theta: -14, phi: -27, r: 1.05 },
    { theta: 2, phi: 6, r: 0.72 },
    { theta: 16, phi: -10, r: 1.2 },
    { theta: 33, phi: 23, r: 0.95 },
    { theta: 50, phi: -14, r: 1.1 },
    { theta: -26, phi: 31, r: 1.0 },
    { theta: 41, phi: 4, r: 0.9 },
];

export function initUgcSphereGallery() {
    const stage = document.getElementById('ugc-sphere-stage');
    const scene = document.getElementById('ugc-sphere-scene');
    if (!stage || !scene) return;

    const cards = Array.from(scene.querySelectorAll('.ugc-sphere-card'));
    if (!cards.length) return;

    cards.forEach((card, i) => {
        const pos = POSITIONS[i % POSITIONS.length];
        const depth = RADIUS * pos.r;
        card.style.transform =
            `rotateY(${pos.theta}deg) rotateX(${pos.phi}deg) translateZ(${depth}px)`;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        scene.style.transform = 'rotateX(-6deg) rotateY(14deg)';
        return;
    }

    let targetRotX = -6;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let hovering = false;
    let idleAngle = 0;

    function setTargetFromPoint(clientX, clientY) {
        const rect = stage.getBoundingClientRect();
        const relX = (clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const relY = (clientY - rect.top) / rect.height - 0.5;
        targetRotY = relX * MAX_ROTATE_Y * 2;
        targetRotX = -relY * MAX_ROTATE_X * 2;
    }

    stage.addEventListener('mousemove', (e) => {
        hovering = true;
        setTargetFromPoint(e.clientX, e.clientY);
    });
    stage.addEventListener('mouseleave', () => {
        hovering = false;
    });
    stage.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        hovering = true;
        setTargetFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    stage.addEventListener('touchend', () => {
        hovering = false;
    });

    function frame() {
        if (!hovering) {
            idleAngle += IDLE_SPEED;
            targetRotY = Math.sin(idleAngle * Math.PI / 180) * (MAX_ROTATE_Y * 0.5);
            targetRotX = -6;
        }
        currentRotX += (targetRotX - currentRotX) * DAMPING;
        currentRotY += (targetRotY - currentRotY) * DAMPING;
        scene.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
    }

    gsap.ticker.add(frame);

    let hiddenPaused = false;
    document.addEventListener('visibilitychange', () => {
        hiddenPaused = document.hidden;
        if (hiddenPaused) gsap.ticker.remove(frame);
        else gsap.ticker.add(frame);
    });
}
