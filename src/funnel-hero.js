import * as THREE from 'three';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /publicidad-en-medios: a funnel of the same glass as the "im" of the
// home and the bubble of /nuestra-historia, on the same ruled white wall
// (src/glass-stage.js). The audience falls in from above as pale drops and
// swirls down its throat, faster as it narrows; most fall away on the way, and
// the few that reach the neck turn brand blue and leave through the spout. The
// scroll of the hero (setProgress) is the copy: "de alcance a leads, de leads a
// ventas, de ventas a crecimiento real" — more of them get through.

// Profile, in units of the funnel's height (y from +0.5 at the rim to -0.5 at
// the end of the spout). RT: radius of the rim, RN: of the neck and spout.
const RT = 0.5, RN = 0.05, NECK_Y = -0.26, LIP = 0.018;
const bowl = s => RN + (RT - RN) * Math.pow(1 - s, 2.3);          // s: 0 rim → 1 neck
const bowlY = s => 0.5 - s * (0.5 - NECK_Y);

const PALE = new THREE.Color('#CFDCFF');
const BLUE = new THREE.Color('#1F5EFF');

export function createScene(canvas, { reduced = false } = {}) {
    let group, drops, neckRing, P, N, size = 60;
    const tmp = new THREE.Object3D();
    const col = new THREE.Color();
    const rand = (a, b) => a + Math.random() * (b - a);

    const build = stage => {
        // A rolled lip at the rim, the bowl narrowing to the neck, then the spout.
        const pts = [];
        pts.push(new THREE.Vector2(RT + LIP * 1.6, 0.5 - LIP * 0.6));
        pts.push(new THREE.Vector2(RT + LIP * 1.2, 0.5 + LIP * 0.25));
        pts.push(new THREE.Vector2(RT + LIP * 0.2, 0.5 + LIP * 0.3));
        for (let i = 0; i <= 64; i++) { const s = i / 64; pts.push(new THREE.Vector2(bowl(s), bowlY(s))); }
        for (let i = 1; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(RN * (1 - 0.12 * t), NECK_Y - t * (NECK_Y + 0.5))); }
        // Thin, like blown glass: three.js scales `thickness` with the mesh.
        const glass = new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.035, dispersion: 4, side: THREE.DoubleSide, attenuationDistance: 140 });
        group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 128), glass));
        stage.scene.add(group);

        // A thin brand-blue band at the neck, where only the good ones get through.
        neckRing = new THREE.Mesh(
            new THREE.TorusGeometry(RN * 1.08, 0.006, 16, 96),
            new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1, emissive: BLUE, emissiveIntensity: 0.15 })
        );
        neckRing.rotation.x = Math.PI / 2;
        neckRing.position.y = NECK_Y;
        group.add(neckRing);

        // Opaque drops (glass would not show through the glass of the funnel),
        // pale at first and brand blue once they make it through.
        N = stage.small() ? 90 : 150;
        drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }), N);
        drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        drops.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
        drops.instanceColor.setUsage(THREE.DynamicDrawUsage);
        drops.frustumCulled = false;
        group.add(drops);
        P = Array.from({ length: N }, () => ({}));
        P.forEach(p => spawn(p, stage, true));
    };

    // Each drop: s along the funnel (negative: still falling toward the rim),
    // its angle around the axis, its size, whether it gets through and, if not,
    // where it falls away. More of them make it through as the copy goes from
    // reach to growth.
    const spawn = (p, stage, fresh = false) => {
        p.s = fresh ? rand(-0.9, 1) : rand(-0.9, -0.2);
        p.a = rand(0, Math.PI * 2);
        p.k = rand(0.55, 0.92);
        p.size = rand(0.009, 0.017);
        p.speed = rand(0.8, 1.2);
        p.through = Math.random() < 0.12 + stage.progress * 0.33;
        p.cut = rand(0.3, 0.82);
        p.fade = 1;
        p.exit = 0;
        p.vy = 0;
        if (p.s > 0.6 && !p.through) p.s = rand(-0.9, 0.2);
    };

    function stepDrop(p, dt, i, stage) {
        const pr = stage.progress;
        const flow = 0.16 + pr * 0.12;
        let x, y, z, s0 = p.size, mix = 0;
        if (p.exit > 0) {
            // Out of the spout: falls, slightly spread, and shrinks away.
            p.exit += dt;
            p.vy -= 2.4 * dt;
            p.ey += p.vy * dt;
            x = p.ex; z = p.ez; y = p.ey;
            s0 *= Math.max(0, 1 - p.exit * 0.9);
            mix = 1;
            if (p.exit > 1.1 || y < -1.1) spawn(p, stage);
        } else {
            p.s += dt * flow * p.speed * (p.s < 0 ? 1.6 : 0.55 + 1.3 * p.s * p.s);
            const s = Math.min(1, Math.max(0, p.s));
            const r = (p.s < 0 ? RT * 1.02 : bowl(s)) * p.k;
            // Swirl: angular speed grows as the funnel narrows (it spins up).
            p.a += dt * (0.25 + 0.06 / Math.max(r, RN)) * p.speed;
            x = Math.cos(p.a) * r; z = Math.sin(p.a) * r;
            y = p.s < 0 ? 0.5 + LIP - p.s * 0.45 : bowlY(s) + 0.012;
            if (p.s < 0) { const f = -p.s; x *= 1 + f * 0.25; z *= 1 + f * 0.25; }
            // The ones that do not make it fall away (shrink) at their point.
            if (!p.through && p.s > p.cut) { p.fade -= dt * 3; if (p.fade <= 0) spawn(p, stage); }
            s0 *= p.through ? 1 : Math.max(0, p.fade);
            // Near the neck the good ones turn blue.
            mix = p.through ? THREE.MathUtils.smoothstep(p.s, 0.6, 0.95) : 0;
            if (p.s >= 1) { p.exit = 0.0001; p.ex = x * 0.4; p.ez = z * 0.4; p.ey = NECK_Y; p.vy = -0.35; }
            // Fading in as they come into view above the rim.
            if (p.s < -0.55) s0 *= THREE.MathUtils.smoothstep(p.s, -0.9, -0.55);
        }
        col.copy(PALE).lerp(BLUE, mix * (0.75 + pr * 0.25));
        drops.setColorAt(i, col);
        tmp.position.set(x, y, z);
        tmp.scale.setScalar(Math.max(0.00001, s0 * (1 + mix * 0.35)));
        tmp.updateMatrix();
        drops.setMatrixAt(i, tmp.matrix);
    }

    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y;
        // Floats a little and leans toward the pointer.
        group.position.set(px * size * 0.03, (reduced ? 0 : Math.sin(t * 0.7) * size * 0.012) - size * 0.03, 0);
        group.rotation.set(0.12 + py * -0.12, t * 0.08, px * -0.06);
        P.forEach((p, i) => stepDrop(p, dt, i, stage));
        drops.instanceMatrix.needsUpdate = true;
        drops.instanceColor.needsUpdate = true;
        neckRing.material.emissiveIntensity = 0.15 + stage.progress * 0.5;
        stage.shadow.x = group.position.x;
        stage.shadow.y = -size * 0.5;
        stage.shadow.r = size * 0.32;
    };

    // As tall as it can be while the rim stays inside the column.
    const onResize = stage => {
        size = Math.min(stage.visH * 0.64, stage.visW * 0.7);
        group.scale.setScalar(size);
    };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
