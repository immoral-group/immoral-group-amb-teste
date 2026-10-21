import * as THREE from 'three';
import { buildStudio, backdropVertex, backdropFragment, BAR_ANGLE } from './home-prisma-hero.js';

// The stage every service hero shares (src/funnel-hero.js, src/identity-hero.js…):
// the renderer, the studio light of the "im" of the home, the ruled white wall
// behind (what the glass refracts), the pointer, resizing, and a loop that
// only runs while the canvas is on screen. A hero builds its object in
// `build(stage)` and moves it in `update(stage, dt)`; its scroll comes in
// through setProgress().

const CAMERA_Z = 200;
const BACKDROP_Z = -70;

export function createGlassStage(canvas, { reduced = false, build, update, onResize } = {}) {
    const small = () => window.innerWidth < 760;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.setClearColor(0xFFFFFF, 1);
    if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = small() ? 0.6 : 1;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(buildStudio(), 0.02).texture;
    pmrem.dispose();
    if (scene.environmentRotation) scene.environmentRotation.set(0, 0.6, 0);

    const camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);
    camera.position.set(0, 0, CAMERA_Z);

    const uniforms = {
        uSize: { value: new THREE.Vector2(400, 250) },
        uMouse: { value: new THREE.Vector2(9999, 9999) },
        uShadow: { value: new THREE.Vector2(0, 0) },
        uShadowR: { value: 30 },
        uProgress: { value: 0 },
        uAngle: { value: BAR_ANGLE },
        uBase: { value: new THREE.Color('#FFFFFF') },
        uLine: { value: new THREE.Color('#DCE5F8') },
        uShade: { value: new THREE.Color('#C3D3F5') },
    };
    const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({ uniforms, vertexShader: backdropVertex, fragmentShader: backdropFragment, toneMapped: false, depthWrite: false })
    );
    backdrop.position.z = BACKDROP_Z;
    backdrop.renderOrder = -1;
    scene.add(backdrop);

    // What a hero reads and writes. size: a length that fits the canvas
    // (its own object decides what it means); smooth: the eased pointer, -1…1.
    const stage = {
        THREE, scene, camera, renderer, uniforms, reduced, small,
        w: 1, h: 1, visW: 1, visH: 1, t: 0, progress: 0,
        pointer: new THREE.Vector2(), smooth: new THREE.Vector2(), hasPointer: false,
        // Where the soft coloured shadow of the object sits on the wall (world units).
        shadow: { x: 0, y: 0, r: 30 },
    };
    const run = { running: false, visible: true, compiled: false };

    build?.(stage);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        stage.w = Math.max(1, rect.width);
        stage.h = Math.max(1, rect.height);
        renderer.setSize(stage.w, stage.h, false);
        camera.aspect = stage.w / stage.h;
        camera.updateProjectionMatrix();
        stage.visH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        stage.visW = stage.visH * (stage.w / stage.h);
        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        backdrop.scale.set(stage.visW * k * 1.25, stage.visH * k * 1.25, 1);
        uniforms.uSize.value.set(stage.visW * k * 1.25, stage.visH * k * 1.25);
        onResize?.(stage);
        if (!run.running && run.compiled) frame(0);
    }

    function frame(dt) {
        if (!run.compiled) return;
        stage.t += dt;
        const t = stage.t;
        stage.smooth.lerp(stage.hasPointer ? stage.pointer : new THREE.Vector2(), Math.min(1, dt * 3));
        update?.(stage, reduced ? 0 : dt);
        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        const px = stage.smooth.x, py = stage.smooth.y;
        if (stage.hasPointer) uniforms.uMouse.value.set(px * stage.visW * 0.5 * k, py * stage.visH * 0.5 * k);
        else uniforms.uMouse.value.set(Math.sin(t * 0.3) * stage.visW * 0.3 * k, Math.cos(t * 0.23) * stage.visH * 0.2 * k);
        uniforms.uShadow.value.set(stage.shadow.x * k, stage.shadow.y * k);
        uniforms.uShadowR.value = stage.shadow.r * k;
        uniforms.uProgress.value = stage.progress * 0.3;
        if (scene.environmentRotation) scene.environmentRotation.set(py * 0.25, 0.6 + px * 0.5 + t * 0.03, 0);
        renderer.render(scene, camera);
    }

    let raf = 0, last = performance.now();
    const loop = now => { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); };
    const start = () => { if (run.running || !run.visible || !run.compiled || reduced) return; run.running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { run.running = false; cancelAnimationFrame(raf); };

    const onMove = e => {
        const rect = canvas.getBoundingClientRect();
        stage.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
        stage.hasPointer = true;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { stage.hasPointer = false; });

    new IntersectionObserver(([en]) => { run.visible = en.isIntersecting; run.visible ? start() : stop(); }).observe(canvas);
    new ResizeObserver(resize).observe(canvas);
    resize();

    const ready = (async () => {
        try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (_) { /* best effort */ }
        run.compiled = true;
        frame(0.016);
        start();
    })();

    return {
        ready,
        stage,
        // 0 → 1 along the hero's copy (or as it scrolls away).
        setProgress(v) { stage.progress = Math.max(0, Math.min(1, v)); if (!run.running) frame(0); },
        destroy() { stop(); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
    };
}
