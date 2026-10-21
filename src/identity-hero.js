import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /diseno-de-marca: an identity system in glass (src/glass-stage.js).
// Four basic shapes — sphere, rounded cube, torus, cone — tumble apart and,
// once the page is ready, come together into one ordered grid, upright, like
// the pieces of a brand that all come from the same place. Brand-coloured
// accents circle them. As the hero scrolls away (setProgress) the system
// comes apart again; scrolling back puts it together.

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 20, intro = reduced ? 1 : 0, introAt = -1;
    const pieces = [];
    const accents = [];
    const group = new THREE.Group();

    // Where each piece rests in the system (grid units) and where it floats off to.
    const LAYOUT = [
        { home: [-0.64, 0.64, 0], away: [-1.3, 1.05, -0.6], spin: [0.5, 0.9, 0.2] },
        { home: [0.64, 0.64, 0], away: [1.2, 1.2, 0.4], spin: [-0.7, 0.4, 0.6] },
        { home: [-0.64, -0.64, 0], away: [-1.15, -1.25, 0.5], spin: [0.3, -0.8, 0.5] },
        { home: [0.64, -0.64, 0], away: [1.32, -1.0, -0.4], spin: [-0.4, -0.5, -0.7] },
    ];

    const build = stage => {
        stage.scene.add(group);
        // Same glass as the bubbles, with a little more dispersion: at the
        // edges it splits the wall's lines into colour, like a prism.
        const glass = () => new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.28, dispersion: 6, attenuationDistance: 90 });
        const geos = [
            new THREE.SphereGeometry(0.5, 96, 64),
            new RoundedBoxGeometry(0.88, 0.88, 0.88, 6, 0.16),
            new THREE.TorusGeometry(0.34, 0.15, 48, 128),
            new THREE.ConeGeometry(0.5, 0.92, 96, 1),
        ];
        geos.forEach((g, i) => {
            const mesh = new THREE.Mesh(g, glass());
            group.add(mesh);
            pieces.push({ mesh, ...LAYOUT[i], phase: i * 1.7 });
        });
        // Solid accents in the brand colours, orbiting the system.
        [['#1F5EFF', 0.11, 1.32, 0.42], ['#3FE0F5', 0.075, 1.12, -0.58], ['#9DBBFF', 0.06, 1.5, 0.3]].forEach(([c, r, orbit, speed], i) => {
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 }));
            group.add(mesh);
            accents.push({ mesh, orbit, speed, phase: i * 2.1, tilt: 0.35 + i * 0.25 });
        });
    };

    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y;
        // Comes together once, after it is shown; the scroll then takes it apart.
        if (introAt < 0 && stage.t > 0.2) introAt = stage.t;
        if (!reduced && introAt >= 0) intro = Math.min(1, (stage.t - introAt) / 1.8);
        const a = ease(intro) * (1 - ease(stage.progress));

        group.position.set(px * unit * 0.12, py * unit * 0.08, 0);
        group.rotation.set(-py * 0.16, px * 0.22, 0);

        pieces.forEach((p, i) => {
            tmpA.fromArray(p.away).multiplyScalar(unit);
            tmpB.fromArray(p.home).multiplyScalar(unit);
            p.mesh.position.lerpVectors(tmpA, tmpB, a);
            // Each one floats on its own, less once it is in place.
            const f = 1 - a * 0.6, w = t * 0.6 + p.phase;
            p.mesh.position.x += Math.sin(w) * unit * 0.05 * f;
            p.mesh.position.y += Math.cos(w * 1.3) * unit * 0.05 * f;
            // Tumbling while apart; upright, turning slowly, in the system.
            const k = 1 - a;
            p.mesh.rotation.set(
                p.spin[0] * (t * 0.5 + 2) * k + 0.25 * a * Math.sin(t * 0.4 + i),
                p.spin[1] * (t * 0.5 + 2) * k + (t * 0.35 + i) * a,
                p.spin[2] * (t * 0.5 + 2) * k
            );
            p.mesh.scale.setScalar(unit * (0.92 + 0.08 * a));
        });
        accents.forEach(ac => {
            const w = t * ac.speed + ac.phase;
            const r = unit * ac.orbit * (1.1 - 0.15 * a);
            ac.mesh.position.set(Math.cos(w) * r, Math.sin(w) * r * Math.cos(ac.tilt), Math.sin(w) * r * Math.sin(ac.tilt));
            ac.mesh.scale.setScalar(unit);
        });
        stage.shadow.x = group.position.x;
        stage.shadow.y = -unit * 1.35;
        stage.shadow.r = unit * (1.1 + (1 - a) * 0.5);
    };

    // A grid cell, sized so the system fills the column with room to spare.
    const onResize = stage => { unit = Math.min(stage.visH * 0.2, stage.visW * 0.25); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
