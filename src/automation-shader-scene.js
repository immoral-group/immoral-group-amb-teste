// Fondo shader (WebGL2 puro) del hero de Automatización de Procesos: un
// campo de filamentos de luz en blanco y gris (sin color), que se abren en
// abanico desde un foco fuera de cuadro a la derecha — evocando el hero de
// referencia que aportó el usuario (aaask.com), pero acromático y con una
// reimplementación propia (funciones analíticas por filamento vía hash, no
// partículas ni texturas de ruido). El fondo en sí NO reacciona al cursor
// (decisión explícita: el pixelado en bloques que usa warp() se ve bien en
// texto pero rompería filamentos suaves en escalones) — el cursor sigue
// pixelando solo el texto del hero, vía la rejilla de desplazamiento de más
// abajo (no un framebuffer), que decae con el tiempo.
//
// Nota histórica: antes de este cambio el fondo era un "plasma" de color con
// dithering ordenado (inspirado en https://codapress.co.uk/, cuyo bundle JS
// se inspeccionó para entender esa técnica), sustituido primero por negro
// sólido (ver TASK-LOG) y ahora por estos filamentos.

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

// Hash sin trigonometría (variante del clásico de Dave Hoskins): devuelve 4
// valores pseudoaleatorios por índice de cinta. Se evita a propósito el
// hash basado en sin() porque aquí se llama varias veces por cinta y por
// fragmento — con ~18 cintas serían cientos de sin() por píxel.
vec4 hash41(float x) {
    vec4 p = fract(vec4(x) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
    p += dot(p, p.wzxy + 33.33);
    return fract((p.xxyz + p.yzzw) * p.zywx);
}

const int NUM_STRANDS = 22;
// Foco fuera de cuadro a la derecha, en unidades de altura de pantalla.
// Todas las cintas se aprietan ahí y se abren en abanico hacia la izquierda.
// Se mantiene BIEN lejos del borde derecho a propósito: con el foco cerca, en
// esa esquina se solapaban las 22 cintas a la vez y la suma se quemaba en un
// blanco plano; alejándolo, el borde visible cae en la parte ya abierta del
// abanico y las cintas quedan además más paralelas, como en la referencia.
const float FOCAL_X = 1.95;
const float FOCAL_Y = 0.16;

// Campo de cintas de luz, acumulado como luminancia (blanco/gris, sin la
// aberración cromática de la referencia). Cada cinta es una curva analítica
// —sin texturas ni buffers— compuesta de DOS capas superpuestas, que es lo
// que da el aspecto de la referencia: una banda ancha y suave (el "volumen"
// de la cinta) con un núcleo fino y brillante corriendo por dentro.
//
// Las cintas se parametrizan por su altura en el BORDE IZQUIERDO, no por una
// pendiente: así se garantiza que queden repartidas por toda la pantalla.
// (Parametrizar por pendiente mandaba la mayoría fuera de cuadro y dejaba
// solo unos pocos hilos sueltos visibles.)
float filaments(vec2 p, float aspect, float t) {
    float focalX = FOCAL_X * aspect;

    // tX: 0 en el foco (derecha, fuera de cuadro), 1 en el borde izquierdo.
    // (Nota: se probó deformar aquí p con una distorsión de barril completa
    // antes de calcular tX, pero eso cambia el jacobiano espacio-a-espacio de
    // forma no constante, y el resto del código asume uno constante para
    // corregir el grosor del núcleo fino — el resultado eran núcleos
    // aliasing/granulados en vez de curvas limpias. La curvatura "ojo de pez"
    // se hace en su lugar más abajo, como desplazamiento por cinta.)
    float tX = max((focalX - p.x) / focalX, 0.0);

    float lum = 0.0;

    for (int i = 0; i < NUM_STRANDS; i++) {
        vec4 a = hash41(float(i) * 1.37 + 2.11);
        vec4 b = hash41(float(i) * 2.71 + 5.43);

        // Convergencia PARCIAL: si en el foco todas cayeran en el mismo punto
        // el resultado son rayos rectos tipo estrella; dándoles ahí también un
        // reparto propio (menor que el del borde izquierdo) quedan como cintas
        // que fluyen casi en paralelo y solo se juntan hacia la derecha, que es
        // lo que hace la referencia.
        float yFocal = FOCAL_Y + (a.x - 0.5) * 0.16;
        // Reparto en el borde izquierdo. Banda MUY estrecha (antes 0.02..1.00,
        // casi toda la pantalla) para que las cintas viajen apretadas, como un
        // único haz coherente, en vez de esparcidas de arriba a abajo. El
        // pow() agrupa además en sub-racimos en vez de dejarlas equiespaciadas.
        float spread = pow(a.y, 1.35);
        float yLeft = mix(0.10, 0.62, spread);
        float yBase = mix(yFocal, yLeft, tX);

        // Ondulación en dos armónicos (curva en S, no un arco simple) que crece
        // hacia la izquierda: salen limpias del bundle y se curvan al abrirse.
        // Amplitud MUY contenida para que no se separen entre sí (el haz debe
        // leerse como un bloque que ondula junto, no como cintas divergiendo).
        float sweep = tX * mix(1.1, 2.4, a.z) + b.x * 6.2831853;
        float drift = t * mix(0.05, 0.17, b.y);
        float wob = (sin(sweep + drift) + sin(sweep * 0.53 - drift * 0.7) * 0.55)
                    * mix(0.018, 0.05, b.z) * tX;

        // Curvatura GLOBAL tipo "ojo de pez": una única forma de arco,
        // compartida por todas las cintas (con jitter propio pequeño en fase y
        // amplitud para que no queden como rieles de tren perfectos), que
        // arquea el haz entero como si pasara por delante de una lente.
        float bendPhase = a.z * 6.2831853 * 0.3;
        float bendAmp = mix(0.30, 0.55, b.z); // más amplitud: curva más marcada, tipo lente
        float bendGrow = 0.4 + 0.6 * tX; // crece hacia el borde, poco en el centro — como una lente real
        float bend = sin(tX * 3.14159265 * 1.05 + bendPhase) * bendAmp
                     * smoothstep(0.0, 0.3, tX) * bendGrow;

        float yi = yBase + wob + bend;

        // Corrección por pendiente para que el grosor aparente no engorde en
        // los tramos más inclinados — incluye la derivada de bend().
        float dBendDtX = cos(tX * 3.14159265 * 1.05 + bendPhase) * bendAmp
                          * (3.14159265 * 1.05) * smoothstep(0.0, 0.3, tX) * bendGrow;
        float slope = ((yLeft - yFocal) + dBendDtX) / focalX;
        float d = abs(p.y - yi) * inversesqrt(1.0 + slope * slope);

        // Las cintas se desvanecen hacia la izquierda (profundidad).
        float fade = mix(1.0, 0.35, smoothstep(0.35, 1.15, tX));

        // Wireframe fino y COMPLETO: sin halo ni glow — borde NÍTIDO (smoothstep)
        // en vez de caída gaussiana, como un trazo real, no una cinta de luz.
        float coreHalf = mix(0.0006, 0.0012, b.w); // más fino (antes 0.0014-0.003), como el wireframe de diseño
        float core = 1.0 - smoothstep(coreHalf * 0.5, coreHalf, d);

        // PUNTO DE LUZ que viaja por la cinta como un círculo nítido (a
        // pedido: sin engrosar la línea, un punto redondo como los vértices
        // de la referencia de wireframe, sin glow). flowArg es la fase a lo
        // largo de la cinta; sin(flowArg*pi) vale 1 justo en el centro de
        // cada punto, en flowArg = 0.5 + 2k. Se despeja esa distancia de fase
        // y se convierte a una distancia aproximada "a lo largo de la cinta"
        // (misma escala que d, la perpendicular), para combinarlas en una
        // distancia 2D real y dibujar un círculo, no una franja.
        float freq = mix(5.5, 12.0, b.w);
        float speed = mix(0.40, 0.85, a.w);
        float flowArg = tX * freq - t * speed + b.x * 6.2831853;
        float peakK = floor((flowArg - 0.5) / 2.0 + 0.5);
        float deltaFlowArg = flowArg - (0.5 + 2.0 * peakK);
        float alongDist = (deltaFlowArg / freq) * focalX;

        float dotR = mix(0.004, 0.008, b.w); // radio del punto de luz (más chico, a juego con la línea fina)
        float distToDot = length(vec2(alongDist, d));
        float dot = 1.0 - smoothstep(dotR * 0.6, dotR, distToDot);

        // Línea base siempre visible (solo atenuada por profundidad) + el
        // punto de luz redondo viajando encima. Sin niebla ni banda difusa.
        lum += core * fade;
        lum += dot * fade;
    }

    return lum;
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
    // warp() solo se usa para pixelar el TEXTO (sampleText más abajo) — el
    // fondo se calcula con screenPx sin deformar a propósito: el pixelado en
    // bloques de warp() se ve bien en texto, pero rompería los filamentos
    // suaves en escalones/glitch visibles.
    vec2 warped = warp(screenPx);

    // Espacio normalizado por la ALTURA de pantalla (no por resolución
    // completa): mantiene la proporción real de los filamentos al cambiar
    // el ancho de la ventana, en vez de deformarlos.
    float aspect = uResolution.x / uResolution.y;
    vec2 p = screenPx / uResolution.y;

    float lum = filaments(p, aspect, uTime);

    // La luz pesa más del lado derecho (como en la referencia), pero las
    // cintas siguen llegando al borde izquierdo, solo que atenuadas — cortar
    // ahí a oscuras dejaba la mitad del cuadro vacía.
    float sideBias = smoothstep(-0.15, 0.95, p.x / aspect);
    lum *= mix(0.38, 1.15, sideBias);

    // Caída suave hacia el borde superior: en la referencia la esquina de
    // arriba a la izquierda queda en negro y el haz entra por el centro-derecha.
    lum *= mix(0.35, 1.0, smoothstep(0.0, 0.45, p.y));

    // Escudo bajo el bloque de texto del hero: uTextOrigin/uTextSize se
    // recalculan cada frame en JS (updateTextOrigin(), vía
    // getBoundingClientRect()) con la posición real del texto en pantalla,
    // así que este escudo sigue al hero al hacer scroll y desaparece
    // con él sin coordinación adicional aquí.
    vec2 halfSize = uTextSize * 0.5;
    vec2 boxCenter = uTextOrigin + halfSize;
    vec2 outsideBox = max(abs(screenPx - boxCenter) - halfSize, vec2(0.0));
    float distOutsideBox = length(outsideBox);
    float feather = 0.16 * uResolution.y;
    float shield = 1.0 - smoothstep(0.0, feather, distOutsideBox);
    lum *= mix(1.0, 0.15, shield * uHasText);

    // Respiración lenta (mismo tween GSAP que antes animaba el contraste del
    // plasma, reaprovechado aquí sin cambios en el JS).
    lum *= uContrast;

    // Compresión suave de altas luces en vez de recorte duro: deja subir los
    // núcleos de las cintas sin clipear en un plano sólido.
    lum = lum / (1.0 + lum * 0.42);

    vec3 col = vec3(clamp(lum, 0.0, 1.0));

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
        textCtx.textAlign = 'left';
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

            const totalTextHeight = lines.length * lineHeight;
            const startY = offsetY + (elRect.height - totalTextHeight) / 2 + lineHeight * 0.8;
            lines.forEach((line, i) => {
                textCtx.fillText(line, offsetX, startY + i * lineHeight);
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

    // Respiración lenta y constante del brillo de los filamentos (contraste),
    // independiente del mouse, para que el fondo nunca esté del todo estático.
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
    // la GPU (los filamentos pierden su forma). Se acumula tiempo propio a partir
    // del delta de cada frame y se envuelve periódicamente para que nunca
    // crezca sin límite, sin que se note el salto (el envolvido cae siempre
    // en un múltiplo exacto del periodo de las funciones periódicas).
    const TIME_WRAP = 1000;
    let elapsed = 0;

    // Al hacer scroll, el movimiento (ondulación + pulsos de flujo) se acelera
    // — un impulso que crece con la velocidad del scroll y decae solo cuando
    // se deja de scrollear, en vez de saltar a una velocidad fija.
    let scrollBoost = 0;
    let lastScrollY = window.scrollY;
    function onScroll() {
        const currentY = window.scrollY;
        scrollBoost = Math.min(scrollBoost + Math.abs(currentY - lastScrollY) * 0.03, 9);
        lastScrollY = currentY;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    function tick(_absoluteTime, deltaMs) {
        scrollBoost *= 0.93; // decae solo hacia 1x en reposo
        const timeScale = 1.0 + scrollBoost;
        elapsed = (elapsed + (deltaMs / 1000) * timeScale) % TIME_WRAP;
        render(elapsed);
    }
    gsap.ticker.add(tick);

    function dispose() {
        gsap.ticker.remove(tick);
        breathingTween.kill();
        window.removeEventListener('scroll', onScroll);
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
