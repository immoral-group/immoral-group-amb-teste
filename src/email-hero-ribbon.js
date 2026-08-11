// Cinta continua de tarjetas en 3D (efecto acordeón sobre una onda orgánica),
// para el espacio negro bajo el título del hero de email-marketing.html.
// Todas las tarjetas viven en la misma superficie matemática (fase global +
// posición normalizada); no hay animación de entrada ni tarjetas independientes.
//
// Importante: ninguna propiedad de color/brillo depende del tiempo o de la
// rotación instantánea de la tarjeta — solo la POSICIÓN (translate/rotate) se
// anima. Si el brillo se ata a rotateY/Z en cada frame, el punto "más
// iluminado" viaja con la fase global y se percibe como una luz recorriendo
// la cinta; por eso el sombreado de cada tarjeta se calcula una sola vez, al
// crearla, a partir de su color fijo — nunca en el bucle de animación.

const PERSPECTIVE = 1150;

const MAIN_WAVE_AMPLITUDE = 30;
const SECONDARY_WAVE_AMPLITUDE = 5;
const WAVE_FREQUENCY = 4.4; // pocos pliegues, amplios y suaves (no muchas oscilaciones)
const DEPTH_AMPLITUDE = 110;
const MAX_ROTATE_Y = 36; // moderado a propósito: garantiza que la tarjeta nunca se vea "de canto"
const MAX_ROTATE_Z = 4;
const MAX_ROTATE_X = 2;
const ANIMATION_SPEED = 0.55; // rad/s de avance de la fase global — movimiento pausado

const ROTATE_Z_FROM_SLOPE = 4.5;
const OVERFLOW_FACTOR = 1.08; // la cinta sobresale un poco de los bordes
const CARD_THICKNESS = 16;

// Relación ancho/paso: con MAX_ROTATE_Y=36°, cos(36°)≈0.81, así que la proyección
// más estrecha de una tarjeta (width * 0.81) sigue siendo ~2.3x el paso entre
// tarjetas. Esto garantiza matemáticamente que nunca aparezca un hueco negro
// entre dos tarjetas vecinas, en cualquier punto de la animación.
const STEP_RATIO = 0.355;

const HOVER_SCALE = 1.45;
const HOVER_LIFT = 70; // px que se acerca al visitante la tarjeta bajo el cursor
const HOVER_EASE = 0.18; // suavizado del crecimiento/reducción al entrar/salir el mouse

// Paleta neutra (blanco / gris / negro puros, sin tinte de color), del claro al oscuro.
const PALETTE = ['#ffffff', '#f1f1f1', '#e0e0e0', '#c4c4c4', '#9e9e9e', '#757575', '#525252', '#2e2e2e', '#0a0a0a'];
const GLOW_COLORS = ['rgba(255,255,255,0.75)', 'rgba(210,210,210,0.8)', 'rgba(150,150,150,0.85)', 'rgba(80,80,80,0.7)'];
const GLOW_COUNT = 9;

// Velocidad del desplazamiento horizontal continuo (px/s) — negativo = hacia la
// izquierda, como una cinta transportadora. Las tarjetas hacen wraparound (ver
// wrapX): al salir por un borde reaparecen por el otro, sin salto visible
// porque el rango de wrap es un múltiplo exacto del paso entre tarjetas.
const SCROLL_SPEED = -45;

const MOBILE_BREAKPOINT = 640;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// Envuelve x dentro de [-range/2, range/2) — el módulo de JS puede devolver
// negativos con operandos negativos, por eso el doble % en vez de uno solo.
function wrapX(x, range) {
    const half = range / 2;
    return ((((x + half) % range) + range) % range) - half;
}

function layoutFor(width, height, isMobile) {
    const cardWidth = isMobile ? 60 : 96;
    const step = cardWidth * STEP_RATIO;
    const cardHeight = clamp(height * (isMobile ? 0.78 : 0.82), isMobile ? 120 : 160, isMobile ? 200 : 260);
    const minCount = isMobile ? 18 : 24;
    const maxCount = isMobile ? 30 : 46;

    const totalWidth = Math.max(width, 1) * OVERFLOW_FACTOR;
    let count = Math.round(totalWidth / step) + 1;
    count = Math.min(maxCount, Math.max(minCount, count));
    const actualStep = totalWidth / (count - 1);

    return { count, step: actualStep, cardWidth, cardHeight, totalWidth };
}

// Hash determinista y de baja frecuencia: da color a cada tarjeta según su
// posición en la cinta, creando bandas de tono en vez de ruido tipo "sal y pimienta".
function colorForIndex(normalizedX) {
    const n =
        Math.sin(normalizedX * 12.9 + 1.3) * 0.5 +
        Math.sin(normalizedX * 27.3 + 4.1) * 0.3 +
        Math.sin(normalizedX * 5.7 + 0.4) * 0.2;
    const t = Math.min(1, Math.max(0, (n + 1) / 2));
    return PALETTE[Math.floor(t * (PALETTE.length - 1))];
}

function shade(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = clamp((num >> 16) + amount, 0, 255);
    const g = clamp(((num >> 8) & 0xff) + amount, 0, 255);
    const b = clamp((num & 0xff) + amount, 0, 255);
    return `rgb(${r}, ${g}, ${b})`;
}

function rgba(hex, alpha) {
    const num = parseInt(hex.slice(1), 16);
    return `rgba(${num >> 16}, ${(num >> 8) & 0xff}, ${num & 0xff}, ${alpha})`;
}

// Misma superficie de onda que usan las tarjetas, muestreada en un punto cualquiera
// (0..1). Se reutiliza tanto para las tarjetas como para los blobs de luz de fondo,
// para que el halo siga exactamente el mismo movimiento que la cinta.
function waveAt(normalizedX, globalPhase) {
    const cardPhase = normalizedX * WAVE_FREQUENCY + globalPhase;
    const y =
        Math.sin(cardPhase) * MAIN_WAVE_AMPLITUDE +
        Math.sin(cardPhase * 2.1 + 0.7) * SECONDARY_WAVE_AMPLITUDE;
    const z = Math.sin(cardPhase * 0.8 + 1.2) * DEPTH_AMPLITUDE;
    const rotateY = Math.sin(cardPhase * 1.15 + 0.5) * MAX_ROTATE_Y;
    return { cardPhase, y, z, rotateY };
}

export function initEmailHeroRibbon() {
    const container = document.getElementById('email-hero-ribbon');
    if (!container) return;
    if (container.dataset.ribbonInitialized === 'true') return;
    container.dataset.ribbonInitialized = 'true';

    const scene = document.createElement('div');
    scene.style.position = 'absolute';
    scene.style.inset = '0';
    scene.style.perspective = `${PERSPECTIVE}px`;
    // CSS no permite "recortar solo el eje horizontal": si overflow-x es hidden
    // y overflow-y es visible, la spec fuerza el valor computado de overflow-y a
    // auto, que sigue recortando igual (solo agrega scrollbar). Por eso el fix
    // real no es tocar overflow — es que buildGlow() nunca dimensione el
    // resplandor más alto que esta caja (ver ahí), así su propio degradado
    // termina de desvanecerse a transparente ANTES de llegar al borde, en vez
    // de quedar cortado a mitad de camino todavía opaco.
    scene.style.overflow = 'hidden';

    const glowLayer = document.createElement('div');
    glowLayer.style.position = 'absolute';
    glowLayer.style.left = '50%';
    glowLayer.style.top = '50%';
    glowLayer.style.width = '0';
    glowLayer.style.height = '0';

    const stage = document.createElement('div');
    stage.style.position = 'absolute';
    stage.style.left = '50%';
    stage.style.top = '50%';
    stage.style.width = '0';
    stage.style.height = '0';
    stage.style.transformStyle = 'preserve-3d';

    scene.appendChild(glowLayer);
    scene.appendChild(stage);
    container.appendChild(scene);

    let cards = [];
    let baseX = [];
    let hoverTarget = [];
    let hoverCurrent = [];
    let glowBlobs = [];
    let glowBaseX = [];
    let coreGlow = null;
    let layout = null;
    let globalPhase = 0;
    let scrollOffset = 0;
    let lastTime = 0;
    let resizeTimeout = null;

    function buildGlow() {
        glowLayer.innerHTML = '';
        glowBlobs = [];
        glowBaseX = [];

        // Halo ambiental grande y muy difuminado, centrado en la cinta: da el
        // "resplandor" de fondo que baña toda la sección, no solo los bordes
        // de cada tarjeta.
        //
        // maxGlowHeight: nunca más alto que la caja visible (con margen). El
        // propio radial-gradient ya se desvanece a transparente antes de su
        // borde (0% opaco -> 75% transparente) — si el elemento es más alto
        // que el contenedor, ese fundido nunca llega a completarse: el
        // overflow:hidden de arriba corta el círculo a mitad de camino,
        // todavía opaco, y se ve como un corte duro en vez de un desvanecido.
        const maxGlowHeight = container.clientHeight * 0.92;
        coreGlow = document.createElement('div');
        const coreW = layout.totalWidth * 0.55;
        const coreH = Math.min(layout.cardHeight * 2.4, maxGlowHeight);
        coreGlow.style.position = 'absolute';
        coreGlow.style.width = `${coreW}px`;
        coreGlow.style.height = `${coreH}px`;
        coreGlow.style.marginLeft = `${-coreW / 2}px`;
        coreGlow.style.marginTop = `${-coreH / 2}px`;
        coreGlow.style.borderRadius = '50%';
        coreGlow.style.background = 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(160,160,160,0.18) 45%, rgba(0,0,0,0) 75%)';
        coreGlow.style.filter = 'blur(60px)';
        coreGlow.style.mixBlendMode = 'screen';
        glowLayer.appendChild(coreGlow);

        const w = layout.cardWidth * 3.2;
        const h = Math.min(layout.cardHeight * 1.9, maxGlowHeight);

        for (let i = 0; i < GLOW_COUNT; i++) {
            const blob = document.createElement('div');
            blob.style.position = 'absolute';
            blob.style.width = `${w}px`;
            blob.style.height = `${h}px`;
            blob.style.marginLeft = `${-w / 2}px`;
            blob.style.marginTop = `${-h / 2}px`;
            blob.style.borderRadius = '50%';
            blob.style.background = `radial-gradient(circle, ${GLOW_COLORS[i % GLOW_COLORS.length]} 0%, rgba(0,0,0,0) 70%)`;
            blob.style.filter = 'blur(42px)';
            blob.style.mixBlendMode = 'screen';
            blob.style.willChange = 'transform';
            glowLayer.appendChild(blob);
            glowBlobs.push(blob);
            glowBaseX.push((i / (GLOW_COUNT - 1) - 0.5) * layout.totalWidth);
        }
    }

    function buildCards() {
        stage.innerHTML = '';
        cards = [];
        baseX = [];
        hoverTarget = [];
        hoverCurrent = [];

        const n = layout.count;
        for (let i = 0; i < n; i++) {
            const normalizedX = i / (n - 1);
            const color = colorForIndex(normalizedX);

            const card = document.createElement('div');
            card.style.position = 'absolute';
            card.style.width = `${layout.cardWidth}px`;
            card.style.height = `${layout.cardHeight}px`;
            card.style.marginLeft = `${-layout.cardWidth / 2}px`;
            card.style.marginTop = `${-layout.cardHeight / 2}px`;
            card.style.borderRadius = '9px';
            // Degradado fijo (calculado una sola vez a partir del color base): da
            // la sensación de curvatura/bisel sin depender de la rotación en vivo.
            card.style.backgroundImage =
                `linear-gradient(112deg, ${shade(color, 75)} 0%, ${shade(color, 25)} 14%, ${color} 55%, ${shade(color, -45)} 100%)`;
            // Sombra de contacto + halo de color propio y estático (no animado):
            // aporta al "glow" general sin causar una luz que viaje por la cinta.
            card.style.boxShadow = `0 16px 34px rgba(0,0,0,0.4), 0 0 26px ${rgba(color, 0.4)}`;
            card.style.transformStyle = 'preserve-3d';
            card.style.willChange = 'transform';
            card.style.backfaceVisibility = 'hidden';
            card.style.cursor = 'pointer';

            const rightEdge = document.createElement('div');
            rightEdge.style.position = 'absolute';
            rightEdge.style.top = '0';
            rightEdge.style.right = '0';
            rightEdge.style.width = `${CARD_THICKNESS}px`;
            rightEdge.style.height = '100%';
            rightEdge.style.background = `linear-gradient(90deg, ${shade(color, -70)}, ${shade(color, -90)})`;
            rightEdge.style.transformOrigin = 'right center';
            rightEdge.style.transform = 'rotateY(-90deg)';

            const leftEdge = document.createElement('div');
            leftEdge.style.position = 'absolute';
            leftEdge.style.top = '0';
            leftEdge.style.left = '0';
            leftEdge.style.width = `${CARD_THICKNESS}px`;
            leftEdge.style.height = '100%';
            leftEdge.style.background = `linear-gradient(90deg, ${shade(color, -40)}, ${shade(color, -60)})`;
            leftEdge.style.transformOrigin = 'left center';
            leftEdge.style.transform = 'rotateY(90deg)';

            card.appendChild(rightEdge);
            card.appendChild(leftEdge);

            hoverTarget.push(1);
            hoverCurrent.push(1);
            const index = i;
            card.addEventListener('pointerenter', () => { hoverTarget[index] = HOVER_SCALE; });
            card.addEventListener('pointerleave', () => { hoverTarget[index] = 1; });

            stage.appendChild(card);
            cards.push(card);
            baseX.push((i - (n - 1) / 2) * layout.step);
        }

        buildGlow();
    }

    function updateExistingCardSizes() {
        for (const card of cards) {
            card.style.width = `${layout.cardWidth}px`;
            card.style.height = `${layout.cardHeight}px`;
            card.style.marginLeft = `${-layout.cardWidth / 2}px`;
            card.style.marginTop = `${-layout.cardHeight / 2}px`;
        }
        baseX = cards.map((_, i) => (i - (cards.length - 1) / 2) * layout.step);
    }

    function resize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const isMobile = width < MOBILE_BREAKPOINT;
        const next = layoutFor(width, height, isMobile);

        if (!layout || next.count !== layout.count || next.cardWidth !== layout.cardWidth) {
            layout = next;
            buildCards();
        } else if (next.cardHeight !== layout.cardHeight) {
            layout = next;
            updateExistingCardSizes();
            buildGlow();
        } else {
            layout = next;
            baseX = cards.map((_, i) => (i - (cards.length - 1) / 2) * layout.step);
        }
    }

    function tick(now) {
        if (!lastTime) lastTime = now;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        globalPhase += ANIMATION_SPEED * dt;
        scrollOffset += SCROLL_SPEED * dt;

        const n = cards.length;
        // Múltiplo exacto del paso entre tarjetas: así el wraparound de wrapX()
        // nunca produce un hueco ni un solape visible en la costura.
        const totalRange = layout.step * n;
        const dPhase = WAVE_FREQUENCY / n;
        const dxNormalized = dPhase / WAVE_FREQUENCY;

        for (let i = 0; i < n; i++) {
            // Posición real en pantalla (con el desplazamiento continuo ya envuelto),
            // no el índice fijo de la tarjeta — así la onda queda anclada al espacio
            // visual (un "carril" fijo) y cada tarjeta la atraviesa al desplazarse,
            // en vez de ondular sin moverse de su sitio.
            const x = wrapX(baseX[i] + scrollOffset, totalRange);
            const normalizedX = x / totalRange + 0.5;
            const wave = waveAt(normalizedX, globalPhase);
            const waveNext = waveAt(normalizedX + dxNormalized, globalPhase);
            const slope = waveNext.y - wave.y;

            const rotateZ = clamp(slope * ROTATE_Z_FROM_SLOPE, -MAX_ROTATE_Z, MAX_ROTATE_Z);
            const rotateX = Math.sin(wave.cardPhase * 0.6) * MAX_ROTATE_X;
            const xOffset = Math.sin(wave.cardPhase * 1.5) * 4;

            // El brillo SOLO reacciona al hover (acción del visitante), nunca a la
            // fase de la onda: así ninguna "luz" recorre la cinta por sí sola.
            hoverCurrent[i] += (hoverTarget[i] - hoverCurrent[i]) * HOVER_EASE;
            const scale = hoverCurrent[i];
            const hoverLift = (scale - 1) * HOVER_LIFT;

            const el = cards[i];
            el.style.transform =
                `translate3d(${x + xOffset}px, ${wave.y}px, ${wave.z + hoverLift}px) ` +
                `rotateX(${rotateX}deg) rotateY(${wave.rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
            if (scale > 1.001) {
                el.style.filter = `brightness(${1 + (scale - 1) * 0.35})`;
            } else if (el.style.filter) {
                el.style.filter = '';
            }
            el.style.zIndex = Math.round(scale * 100).toString();
        }

        for (let i = 0; i < glowBlobs.length; i++) {
            const normalizedX = i / (GLOW_COUNT - 1);
            const wave = waveAt(normalizedX, globalPhase);
            const pulse = 1 + Math.sin(wave.cardPhase * 0.5 + i) * 0.1;
            glowBlobs[i].style.transform =
                `translate3d(${glowBaseX[i]}px, ${wave.y}px, ${wave.z - 130}px) scale(${pulse})`;
        }

        if (coreGlow) {
            const centerWave = waveAt(0.5, globalPhase);
            const corePulse = 1 + Math.sin(globalPhase * 0.4) * 0.06;
            coreGlow.style.transform = `translate3d(0px, ${centerWave.y}px, -220px) scale(${corePulse})`;
        }

        requestAnimationFrame(tick);
    }

    function onResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 150);
    }

    resize();
    window.addEventListener('resize', onResize);
    requestAnimationFrame(tick);
}
