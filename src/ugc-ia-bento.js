// Grid "bento" de la sección "UGC con IA" (influencer-marketing.html), siguiendo el
// storyboard numerado (animacion.svg) que armó el usuario: 7 "pantallas" y 9
// elementos, donde cada elemento que sigue presente entre una pantalla y la
// siguiente simplemente CAMBIA de tamaño/posición (tween continuo), y un elemento
// que aparece o desaparece lo hace ENTRANDO o SALIENDO por un borde del
// contenedor — nunca con fade. Por eso acá no hay opacidad animada en ningún
// momento: la visibilidad la da estar dentro o fuera del área visible
// (`.ugc-bento-stage` tiene overflow:hidden), no un cambio de opacidad.
//
// Mismo mecanismo de siempre: cada tile tiene un rect {x,y,w,h} en % por cada
// uno de los 7 estados; cuando el tile no está "presente" en un estado, ese
// rect es su posición visible más cercana empujada fuera del contenedor en una
// dirección fija (arriba/abajo/izquierda/derecha) — así, al aparecer, entra
// deslizándose desde ese borde en vez de materializarse.
//
// El "pineado" NO usa GSAP ScrollTrigger (a diferencia de otras secciones de
// esta página, como "Cómo lo hacemos"): un ScrollTrigger con pin:true inserta
// un pin-spacer cuyo alto depende de %-de-viewport, y en esta página conviven
// VARIAS secciones pineadas — verificado a mano que combinarlas así es frágil
// (el pin-spacer de una corre el punto de inicio calculado por la siguiente, y
// ScrollTrigger.refresh() no siempre alcanza a corregir esas dependencias en
// cascada). Un `position: sticky` normal logra el mismo efecto visual sin
// insertar nada que pueda desincronizar a otras secciones, y el progreso del
// scroll se mide a mano — mismo criterio que ugc-sphere-gallery.js/
// ugc-card-flow.js, que tampoco dependen de ScrollTrigger.
import gsap from 'gsap';

const CLAMP = (v, min, max) => Math.min(Math.max(v, min), max);
// Suavizado cuadro a cuadro (mismo criterio que DAMPING en ugc-sphere-gallery.js):
// en vez de mapear el scroll 1 a 1 (que se siente rígido/brusco), el progreso
// "actual" persigue al progreso real del scroll con un poco de inercia.
const DAMPING = 0.1;

const OFF = 8; // separación extra (en %) al empujar un rect fuera del contenedor

function pushLeft(r) { return { x: -r.w - OFF, y: r.y, w: r.w, h: r.h }; }
function pushRight(r) { return { x: 100 + OFF, y: r.y, w: r.w, h: r.h }; }
function pushTop(r) { return { x: r.x, y: -r.h - OFF, w: r.w, h: r.h }; }
function pushBottom(r) { return { x: r.x, y: 100 + OFF, w: r.w, h: r.h }; }

// 7 estados (0-6, uno por "pantalla" del storyboard). Cada tile define su rect
// en CADA estado — construido a mano copiando la posición del storyboard
// mientras está presente, y empujando fuera del cuadro en el estado anterior/
// posterior a su aparición cuando no lo está.
const TILES = [
    // v1 (elemento "1"): columna izquierda completa -> arriba-izquierda achicada -> sale por la izquierda.
    (() => {
        const s0 = { x: 0, y: 1.67, w: 30.68, h: 98.33 };
        const s1 = { x: 0.17, y: 1.66, w: 30.70, h: 57.25 };
        const out = pushLeft(s1);
        return { id: 'v1', states: [s0, s1, out, out, out, out, out] };
    })(),
    // title (elemento "2"): columna central completa en las primeras 2 pantallas, sale por
    // arriba — antes era un video más, ahora lleva el título/texto que estaba arriba de la grilla.
    (() => {
        const s0 = { x: 34.48, y: 0, w: 30.68, h: 98.33 };
        const s1 = { x: 34.68, y: 0, w: 30.70, h: 97.88 };
        const out = pushTop(s1);
        return { id: 'title', states: [s0, s1, out, out, out, out, out] };
    })(),
    // v3 (elemento "3"): el que más persiste — columna derecha -> abajo-derecha chica ->
    // franja ancha abajo -> pantalla completa -> sale por la derecha (empuja a v6 a entrar).
    (() => {
        const s0 = { x: 69.32, y: 0.37, w: 30.68, h: 98.33 };
        const s1 = { x: 69.30, y: 43.22, w: 30.70, h: 55.04 };
        const s2 = { x: 0, y: 43.30, w: 100, h: 56.71 };
        const s3 = { x: 0, y: 0, w: 100, h: 100 };
        const out = pushRight(s3);
        return { id: 'v3', states: [s0, s1, s2, s3, out, out, out] };
    })(),
    // v4 (elemento "4"): entra por la derecha en la pantalla 2, franja ancha arriba en la 3, vuelve a salir por la derecha.
    (() => {
        const s1 = { x: 69.01, y: 1.2, w: 30.70, h: 37.68 };
        const s2 = { x: 1.40, y: 0, w: 97.82, h: 38.83 };
        const inn = pushRight(s1);
        const out = pushRight(s2);
        return { id: 'v4', states: [inn, s1, s2, out, out, out, out] };
    })(),
    // v5 (elemento "5"): solo aparece en la pantalla 2, abajo-izquierda, entra y sale por abajo.
    (() => {
        const s1 = { x: 0, y: 62.35, w: 30.70, h: 37.68 };
        const out = pushBottom(s1);
        return { id: 'v5', states: [out, s1, out, out, out, out, out] };
    })(),
    // v6 (elemento "6", video duplicado): entra por la derecha justo cuando v3 sale por ahí
    // (pantalla completa, como una continuación/wipe), se achica a abajo-izquierda, sale por arriba.
    (() => {
        const s4 = { x: 0, y: 0, w: 100, h: 100 };
        const s5 = { x: 0, y: 45.07, w: 59.69, h: 54.94 };
        const inn = pushRight(s4);
        const out = pushTop(s5);
        return { id: 'v6', states: [inn, inn, inn, inn, s4, s5, out] };
    })(),
    // textA (elemento "7"): entra por abajo en la pantalla 6 (columna derecha alta), pasa a columna izquierda en la 7.
    (() => {
        const s5 = { x: 63.78, y: 0, w: 36.22, h: 99.47 };
        const s6 = { x: 0, y: 0, w: 30.56, h: 98.97 };
        const inn = pushBottom(s5);
        return { id: 'textA', states: [inn, inn, inn, inn, inn, s5, s6] };
    })(),
    // textB (elemento "8"): entra por abajo en la pantalla 6 (franja ancha arriba), columna central en la 7.
    (() => {
        const s5 = { x: 0.60, y: 2.12, w: 59.09, h: 33.72 };
        const s6 = { x: 34.35, y: 0.19, w: 30.56, h: 98.97 };
        const inn = pushBottom(s5);
        return { id: 'textB', states: [inn, inn, inn, inn, inn, s5, s6] };
    })(),
    // textC (elemento "9"): solo aparece en la última pantalla, columna derecha, entra por abajo.
    (() => {
        const s6 = { x: 69.44, y: 1.03, w: 30.56, h: 98.97 };
        const inn = pushBottom(s6);
        return { id: 'textC', states: [inn, inn, inn, inn, inn, inn, s6] };
    })(),
];

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// El scroll no reparte el progreso en partes iguales entre las 7 pantallas: cada
// una tiene una pequeña "pausa" (HOLD_WEIGHT) antes de arrancar la transición
// hacia la siguiente (TRANS_WEIGHT) — pedido explícito para que se sienta más
// fluido y, sobre todo, para que la última pantalla no se le escape de encima
// apenas se arma (antes, llegar a los 3 elementos finales y seguir scrolleando
// pasaba directo a la siguiente sección sin dar tiempo a verla).
const NUM_STATES = 7;
const HOLD_WEIGHT = 0.35;
const TRANS_WEIGHT = 1;

const SEGMENTS = (() => {
    const segs = [];
    let cum = 0;
    for (let i = 0; i < NUM_STATES; i++) {
        segs.push({ hold: true, state: i, start: cum, end: cum + HOLD_WEIGHT });
        cum += HOLD_WEIGHT;
        if (i < NUM_STATES - 1) {
            segs.push({ hold: false, from: i, start: cum, end: cum + TRANS_WEIGHT });
            cum += TRANS_WEIGHT;
        }
    }
    return segs.map((s) => ({ ...s, start: s.start / cum, end: s.end / cum }));
})();

// Progreso (0-1) -> qué par de estados interpolar y cuánto. Durante un tramo
// "hold" queda fijo en ese estado (t=0); durante un tramo de transición,
// interpola con la curva de siempre entre ese estado y el próximo.
function resolveSegment(progress) {
    const p = CLAMP(progress, 0, 1);
    for (const seg of SEGMENTS) {
        if (p <= seg.end) {
            if (seg.hold) return { idx: seg.state, t: 0 };
            const local = seg.end > seg.start ? (p - seg.start) / (seg.end - seg.start) : 1;
            return { idx: seg.from, t: easeInOutCubic(CLAMP(local, 0, 1)) };
        }
    }
    return { idx: NUM_STATES - 1, t: 0 };
}

function applyProgress(tileEls, progress) {
    const { idx, t } = resolveSegment(progress);
    const nextIdx = Math.min(idx + 1, NUM_STATES - 1);

    TILES.forEach((tile) => {
        const el = tileEls[tile.id];
        if (!el) return;
        const r0 = tile.states[idx];
        const r1 = tile.states[nextIdx];
        const x = r0.x + (r1.x - r0.x) * t;
        const y = r0.y + (r1.y - r0.y) * t;
        const w = r0.w + (r1.w - r0.w) * t;
        const h = r0.h + (r1.h - r0.h) * t;
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        el.style.width = `${w}%`;
        el.style.height = `${h}%`;
    });
}

// El texto del tile "title" (eyebrow/h2/párrafo) arranca invisible (ver CSS
// .ugc-bento-tile.is-title) y se revela una sola vez, con transición propia,
// apenas la sección entra en pantalla — "que vaya apareciendo mientras se
// scrollea" sin atarlo pixel a pixel al progreso del grid (que ya se mueve
// bastante solo).
function initTitleReveal(stage, titleTile) {
    if (!titleTile) return;
    // Se observa `stage` (la caja pegada/sticky, ~720px) y no el wrapper alto
    // de scroll (miles de px): un threshold sobre ESE nunca se cumple, porque
    // ni el 15% de un wrapper de 8000+px cabe en ningún viewport real.
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                titleTile.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    observer.observe(stage);
}

export function initUgcIaBento() {
    const scrollWrap = document.getElementById('ugc-bento-scroll');
    const stage = document.getElementById('ugc-bento-stage');
    if (!scrollWrap || !stage) return;

    const tileEls = {};
    TILES.forEach((tile) => {
        tileEls[tile.id] = document.getElementById(`ugc-bento-${tile.id}`);
    });

    initTitleReveal(stage, tileEls.title);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        // Composición estática de referencia (pantalla central del storyboard), sin animación.
        applyProgress(tileEls, 3 / 6);
        return;
    }

    // Progreso REAL = cuánto se scrolleó dentro del tramo alto de `scrollWrap`
    // mientras `stage` queda pegado (sticky) arriba. 0 al entrar, 1 justo antes
    // de que `scrollWrap` se termine y el documento vuelva a fluir normal.
    function targetProgress() {
        const rect = scrollWrap.getBoundingClientRect();
        const total = scrollWrap.offsetHeight - stage.offsetHeight;
        if (total <= 0) return 0;
        return CLAMP(-rect.top / total, 0, 1);
    }

    let current = targetProgress();
    applyProgress(tileEls, current);

    // Un ticker por frame (en vez de solo reaccionar al evento "scroll") es lo
    // que permite el suavizado: cada cuadro, `current` persigue al progreso
    // real con inercia (DAMPING), en vez de saltar directo a la posición del
    // scroll — así el movimiento no se siente rígido ni se traba en scrolls
    // rápidos/entrecortados (trackpad, rueda del mouse).
    function frame() {
        current += (targetProgress() - current) * DAMPING;
        applyProgress(tileEls, current);
    }

    gsap.ticker.add(frame);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) gsap.ticker.remove(frame);
        else gsap.ticker.add(frame);
    });
}
