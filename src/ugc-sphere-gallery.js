// Galería esférica de UGC con personas reales (influencer-marketing.html).
// El usuario está PARADO EN EL CENTRO de una esfera invisible muy grande;
// las tarjetas de video son puntos fijos sobre la superficie de esa esfera.
// Mover el mouse (o arrastrar el dedo en touch) rota la escena ENTERA en
// sentido contrario al desplazamiento, dando la sensación de mirar
// alrededor desde dentro del globo.
//
// Cada tarjeta queda TANGENTE a la esfera: rotateY(theta) rotateX(phi)
// orienta la tarjeta según su posición y translateZ(radio) la aleja del
// centro en esa misma dirección — así el ojo ve claramente que cada una
// está "clavada" en un punto distinto de una superficie curva (el objetivo
// de esta sección), en vez de tarjetas planas flotando a distintas
// profundidades. El costo es que las tarjetas en ángulos grandes se ven
// más escorzadas/inclinadas respecto de cámara — eso es foreshortening
// real y esperado en una esfera vista desde adentro, no un bug.
//
// rotateY(theta) rotateX(phi) translateZ(radio) ya deja el frente de la
// tarjeta mirando hacia el centro (verificado a mano: con la vuelta extra
// de 180° el navegador termina mostrando el reverso espejado y
// backface-visibility lo oculta casi todo — sin esa vuelta, todas las
// tarjetas quedan visibles y de frente, como corresponde a una cámara dentro
// del globo). backface-visibility:hidden queda solo como red de seguridad
// por si el giro del mouse empuja alguna tarjeta a un ángulo extremo.
//
// El perspective de CSS (definido junto a la sección en el HTML) tiene que
// ser bastante más grande que el radio de la esfera — no solo "más grande"
// a secas. La escala de proyección es perspective/(perspective-z), y como
// una rotación nunca cambia la distancia de un punto al origen, z se mueve
// en todo el rango ±radio según hacia dónde mira la cámara. Si perspective
// es apenas mayor que el radio (p. ej. 1.3x), esa escala se dispara a 3-5x
// apenas una tarjeta rota hacia adelante — eso fue el bug real de la
// primera versión: no importaba tanto el tamaño del radio en sí, sino que
// perspective y radio quedaban demasiado cerca uno del otro. Con
// perspective ≈ 3.3x el radio, la escala se mueve en un rango suave
// (~0.7x-1.6x) en vez de estallar, y ahí sí el radio grande cumple su
// función real: separar las tarjetas en pantalla sin deformarlas.
import gsap from 'gsap';

const isMobile = window.matchMedia('(max-width: 768px)').matches;
const RADIUS = isMobile ? 480 : 860; // debe guardar la misma proporción con el perspective de cada breakpoint (~3.3x)
const MAX_ROTATE_Y = 30; // giro horizontal máximo de la escena (grados)
const MAX_ROTATE_X = 18; // giro vertical máximo de la escena (grados)
const DAMPING = 0.06; // 0-1: más chico = giro más suave/con más "lag"
const IDLE_SPEED = 0.12; // deg/frame del barrido automático cuando no hay mouse encima

// Posiciones a mano (mismo criterio que ITEMS en ugc-card-flow.js): un reparto
// disperso pero compuesto a ojo, no una fórmula genérica — así se evita que
// dos tarjetas queden pegadas o que el conjunto se vea como una grilla.
// theta = giro horizontal (izq/der), phi = giro vertical (abajo/arriba),
// r = radio relativo (variación de profundidad dentro de la esfera).
const POSITIONS = [
    { theta: -85, phi: -12, r: 1.1 },
    { theta: -72, phi: 36, r: 0.85 },
    { theta: -54, phi: -42, r: 1.0 },
    { theta: -30, phi: 10, r: 0.7 },
    { theta: -10, phi: -34, r: 1.15 },
    { theta: 10, phi: 42, r: 0.9 },
    { theta: 30, phi: -12, r: 1.05 },
    { theta: 46, phi: 48, r: 0.85 },
    { theta: 70, phi: -36, r: 1.1 },
    { theta: 85, phi: 14, r: 0.85 },
    { theta: -42, phi: 50, r: 0.95 },
    { theta: 18, phi: -50, r: 1.0 },
    { theta: 58, phi: 6, r: 0.75 },
    { theta: 0, phi: -6, r: 0.68 },
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
        // translateZ NEGATIVO: lo que queda enfrente (theta/phi≈0) se hunde
        // hacia el fondo, y lo que queda en la periferia se acerca — así se
        // lee como el interior cóncavo de un domo/esfera en vez de una
        // pelota convexa flotando frente a cámara (ver nota más arriba).
        card.style.transform =
            `rotateY(${pos.theta}deg) rotateX(${pos.phi}deg) translateZ(${-depth}px)`;
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        scene.style.transform = 'rotateX(-4deg) rotateY(10deg)';
        return;
    }

    let targetRotX = -4;
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
            targetRotY = Math.sin((idleAngle * Math.PI) / 180) * (MAX_ROTATE_Y * 0.5);
            targetRotX = -4;
        }
        currentRotX += (targetRotX - currentRotX) * DAMPING;
        currentRotY += (targetRotY - currentRotY) * DAMPING;
        scene.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
    }

    gsap.ticker.add(frame);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) gsap.ticker.remove(frame);
        else gsap.ticker.add(frame);
    });
}
