// Conveyor 3D de tarjetas-vídeo para la sección "cc-section" de influencer-marketing.html.
// Todas las tarjetas recorren la MISMA curva (Catmull-Rom cíclica) con un offset de progreso
// distinto cada una, en bucle infinito — no es un carrusel, no hay "slide activo".
// Los dos puntos "NEAR" son intermedios (no del brief original): el tramo donde la tarjeta
// pasa de fondo a primer plano concentraba el mayor salto de z/scale en un solo segmento de
// la Catmull-Rom y se sentía brusco — se reparte ese salto en dos pasos para suavizarlo.
const PATH_KEYFRAMES = [
    { x: 430, y: -65, z: -420, scale: 0.68, rotateY: -8 },
    { x: 360, y: -55, z: -340, scale: 0.74, rotateY: -7 },
    { x: 285, y: -45, z: -270, scale: 0.80, rotateY: -6 },
    { x: 205, y: -30, z: -195, scale: 0.86, rotateY: -5 },
    { x: 120, y: -15, z: -120, scale: 0.92, rotateY: -3 },
    { x: 30, y: 5, z: -40, scale: 0.98, rotateY: -1 },
    { x: -30, y: 20, z: 10, scale: 1.03, rotateY: -0.5 }, // NEAR 1
    { x: -90, y: 35, z: 60, scale: 1.08, rotateY: 0 },
    { x: -150, y: 45, z: 90, scale: 1.12, rotateY: 0.5 }, // NEAR 2
    { x: -210, y: 55, z: 120, scale: 1.16, rotateY: 1 },
    { x: -480, y: 70, z: 80, scale: 1.08, rotateY: 2 },
];

const CARD_COUNT = 9;
// Las 9 tarjetas están repartidas a partes iguales en la vuelta, así que el tiempo
// entre que una tarjeta pasa por un punto del camino (ej. primer plano) y la siguiente
// hace lo mismo es CYCLE_MS / CARD_COUNT. 9000 / 9 = 1000ms: cada vídeo se ve ~1s antes
// de que el siguiente ocupe su lugar, y al reducir CYCLE_MS también se mueve más rápido
// el recorrido completo (la velocidad de paso por cada tramo del camino es la misma cifra).
const CYCLE_MS = 9000;
const PARALLAX_PX = 12;
const PARALLAX_DEG = 1.5;
const LERP = 0.06;

function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
}

// Muestreo "en bruto" de la curva: t uniforme dentro de cada tramo entre keyframes.
// A propósito NO lleva easing por-tramo — un easing ahí frena la tarjeta a velocidad
// cero en cada uno de los keyframes (11 micro-pausas por vuelta), que es justo el
// efecto de "salto"/tirón que no queremos. La suavidad real viene de reparametrizar
// por longitud de arco (ver sampleConstantSpeed), no de frenar en cada punto.
function samplePathRaw(progress) {
    const n = PATH_KEYFRAMES.length;
    const scaled = progress * n;
    const idx = Math.floor(scaled) % n;
    const t = scaled - Math.floor(scaled);
    const p0 = PATH_KEYFRAMES[(idx - 1 + n) % n];
    const p1 = PATH_KEYFRAMES[idx];
    const p2 = PATH_KEYFRAMES[(idx + 1) % n];
    const p3 = PATH_KEYFRAMES[(idx + 2) % n];
    const keys = ['x', 'y', 'z', 'scale', 'rotateY'];
    const out = {};
    keys.forEach((k) => {
        out[k] = catmullRom(p0[k], p1[k], p2[k], p3[k], t);
    });
    return out;
}

// Tabla de longitud de arco de la curva 3D cerrada (x,y,z), construida una vez.
// Permite convertir un progreso "a velocidad constante" (u, 0-1) en el progreso real
// sobre la curva (raw) — así la tarjeta avanza siempre a la misma velocidad física,
// sin importar que los keyframes estén más juntos o más separados entre sí.
const ARC_SAMPLES = 240;
let arcLengthTable = null;

function buildArcLengthTable() {
    const points = [];
    for (let i = 0; i <= ARC_SAMPLES; i++) {
        points.push(samplePathRaw((i / ARC_SAMPLES) % 1));
    }
    const cumLen = new Array(ARC_SAMPLES + 1);
    cumLen[0] = 0;
    for (let i = 1; i <= ARC_SAMPLES; i++) {
        const a = points[i - 1];
        const b = points[i];
        cumLen[i] = cumLen[i - 1] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    }
    return { cumLen, total: cumLen[ARC_SAMPLES] };
}

function remapToConstantSpeed(u) {
    if (!arcLengthTable) arcLengthTable = buildArcLengthTable();
    const { cumLen, total } = arcLengthTable;
    const target = u * total;
    let lo = 0;
    let hi = ARC_SAMPLES;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumLen[mid] < target) lo = mid + 1; else hi = mid;
    }
    const i = Math.max(1, lo);
    const segLen = cumLen[i] - cumLen[i - 1];
    const localT = segLen > 0 ? (target - cumLen[i - 1]) / segLen : 0;
    return ((i - 1 + localT) / ARC_SAMPLES) % 1;
}

function samplePath(progress) {
    return samplePathRaw(remapToConstantSpeed(progress));
}

// Opacidad ligada a la profundidad (igual que capas 3D en After Effects: las que están
// más al fondo se ven más tenues/traslúcidas, las de primer plano llegan a opacidad total).
// Combinado con el z-index dinámico, esto hace que una tarjeta no "aparezca" de golpe al
// pasar delante de otra — se va superponiendo gradualmente en vez de dar un salto brusco.
const MIN_SCALE = 0.68;
const MAX_SCALE = 1.16;
const MIN_OPACITY = 0.4;

function opacityForScale(scale) {
    const t = Math.min(1, Math.max(0, (scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)));
    return MIN_OPACITY + t * (1 - MIN_OPACITY);
}

// Este conveyor vive embebido en la columna derecha del hero (máx. 480px de ancho),
// no en una sección a pantalla completa — el factor reduce las magnitudes de la curva
// (pensadas para un escenario mucho más grande) para que quepan en esa columna.
function getResponsiveFactor() {
    const w = window.innerWidth;
    if (w <= 480) return 0.192;
    return 0.272;
}

// Opacidad de las tarjetas que quedan "detrás" cuando una está en foco (clic).
const FOCUS_DIM_OPACITY = 0.12;

// Badges decorativos "+X.XXX vistas": cifra aleatoria que cuenta hacia arriba en bucle
// (nunca un dato real, es puro adorno visual). Cada badge tiene su propio rAF, independiente
// del conveyor — no hace falta pausarlo junto con las tarjetas, es barato y puramente estético.
function formatViews(n) {
    return Math.round(n).toLocaleString('es-ES');
}

function animateViewBadge(numberEl) {
    function cycle() {
        const start = 400 + Math.random() * 3000;
        const target = start + 6000 + Math.random() * 34000;
        const duration = 1600 + Math.random() * 900;
        const t0 = performance.now();

        function tick(now) {
            const t = Math.min(1, (now - t0) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            numberEl.textContent = '+' + formatViews(start + (target - start) * eased);
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                setTimeout(cycle, 2200 + Math.random() * 1800);
            }
        }
        requestAnimationFrame(tick);
    }
    cycle();
}

function initViewBadges() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.cc-badge-number').forEach((el) => {
        if (prefersReducedMotion) {
            el.textContent = '+' + formatViews(1000 + Math.random() * 30000);
        } else {
            animateViewBadge(el);
        }
    });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Altura del header fijo actualmente visible (el oscuro de escritorio o la barra
// móvil/tablet) — se usa para que ninguna burbuja se coloque por debajo de él.
function getHeaderHeight() {
    const desktopNav = document.querySelector('nav.fixed');
    if (desktopNav && getComputedStyle(desktopNav).display !== 'none') {
        return desktopNav.getBoundingClientRect().height;
    }
    const menuBtn = document.getElementById('mobileMenuOpenBtn');
    const mobileBar = menuBtn ? menuBtn.closest('.fixed') : null;
    if (mobileBar && getComputedStyle(mobileBar).display !== 'none') {
        return mobileBar.getBoundingClientRect().height;
    }
    return 0;
}

// Coloca cada badge por fuera de la caja REAL del carrusel (medida en pantalla con
// getBoundingClientRect, no un porcentaje adivinado) más un margen de seguridad — así
// nunca queda tocando ni tapado por la tarjeta grande, sin importar el tamaño de viewport.
function layoutBadges(stage) {
    if (!stage) return;
    const section = stage.closest('section');
    if (!section) return;
    const badges = Array.from(section.querySelectorAll(':scope > .cc-badge'));
    if (badges.length === 0) return;

    const stageRect = stage.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const left = stageRect.left - sectionRect.left;
    const top = stageRect.top - sectionRect.top;
    const bottom = top + stageRect.height;
    const w = stageRect.width;
    const h = stageRect.height;
    const center = left + w / 2;

    const margin = window.innerWidth <= 640 ? 24 : 58;
    const pad = 10; // no pegarse al borde de la sección tampoco
    const gap = 14; // separación mínima entre dos badges del mismo lado, para que no se pisen
    const isStacked = window.innerWidth < 1024;
    const gridEl = stage.closest('.grid');
    const textCol = gridEl ? gridEl.firstElementChild : null;

    // Techo real por encima del cual ninguna burbuja "top" puede colocarse: el borde
    // inferior del header fijo siempre, y en layout apilado (el texto va arriba y el
    // carrusel debajo, a todo el ancho) también el borde inferior del bloque de texto
    // — si no, el margen fijo de separación podía no alcanzar y la burbuja quedaba
    // encima del párrafo cuando ese hueco real era más pequeño de lo esperado.
    let topObstacleBottom = getHeaderHeight() + 12;
    if (isStacked && textCol) {
        topObstacleBottom = Math.max(topObstacleBottom, textCol.getBoundingClientRect().bottom + 16);
    }
    const topPad = Math.max(pad, topObstacleBottom - sectionRect.top);

    // Límite izquierdo real: en layout no apilado hay una columna de texto a la
    // izquierda del carrusel — ninguna burbuja debe invadirla, ni la que se ancla a
    // su izquierda ni el extremo izquierdo de las filas de arriba/abajo si la fila
    // se ensancha más que el propio carrusel (ver más abajo).
    let leftBound = pad;
    if (!isStacked && textCol) {
        leftBound = Math.max(pad, (textCol.getBoundingClientRect().right - sectionRect.left) + 20);
    }

    const meas = badges.map((b) => ({ bw: b.offsetWidth || 140, bh: b.offsetHeight || 40 }));

    // La 5ª burbuja ("compartidos") va a la izquierda del carrusel solo si cabe
    // realmente entre el texto y el carrusel; si no (apilado, o el texto es largo y
    // el viewport no es muy ancho), se suma a la fila de abajo con las otras dos.
    const canPlaceLeft = !isStacked && (left - margin - meas[4].bw) >= leftBound;
    const sides = badges.map((_, i) => {
        if (i === 0 || i === 1) return 'top';
        if (i === 4) return canPlaceLeft ? 'left' : 'bottom';
        return 'bottom';
    });

    // Arriba/abajo: las burbujas de un mismo lado se reparten centradas respecto al
    // carrusel, con la separación real basada en su ancho MEDIDO (nunca un porcentaje
    // fijo del ancho del carrusel) — así nunca se solapan entre sí, tanto si caben 2
    // como si caen 3 en la misma fila (cuando la 5ª no puede ir a la izquierda), ni
    // aunque el carrusel se haya reducido de tamaño.
    ['top', 'bottom'].forEach((side) => {
        const idxs = sides.reduce((acc, s, i) => { if (s === side) acc.push(i); return acc; }, []);
        if (idxs.length === 0) return;
        const totalContent = idxs.reduce((sum, i) => sum + meas[i].bw, 0) + gap * (idxs.length - 1);
        const maxStartX = Math.max(leftBound, sectionRect.width - pad - totalContent);
        let cursor = clamp(center - totalContent / 2, leftBound, maxStartX);
        idxs.forEach((i) => {
            const bh = meas[i].bh;
            const rawY = side === 'top' ? (top - margin - bh) : (bottom + margin);
            const y = clamp(rawY, topPad, sectionRect.height - bh - pad);
            badges[i].style.left = `${Math.round(cursor)}px`;
            badges[i].style.top = `${Math.round(y)}px`;
            cursor += meas[i].bw + gap;
        });
    });

    if (canPlaceLeft) {
        const i = 4;
        const x = clamp(left - margin - meas[i].bw, leftBound, sectionRect.width - meas[i].bw - pad);
        const y = clamp(top + h * 0.5, topPad, sectionRect.height - meas[i].bh - pad);
        badges[i].style.left = `${Math.round(x)}px`;
        badges[i].style.top = `${Math.round(y)}px`;
    }
}

export function initInfluencerCardConveyor() {
    const scene = document.getElementById('cc-scene');
    if (!scene) return;

    const cards = Array.from(scene.querySelectorAll('.cc-card'));
    if (cards.length === 0) return;

    const stage = document.getElementById('cc-stage');
    const backdrop = document.getElementById('cc-backdrop');
    const closeBtn = document.getElementById('cc-close');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initViewBadges();
    layoutBadges(stage);
    let resizeTimeoutId = null;
    window.addEventListener('resize', () => {
        if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
        resizeTimeoutId = setTimeout(() => layoutBadges(stage), 150);
    });

    let responsiveFactor = getResponsiveFactor();
    window.addEventListener('resize', () => {
        responsiveFactor = getResponsiveFactor();
    });

    let mouseNX = 0;
    let mouseNY = 0;
    let parX = 0;
    let parY = 0;
    let parRotX = 0;
    let parRotY = 0;

    if (stage && window.matchMedia('(pointer: fine)').matches) {
        stage.addEventListener('mousemove', (e) => {
            const rect = stage.getBoundingClientRect();
            mouseNX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseNY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        });
        stage.addEventListener('mouseleave', () => {
            mouseNX = 0;
            mouseNY = 0;
        });
    }

    // --- Pausa/resumen: dos motivos independientes (pestaña oculta, tarjeta en foco).
    // La animación corre solo si ninguno de los dos está activo. pauseAccum acumula el
    // tiempo total en pausa para restárselo al timestamp de rAF — así, al reanudar, la
    // tarjeta sigue exactamente donde se quedó en vez de saltar hacia delante.
    let rafId = null;
    let hiddenPaused = false;
    let focusPaused = false;
    let pauseStart = null;
    let pauseAccum = 0;
    let activeCard = null;
    const savedStyles = new Map();

    function isPaused() {
        return hiddenPaused || focusPaused;
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function startLoop() {
        if (!rafId && !isPaused() && !prefersReducedMotion) {
            rafId = requestAnimationFrame(frame);
        }
    }

    function reconcilePause(wasPaused) {
        const nowPaused = isPaused();
        if (!wasPaused && nowPaused) {
            pauseStart = performance.now();
            stopLoop();
        } else if (wasPaused && !nowPaused) {
            if (pauseStart !== null) {
                pauseAccum += performance.now() - pauseStart;
                pauseStart = null;
            }
            startLoop();
        }
    }

    function setHiddenPaused(v) {
        const wasPaused = isPaused();
        hiddenPaused = v;
        reconcilePause(wasPaused);
    }

    function setFocusPaused(v) {
        const wasPaused = isPaused();
        focusPaused = v;
        reconcilePause(wasPaused);
    }

    // --- Clic en una tarjeta: pausa el conveyor, atenúa las demás, y la elegida se
    // saca del escenario 3D (para que el !important del CSS de foco no compita con
    // las transformaciones inline de la animación) y se agranda centrada, con sonido
    // y controles, a opacidad completa desde el primer instante — deliberadamente sin
    // ninguna transición/temporizador de por medio (esa era la pieza que se quedaba a
    // medias y dejaba la tarjeta oscurecida). Al cerrar se restaura todo de inmediato.
    function focusCard(card) {
        if (activeCard) return;
        activeCard = card;

        cards.forEach((c) => {
            savedStyles.set(c, { opacity: c.style.opacity, zIndex: c.style.zIndex });
            if (c !== card) c.style.opacity = String(FOCUS_DIM_OPACITY);
        });

        card._ccOriginalParent = card.parentNode;
        card._ccOriginalNextSibling = card.nextSibling;
        document.body.appendChild(card);
        card.classList.add('is-focused-card');

        const video = card.querySelector('video');
        if (video) {
            video.muted = false;
            video.controls = true;
            video.play().catch(() => {});
        }

        if (backdrop) backdrop.classList.add('is-active');
        if (closeBtn) closeBtn.classList.add('is-active');

        setFocusPaused(true);
    }

    function exitFocus() {
        if (!activeCard) return;
        const card = activeCard;
        activeCard = null;

        const video = card.querySelector('video');
        if (video) {
            video.muted = true;
            video.controls = false;
        }

        card.classList.remove('is-focused-card');
        if (card._ccOriginalNextSibling) {
            card._ccOriginalParent.insertBefore(card, card._ccOriginalNextSibling);
        } else {
            card._ccOriginalParent.appendChild(card);
        }

        cards.forEach((c) => {
            const saved = savedStyles.get(c);
            if (saved) {
                c.style.opacity = saved.opacity;
                c.style.zIndex = saved.zIndex;
            }
        });
        savedStyles.clear();

        if (backdrop) backdrop.classList.remove('is-active');
        if (closeBtn) closeBtn.classList.remove('is-active');

        setFocusPaused(false);
    }

    cards.forEach((card) => {
        card.addEventListener('click', () => focusCard(card));
    });
    if (backdrop) backdrop.addEventListener('click', exitFocus);
    if (closeBtn) closeBtn.addEventListener('click', exitFocus);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') exitFocus();
    });

    if (prefersReducedMotion) {
        // Composición estática (respetando la preferencia del usuario): una sola pasada
        // por la curva, sin bucle continuo. El clic para poner en foco sigue funcionando.
        cards.forEach((card, i) => {
            const progress = i / CARD_COUNT;
            const s = samplePath(progress);
            const x = s.x * responsiveFactor;
            const y = s.y * responsiveFactor;
            const z = s.z * responsiveFactor;
            card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${s.scale}) rotateY(${s.rotateY}deg)`;
            card.style.zIndex = String(Math.round(s.z + 1000));
            card.style.opacity = String(opacityForScale(s.scale));
        });
        return;
    }

    function frame(timestamp) {
        const t = timestamp - pauseAccum;
        const globalProgress = (t % CYCLE_MS) / CYCLE_MS;

        cards.forEach((card, i) => {
            const offset = i / CARD_COUNT;
            const progress = (globalProgress + offset) % 1;
            const s = samplePath(progress);
            const x = s.x * responsiveFactor;
            const y = s.y * responsiveFactor;
            const z = s.z * responsiveFactor;
            card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${s.scale}) rotateY(${s.rotateY}deg)`;
            card.style.zIndex = String(Math.round(s.z + 1000));
            card.style.opacity = String(opacityForScale(s.scale));
        });

        parX += (mouseNX * PARALLAX_PX - parX) * LERP;
        parY += (mouseNY * PARALLAX_PX - parY) * LERP;
        parRotY += (mouseNX * PARALLAX_DEG - parRotY) * LERP;
        parRotX += (-mouseNY * PARALLAX_DEG - parRotX) * LERP;
        scene.style.transform = `translate3d(${parX}px, ${parY}px, 0) rotateX(${parRotX}deg) rotateY(${parRotY}deg)`;

        rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    document.addEventListener('visibilitychange', () => {
        setHiddenPaused(document.hidden);
    });
}
