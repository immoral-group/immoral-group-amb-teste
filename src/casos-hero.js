import * as THREE from 'three';
import { glassParams, buildStudio, BAR_ANGLE } from './home-prisma-hero.js';

// Hero of /casos-de-exito: one glass bubble per success case (the material,
// studio light and ruled wall of the /nuestra-historia bubble) with the brand's
// logo inside. They rise from below the screen like bubbles, go round the
// title, burst near the top (droplets and a ring of light, like the big one)
// and come back from below. Matter.js (global, from the CDN) runs the physics
// in CSS pixels; three.js draws it with an orthographic camera in the same
// units, so a body's position is the mesh's. On desktop the bubbles can be
// dragged and thrown, they move out of the pointer's way, and a click
// (without dragging) opens the case.

const WALL = 200;

const wallVertex = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Up to this many bubbles reach the liquid surface (one per case).
const MAX_BUBBLES = 32;
const RIPPLES = 6;

// White wall with ruled lines at the angle of the brand bar (the glass refracts
// them), quiet behind the centred title and spreading under the pointer.
// On desktop it also draws the pool: the top of the cases section, peeking in
// at the bottom of the screen, as one big slab of the bubbles' glass. The
// bubbles are born inside it and leave it like liquid: a smooth union of the
// pool and each bubble (metaballs) stretches a neck that thins and snaps, and
// the surface ripples where one has just broken free.
const wallFragment = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform vec2 uHole;
uniform float uAngle;
uniform vec3 uBase;
uniform vec3 uLine;
uniform float uTime;
uniform float uPoolOn;
uniform vec4 uPool;                 // left, top, right (world), corner radius
// x, y, radius (world), liquid: 1 while joined to the pool (drawn here, as part
// of the liquid), fading to 0 as it breaks free (its 3D glass takes over).
uniform vec4 uBubbles[${MAX_BUBBLES}];
uniform vec4 uRipples[${RIPPLES}];       // x, start time, strength, 0

float lines(vec2 p) {
    float H = uSize.y;
    float ca = cos(uAngle), sa = sin(uAngle);
    vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
    vec2 mq = vec2(ca * uMouse.x + sa * uMouse.y, -sa * uMouse.x + ca * uMouse.y);
    float md = length(p - uMouse);
    float lens = exp(-md * md / (0.022 * H * H));
    q.y = mix(q.y, mq.y + (q.y - mq.y) * 0.55, lens);
    float sp = H / 22.0;
    float f = abs(fract(q.y / sp + 0.5) - 0.5) * sp;
    float w = fwidth(q.y);
    return 1.0 - smoothstep(0.009 * sp, 0.009 * sp + w * 1.1, f);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

// Signed distance to the liquid (negative inside). dPool: to the pool alone;
// dIn: to the nearest bubble, wIn: how liquid that bubble still is.
float liquid(vec2 p, out float dPool, out float dIn, out float wIn) {
    float L = uPool.x, T = uPool.y, R = uPool.z;
    float cr = min(uPool.w, (R - L) * 0.5);
    dPool = sdRoundBox(p - vec2((L + R) * 0.5, T - 3000.0), vec2((R - L) * 0.5, 3000.0), cr);
    // Ripples where a bubble has just broken free: a damped wave along the surface.
    for (int i = 0; i < ${RIPPLES}; i++) {
        vec4 rp = uRipples[i];
        float e = uTime - rp.y;
        if (rp.z <= 0.0 || e < 0.0 || e > 2.5) continue;
        float dx = p.x - rp.x;
        dPool -= rp.z * exp(-e * 2.6) * sin(e * 13.0 - abs(dx) * 0.045) * exp(-dx * dx / (rp.z * rp.z * 90.0));
    }
    float d = dPool;
    dIn = 1e5;
    wIn = 0.0;
    for (int i = 0; i < ${MAX_BUBBLES}; i++) {
        vec4 b = uBubbles[i];
        if (b.z <= 0.0 || b.w <= 0.0) continue;
        float dc = length(p - b.xy) - b.z;
        if (dc < dIn) { dIn = dc; wIn = b.w; }
        // Bubbles melt into the pool and into each other; as one breaks free
        // the blend narrows and the neck snaps.
        d = smin(d, dc, max(b.z * 0.95 * b.w, 0.5));
    }
    return d;
}

void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float ln = lines(p);
    vec2 h = p / uHole;
    float mask = smoothstep(0.75, 1.35, length(h));
    vec3 col = mix(uBase, uLine, ln * 0.7 * mask);

    if (uPoolOn > 0.5 && p.y < uPool.y + 260.0) {
        float dPool, dIn, wIn, a, b, c;
        float f = liquid(p, dPool, dIn, wIn);
        float fx = liquid(p + vec2(1.0, 0.0), a, b, c);
        float fy = liquid(p + vec2(0.0, 1.0), a, b, c);
        vec2 g = normalize(vec2(fx - f, fy - f) + 1e-6);   // outward normal
        float aa = max(fwidth(f), 0.75);
        // The whole liquid: pool, necks and the bubbles still joined to it. The
        // body of a bubble breaking free fades out here while its 3D glass
        // fades in on top.
        float inBubble = (1.0 - smoothstep(-aa, aa, dIn)) * smoothstep(-aa, aa, dPool);
        float cover = (1.0 - smoothstep(-aa, aa, f)) * mix(1.0, wIn, inBubble);
        if (cover > 0.0) {
            float depth = clamp(-f / 34.0, 0.0, 1.0);     // 0 at the surface, 1 well inside
            float bend = (1.0 - depth) * (1.0 - depth);
            // Refraction: the ruled lines bend toward the edges, like through the bubbles.
            vec2 rq = p + g * bend * 26.0;
            float lr = lines(rq);
            vec3 glass = mix(vec3(0.94, 0.95, 1.0), vec3(0.74, 0.79, 0.97), lr * 0.8);
            // A cool lilac tint that deepens away from the surface (the bubbles' attenuation).
            float deep = clamp(-f / 220.0, 0.0, 1.0);
            glass = mix(glass, vec3(0.83, 0.86, 0.99), 0.3 + 0.25 * deep);
            // The edge, built like the rim of the bubbles: a periwinkle outline
            // that draws the shape on the white, a white glint just inside it,
            // then a soft periwinkle band with a thin iridescent film.
            float ang = atan(g.y, g.x);
            vec3 iri = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + ang * 0.35 + p.x * 0.0015 + uTime * 0.04));
            float outline = 1.0 - smoothstep(0.6, 2.2, -f);
            float glint = exp(-pow((-f - 4.0) / 1.8, 2.0));
            float band = exp(-pow((-f - 13.0) / 7.0, 2.0));
            glass = mix(glass, vec3(0.63, 0.71, 0.97), band * 0.5);
            glass = mix(glass, iri, band * 0.3);
            glass = mix(glass, vec3(1.0), glint * 0.9);
            glass = mix(glass, vec3(0.55, 0.64, 0.95), outline * 0.85);
            // Highlight where the surface faces the light (up and to the left).
            float spec = pow(max(0.0, dot(g, normalize(vec2(-0.45, 1.0)))), 8.0) * (1.0 - smoothstep(6.0, 26.0, -f));
            glass = mix(glass, vec3(1.0), spec * 0.6);
            // Caustic: a soft bright band under the surface of the pool.
            glass = mix(glass, vec3(1.0), 0.25 * exp(-pow((-dPool - 34.0) / 14.0, 2.0)));
            col = mix(col, glass, cover);
        }
    }
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
}`;

// Logos come in any colour, some without transparency: a white silhouette on
// transparent (tinted in ink by the material) works for all of them. Drawn
// with its long side at 1024 px whatever the file: an SVG is rasterised sharp
// at that size (not at its tiny intrinsic one) and the texture has enough
// detail for its mipmaps.
const LOGO_PX = 1024;
const FALLBACK_LOGO = '/imgs/well-logo.png';
function silhouette(img) {
    const c = document.createElement('canvas');
    const k = LOGO_PX / Math.max(img.naturalWidth, img.naturalHeight);
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, 0, 0, c.width, c.height);
    const corners = [[0, 0], [c.width - 1, 0], [0, c.height - 1], [c.width - 1, c.height - 1]];
    const transparent = corners.some(([cx, cy]) => x.getImageData(cx, cy, 1, 1).data[3] < 200);
    const data = x.getImageData(0, 0, c.width, c.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
        // Transparent logos keep their alpha; opaque ones (dark mark on a light
        // ground) are cut out by luminance.
        const a = transparent ? d[i + 3] : d[i + 3] * (1 - (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255);
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = a;
    }
    x.putImageData(data, 0, 0);
    // Cropped to the mark itself: some files carry a wide transparent margin
    // and would come out tiny next to the rest.
    let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    for (let py = 0; py < c.height; py++) {
        for (let px = 0; px < c.width; px++) {
            if (d[(py * c.width + px) * 4 + 3] > 16) {
                if (px < minX) minX = px; if (px > maxX) maxX = px;
                if (py < minY) minY = py; if (py > maxY) maxY = py;
            }
        }
    }
    if (maxX < 0) return c;
    const out = document.createElement('canvas');
    out.width = maxX - minX + 1; out.height = maxY - minY + 1;
    out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out;
}

// 2×2 matrices, row-major [a, b, c, d]: a stretch by (1 + s) along the angle
// and by (1 - s·k) across it (keeps the volume roughly), and their product.
const stretch = (angle, s, k) => {
    const c = Math.cos(angle), n = Math.sin(angle), u = 1 + s, v = 1 - s * k;
    return [c * c * u + n * n * v, c * n * (u - v), c * n * (u - v), n * n * u + c * c * v];
};
const mul2 = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];

const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

/**
 * @param {HTMLElement} stage  element that holds the canvas (and gets the pointer)
 * @param {HTMLCanvasElement} canvas
 * @param {{ cases: {logo: string, href: string, small?: boolean}[], avoid: () => DOMRect | null, interactive: boolean }} opts
 */
export function createCaseBubbles(stage, canvas, { cases, avoid, interactive }) {
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events, Query } = window.Matter;

    const small = () => innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small() ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0xFFFFFF, 1);
    if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = small() ? 0.6 : 1;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(buildStudio(), 0.02).texture;
    pmrem.dispose();
    if (scene.environmentRotation) scene.environmentRotation.set(0, 0.6, 0);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
    camera.position.z = 2000;

    const uniforms = {
        uSize: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(9999, 9999) },
        uHole: { value: new THREE.Vector2(1, 1) },
        uAngle: { value: BAR_ANGLE },
        uBase: { value: new THREE.Color('#FFFFFF') },
        uLine: { value: new THREE.Color('#DCE5F8') },
        uTime: { value: 0 },
        uPoolOn: { value: 0 },
        uPool: { value: new THREE.Vector4() },
        uBubbles: { value: Array.from({ length: MAX_BUBBLES }, () => new THREE.Vector4()) },
        uRipples: { value: Array.from({ length: RIPPLES }, () => new THREE.Vector4()) },
    };
    let rippleNext = 0;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms, vertexShader: wallVertex, fragmentShader: wallFragment, toneMapped: false, depthWrite: false }));
    wall.position.z = -600;
    wall.renderOrder = -1;
    scene.add(wall);

    // Thin shell, like the bubble of /nuestra-historia (thickness scales with
    // the mesh; the attenuation distance is in world units, here pixels).
    // No dispersion: it would split the logo inside into coloured fringes.
    const glass = new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.22, iridescence: 0.9, dispersion: 0, attenuationDistance: 900 });
    // A living surface: slow waves along the normal, each bubble on its own
    // phase (uPhase) and stronger while it jiggles after a knock (uAmp).
    const wobble = { uTime: { value: 0 } };
    const wobbly = (phase, amp) => shader => {
        shader.uniforms.uTime = wobble.uTime;
        shader.uniforms.uPhase = phase;
        shader.uniforms.uAmp = amp;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uPhase;\nuniform float uAmp;')
            .replace('#include <begin_vertex>', [
                '#include <begin_vertex>',
                'float tt = uTime + uPhase;',
                'float wv = sin(position.x * 2.6 + tt * 1.7) * sin(position.y * 2.2 + tt * 1.3) * sin(position.z * 2.9 + tt * 1.5);',
                'wv += 0.5 * sin(position.y * 4.1 - tt * 2.3) * sin(position.x * 3.3 + tt * 1.9);',
                'transformed += normal * wv * uAmp;',
            ].join('\n'));
    };
    glass.onBeforeCompile = wobbly({ value: 0 }, { value: 0.03 });
    const sphere = new THREE.SphereGeometry(1, 72, 48);
    const plane = new THREE.PlaneGeometry(1, 1);
    const INK = new THREE.Color('#0C1A3D');

    // ---------- Droplets and rings of the bursts (shared pools) ----------
    const DROPS_EACH = 14;
    const DROPS = cases.length * DROPS_EACH;
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 1.2, dispersion: 0 }), DROPS);
    drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    drops.frustumCulled = false;
    scene.add(drops);
    const dropData = Array.from({ length: DROPS }, () => ({ p: new THREE.Vector2(), v: new THREE.Vector2(), s: 0, life: 0 }));
    const tmp = new THREE.Object3D();
    const ringGeo = new THREE.RingGeometry(0.97, 1, 96);

    // pool: the top edge of the cases section, in stage pixels (null: none).
    const state = { w: 1, h: 1, r: 60, t: 0, running: false, visible: true, ready: false, released: false, hasPointer: false, dragged: false, pool: null };
    // No gravity: each bubble gets its own lift (see beforeUpdate).
    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    const world = engine.world;
    const bubbles = []; // { body, mesh, logo, ring, href, alive, burstAt, respawnAt, lift, phase, top }
    let walls = [], hole = null;

    const radius = () => Math.round(Math.min(80, Math.max(state.w < 760 ? 34 : 42, state.w * 0.05)));
    const rand = (a, b) => a + Math.random() * (b - a);

    function buildWalls() {
        Composite.remove(world, walls);
        const { w, h } = state;
        const opts = { isStatic: true };
        // Only the sides: they come in from below and leave by bursting at the top.
        walls = [
            Bodies.rectangle(-WALL / 2, h / 2, WALL, h * 4, opts),
            Bodies.rectangle(w + WALL / 2, h / 2, WALL, h * 4, opts),
        ];
        const box = avoid();
        hole = null;
        if (box) {
            const s = stage.getBoundingClientRect();
            const pad = 18;
            const l = box.left - s.left - pad, r = box.right - s.left + pad;
            const t = box.top - s.top - pad, b = box.bottom - s.top + pad;
            // An invisible circle in the middle of the title, a bit taller than
            // the text: the bubbles slide round it and pass close to the copy,
            // behind its edges, without ever crossing its centre.
            // On a phone the text takes the whole width (no way round): there
            // they burst before reaching it.
            hole = { x: (l + r) / 2, y: (t + b) / 2, w: r - l, h: b - t, top: t, bottom: b, r: box.height * 0.68 };
            if (w >= 760) walls.push(Bodies.circle(hole.x, hole.y, hole.r, { isStatic: true, friction: 0 }));
        }
        Composite.add(world, walls);
    }

    function layout() {
        const rect = stage.getBoundingClientRect();
        state.w = Math.max(1, rect.width);
        state.h = Math.max(1, rect.height);
        renderer.setSize(state.w, state.h, false);
        Object.assign(camera, { left: -state.w / 2, right: state.w / 2, top: state.h / 2, bottom: -state.h / 2 });
        camera.updateProjectionMatrix();
        wall.scale.set(state.w, state.h, 1);
        uniforms.uSize.value.set(state.w, state.h);
        buildWalls();
        uniforms.uHole.value.set(hole ? hole.w * 0.62 : 1, hole ? hole.h * 0.75 : 1);
        // Same size for every bubble; a new size rescales the bodies in place.
        const r = radius();
        if (r !== state.r && bubbles.length) bubbles.forEach(b => Body.scale(b.body, r / state.r, r / state.r));
        state.r = r;
    }

    // Where a bubble bursts: just under the nav on wide screens, under the
    // title on a phone. A little different every time.
    function burstLine() {
        const r = state.r;
        if (state.w < 760 && hole) return hole.bottom + r * rand(0.6, 1.6);
        return r + rand(60, 150);
    }

    // They come in by the sides, never through the middle (where the title
    // is): the outer 30% of the width on each side.
    function sideX() {
        const r = state.r, band = state.w * (state.w < 760 ? 0.36 : 0.3);
        return Math.random() < 0.5 ? rand(r, Math.max(r + 1, band)) : rand(Math.min(state.w - r - 1, state.w - band), state.w - r);
    }

    // From below the screen, staggered so they arrive one after another.
    function launch(b, delay = 0) {
        const r = state.r;
        Composite.remove(world, b.body);
        Body.setPosition(b.body, { x: sideX(), y: state.h + r * 1.2 + delay });
        Body.setVelocity(b.body, { x: 0, y: 0 });
        b.lift = rand(0.75, 1.3);
        b.phase = rand(0, Math.PI * 2);
        b.top = burstLine();
        b.alive = true;
        b.burstAt = -1;
        b.mesh.visible = true;
        b.mesh.scale.setScalar(r);
        if (b.logo) b.logo.visible = true;
        b.lean = 0;
        b.jig.a = 0;
        Composite.add(world, b.body);
    }

    // The screen does not start empty: some bubbles are already on their way
    // up, spread over the height (never on each other, on the title circle
    // or above where they burst). The rest keep arriving from below.
    function scatter() {
        const r = state.r, placed = [];
        const order = bubbles.filter(Boolean).sort(() => Math.random() - 0.5);
        const n = Math.round(order.length * 0.6);
        order.forEach((b, i) => {
            if (i >= n) { launch(b, (i - n) * r * 1.6); return; }
            for (let k = 0; k < 60; k++) {
                const floor = state.pool ? state.pool.top - r * 2.2 : state.h - r * 0.5; // above the pool, if there is one
                const x = sideX(), y = rand(Math.max(b.top + r * 1.5, r * 2), floor);
                const clear = placed.every(p => Math.hypot(p.x - x, p.y - y) > r * 2.15)
                    && !(hole && state.w >= 760 && Math.hypot(hole.x - x, hole.y - y) < hole.r + r * 1.1)
                    && !(hole && state.w < 760 && y < hole.bottom + r);
                if (clear) { Body.setPosition(b.body, { x, y }); placed.push({ x, y }); return; }
            }
            launch(b, (i - n + 1) * r * 1.6);
        });
    }

    // Pop: the skin is gone at once, droplets fly out and fall, a ring of
    // light opens and fades, and the logo is gone almost instantly.
    function burst(b) {
        const r = state.r, { x, y } = b.body.position;
        Composite.remove(world, b.body);
        b.alive = false;
        b.burstAt = state.t;
        b.respawnAt = state.t + rand(0.6, 2.4);
        b.mesh.visible = false;
        b.pos = { x: x - state.w / 2, y: state.h / 2 - y };
        b.ring.position.set(b.pos.x, b.pos.y, 0);
        const base = bubbles.indexOf(b) * DROPS_EACH;
        for (let i = 0; i < DROPS_EACH; i++) {
            const d = dropData[base + i];
            const a = (i / DROPS_EACH) * Math.PI * 2 + rand(-0.2, 0.2);
            d.p.set(b.pos.x + Math.cos(a) * r, b.pos.y + Math.sin(a) * r);
            d.v.set(Math.cos(a), Math.sin(a)).multiplyScalar(r * rand(2.5, 5.5)).add(new THREE.Vector2(0, r * 1.5));
            d.s = r * rand(0.04, 0.1);
            d.life = 1;
        }
    }

    // One bubble per case: glass sphere + the logo, flat and opaque, inside it.
    async function addBubble(c, i) {
        let logo = null;
        try {
            // A logo that does not load (a wrong path in /casos-admin) falls back
            // to La Marca Well's, so no bubble is ever left empty.
            const img = await loadImage(c.logo).catch(() => { c.small = true; return loadImage(FALLBACK_LOGO); });
            const mark = silhouette(img);
            const map = new THREE.CanvasTexture(mark);
            map.colorSpace = THREE.SRGBColorSpace;
            map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            const aspect = mark.width / mark.height;
            // Soft edges (blended, not cut by an alpha test) and drawn on the
            // front of the glass: refracted through it, at this size, the
            // mark came out blurred.
            logo = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map, color: INK, transparent: true, depthWrite: false, toneMapped: false }));
            logo.renderOrder = 2;
            // In units of the radius: the corners of the logo stay inside the
            // glass (half-diagonal 0.82) and the long side under 1.56. The
            // nearly square ones asked to stay smaller take a bit less.
            const diag = 0.82 * (c.small ? 0.78 : 1);
            const k = Math.min((2 * diag) / Math.hypot(aspect, 1), 1.56 / Math.max(aspect, 1));
            logo.userData.size = [k * aspect, k];
            scene.add(logo);
        } catch (_) { /* a case without a logo keeps an empty bubble */ }
        // Its own copy of the glass (same program): its opacity fades it in as
        // it leaves the pool, where until then it was part of the liquid.
        const mesh = new THREE.Mesh(sphere, Object.assign(glass.clone(), { transparent: true }));
        const amp = { value: 0.035 };
        mesh.material.onBeforeCompile = wobbly({ value: rand(0, 40) }, amp);
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#9DBBFF', transparent: true, opacity: 0, depthWrite: false }));
        scene.add(ring);
        // They slide instead of rolling: a sphere looks the same either way and
        // the logo stays upright, readable (it only leans with the speed).
        const body = Bodies.circle(0, 0, state.r, { restitution: 0.5, friction: 0.01, frictionStatic: 0.05, frictionAir: 0.05, density: 0.0012, inertia: Infinity });
        // jig: the jelly wobble after a knock (strength, direction, when).
        const b = { body, mesh, logo, ring, amp, href: c.href, alive: false, burstAt: -1, respawnAt: 0, jig: { a: 0, dir: 0, t0: -9 }, breath: rand(0, 6.28) };
        if (logo) logo.matrixAutoUpdate = false;
        bubbles[i] = b;
        byBody.set(body.id, b);
        launch(b);
    }

    // A knock (another bubble, the title's circle, a side) sets the bubble
    // jiggling along the line of the hit, harder the faster it came in.
    const byBody = new Map();
    Events.on(engine, 'collisionStart', ({ pairs }) => {
        pairs.forEach(({ bodyA, bodyB, collision }) => {
            const dvx = bodyA.velocity.x - bodyB.velocity.x, dvy = bodyA.velocity.y - bodyB.velocity.y;
            const n = collision.normal;
            const knock = Math.abs(dvx * n.x + dvy * n.y);
            const a = Math.min(0.2, 0.04 + knock * 0.07);
            [bodyA, bodyB].forEach(body => {
                const b = byBody.get(body.id);
                if (!b) return;
                const left = b.jig.a * Math.exp(-(state.t - b.jig.t0) * 3.2);
                if (a < left) return;
                b.jig = { a, dir: Math.atan2(-n.y, n.x), t0: state.t };
            });
        });
    });

    // Buoyancy and a slow sideways sway, each bubble at its own pace. With
    // frictionAir this settles into a steady rise.
    Events.on(engine, 'beforeUpdate', () => {
        const t = state.t;
        bubbles.forEach(b => {
            if (!b?.alive) return;
            const m = b.body.mass;
            // Two sways on top of each other and a lift that comes and goes:
            // no two bubbles rise alike, none in a straight line.
            const sway = Math.sin(t * 0.9 + b.phase) * 0.00011 + Math.sin(t * 2.3 + b.phase * 1.7) * 0.00005;
            const lift = 0.0003 * b.lift * (1 + 0.3 * Math.sin(t * 0.7 + b.phase * 2.1));
            Body.applyForce(b.body, b.body.position, { x: sway * m, y: -lift * m });
        });
    });

    if (interactive) {
        const mouse = Mouse.create(stage);
        // Matter listens to the wheel to scale its mouse: that would block the page scroll.
        mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
        mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
        mouse.element.removeEventListener('wheel', mouse.mousewheel);
        const drag = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        Composite.add(world, drag);
        const alive = () => bubbles.filter(b => b?.alive).map(b => b.body);
        let down = null;
        Events.on(drag, 'mousedown', () => { down = { ...mouse.position }; state.dragged = false; });
        Events.on(drag, 'mousemove', () => { if (down && Math.hypot(mouse.position.x - down.x, mouse.position.y - down.y) > 6) state.dragged = true; });
        Events.on(drag, 'mouseup', () => {
            if (down && !state.dragged) {
                const hit = Query.point(alive(), mouse.position)[0];
                const b = hit && bubbles.find(x => x.body === hit);
                if (b?.href) location.href = b.href;
            }
            down = null;
        });
        // The bubbles move out of the pointer's way.
        Events.on(engine, 'beforeUpdate', () => {
            if (!state.hasPointer) return;
            const m = mouse.position;
            const range = state.r * 2.1;
            bubbles.forEach(b => {
                if (!b?.alive || drag.body === b.body) return;
                const dx = b.body.position.x - m.x, dy = b.body.position.y - m.y;
                const d = Math.hypot(dx, dy);
                if (d > 0 && d < range) {
                    const k = (1 - d / range) * 0.004 * b.body.mass;
                    Body.applyForce(b.body, b.body.position, { x: (dx / d) * k, y: (dy / d) * k });
                }
            });
        });
        stage.addEventListener('pointermove', e => {
            state.hasPointer = true;
            const s = stage.getBoundingClientRect();
            uniforms.uMouse.value.set(e.clientX - s.left - state.w / 2, state.h / 2 - (e.clientY - s.top));
            // The cursor tells what a click does.
            const over = Query.point(alive(), { x: e.clientX - s.left, y: e.clientY - s.top }).length > 0;
            stage.dataset.cursor = over ? 'Ver caso' : 'Arrastra';
        });
        stage.addEventListener('pointerleave', () => { state.hasPointer = false; });
    }

    function frame(dt) {
        state.t += dt;
        if (dt > 0) Engine.update(engine, Math.min(dt, 1 / 30) * 1000);
        wobble.uTime.value = state.t;
        uniforms.uTime.value = state.t;
        // The pool and the bubbles near it, for the liquid surface (world units).
        const pool = state.pool;
        uniforms.uPoolOn.value = pool ? 1 : 0;
        if (pool) uniforms.uPool.value.set(pool.inset - state.w / 2, state.h / 2 - pool.top, state.w / 2 - pool.inset, pool.radius);
        // While a bubble is joined to the pool it is liquid: the wall shader
        // draws it as part of the pool (melting into it and into its
        // neighbours) and its 3D glass is hidden. Once it is clear of the
        // surface the neck snaps (a ripple), the liquid body fades out and the
        // 3D bubble fades in. Without a pool, they are always 3D.
        let n = 0;
        bubbles.forEach(b => {
            if (!b?.alive) return;
            const by = b.body.position.y;
            const joined = !!pool && by > pool.top - state.r * 1.75;
            if (joined) b.liquid = 1;
            else if (b.liquid > 0) {
                if (b.joined && pool) {
                    uniforms.uRipples.value[rippleNext].set(b.body.position.x - state.w / 2, state.t, state.r * 0.22, 0);
                    rippleNext = (rippleNext + 1) % RIPPLES;
                }
                b.liquid = Math.max(0, b.liquid - dt / 0.35);
            }
            b.joined = joined;
            const liquid = b.liquid || 0;
            b.mesh.material.opacity = 1 - liquid;
            b.mesh.visible = liquid < 0.99;
            if (pool && liquid > 0 && n < MAX_BUBBLES) uniforms.uBubbles.value[n++].set(b.body.position.x - state.w / 2, state.h / 2 - by, state.r, liquid);
        });
        for (let i = n; i < MAX_BUBBLES; i++) uniforms.uBubbles.value[i].set(0, 0, 0, 0);
        const r = state.r;
        const tmpV = new THREE.Vector2();
        bubbles.forEach(b => {
            if (!b) return;
            const { body, mesh, logo, ring } = b;
            if (b.alive) {
                if (body.position.y < b.top) burst(b);
                else {
                    const x = body.position.x - state.w / 2, y = state.h / 2 - body.position.y;
                    // Soft body: a stretch along the direction it travels, the
                    // jelly wobble of the last knock (a damped oscillation along
                    // where it was hit) and a slow breath. The logo inside
                    // deforms with it.
                    tmpV.set(body.velocity.x, -body.velocity.y);
                    const sv = Math.min(0.14, tmpV.length() * 0.016);
                    const e = state.t - b.jig.t0;
                    const env = b.jig.a * Math.exp(-e * 3.2);
                    const sj = env * Math.sin(e * 17);
                    const br = 1 + 0.025 * Math.sin(state.t * 1.6 + b.breath);
                    const D = mul2(stretch(Math.atan2(tmpV.y, tmpV.x), sv, 0.7), stretch(b.jig.dir, sj, 0.85));
                    b.amp.value = 0.035 + Math.abs(env) * 0.25;
                    mesh.matrix.set(
                        D[0] * r * br, D[1] * r * br, 0, x,
                        D[2] * r * br, D[3] * r * br, 0, y,
                        0, 0, r, 0,
                        0, 0, 0, 1);
                    mesh.matrixWorldNeedsUpdate = true;
                    if (logo) {
                        const lean = Math.max(-0.35, Math.min(0.35, -body.velocity.x * 0.04));
                        b.lean = (b.lean || 0) + (lean - (b.lean || 0)) * Math.min(1, dt * 8);
                        const c = Math.cos(b.lean), s = Math.sin(b.lean);
                        const L = mul2(D, [c, -s, s, c]);
                        const lw = logo.userData.size[0] * r * br, lh = logo.userData.size[1] * r * br;
                        logo.matrix.set(
                            L[0] * lw, L[1] * lh, 0, x,
                            L[2] * lw, L[3] * lh, 0, y,
                            0, 0, 1, r + 2,
                            0, 0, 0, 1);
                        logo.matrixWorldNeedsUpdate = true;
                    }
                }
            }
            if (b.burstAt >= 0) {
                const e = state.t - b.burstAt;
                const re = Math.min(1, e / 0.5);
                ring.scale.setScalar(r * (1 + re * 0.8));
                ring.material.opacity = (1 - re) * 0.15; // barely there: a hint of the pop, not a blue circle
                // The logo goes with the skin: a blink, not a fade.
                if (logo) logo.visible = e < 0.07;
                if (e > 0.6) { b.burstAt = -1; ring.material.opacity = 0; }
            }
            if (!b.alive && b.burstAt < 0 && state.t >= b.respawnAt) launch(b);
        });

        // Droplets: fly out, fall and shrink away.
        dropData.forEach((d, i) => {
            if (d.life > 0) {
                d.life -= dt / 0.9;
                d.v.y -= r * 14 * dt;
                d.v.multiplyScalar(Math.pow(0.3, dt));
                d.p.addScaledVector(d.v, dt);
            }
            tmp.position.set(d.p.x, d.p.y, 0);
            tmp.scale.setScalar(Math.max(0.0001, d.s * Math.max(0, d.life)));
            tmp.updateMatrix();
            drops.setMatrixAt(i, tmp.matrix);
        });
        drops.instanceMatrix.needsUpdate = true;

        if (!state.hasPointer) {
            uniforms.uMouse.value.set(Math.sin(state.t * 0.3) * state.w * 0.3, Math.cos(state.t * 0.23) * state.h * 0.2);
        }
        if (scene.environmentRotation) scene.environmentRotation.set(0, 0.6 + state.t * 0.03, 0);
        renderer.render(scene, camera);
    }

    let raf = 0, last = performance.now();
    const loop = now => { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); };
    const start = () => { if (state.running || !state.visible || !state.ready || !state.released) return; state.running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { state.running = false; cancelAnimationFrame(raf); };

    new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; state.visible ? start() : stop(); }).observe(stage);
    let resizeRaf = 0;
    new ResizeObserver(() => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(layout); }).observe(stage);
    layout();

    const ready = (async () => {
        await Promise.all(cases.map(addBubble));
        try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (_) { /* best effort */ }
        state.ready = true;
        scatter();
        frame(0); // in place before they start to move
    })();

    return {
        ready,
        // The bubbles start to rise when the page is ready to be seen.
        release() { state.released = true; start(); },
        relayout: layout,
        // The top of the cases section, where the bubbles come from: its edge
        // in stage pixels, its side inset and corner radius (null: no pool).
        setPool(pool) { state.pool = pool; if (!state.running && state.ready) frame(0); },
    };
}
