import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Hero "Prisma": the "im" monogram of the logo (same paths as /imgs/favicon.svg)
// rendered as physical glass with the brand's slanted bar. The bar belongs to
// the same rotating group as the glass, so both move together. The monogram
// is not scrubbed by scroll: it eases between two composed positions (hero /
// manifesto) via setStage(), driven by a tween in home-prisma.js.

const I_PATH = 'M6.48,7.11c-1.27,0-2.26-.31-2.97-.94-.71-.63-1.07-1.5-1.07-2.64,0-1.04.36-1.89,1.09-2.54.73-.66,1.71-.99,2.95-.99s2.26.31,2.97.94c.71.63,1.07,1.49,1.07,2.59,0,1.04-.36,1.9-1.09,2.57-.73.67-1.71,1.01-2.95,1.01ZM3.23,36.31V12.06h6.59v24.25H3.23Z';
const M_PATH = 'M14.05,36.31V12.06h6.36l.14,4.63-.97.18c.34-.79.8-1.51,1.37-2.15.57-.64,1.23-1.19,1.97-1.65s1.53-.82,2.37-1.08c.84-.26,1.67-.39,2.51-.39,1.27,0,2.41.2,3.44.6,1.02.4,1.89,1.02,2.6,1.86.71.84,1.27,1.95,1.67,3.32l-1.02-.09.33-.73c.4-.73.91-1.41,1.53-2.02.62-.61,1.32-1.13,2.09-1.56.77-.43,1.58-.76,2.41-1.01.84-.24,1.66-.37,2.46-.37,1.92,0,3.51.37,4.78,1.12,1.27.75,2.22,1.87,2.85,3.37.63,1.5.95,3.33.95,5.5v14.72h-6.59v-14.26c0-1.1-.16-2-.46-2.7-.31-.7-.76-1.23-1.35-1.58-.59-.35-1.35-.53-2.27-.53-.71,0-1.37.11-1.97.34s-1.13.55-1.58.96c-.45.41-.8.9-1.04,1.47-.25.57-.37,1.17-.37,1.81v14.49h-6.64v-14.3c0-1.01-.16-1.87-.46-2.59-.31-.72-.76-1.26-1.35-1.63-.59-.37-1.32-.55-2.18-.55-.71,0-1.37.11-1.97.34s-1.12.55-1.56.96c-.43.41-.77.89-1.02,1.44-.25.55-.37,1.15-.37,1.79v14.53h-6.64Z';

// Bar of the logo: polygon 54.95,23.78 → 0,30.52 (rises ~2.45° to the right).
const BAR_ANGLE = Math.atan2(2.35, 54.92);
const BAR_THICK = 4.1;
const BAR_LEN = 200; // mark units; stretched per frame to reach both screen edges
const MARK_W = 54.95;
const MARK_H = 36.31;

const ZERO = new THREE.Vector2(0, 0);
const CAMERA_Z = 200;
const BACKDROP_Z = -70;

const backdropVertex = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const backdropFragment = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform vec2 uSize;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uShadow;
uniform vec2 uGlow;
uniform float uGlowR;
uniform float uShadowR;
uniform float uProgress;
uniform float uAngle;
uniform vec3 uBase;
uniform vec3 uLine;
uniform vec3 uSky;
uniform vec3 uBlue;
uniform vec3 uShade;

float blob(vec2 p, vec2 c, float r) {
    vec2 d = p - c;
    return exp(-dot(d, d) / (r * r));
}

void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float t = uTime;
    float H = uSize.y;

    vec3 col = uBase;

    // Slow aurora of brand blues.
    vec2 c1 = vec2(0.22 * uSize.x + 0.05 * H * sin(t * 0.21), 0.16 * H + 0.05 * H * cos(t * 0.17));
    vec2 c2 = vec2(-0.32 * uSize.x + 0.06 * H * cos(t * 0.13), -0.22 * H + 0.04 * H * sin(t * 0.19));
    vec2 c3 = vec2(0.05 * uSize.x + 0.08 * H * sin(t * 0.11 + 1.3), -0.42 * H + 0.06 * H * cos(t * 0.15));
    float a1 = blob(p, c1, 0.34 * H);
    float a2 = blob(p, c2, 0.30 * H);
    float a3 = blob(p, c3, 0.26 * H);
    float am = blob(p, uMouse, 0.20 * H);
    float aur = clamp(a1 * 0.95 + a2 * 0.55 + a3 * 0.45 + am * 0.35 + uProgress * 0.25, 0.0, 1.0);
    col = mix(col, uSky, aur);
    col = mix(col, uBlue, a1 * a1 * 0.22 + am * am * 0.08);

    // Deep blue light right behind the glass, so the refraction carries colour.
    float g = blob(p, uGlow, uGlowR);
    col = mix(col, uBlue, g * 0.55);
    col = mix(col, vec3(0.06, 0.2, 0.95), g * g * 0.25);

    // Ruled lines at the angle of the brand bar. Glass refracts them.
    float ca = cos(uAngle), sa = sin(uAngle);
    vec2 q = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
    float md = length(p - uMouse);
    // Lens around the pointer: lines spread apart like under a loupe.
    vec2 mq = vec2(ca * uMouse.x + sa * uMouse.y, -sa * uMouse.x + ca * uMouse.y);
    float lens = exp(-md * md / (0.022 * H * H));
    q.y = mix(q.y, mq.y + (q.y - mq.y) * 0.55, lens);
    q.y += uProgress * 0.25 * H;
    float sp = H / 22.0;
    float f = abs(fract(q.y / sp + 0.5) - 0.5) * sp;
    float w = fwidth(q.y);
    float ln = 1.0 - smoothstep(0.009 * sp, 0.009 * sp + w * 1.1, f);
    // Lines fade out toward the bottom-left, where the headline sits.
    vec2 n = p / uSize;
    float mask = smoothstep(-0.55, 0.15, n.x + n.y * 1.4);
    mask *= 1.0 - smoothstep(0.35, 0.62, length(n * vec2(1.0, 1.25)));
    col = mix(col, uLine, ln * 0.42 * mask);

    // Soft coloured shadow of the glass on the wall.
    vec2 sd = (p - uShadow) / vec2(uShadowR * 1.25, uShadowR * 0.62);
    float sh = exp(-dot(sd, sd) * 1.6);
    col = mix(col, uShade, sh * 0.55);

    // Very light vignette.
    float v = smoothstep(0.95, 0.35, length(n * vec2(0.9, 1.1)));
    col *= mix(0.965, 1.0, v);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
}`;

// Studio environment in brand tones: white dome fading to periwinkle, two
// softboxes and a blue panel, so reflections read as clean light + brand blue.
function buildStudio() {
    const env = new THREE.Scene();
    const dome = new THREE.Mesh(
        new THREE.SphereGeometry(50, 48, 24),
        new THREE.ShaderMaterial({
            side: THREE.BackSide,
            depthWrite: false,
            uniforms: {
                top: { value: new THREE.Color('#FFFFFF') },
                mid: { value: new THREE.Color('#E6EDFF') },
                bottom: { value: new THREE.Color('#7F9FFF') },
            },
            vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
            fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.7, h)) : mix(mid, bottom, smoothstep(0.0, 0.8, -h)); gl_FragColor = vec4(c, 1.0); }',
        })
    );
    env.add(dome);
    const panel = (w, h, color, k, pos, look) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(...pos);
        m.lookAt(...look);
        env.add(m);
    };
    panel(40, 14, '#ffffff', 5, [0, 30, 10], [0, 0, 0]);       // key softbox above
    panel(8, 40, '#ffffff', 3.2, [-34, 4, 14], [0, 0, 0]);     // strip left
    panel(8, 40, '#ffffff', 2.4, [34, 2, 18], [0, 0, 0]);      // strip right
    panel(30, 10, '#1F5EFF', 2.6, [10, -24, 18], [0, 0, 0]);   // brand blue bounce
    panel(18, 18, '#9DBBFF', 1.6, [0, 6, -40], [0, 0, 0]);     // back fill
    return env;
}

function flipShape(shape, divisions) {
    const { shape: outer, holes } = shape.extractPoints(divisions);
    const flipped = new THREE.Shape(outer.map(v => new THREE.Vector2(v.x, -v.y)));
    holes.forEach(h => flipped.holes.push(new THREE.Path(h.map(v => new THREE.Vector2(v.x, -v.y)))));
    return flipped;
}

function shapesFromPath(d) {
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
    const out = [];
    data.paths.forEach(p => SVGLoader.createShapes(p).forEach(s => out.push(flipShape(s, 48))));
    return out;
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = v => Math.min(1, Math.max(0, v));
const smooth = t => t * t * (3 - 2 * t);

export function createPrismaHero(canvas, { reduced = false } = {}) {
    const isSmall = () => window.innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall() ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0xF4F6FB, 1);
    if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = isSmall() ? 0.6 : 1;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = buildStudio();
    scene.environment = pmrem.fromScene(envScene, 0.02).texture;
    pmrem.dispose();
    scene.environmentIntensity = 1.0;
    if (scene.environmentRotation) scene.environmentRotation.set(0, 0.6, 0);

    const camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);
    camera.position.set(0, 0, CAMERA_Z);

    // ---------- Backdrop ----------
    const uniforms = {
        uSize: { value: new THREE.Vector2(400, 250) },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(9999, 9999) },
        uShadow: { value: new THREE.Vector2(0, 0) },
        uShadowR: { value: 40 },
        uGlow: { value: new THREE.Vector2(0, 0) },
        uGlowR: { value: 30 },
        uProgress: { value: 0 },
        uAngle: { value: BAR_ANGLE },
        uBase: { value: new THREE.Color('#F4F6FB') },
        uLine: { value: new THREE.Color('#C9D7F2') },
        uSky: { value: new THREE.Color('#DCE7FF') },
        uBlue: { value: new THREE.Color('#5D8CFF') },
        uShade: { value: new THREE.Color('#C3D3F5') },
    };
    const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({ uniforms, vertexShader: backdropVertex, fragmentShader: backdropFragment, toneMapped: false, depthWrite: false })
    );
    backdrop.position.z = BACKDROP_Z;
    backdrop.renderOrder = -1;
    scene.add(backdrop);

    // ---------- Monogram ----------
    const glass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.015,
        transmission: 1,
        thickness: 16,
        ior: 1.62,
        dispersion: 12,
        attenuationColor: new THREE.Color('#B4C9FF'),
        attenuationDistance: 64,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        specularIntensity: 1,
        specularColor: new THREE.Color('#ffffff'),
        iridescence: 0.55,
        iridescenceIOR: 1.25,
        iridescenceThicknessRange: [180, 520],
        envMapIntensity: 1.55,
    });

    const extrude = { depth: 5.6, bevelEnabled: true, bevelThickness: 2.6, bevelSize: 1.15, bevelOffset: -0.2, bevelSegments: 12, curveSegments: 32 };
    const iGeo = new THREE.ExtrudeGeometry(shapesFromPath(I_PATH), extrude);
    const mGeo = new THREE.ExtrudeGeometry(shapesFromPath(M_PATH), extrude);
    // Shared centring so both letters keep their position from the logo.
    const cx = MARK_W / 2, cy = -MARK_H / 2, cz = extrude.depth / 2;
    [iGeo, mGeo].forEach(g => { g.translate(-cx, -cy, -cz); g.computeVertexNormals(); });

    const root = new THREE.Group();      // follows layout + scroll
    const spin = new THREE.Group();      // pointer + drag rotation
    const iMesh = new THREE.Mesh(iGeo, glass);
    const mMesh = new THREE.Mesh(mGeo, glass);
    spin.add(iMesh, mMesh);
    root.add(spin);
    scene.add(root);

    // ---------- The line ----------
    const barGeo = new RoundedBoxGeometry(BAR_LEN, BAR_THICK, 3.2, 4, 1.4);
    barGeo.translate(BAR_LEN / 2, 0, 0);
    const barMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#1F5EFF'),
        roughness: 0.22,
        metalness: 0.0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.9,
        emissive: new THREE.Color('#0A35C8'),
        emissiveIntensity: 0.18,
    });
    // A glint of light travels along the bar (and gets refracted by the glass).
    const barTime = { value: 0 };
    barMat.onBeforeCompile = shader => {
        shader.uniforms.uBarTime = barTime;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vBarUv;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBarUv = uv;');
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vBarUv;\nuniform float uBarTime;')
            .replace('#include <emissivemap_fragment>', [
                '#include <emissivemap_fragment>',
                'float ph = fract(vBarUv.x * 2.2 - uBarTime * 0.11);',
                'float streak = smoothstep(0.0, 0.012, ph) * (1.0 - smoothstep(0.012, 0.055, ph));',
                'totalEmissiveRadiance += vec3(0.78, 0.88, 1.0) * streak * 2.6;',
            ].join('\n'));
    };
    // Bar centre inside the monogram (from the logo polygon). The bar lives in
    // the spin group, in mark units, so pointer tilt and drag carry it along.
    const BAR_OFFSET = new THREE.Vector2(27.48 - cx, -(27.15) - cy);
    const lineGroup = new THREE.Group();
    const bar = new THREE.Mesh(barGeo, barMat);
    lineGroup.add(bar);
    lineGroup.position.set(BAR_OFFSET.x, BAR_OFFSET.y, 0);
    lineGroup.rotation.z = BAR_ANGLE;
    spin.add(lineGroup);

    // A few satellites give the glass something to bend besides the lines.
    const satMat = new THREE.MeshPhysicalMaterial({ color: '#1F5EFF', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const satSoft = new THREE.MeshPhysicalMaterial({ color: '#9DBBFF', roughness: 0.35, clearcoat: 0.6 });
    const satGlass = glass.clone();
    satGlass.thickness = 4;
    satGlass.dispersion = 3;
    const satellites = [
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(2.1, 48, 32), satMat), home: [-0.6, 0.12, -22], speed: 0.6 },
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(3.4, 64, 48), satGlass), home: [0.62, 0.46, 8], speed: 0.45 },
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 24), satSoft), home: [0.66, -0.3, -30], speed: 0.8 },
        { mesh: new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 4.2, 12, 48), satGlass), home: [-0.66, -0.36, 4], speed: 0.35 },
    ];
    satellites.forEach(s => { root.add(s.mesh); });

    // ---------- State ----------
    const state = {
        width: 1, height: 1, visW: 1, visH: 1,
        layout: null,
        progress: 0,           // scroll 0..1 (backdrop only)
        stage: 0,              // 0 = hero, 1 = manifesto (eased externally)
        intro: reduced ? 1 : 0, // 0..1
        barIntro: reduced ? 1 : 0,
        pointer: new THREE.Vector2(0, 0),
        pointerSmooth: new THREE.Vector2(0, 0),
        hasPointer: false,
        dragVel: 0,
        dragAngle: 0,
        dragging: false,
        lastX: 0,
        time: 0,
        running: false,
        compiled: false,
        visible: true,
        paused: reduced,
    };

    function computeLayout() {
        const aspect = state.width / state.height;
        const dist = CAMERA_Z;
        state.visH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        state.visW = state.visH * aspect;
        const W = state.visW, H = state.visH;
        let l;
        if (aspect >= 1.15) {
            const s = Math.min((0.46 * W) / MARK_W, (0.52 * H) / MARK_H);
            l = { s0: s, x0: 0.1 * W, y0: 0.11 * H, s1: s * 0.7, x1: 0.27 * W, y1: 0.21 * H };
        } else if (aspect >= 0.8) {
            const s = Math.min((0.62 * W) / MARK_W, (0.4 * H) / MARK_H);
            l = { s0: s, x0: 0.06 * W, y0: 0.17 * H, s1: s * 0.7, x1: 0.18 * W, y1: 0.26 * H };
        } else {
            const s = Math.min((0.8 * W) / MARK_W, (0.32 * H) / MARK_H);
            l = { s0: s, x0: 0.0, y0: 0.17 * H, s1: s * 0.72, x1: 0.0, y1: 0.24 * H };
        }
        state.layout = l;

        // Backdrop covers the frustum at its depth with margin.
        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        backdrop.scale.set(W * k * 1.25, H * k * 1.25, 1);
        uniforms.uSize.value.set(W * k * 1.25, H * k * 1.25);
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        state.width = Math.max(1, rect.width);
        state.height = Math.max(1, rect.height);
        renderer.setSize(state.width, state.height, false);
        camera.aspect = state.width / state.height;
        camera.updateProjectionMatrix();
        computeLayout();
        if (!state.running && state.compiled) renderFrame(0);
    }

    // ---------- Input ----------
    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        state.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
        state.hasPointer = true;
        if (state.dragging) {
            const dx = e.clientX - state.lastX;
            state.lastX = e.clientX;
            state.dragVel = dx * 0.0065;
            state.dragAngle += state.dragVel;
        }
    }
    function onPointerDown(e) {
        if (e.pointerType === 'touch') return; // keep vertical scroll on touch
        state.dragging = true;
        state.lastX = e.clientX;
        canvas.setPointerCapture?.(e.pointerId);
        canvas.classList.add('is-grabbing');
    }
    function onPointerUp(e) {
        state.dragging = false;
        canvas.releasePointerCapture?.(e.pointerId);
        canvas.classList.remove('is-grabbing');
    }
    function onLeave() { state.hasPointer = false; }
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onLeave);

    // ---------- Frame ----------
    function renderFrame(dt) {
        const l = state.layout;
        if (!l || !state.compiled) return;
        state.time += dt;
        const t = state.time;

        state.pointerSmooth.lerp(state.hasPointer ? state.pointer : ZERO, Math.min(1, dt * 3.2));
        const px = state.pointerSmooth.x, py = state.pointerSmooth.y;

        // Drag inertia with a soft spring back to rest.
        if (!state.dragging) {
            state.dragVel *= Math.pow(0.04, dt);
            state.dragAngle += state.dragVel;
            state.dragAngle = lerp(state.dragAngle, Math.round(state.dragAngle / (Math.PI * 2)) * Math.PI * 2, Math.min(1, dt * 1.6));
        }

        const p = smooth(clamp01(state.progress)); // drives the backdrop only
        const intro = state.intro;
        const ie = 1 - Math.pow(1 - intro, 3);

        const st = state.stage;
        const s = lerp(l.s0, l.s1, st) * lerp(0.72, 1, ie);
        root.scale.setScalar(s);
        const bob = reduced ? 0 : Math.sin(t * 0.9) * 0.012 * state.visH;
        root.position.set(lerp(l.x0, l.x1, st), lerp(l.y0, l.y1, st) + bob + (1 - ie) * -0.18 * state.visH, 0);
        root.rotation.set(0.08 - py * 0.18 + (1 - ie) * 0.9, px * 0.38, 0);
        spin.rotation.y = state.dragAngle + (reduced ? 0 : Math.sin(t * 0.35) * 0.12);
        spin.rotation.x = reduced ? 0 : Math.sin(t * 0.27) * 0.05;
        barTime.value = t;

        // The bar spans from the left to the right edge of the screen at rest
        // (in mark units) and grows from the left during the intro.
        const cxWorld = root.position.x + BAR_OFFSET.x * s;
        const toLeft = (cxWorld + state.visW * 0.7) / s;
        const toRight = (state.visW * 0.7 - cxWorld) / s;
        bar.position.x = -toLeft;
        bar.scale.x = Math.max(0.0001, state.barIntro) * (toLeft + toRight) / BAR_LEN;

        satellites.forEach((sat, i) => {
            const [hx, hy, hz] = sat.home;
            const w = t * sat.speed + i * 1.7;
            sat.mesh.position.set(
                hx * MARK_W + Math.sin(w) * 2.5,
                hy * MARK_H * 1.6 + Math.cos(w * 1.3) * 2,
                hz + Math.sin(w * 0.7) * 4
            );
            sat.mesh.rotation.set(w * 0.4, w * 0.6, 0);
            sat.mesh.scale.setScalar(lerp(0.0001, 1, clamp01(intro * 1.4 - 0.3 - i * 0.08)));
        });

        // Backdrop uniforms (in backdrop units).
        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        uniforms.uTime.value = t;
        uniforms.uProgress.value = p;
        if (state.hasPointer) {
            uniforms.uMouse.value.set(px * state.visW * 0.5 * k, py * state.visH * 0.5 * k);
        } else {
            uniforms.uMouse.value.set(Math.sin(t * 0.3) * state.visW * 0.3 * k, Math.cos(t * 0.23) * state.visH * 0.2 * k);
        }
        uniforms.uShadow.value.set(root.position.x * k + 0.04 * state.visW, root.position.y * k - 0.2 * state.visH * k);
        uniforms.uShadowR.value = MARK_W * s * 0.62 * k * lerp(0.4, 1, ie);
        uniforms.uGlow.value.set(root.position.x * k + px * 6, root.position.y * k - 0.02 * state.visH + py * 4);
        uniforms.uGlowR.value = MARK_W * s * 0.42 * k * lerp(0.2, 1, ie);

        if (scene.environmentRotation) scene.environmentRotation.set(py * 0.25, 0.6 + px * 0.5 + t * 0.02, 0);

        renderer.render(scene, camera);
    }

    let raf = 0;
    let last = performance.now();
    function loop(now) {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        renderFrame(dt);
    }
    function start() {
        if (state.running || state.paused || !state.visible || !state.compiled) return;
        state.running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }
    function stop() {
        state.running = false;
        cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(entries => {
        state.visible = entries[0].isIntersecting;
        if (state.visible) start(); else stop();
    }, { threshold: 0 });
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Compile shaders up-front (in parallel when KHR_parallel_shader_compile
    // exists) so the first render doesn't block the intro animation.
    const ready = (async () => {
        try {
            if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
            else renderer.compile(scene, camera);
        } catch (_) { /* compile is best effort */ }
        state.compiled = true;
        renderFrame(0.016);
        start();
    })();

    return {
        ready,
        setProgress(v) { state.progress = v; if (!state.running) renderFrame(0); },
        setStage(v) { state.stage = v; if (!state.running) renderFrame(0); },
        setIntro(v) { state.intro = v; if (!state.running) renderFrame(0); },
        setBarIntro(v) { state.barIntro = v; if (!state.running) renderFrame(0); },
        get introValues() { return state; },
        setPaused(p) {
            state.paused = p;
            if (p) { stop(); renderFrame(0); } else start();
        },
        start,
        destroy() {
            stop(); io.disconnect(); ro.disconnect();
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            renderer.dispose();
        },
    };
}
