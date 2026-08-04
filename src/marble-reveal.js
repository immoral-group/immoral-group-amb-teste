// Fondo de mármol (imagen ya diseñada) que se descubre al pasar el mouse, tipo
// acuarela, con un leve borde azul en el límite del trazo (efecto de distorsión sutil).

const IMG_SRC = '/imgs/marmol-montana-email.webp';

const STROKE_RADIUS = 130;
const FADE_IN_MS = 220;
const HOLD_MS = 300;
const FADE_OUT_MS = 1400;
const LIFESPAN = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;
const MIN_SPAWN_INTERVAL = 22;

const EDGE_R = 59, EDGE_G = 130, EDGE_B = 246; // azul de marca (blue-500)
const EDGE_PEAK_ALPHA = 0.1; // muy sutil, casi imperceptible
const EDGE_LOW_RES_W = 160; // procesar el borde en baja resolución: da un halo difuso, no un anillo geométrico

export function initMarbleReveal() {
    const container = document.getElementById('email-services-marble');
    if (!container) return;
    if (container.dataset.marbleInitialized === 'true') return;
    container.dataset.marbleInitialized = 'true';

    const reliefCanvas = document.createElement('canvas');
    reliefCanvas.className = 'absolute inset-0 w-full h-full pointer-events-none';
    const maskCanvas = document.createElement('canvas');
    maskCanvas.className = 'absolute inset-0 w-full h-full pointer-events-none';

    container.insertBefore(maskCanvas, container.firstChild);
    container.insertBefore(reliefCanvas, maskCanvas);

    const reliefCtx = reliefCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    const mountainImg = new Image();
    mountainImg.src = IMG_SRC;

    function drawRelief() {
        if (!mountainImg.naturalWidth) return;
        const w = reliefCanvas.width, h = reliefCanvas.height;
        if (!w || !h) return;

        // Recorte tipo "object-cover": llena el contenedor sin deformar la montaña.
        const scale = Math.max(w / mountainImg.naturalWidth, h / mountainImg.naturalHeight);
        const drawW = mountainImg.naturalWidth * scale, drawH = mountainImg.naturalHeight * scale;
        const dx = (w - drawW) / 2, dy = (h - drawH) / 2;

        reliefCtx.clearRect(0, 0, w, h);
        reliefCtx.imageSmoothingEnabled = true;
        reliefCtx.drawImage(mountainImg, dx, dy, drawW, drawH);
    }
    mountainImg.addEventListener('load', drawRelief);

    // Canvas auxiliares en baja resolución para el halo azul: se dibuja el "mapa de
    // revelado" acumulado (no un círculo por trazo), se difumina, y la diferencia entre
    // la versión nítida y la difuminada da un borde suave que sigue la silueta real
    // (irregular, tipo mancha) en vez de un anillo geométrico.
    const lowHoleCanvas = document.createElement('canvas');
    const lowHoleCtx = lowHoleCanvas.getContext('2d');
    const lowBlurCanvas = document.createElement('canvas');
    const lowBlurCtx = lowBlurCanvas.getContext('2d');
    let lowW = 1, lowH = 1, lowScale = 1;

    function resize() {
        const w = container.clientWidth, h = container.clientHeight;
        reliefCanvas.width = w; reliefCanvas.height = h;
        maskCanvas.width = w; maskCanvas.height = h;

        lowW = EDGE_LOW_RES_W;
        lowH = Math.max(1, Math.round(EDGE_LOW_RES_W * (h / Math.max(1, w))));
        lowScale = w / lowW;
        lowHoleCanvas.width = lowW; lowHoleCanvas.height = lowH;
        lowBlurCanvas.width = lowW; lowBlurCanvas.height = lowH;

        drawRelief();
    }

    let strokes = [];
    let lastSpawn = 0;
    let lastPointer = null;

    function spawnStroke(x, y, t) {
        strokes.push({ x, y, born: t });
    }

    function handlePointer(e) {
        const now = performance.now();
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (lastPointer && now - lastSpawn < MIN_SPAWN_INTERVAL) {
            lastPointer = { x, y };
            return;
        }
        if (lastPointer) {
            const dx = x - lastPointer.x, dy = y - lastPointer.y;
            const dist = Math.hypot(dx, dy);
            const steps = Math.max(1, Math.min(8, Math.round(dist / 18)));
            for (let i = 1; i <= steps; i++) {
                spawnStroke(lastPointer.x + dx * (i / steps), lastPointer.y + dy * (i / steps), now);
            }
        } else {
            spawnStroke(x, y, now);
        }
        lastPointer = { x, y };
        lastSpawn = now;
    }

    function strokeAlpha(age) {
        if (age < FADE_IN_MS) return age / FADE_IN_MS;
        if (age < FADE_IN_MS + HOLD_MS) return 1;
        const t = age - FADE_IN_MS - HOLD_MS;
        return Math.max(0, 1 - t / FADE_OUT_MS);
    }

    function drawMask(now) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        strokes = strokes.filter((s) => now - s.born < LIFESPAN);

        // 1) agujero que descubre el mármol
        maskCtx.globalCompositeOperation = 'destination-out';
        for (const s of strokes) {
            const alpha = strokeAlpha(now - s.born);
            if (alpha <= 0) continue;
            const g = maskCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, STROKE_RADIUS);
            g.addColorStop(0, `rgba(0,0,0,${alpha})`);
            g.addColorStop(0.65, `rgba(0,0,0,${alpha * 0.7})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            maskCtx.fillStyle = g;
            maskCtx.beginPath();
            maskCtx.arc(s.x, s.y, STROKE_RADIUS, 0, Math.PI * 2);
            maskCtx.fill();
        }

        // 2) leve halo azul en el borde de la silueta revelada (no un anillo por trazo):
        // se pinta el mapa de revelado acumulado en baja resolución, se difumina, y la
        // diferencia entre ambos marca el contorno real, con la forma orgánica que deje
        // el recorrido del mouse.
        if (strokes.length) {
            lowHoleCtx.clearRect(0, 0, lowW, lowH);
            lowHoleCtx.fillStyle = '#000';
            lowHoleCtx.fillRect(0, 0, lowW, lowH);
            lowHoleCtx.globalCompositeOperation = 'lighter';
            for (const s of strokes) {
                const alpha = strokeAlpha(now - s.born);
                if (alpha <= 0) continue;
                const lx = s.x / lowScale, ly = s.y / lowScale, lr = STROKE_RADIUS / lowScale;
                const g = lowHoleCtx.createRadialGradient(lx, ly, 0, lx, ly, lr);
                g.addColorStop(0, `rgba(255,255,255,${alpha})`);
                g.addColorStop(0.82, `rgba(255,255,255,${alpha})`);
                g.addColorStop(1, 'rgba(255,255,255,0)');
                lowHoleCtx.fillStyle = g;
                lowHoleCtx.beginPath();
                lowHoleCtx.arc(lx, ly, lr, 0, Math.PI * 2);
                lowHoleCtx.fill();
            }
            lowHoleCtx.globalCompositeOperation = 'source-over';

            lowBlurCtx.clearRect(0, 0, lowW, lowH);
            lowBlurCtx.filter = 'blur(4px)';
            lowBlurCtx.drawImage(lowHoleCanvas, 0, 0);
            lowBlurCtx.filter = 'none';
            lowBlurCtx.globalCompositeOperation = 'difference';
            lowBlurCtx.drawImage(lowHoleCanvas, 0, 0);
            lowBlurCtx.globalCompositeOperation = 'source-over';

            const edgeImg = lowBlurCtx.getImageData(0, 0, lowW, lowH);
            const ed = edgeImg.data;
            for (let i = 0; i < ed.length; i += 4) {
                const v = ed[i]; // intensidad del borde (0-255), igual en r/g/b por ser gris
                ed[i] = EDGE_R; ed[i + 1] = EDGE_G; ed[i + 2] = EDGE_B;
                ed[i + 3] = Math.min(255, v * EDGE_PEAK_ALPHA);
            }
            lowBlurCtx.putImageData(edgeImg, 0, 0);

            maskCtx.globalCompositeOperation = 'source-over';
            maskCtx.imageSmoothingEnabled = true;
            maskCtx.drawImage(lowBlurCanvas, 0, 0, maskCanvas.width, maskCanvas.height);
        }

        requestAnimationFrame(drawMask);
    }

    container.addEventListener('pointermove', handlePointer);
    window.addEventListener('resize', resize);

    resize();
    drawMask(performance.now());
}
