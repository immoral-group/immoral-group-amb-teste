// Fondo shader (WebGL2 puro) que reemplaza el iframe de Spline del hero de
// Automatización de Procesos: un "plasma" de color en movimiento, cuantizado
// con dithering ordenado (matriz de Bayer 8x8, la matriz estándar de
// referencia en cualquier implementación de ordered dithering), donde el
// cursor empuja una rejilla de desplazamiento pequeña (no un framebuffer)
// que decae con el tiempo — el mismo desplazamiento se usa para curvar tanto
// el ruido de fondo como una textura con el texto del hero, así el pixelado
// afecta a los dos por igual. Inspirado en el hero de https://codapress.co.uk/
// (inspeccionado su bundle JS para entender la técnica: rejilla JS + textura
// RG8 + snap del offset al tamaño de celda del dither — no es una copia
// literal de su shader, es una reimplementación propia con la paleta de
// marca ya usada en design-shader-scene.js).

import gsap from 'gsap';

const VERTEX_SRC = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uResolution;
uniform float uTime;
uniform float uContrast;
uniform sampler2D uDispTexture;
uniform float uDispMax;
uniform float uDispStrength;
uniform float uCellSize;
uniform sampler2D uTextTexture;
uniform vec2 uTextOrigin;
uniform vec2 uTextSize;
uniform float uHasText;

// Coordenada "de pantalla" con origen arriba-izquierda, en píxeles reales del
// canvas — misma convención que getBoundingClientRect() en JS, para poder
// comparar directamente con uTextOrigin/uTextSize sin conversiones.
vec2 screenCoord(vec2 fragCoord) {
    return vec2(fragCoord.x, uResolution.y - fragCoord.y);
}

vec2 sampleDisp(vec2 screenPx) {
    // uv debe cubrir toda la pantalla (0..1 de borde a borde del canvas) — la
    // rejilla en sí solo tiene uFieldSize texels, pero eso ya lo resuelve la
    // interpolación bilineal del sampler, no hay que "escalar" la UV por su
    // resolución.
    vec2 uv = screenPx / uResolution;
    vec2 enc = texture(uDispTexture, uv).rg;
    return (enc - 0.5) * 2.0 * uDispMax;
}

// Curva la coordenada de pantalla según la rejilla de desplazamiento, pero
// redondeando el offset a saltos de uCellSize — así el desplazamiento se ve
// a bloques (pixelado) en vez de deslizar suave.
vec2 warp(vec2 screenPx) {
    vec2 raw = sampleDisp(screenPx) * uDispStrength;
    vec2 blocky = floor(raw / uCellSize + 0.5) * uCellSize;
    return screenPx + blocky;
}

// Plasma propio: varias ondas senoidales a distinta frecuencia/fase +
// distancia a un par de focos que orbitan con el tiempo. No es la fórmula
// del sitio de referencia, es una composición sencilla propia.
float plasma(vec2 p, float t) {
    float v = 0.0;
    v += sin(p.x * 1.3 + t * 0.6);
    v += sin(p.y * 1.7 - t * 0.4);
    v += sin((p.x + p.y) * 0.85 + t * 0.35);
    vec2 focusA = vec2(sin(t * 0.31), cos(t * 0.27)) * 1.4;
    vec2 focusB = vec2(cos(t * 0.19), sin(t * 0.23)) * 1.1;
    v += sin(length(p - focusA) * 2.4 - t * 0.9);
    v += sin(length(p - focusB) * 2.0 + t * 0.7);
    return v / 5.0;
}

// Negro -> azul de marca -> cian de la web -> blanco (misma paleta que
// design-shader-scene.js, reutilizada aquí para que los dos heroes shader
// del sitio compartan identidad de color).
vec3 palette(float a) {
    vec3 black = vec3(0.0);
    vec3 blue = vec3(0.231, 0.510, 0.965);
    vec3 cyan = vec3(0.396, 0.996, 0.980);
    vec3 white = vec3(1.0);
    float t = clamp(a, 0.0, 1.0);
    vec3 c = mix(black, blue, smoothstep(0.0, 0.45, t));
    c = mix(c, cyan, smoothstep(0.35, 0.75, t));
    c = mix(c, white, smoothstep(0.75, 1.0, t));
    return c;
}

// Matriz de Bayer 8x8 estándar (valores 0-63) — la referencia habitual de
// cualquier ordered dithering, no específica de ningún sitio.
const int BAYER[64] = int[64](
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
);

vec3 orderedDither(vec3 color, ivec2 pixelCoord) {
    int x = pixelCoord.x % 8;
    int y = pixelCoord.y % 8;
    float threshold = (float(BAYER[y * 8 + x]) + 0.5) / 64.0;
    const float levels = 5.0;
    vec3 scaled = color * levels;
    vec3 quantized = floor(scaled + threshold) / levels;
    return clamp(quantized, 0.0, 1.0);
}

vec4 sampleText(vec2 screenPx) {
    vec2 local = (screenPx - uTextOrigin) / uTextSize;
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) return vec4(0.0);
    // Sin flip: la textura se sube directamente desde el canvas 2D (fila 0 =
    // arriba, sin UNPACK_FLIP_Y_WEBGL), y local.y ya crece de arriba a abajo
    // igual que la V de la textura — invertirla (como se hacía antes) deja
    // el texto boca abajo.
    return texture(uTextTexture, vec2(local.x, local.y));
}

void main() {
    vec2 screenPx = screenCoord(gl_FragCoord.xy);
    vec2 warped = warp(screenPx);

    vec2 uv = (warped / uResolution) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 col = vec3(0.0); // fondo negro sólido; se conserva warp() para que el cursor siga distorsionando el texto

    if (uHasText > 0.5) {
        vec4 text = sampleText(warped);
        col = mix(col, vec3(1.0), text.a);
    }

    fragColor = vec4(col, 1.0);
}`;

function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compilando shader (automation-shader-scene):', gl.getShaderInfoLog(shader));
    }
    return shader;
}

// Tamaño de la rejilla de desplazamiento — pequeña a propósito (no es una
// textura de pantalla completa), el sampler la interpola con LINEAR.
const FIELD_COLS = 44;
const FIELD_ROWS = 25;
const DISP_MAX = 42; // px de desplazamiento máximo por celda antes de --strength
const DISP_STRENGTH = 1.6;
const CELL_SIZE = 5; // px del "grano" del dither/pixelado (sin dpr; se escala en resize)
const DECAY = 0.9;
const INJECT_RADIUS = 1; // celdas alrededor del cursor que reciben empuje

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (current && ctx.measureText(test).width > maxWidth) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

export function createAutomationShaderScene(container, textBlockEl) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block; width:100%; height:100%;';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        console.error('WebGL2 no soportado, se mantiene el fondo negro liso sin ocultar el texto real.');
        return { dispose() { canvas.remove(); }, resize() {} };
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'position');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Error enlazando el programa de shaders (automation-shader-scene):', gl.getProgramInfoLog(prog));
        canvas.remove();
        return { dispose() {}, resize() {} };
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = {
        resolution: gl.getUniformLocation(prog, 'uResolution'),
        time: gl.getUniformLocation(prog, 'uTime'),
        contrast: gl.getUniformLocation(prog, 'uContrast'),
        dispTexture: gl.getUniformLocation(prog, 'uDispTexture'),
        dispMax: gl.getUniformLocation(prog, 'uDispMax'),
        dispStrength: gl.getUniformLocation(prog, 'uDispStrength'),
        cellSize: gl.getUniformLocation(prog, 'uCellSize'),
        textTexture: gl.getUniformLocation(prog, 'uTextTexture'),
        textOrigin: gl.getUniformLocation(prog, 'uTextOrigin'),
        textSize: gl.getUniformLocation(prog, 'uTextSize'),
        hasText: gl.getUniformLocation(prog, 'uHasText'),
    };

    // --- Textura de desplazamiento (rejilla pequeña, subida cada frame) ---
    const dispX = new Float32Array(FIELD_COLS * FIELD_ROWS);
    const dispY = new Float32Array(FIELD_COLS * FIELD_ROWS);
    const dispBuf = new Uint8Array(FIELD_COLS * FIELD_ROWS * 2);
    const dispTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, dispTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, FIELD_COLS, FIELD_ROWS, 0, gl.RG, gl.UNSIGNED_BYTE, dispBuf);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // --- Textura de texto (offscreen 2D canvas, re-renderizada en resize) ---
    const textCanvas = document.createElement('canvas');
    const textCtx = textCanvas.getContext('2d');
    const textTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let hasText = 0;
    let textOriginX = 0, textOriginY = 0, textWidth = 1, textHeight = 1;

    function renderTextTexture() {
        if (!textBlockEl) return;
        const blockRect = textBlockEl.getBoundingClientRect();
        if (blockRect.width < 1 || blockRect.height < 1) return;

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        textWidth = blockRect.width;
        textHeight = blockRect.height;
        textCanvas.width = Math.ceil(textWidth * dpr);
        textCanvas.height = Math.ceil(textHeight * dpr);
        textCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        textCtx.clearRect(0, 0, textWidth, textHeight);
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'alphabetic';
        textCtx.fillStyle = '#fff';

        const children = Array.from(textBlockEl.children);
        children.forEach((el) => {
            const style = getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize) || 16;
            let lineHeight = parseFloat(style.lineHeight);
            if (!lineHeight || Number.isNaN(lineHeight)) lineHeight = fontSize * 1.2;
            const elRect = el.getBoundingClientRect();
            const offsetX = elRect.left - blockRect.left;
            const offsetY = elRect.top - blockRect.top;
            textCtx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
            // tracking-tight aplica letter-spacing negativo; sin replicarlo aquí,
            // measureText()/fillText() calculan el texto más ancho que el real y
            // el centrado lo recorta contra los bordes del canvas.
            textCtx.letterSpacing = style.letterSpacing;

            let lines;
            if (el.tagName === 'H1' || el.tagName === 'H2') {
                // Cada segmento entre <br> puede seguir siendo más ancho que
                // el propio elemento (el navegador lo envolvería solo); hay
                // que aplicar wrapText también aquí o el texto se dibuja más
                // ancho que el canvas y queda cortado en los bordes.
                lines = el.innerHTML
                    .split(/<br\s*\/?>/i)
                    .map((s) => s.replace(/<[^>]+>/g, '').trim())
                    .filter(Boolean)
                    .flatMap((segment) => wrapText(textCtx, segment, elRect.width));
            } else {
                const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
                lines = wrapText(textCtx, text, elRect.width);
            }

            const centerX = offsetX + elRect.width / 2;
            const totalTextHeight = lines.length * lineHeight;
            const startY = offsetY + (elRect.height - totalTextHeight) / 2 + lineHeight * 0.8;
            lines.forEach((line, i) => {
                textCtx.fillText(line, centerX, startY + i * lineHeight);
            });
        });

        gl.bindTexture(gl.TEXTURE_2D, textTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, textCanvas.width, textCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        hasText = 1;

        // El texto real solo se oculta una vez confirmamos que hay una copia
        // visual suya en el canvas — si esto nunca llega a ejecutarse (WebGL
        // no disponible, o el bloque de texto no existe), el texto real se
        // queda visible tal cual.
        textBlockEl.style.opacity = '0';
    }

    function updateTextOrigin() {
        if (!textBlockEl || !hasText) return;
        const rect = textBlockEl.getBoundingClientRect();
        textOriginX = rect.left;
        textOriginY = rect.top;
    }

    // --- Rejilla de desplazamiento: decae cada frame, recibe un "empuje" en
    // la celda más cercana al cursor (suavizado con gsap.quickTo para que la
    // inyección no salte con movimientos rápidos). ---
    const smoothedMouse = { x: -9999, y: -9999 };
    const setSmoothedX = gsap.quickTo(smoothedMouse, 'x', { duration: 0.22, ease: 'power3' });
    const setSmoothedY = gsap.quickTo(smoothedMouse, 'y', { duration: 0.22, ease: 'power3' });
    let prevInjectX = null, prevInjectY = null;

    function onPointerMove(e) {
        setSmoothedX(e.clientX);
        setSmoothedY(e.clientY);
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    function injectField(canvasW, canvasH) {
        if (smoothedMouse.x < 0 || smoothedMouse.y < 0) return;
        const col = Math.floor((smoothedMouse.x / canvasW) * FIELD_COLS);
        const row = Math.floor((smoothedMouse.y / canvasH) * FIELD_ROWS);
        if (col < 0 || col >= FIELD_COLS || row < 0 || row >= FIELD_ROWS) return;

        const vx = prevInjectX === null ? 0 : smoothedMouse.x - prevInjectX;
        const vy = prevInjectY === null ? 0 : smoothedMouse.y - prevInjectY;
        prevInjectX = smoothedMouse.x;
        prevInjectY = smoothedMouse.y;

        for (let dy = -INJECT_RADIUS; dy <= INJECT_RADIUS; dy++) {
            for (let dx = -INJECT_RADIUS; dx <= INJECT_RADIUS; dx++) {
                const c = col + dx, r = row + dy;
                if (c < 0 || c >= FIELD_COLS || r < 0 || r >= FIELD_ROWS) continue;
                const falloff = dx === 0 && dy === 0 ? 1 : 0.45;
                const i = r * FIELD_COLS + c;
                dispX[i] = Math.max(-DISP_MAX, Math.min(DISP_MAX, dispX[i] + vx * falloff));
                dispY[i] = Math.max(-DISP_MAX, Math.min(DISP_MAX, dispY[i] + vy * falloff));
            }
        }
    }

    function decayAndUploadField() {
        for (let i = 0; i < dispX.length; i++) {
            dispX[i] *= DECAY;
            dispY[i] *= DECAY;
            dispBuf[i * 2] = Math.round((dispX[i] / DISP_MAX * 0.5 + 0.5) * 255);
            dispBuf[i * 2 + 1] = Math.round((dispY[i] / DISP_MAX * 0.5 + 0.5) * 255);
        }
        gl.bindTexture(gl.TEXTURE_2D, dispTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, FIELD_COLS, FIELD_ROWS, gl.RG, gl.UNSIGNED_BYTE, dispBuf);
    }

    // Respiración lenta y constante del plasma (contraste), independiente del
    // mouse, para que el fondo nunca esté del todo estático.
    const breathing = { contrast: 1 };
    const breathingTween = gsap.to(breathing, {
        contrast: 1.22,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
    });

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let cellSizePx = CELL_SIZE * dpr;

    function resize() {
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        cellSizePx = CELL_SIZE * dpr;
        renderTextTexture();
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(renderTextTexture);
    }

    function render(timeSeconds) {
        // Comprobación barata cada frame en vez de depender solo del
        // ResizeObserver: si el contenedor medía 0 en el primer resize()
        // (layout aún no asentado en ese instante) esto lo autocorrige sin
        // esperar a un resize real del viewport.
        const expectedW = Math.max(1, container.clientWidth) * dpr;
        const expectedH = Math.max(1, container.clientHeight) * dpr;
        if (canvas.width !== expectedW || canvas.height !== expectedH) {
            resize();
        }

        // injectField trabaja en px CSS (mismas unidades que clientX/clientY),
        // no en px de dispositivo del canvas — si no, en cualquier pantalla
        // con devicePixelRatio != 1 el cursor se mapea a la celda equivocada
        // de la rejilla y el efecto queda desalineado/imperceptible.
        injectField(container.clientWidth, container.clientHeight);
        decayAndUploadField();
        updateTextOrigin();

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(prog);
        gl.uniform2f(u.resolution, canvas.width, canvas.height);
        gl.uniform1f(u.time, timeSeconds);
        gl.uniform1f(u.contrast, breathing.contrast);
        gl.uniform1f(u.dispMax, DISP_MAX * dpr);
        gl.uniform1f(u.dispStrength, DISP_STRENGTH);
        gl.uniform1f(u.cellSize, cellSizePx);
        gl.uniform2f(u.textOrigin, textOriginX * dpr, textOriginY * dpr);
        gl.uniform2f(u.textSize, textWidth * dpr, textHeight * dpr);
        gl.uniform1f(u.hasText, hasText);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dispTexture);
        gl.uniform1i(u.dispTexture, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textTexture);
        gl.uniform1i(u.textTexture, 1);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // gsap.ticker() da segundos desde que arrancó el ticker global de GSAP —
    // en una pestaña abierta muchas horas ese número crece sin límite, y
    // sin()/cos() con argumentos muy grandes pierden precisión en float32 en
    // la GPU (el plasma degenera a negro). Se acumula tiempo propio a partir
    // del delta de cada frame y se envuelve periódicamente para que nunca
    // crezca sin límite, sin que se note el salto (el envolvido cae siempre
    // en un múltiplo exacto del periodo de las funciones periódicas).
    const TIME_WRAP = 1000;
    let elapsed = 0;
    function tick(_absoluteTime, deltaMs) {
        elapsed = (elapsed + deltaMs / 1000) % TIME_WRAP;
        render(elapsed);
    }
    gsap.ticker.add(tick);

    function dispose() {
        gsap.ticker.remove(tick);
        breathingTween.kill();
        window.removeEventListener('pointermove', onPointerMove);
        resizeObserver.disconnect();
        gl.deleteBuffer(buffer);
        gl.deleteTexture(dispTexture);
        gl.deleteTexture(textTexture);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (textBlockEl) textBlockEl.style.opacity = '';
        canvas.remove();
    }

    return { dispose, resize };
}
