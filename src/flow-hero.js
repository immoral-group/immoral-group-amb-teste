import * as THREE from 'three';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /email-marketing: the journey after the click, as an automation flow
// in glass (src/glass-stage.js). A glass tube winds down the column through
// four nodes — the moments of the journey — and the messages travel inside
// it: pale when someone has just left their email, brand blue by the time
// they buy again. Each node glows as a message goes through it. The scroll of
// the hero (setProgress) turns more of them blue, sooner, and speeds the flow.

const PALE = new THREE.Color('#CFDCFF');
const BLUE = new THREE.Color('#1F5EFF');
const NODES = [0.1, 0.37, 0.64, 0.9];

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 40;
    const group = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.05, 0.95, -0.1),
        new THREE.Vector3(-0.2, 0.78, 0.2),
        new THREE.Vector3(0.72, 0.58, -0.05),
        new THREE.Vector3(0.62, 0.12, 0.18),
        new THREE.Vector3(-0.35, -0.02, -0.12),
        new THREE.Vector3(-0.78, -0.42, 0.1),
        new THREE.Vector3(-0.05, -0.74, -0.08),
        new THREE.Vector3(0.95, -0.92, 0.12),
    ], false, 'catmullrom', 0.5);
    const nodes = [];
    let msgs, M = 0;
    const P = [];
    const tmp = new THREE.Object3D(), col = new THREE.Color(), pos = new THREE.Vector3();

    const build = stage => {
        stage.scene.add(group);
        const glass = new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.06, dispersion: 3, side: THREE.DoubleSide, attenuationDistance: 160 });
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 320, 0.062, 40, false), glass));
        // Open ends: two small glass rings where the flow comes in and goes out.
        [0, 1].forEach(t => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 16, 48), glass);
            ring.position.copy(curve.getPointAt(t));
            ring.lookAt(curve.getPointAt(t).add(curve.getTangentAt(t)));
            group.add(ring);
        });
        // The nodes: glass beads on the tube, with a core that lights up.
        NODES.forEach((t, i) => {
            const bead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 64, 48), new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.3, dispersion: 4, attenuationDistance: 90 }));
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 24), new THREE.MeshPhysicalMaterial({ color: PALE.clone(), roughness: 0.25, clearcoat: 1, emissive: BLUE.clone(), emissiveIntensity: 0 }));
            bead.position.copy(curve.getPointAt(t));
            core.position.copy(bead.position);
            group.add(bead, core);
            nodes.push({ t, core, glow: 0, i });
        });
        // The messages: opaque drops (glass would not show through the tube).
        M = stage.small() ? 12 : 18;
        msgs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }), M);
        msgs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        msgs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(M * 3), 3);
        msgs.frustumCulled = false;
        group.add(msgs);
        for (let i = 0; i < M; i++) P.push({ t: i / M, speed: 0.75 + Math.random() * 0.5, size: 0.026 + Math.random() * 0.012 });
    };

    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y, p = stage.progress;
        group.scale.setScalar(unit);
        group.position.set(px * unit * 0.05, Math.sin(t * 0.6) * unit * 0.015, 0);
        group.rotation.set(-py * 0.18 + 0.05, px * 0.3 + Math.sin(t * 0.25) * 0.08, 0);

        // Where along the journey a message turns blue: later at first, sooner
        // as the copy goes from "lead" to "cliente".
        const turn = THREE.MathUtils.lerp(0.72, 0.3, p);
        const flow = 0.05 + p * 0.03;
        nodes.forEach(n => { n.glow *= Math.exp(-dt * 3); });
        P.forEach((m, i) => {
            const prev = m.t;
            // A little slower through each node, as if it waited to be read.
            const near = NODES.reduce((a, nt) => Math.min(a, Math.abs(m.t - nt)), 1);
            m.t += dt * flow * m.speed * (0.45 + 0.55 * Math.min(1, near / 0.06));
            if (m.t >= 1) m.t -= 1;
            nodes.forEach(n => { if (prev < n.t && m.t >= n.t) n.glow = 1; });
            curve.getPointAt(m.t, pos);
            // Fades in and out at the open ends.
            const edge = Math.min(1, m.t / 0.04, (1 - m.t) / 0.04);
            const mix = THREE.MathUtils.smoothstep(m.t, turn - 0.12, turn + 0.08);
            col.copy(PALE).lerp(BLUE, mix);
            msgs.setColorAt(i, col);
            tmp.position.copy(pos);
            tmp.scale.setScalar(Math.max(0.00001, m.size * edge * (1 + mix * 0.3)));
            tmp.updateMatrix();
            msgs.setMatrixAt(i, tmp.matrix);
        });
        msgs.instanceMatrix.needsUpdate = true;
        msgs.instanceColor.needsUpdate = true;
        nodes.forEach(n => {
            const lit = THREE.MathUtils.smoothstep(n.t, turn - 0.2, turn + 0.1);
            n.core.material.color.copy(PALE).lerp(BLUE, lit);
            n.core.material.emissiveIntensity = n.glow * 0.6;
            n.core.scale.setScalar(1 + n.glow * 0.35);
        });

        stage.shadow.x = group.position.x;
        stage.shadow.y = -unit * 1.05;
        stage.shadow.r = unit * 0.9;
    };

    // The flow spans about two units each way: fill the column with room to spare.
    const onResize = stage => { unit = Math.min(stage.visH * 0.4, stage.visW * 0.4); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
