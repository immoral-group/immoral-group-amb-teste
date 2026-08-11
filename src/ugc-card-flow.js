// Flujo ondulado de tarjetas-vídeo para la fila "ugc-flow" bajo el texto de la sección
// "UGC con IA" (influencer-marketing.html). Las tarjetas entran por la esquina INFERIOR
// IZQUIERDA de la fila y salen por la esquina SUPERIOR DERECHA — una diagonal de esquina
// a esquina, no una línea recta: con 1-2 vaivenes (sube-baja-sube) montados encima, como
// una cinta que serpentea mientras avanza. La profundidad (z/scale) oscila con la misma
// frecuencia para que las tarjetas también crezcan y se encojan a su paso, dando volumen
// 3D sin que la tarjeta gire sobre sí misma (nada de rotaciones de espiral/hélice).
import gsap from 'gsap';

const CARD_COUNT = 5;
const CYCLE_MS = 10000;

// Esquina de entrada (abajo-izquierda) → esquina de salida (arriba-derecha).
const X_ENTER = -640;
const X_EXIT = 640;
const Y_ENTER = 95; // positivo = abajo
const Y_EXIT = -95; // negativo = arriba

// Vaivén superpuesto a esa diagonal: exactamente 1 vuelta completa de sube-baja a lo
// largo de todo el recorrido (sube, valle, sube y sale) — el entero es intencional: así
// el seno vale 0 en u=0 y u=1 y la tarjeta llega EXACTA a ambas esquinas, sin desviarse
// por el vaivén justo donde tiene que entrar/salir.
const WAVE_CYCLES = 1;
const WAVE_AMPLITUDE = 75;
const Z_CENTER = -20;
const Z_AMPLITUDE = 200;

// Envolvente de aparición/desaparición: al entrar (progreso < FADE_IN_END) y al salir
// (progreso > FADE_OUT_START) la tarjeta está en opacidad 0 — así la costura del bucle
// (progreso 1 → 0, donde una tarjeta "reaparece" en la esquina de entrada) queda oculta.
const FADE_IN_END = 0.08;
const FADE_OUT_START = 0.86;
const MIN_SCALE = 0.65;
const MAX_SCALE = 1.18;
const MIN_OPACITY = 0.35;

function sampleWave(u) {
    const phase = u * WAVE_CYCLES * Math.PI * 2;
    const x = gsap.utils.interpolate(X_ENTER, X_EXIT, u);
    const yTrend = gsap.utils.interpolate(Y_ENTER, Y_EXIT, u);
    // Signo negativo: al entrar (fase ≈ 0) la tarjeta debe subir primero, no bajar.
    const y = yTrend - Math.sin(phase) * WAVE_AMPLITUDE;
    const z = Z_CENTER + Math.cos(phase) * Z_AMPLITUDE;
    const scale = gsap.utils.clamp(
        MIN_SCALE,
        MAX_SCALE,
        gsap.utils.mapRange(Z_CENTER - Z_AMPLITUDE, Z_CENTER + Z_AMPLITUDE, MIN_SCALE, MAX_SCALE, z)
    );
    // Inclinación sutil ligada al vaivén — nunca una rotación completa, solo el matiz
    // de perspectiva de una tarjeta que se asoma un poco al subir o bajar.
    const rotateY = Math.sin(phase) * 3;
    const rotateZ = Math.cos(phase) * 1.2;
    return { x, y, z, scale, rotateY, rotateZ };
}

function opacityForScale(scale) {
    const t = gsap.utils.clamp(0, 1, (scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE));
    return MIN_OPACITY + t * (1 - MIN_OPACITY);
}

function fadeEnvelope(u) {
    if (u < FADE_IN_END) return u / FADE_IN_END;
    if (u > FADE_OUT_START) return 1 - (u - FADE_OUT_START) / (1 - FADE_OUT_START);
    return 1;
}

function getResponsiveFactor() {
    const w = window.innerWidth;
    if (w <= 480) return 0.28;
    if (w <= 1024) return 0.42;
    return 0.62;
}

function applyCardStyle(card, u, responsiveFactor) {
    const s = sampleWave(u);
    const x = s.x * responsiveFactor;
    const y = s.y * responsiveFactor;
    const z = s.z * responsiveFactor;
    card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${s.scale}) rotateY(${s.rotateY}deg) rotateZ(${s.rotateZ}deg)`;
    card.style.zIndex = String(Math.round(s.z + 1000));
    card.style.opacity = String(opacityForScale(s.scale) * fadeEnvelope(u));
}

export function initUgcCardFlow() {
    const scene = document.getElementById('ugc-flow-scene');
    if (!scene) return;

    const cards = Array.from(scene.querySelectorAll('.ugc-flow-card'));
    if (cards.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let responsiveFactor = getResponsiveFactor();
    window.addEventListener('resize', () => {
        responsiveFactor = getResponsiveFactor();
    });

    if (prefersReducedMotion) {
        // Composición estática representativa, respetando la preferencia del usuario.
        cards.forEach((card, i) => {
            const u = FADE_IN_END + (i / cards.length) * (FADE_OUT_START - FADE_IN_END);
            applyCardStyle(card, u, responsiveFactor);
        });
        return;
    }

    // Pausa cuando la pestaña está oculta, restando el tiempo en pausa al timestamp de
    // gsap.ticker — así, al volver, la tarjeta sigue donde se quedó en vez de saltar.
    let pauseStart = null;
    let pauseAccum = 0;
    let hiddenPaused = false;

    function frame(timeSeconds) {
        if (hiddenPaused) return;
        const t = timeSeconds * 1000 - pauseAccum;
        const globalProgress = (t % CYCLE_MS) / CYCLE_MS;

        cards.forEach((card, i) => {
            const offset = i / CARD_COUNT;
            const u = (globalProgress + offset) % 1;
            applyCardStyle(card, u, responsiveFactor);
        });
    }

    gsap.ticker.add(frame);

    document.addEventListener('visibilitychange', () => {
        const wasHidden = hiddenPaused;
        hiddenPaused = document.hidden;
        if (!wasHidden && hiddenPaused) {
            pauseStart = gsap.ticker.time * 1000;
        } else if (wasHidden && !hiddenPaused && pauseStart !== null) {
            pauseAccum += gsap.ticker.time * 1000 - pauseStart;
            pauseStart = null;
        }
    });
}
