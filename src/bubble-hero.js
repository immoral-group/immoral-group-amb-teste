import * as THREE from 'three';
import { glassParams, buildStudio, backdropVertex, backdropFragment, BAR_ANGLE } from './home-prisma-hero.js';

// Hero of /nuestra-historia: a glass bubble with the same material, studio
// light and ruled backdrop as the "im" of the home, with a swarm of small
// bubbles around it. The title lives inside it (setTitle). On scroll
// the surface tenses (setTension) and the bubble bursts into glass droplets,
// throwing the letters out (burst); scrolling back re-inflates it (reform).

const CAMERA_Z = 200;
const BACKDROP_Z = -70;
const DROPS = 64;

export function createBubble(canvas, { reduced = false } = {}) {
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

    // ---------- Backdrop (same shader as the home) ----------
    const uniforms = {
        uSize: { value: new THREE.Vector2(400, 250) },
        uMouse: { value: new THREE.Vector2(9999, 9999) },
        uShadow: { value: new THREE.Vector2(0, 0) },
        uShadowR: { value: 40 },
        uProgress: { value: 0 },
        uAngle: { value: BAR_ANGLE },
        uBase: { value: new THREE.Color('#FFFFFF') },
        uLine: { value: new THREE.Color('#DCE5F8') }, // lighter than the home: a quieter backdrop
        uShade: { value: new THREE.Color('#C3D3F5') },
    };
    const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({ uniforms, vertexShader: backdropVertex, fragmentShader: backdropFragment, toneMapped: false, depthWrite: false })
    );
    backdrop.position.z = BACKDROP_Z;
    backdrop.renderOrder = -1;
    scene.add(backdrop);

    // ---------- The bubble ----------
    // three.js scales `thickness` with the mesh, and the sphere is scaled to its
    // radius in world units: keep it thin, like a bubble, not a solid ball.
    // Same dispersion as the "im": it splits the title behind it into a
    // chromatic fringe, which is what makes it read as being inside.
    const glass = new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.32, iridescence: 0.9 });
    // A breathing surface: low-frequency waves along the normal, stronger
    // when the bubble is under tension.
    const wobble = { uTime: { value: 0 }, uAmp: { value: 0.018 } };
    glass.onBeforeCompile = shader => {
        shader.uniforms.uTime = wobble.uTime;
        shader.uniforms.uAmp = wobble.uAmp;
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uAmp;')
            .replace('#include <begin_vertex>', [
                '#include <begin_vertex>',
                'float wv = sin(position.x * 2.6 + uTime * 1.1) * sin(position.y * 2.2 + uTime * 0.8) * sin(position.z * 2.9 + uTime * 0.9);',
                'transformed += normal * wv * uAmp;',
            ].join('\n'));
    };
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), glass);
    scene.add(bubble);

    // Two solid brand-blue accents, like the satellites of the home.
    const satBlue = new THREE.MeshPhysicalMaterial({ color: '#1F5EFF', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
    const sats = [
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), satBlue), home: [-1.35, 0.6, -10], size: 0.05, speed: 0.55 },
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), satBlue), home: [1.42, -0.78, 8], size: 0.028, speed: 0.8 },
    ];
    sats.forEach(s => scene.add(s.mesh));

    // ---------- A swarm of small bubbles around the big one ----------
    // Placed in layout() (they depend on the viewport). They inflate in
    // sequence with the big one and pop in a ripple when it bursts.
    // InstancedMesh ignores the instance scale for `thickness`: keep it in
    // world units.
    const SWARM = small() ? 18 : 34;
    const swarm = new THREE.InstancedMesh(
        new THREE.SphereGeometry(1, 40, 28),
        new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.7, dispersion: 4, iridescence: 0.9 }),
        SWARM
    );
    swarm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(swarm);
    const swarmData = Array.from({ length: SWARM }, (_, i) => ({
        home: new THREE.Vector3(), size: 1, phase: i * 1.7, speed: 0.35 + (i % 5) * 0.09,
        s: 0, target: 0, wait: 0, d: 0,
    }));

    // ---------- Droplets of the burst ----------
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 1.2, dispersion: 2 }), DROPS);
    drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    drops.visible = false;
    scene.add(drops);
    const dropData = Array.from({ length: DROPS }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), s: 1 }));
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.985, 1, 128),
        new THREE.MeshBasicMaterial({ color: '#9DBBFF', transparent: true, opacity: 0, depthWrite: false })
    );
    scene.add(ring);
    const tmp = new THREE.Object3D();

    // ---------- The title, inside the bubble ----------
    // One cut-out plane per glyph, flat, in ink. They are opaque, so the
    // glass refracts them (with its chromatic fringe): the text reads as being
    // inside the bubble. Built by setTitle() once the web font is ready.
    const textGroup = new THREE.Group();
    scene.add(textGroup);
    const INK = new THREE.Color('#0C1A3D');
    const glyphs = [];
    let textMode = 'home', textW = 1; // textW: widest line, in em

    // ---------- State ----------
    const state = {
        w: 1, h: 1, visW: 1, visH: 1, r: 30,
        pointer: new THREE.Vector2(), smooth: new THREE.Vector2(), hasPointer: false,
        tension: 0, scale: 1, scaleTarget: 1, burstAt: -1, t: 0,
        running: false, visible: true, compiled: false,
    };

    function layout() {
        state.visH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        state.visW = state.visH * (state.w / state.h);
        state.r = Math.min(state.visH * 0.3, state.visW * 0.42);
        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        backdrop.scale.set(state.visW * k * 1.25, state.visH * k * 1.25, 1);
        uniforms.uSize.value.set(state.visW * k * 1.25, state.visH * k * 1.25);
        placeSwarm();
    }

    // Clustered around the big bubble, inside the screen, never overlapping
    // it or each other. Seeded, so a resize keeps the same composition.
    function placeSwarm() {
        let seed = 7;
        const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const r = state.r, maxX = state.visW * 0.47, maxY = state.visH * 0.44;
        const placed = [];
        swarmData.forEach((b, i) => {
            const size = r * (i < 6 ? 0.07 + rnd() * 0.05 : 0.022 + Math.pow(rnd(), 1.6) * 0.06);
            let x = 0, y = 0, ok = false;
            for (let n = 0; n < 80 && !ok; n++) {
                const a = rnd() * Math.PI * 2;
                const d = r * (1.16 + Math.pow(rnd(), 1.4) * 1.5) + size;
                x = Math.cos(a) * d * 1.15; y = Math.sin(a) * d * 0.9;
                ok = Math.abs(x) < maxX - size && Math.abs(y) < maxY - size
                    && placed.every(p => Math.hypot(p.x - x, p.y - y) > p.size + size + r * 0.04);
            }
            b.size = ok ? size : 0;
            b.home.set(x, y, -26 + rnd() * 40);
            b.d = Math.hypot(x, y) / r;
            if (ok) placed.push({ x, y, size });
        });
    }

    function setTitle(lines, { family = 'Lexend', weight = 700, tracking = -0.045 } = {}) {
        const PX = 180;
        const font = `${weight} ${PX}px ${family}`;
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.font = font;
        const lineH = 1.02;
        const items = [];
        textW = 0;
        lines.forEach((line, li) => {
            let x = 0;
            const row = [...line].map((ch, i) => {
                const adv = ctx.measureText(line.slice(0, i + 1)).width - ctx.measureText(line.slice(0, i)).width + tracking * PX;
                const g = { ch, x: x / PX, adv: adv / PX };
                x += adv;
                return g;
            });
            const w = (x - tracking * PX) / PX;
            textW = Math.max(textW, w);
            row.forEach(g => { g.cx = g.x + g.adv / 2 - w / 2; g.cy = ((lines.length - 1) / 2 - li) * lineH; });
            items.push(...row.filter(g => g.ch.trim()));
        });
        items.forEach((g, i) => {
            const cw = Math.ceil(ctx.measureText(g.ch).width + PX * 0.4), ch = Math.ceil(PX * 1.5);
            const c = document.createElement('canvas');
            c.width = cw; c.height = ch;
            const x = c.getContext('2d');
            x.font = font; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
            x.fillText(g.ch, cw / 2, ch / 2);
            const map = new THREE.CanvasTexture(c);
            map.colorSpace = THREE.SRGBColorSpace;
            map.anisotropy = 4;
            const geo = new THREE.PlaneGeometry(cw / PX, ch / PX);
            const group = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map, color: INK, alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, toneMapped: false }));
            textGroup.add(group);
            const home = new THREE.Vector3(g.cx, g.cy, 0);
            glyphs.push({
                group, home, i,
                p: home.clone().add(new THREE.Vector3(0, -0.9, -0.4)), rot: new THREE.Vector3(-1.3, 0, 0), s: 0.2,
                v: new THREE.Vector3(), w: new THREE.Vector3(), wait: Infinity,
            });
        });
        try { renderer.compile(scene, camera); } catch (_) { /* best effort */ }
        if (!state.running) frame(0);
    }
    function resize() {
        const rect = canvas.getBoundingClientRect();
        state.w = Math.max(1, rect.width);
        state.h = Math.max(1, rect.height);
        renderer.setSize(state.w, state.h, false);
        camera.aspect = state.w / state.h;
        camera.updateProjectionMatrix();
        layout();
        if (!state.running && state.compiled) frame(0);
    }

    function frame(dt) {
        if (!state.compiled) return;
        state.t += dt;
        const t = state.t;
        state.smooth.lerp(state.hasPointer ? state.pointer : new THREE.Vector2(), Math.min(1, dt * 3));
        const px = state.smooth.x, py = state.smooth.y;
        const r = state.r;

        // Bubble: breathing, leaning toward the pointer, swelling with tension.
        state.scale += (state.scaleTarget - state.scale) * Math.min(1, dt * (state.scaleTarget > state.scale ? 4 : 9));
        const breathe = reduced ? 1 : 1 + Math.sin(t * 1.3) * 0.012;
        const s = r * state.scale * breathe * (1 + state.tension * 0.07);
        bubble.scale.setScalar(Math.max(0.0001, s));
        bubble.position.set(px * r * 0.08, py * r * 0.06 + (reduced ? 0 : Math.sin(t * 0.8) * r * 0.02), 0);
        bubble.rotation.set(py * -0.3 + t * 0.05, px * 0.4 + t * 0.08, 0);
        wobble.uTime.value = t;
        wobble.uAmp.value = 0.018 + state.tension * 0.05;

        sats.forEach((sat, i) => {
            const [hx, hy, hz] = sat.home;
            const w = t * sat.speed + i * 2.1;
            sat.mesh.position.set(hx * r + Math.sin(w) * r * 0.05, hy * r + Math.cos(w * 1.3) * r * 0.05, hz + Math.sin(w * 0.7) * 4);
            sat.mesh.scale.setScalar(r * sat.size * Math.min(1, state.scale * 1.2 + 0.0001));
        });

        // Swarm: each bubble floats on its own, leans with the pointer (more
        // the closer it is) and eases toward its target size once its turn comes.
        const ease = 1 - Math.exp(-dt * 7);
        swarmData.forEach((b, i) => {
            if (t >= b.wait) b.s += (b.target - b.s) * (b.target > b.s ? ease : Math.min(1, dt * 16));
            const w = t * b.speed + b.phase;
            const par = 0.6 + (b.home.z + 26) / 40;
            tmp.position.set(
                b.home.x + Math.sin(w) * r * 0.035 + px * r * 0.06 * par,
                b.home.y + Math.cos(w * 1.27) * r * 0.035 + py * r * 0.05 * par,
                b.home.z
            );
            tmp.rotation.set(0, 0, 0);
            tmp.scale.setScalar(Math.max(0.0001, b.size * b.s * (1 + Math.sin(w * 2.3) * 0.02)));
            tmp.updateMatrix();
            swarm.setMatrixAt(i, tmp.matrix);
        });
        swarm.instanceMatrix.needsUpdate = true;

        // Title: rises letter by letter, leans slightly with the pointer
        // and, when the bubble bursts, the letters fly out in 3D.
        if (glyphs.length) {
            const fs = Math.min(r * 0.34, (r * 1.42) / textW);
            textGroup.scale.setScalar(fs * (1 + state.tension * 0.05));
            textGroup.position.set(bubble.position.x, bubble.position.y, 0);
            textGroup.rotation.set(-py * 0.12 + Math.sin(t * 0.6) * 0.03, px * 0.16 + Math.sin(t * 0.45) * 0.04, 0);
            const k = 1 - Math.exp(-dt * 5.5);
            glyphs.forEach(g => {
                if (textMode === 'burst') {
                    g.v.y -= 7 * dt;
                    g.v.multiplyScalar(Math.pow(0.55, dt));
                    g.p.addScaledVector(g.v, dt);
                    g.rot.addScaledVector(g.w, dt);
                    g.s *= Math.exp(-dt * 1.9);
                } else if (t >= g.wait) {
                    g.p.lerp(g.home, k);
                    g.rot.multiplyScalar(1 - k);
                    g.s += (1 - g.s) * k;
                }
                g.group.visible = g.s > 0.03;
                g.group.position.copy(g.p);
                g.group.rotation.set(g.rot.x, g.rot.y, g.rot.z);
                g.group.scale.setScalar(Math.max(0.0001, g.s));
            });
        }

        // Burst: droplets fly out and fall, a ring of light opens and fades.
        if (state.burstAt >= 0) {
            const e = t - state.burstAt;
            drops.visible = e < 2.2;
            dropData.forEach((d, i) => {
                d.v.y -= 55 * dt;
                d.v.multiplyScalar(Math.pow(0.35, dt));
                d.p.addScaledVector(d.v, dt);
                tmp.position.copy(d.p);
                tmp.scale.setScalar(Math.max(0.0001, d.s * (1 - Math.min(1, e / 1.8))));
                tmp.updateMatrix();
                drops.setMatrixAt(i, tmp.matrix);
            });
            drops.instanceMatrix.needsUpdate = true;
            const re = Math.min(1, e / 0.7);
            ring.scale.setScalar(r * (1 + re * 0.7));
            ring.material.opacity = (1 - re) * 0.14; // barely there: a hint of the pop, not a blue circle
        } else {
            drops.visible = false;
            ring.material.opacity = 0;
        }

        const k = (CAMERA_Z - BACKDROP_Z) / CAMERA_Z;
        if (state.hasPointer) uniforms.uMouse.value.set(px * state.visW * 0.5 * k, py * state.visH * 0.5 * k);
        else uniforms.uMouse.value.set(Math.sin(t * 0.3) * state.visW * 0.3 * k, Math.cos(t * 0.23) * state.visH * 0.2 * k);
        uniforms.uShadow.value.set(bubble.position.x * k + 0.03 * state.visW, -r * 1.15 * k);
        uniforms.uShadowR.value = s * 1.1 * k;
        if (scene.environmentRotation) scene.environmentRotation.set(py * 0.25, 0.6 + px * 0.5 + t * 0.03, 0);

        renderer.render(scene, camera);
    }

    let raf = 0, last = performance.now();
    const loop = now => { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); };
    const start = () => { if (state.running || !state.visible || !state.compiled || reduced) return; state.running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { state.running = false; cancelAnimationFrame(raf); };

    const onMove = e => {
        const rect = canvas.getBoundingClientRect();
        state.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -(((e.clientY - rect.top) / rect.height) * 2 - 1));
        state.hasPointer = true;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', () => { state.hasPointer = false; });

    new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; state.visible ? start() : stop(); }).observe(canvas);
    new ResizeObserver(resize).observe(canvas);
    resize();

    const ready = (async () => {
        try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (_) { /* best effort */ }
        state.compiled = true;
        frame(0.016);
        start();
    })();

    return {
        ready,
        setTension(v) { state.tension = Math.max(0, Math.min(1, v)); if (!state.running) frame(0); },
        burst() {
            if (state.burstAt >= 0) return;
            const r = state.r * state.scale;
            dropData.forEach(d => {
                const dir = new THREE.Vector3().randomDirection();
                d.p.copy(dir).multiplyScalar(r * (0.92 + Math.random() * 0.08)).add(bubble.position);
                d.v.copy(dir).multiplyScalar(state.r * (1.2 + Math.random() * 2.2));
                d.v.y += state.r * 0.6;
                d.s = state.r * (0.012 + Math.random() * 0.03);
            });
            ring.position.copy(bubble.position);
            state.burstAt = state.t;
            state.scaleTarget = 0;
            state.scale = 0.0001; // the skin is gone at once
            // The small ones pop in a ripple, from the inside out.
            swarmData.forEach(b => { b.target = 0; b.wait = state.t + 0.04 + b.d * 0.16; });
            // Letters: thrown outward and toward the camera, spinning.
            textMode = 'burst';
            glyphs.forEach(g => {
                const out = new THREE.Vector3(g.home.x * 1.6 + (Math.random() - 0.5) * 1.2, g.home.y * 2 + 0.6 + Math.random() * 1.4, 0);
                g.v.set(out.x * 2.6, out.y * 2.2, 2.5 + Math.random() * 6);
                g.w.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6);
            });
            if (!state.running) frame(0);
        },
        reform() {
            state.burstAt = -1;
            state.scaleTarget = 1;
            swarmData.forEach((b, i) => { b.target = 1; b.wait = state.t + 0.15 + b.d * 0.12 + (i % 7) * 0.05; });
            textMode = 'home';
            glyphs.forEach(g => { g.wait = state.t + 0.25 + g.i * 0.03; g.v.set(0, 0, 0); });
            if (!state.running) frame(0);
        },
        setTitle,
        destroy() { stop(); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
    };
}
