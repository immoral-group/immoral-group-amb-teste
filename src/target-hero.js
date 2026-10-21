import * as THREE from 'three';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /prospeccion-b2b: "vender en frío sin depender de la suerte", as a
// target in glass (src/glass-stage.js). Brand-blue darts fly in one after
// another and stick in it; every throw learns from the last, so they land
// closer and closer to the centre (and closer still as the hero is scrolled,
// setProgress). The target gives a little with each hit.

const BLUE = new THREE.Color('#1F5EFF');

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 30, hits = 0, nextAt = 0.6;
    const group = new THREE.Group();     // follows the pointer
    const board = new THREE.Group();     // the target, turned to the viewer
    const darts = [];
    let kick = 0;
    const rand = (a, b) => a + Math.random() * (b - a);
    const v = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3(), q = new THREE.Quaternion();
    const FLIGHT = 3.2; // how far in front of the board a dart is thrown from

    const build = stage => {
        stage.scene.add(group);
        group.add(board);
        board.rotation.y = -0.45;
        const glass = (thickness = 0.2) => new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness, dispersion: 4, attenuationDistance: 120 });
        // A thin glass disc and four rings on it.
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 128, 1), glass(0.15));
        disc.rotation.x = Math.PI / 2;
        board.add(disc);
        [1, 0.76, 0.52, 0.28].forEach((r, i) => {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035 + i * 0.006, 24, 160), glass(0.3));
            ring.position.z = 0.05 + i * 0.012;
            board.add(ring);
        });
        // The bullseye, solid brand blue.
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 48, 32), new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, emissive: BLUE, emissiveIntensity: 0.1 }));
        eye.scale.z = 0.5;
        eye.position.z = 0.07;
        board.add(eye);
        board.userData.eye = eye;

        // Darts: a dark tip, a blue shaft, three fins.
        const tipMat = new THREE.MeshPhysicalMaterial({ color: '#0C1A3D', roughness: 0.3, metalness: 0.4, clearcoat: 1 });
        const blue = new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 });
        const fin = new THREE.MeshPhysicalMaterial({ color: '#9DBBFF', roughness: 0.3, clearcoat: 1, transparent: true, opacity: 0.9 });
        for (let i = 0; i < 7; i++) {
            const dart = new THREE.Group();
            const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 24), tipMat); tip.rotation.x = -Math.PI / 2; tip.position.z = 0.08;
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.4, 24), blue); shaft.rotation.x = Math.PI / 2; shaft.position.z = -0.2;
            dart.add(tip, shaft);
            for (let k = 0; k < 3; k++) {
                const f = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.11, 0.16), fin);
                const holder = new THREE.Group(); holder.rotation.z = (k / 3) * Math.PI * 2; f.position.set(0, 0.055, -0.36); holder.add(f); dart.add(holder);
            }
            dart.visible = false;
            group.add(dart);
            darts.push({ dart, state: 'idle', t: 0, hit: new THREE.Vector3(), tilt: new THREE.Euler() });
        }
    };

    // Where the next dart lands: wide at first, tighter with every hit and
    // with the scroll of the copy.
    const aim = stage => {
        const acc = Math.min(1, hits / 9) * 0.6 + stage.progress * 0.4;
        const r = THREE.MathUtils.lerp(0.85, 0.04, acc) * Math.sqrt(Math.random());
        const a = rand(0, Math.PI * 2);
        return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.06);
    };

    const throwDart = stage => {
        const d = darts.find(x => x.state === 'idle') || darts.reduce((a, b) => (a.t > b.t ? a : b));
        d.state = 'fly'; d.t = 0;
        d.hit.copy(aim(stage));
        // How it ends up in the board (along its normal, a touch off-true).
        // It flies in from in front of the board's face along that same line,
        // so it never crosses the target and lands without a jump.
        d.tilt.set(rand(-0.2, 0.2), rand(-0.22, 0.22), 0);
        d.rest = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI + d.tilt.x, d.tilt.y, 0));
        d.axis = new THREE.Vector3(0, 0, 1).applyQuaternion(d.rest);
        d.dart.visible = true;
        d.dart.scale.setScalar(1);
    };

    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y;
        group.scale.setScalar(unit);
        group.position.set(px * unit * 0.08, py * unit * 0.05 + Math.sin(t * 0.6) * unit * 0.02, 0);
        group.rotation.set(-py * 0.12, px * 0.18, 0);
        // The board gives with each hit and settles.
        kick *= Math.exp(-dt * 5);
        board.rotation.set(Math.sin(t * 9) * kick * 0.04, -0.45 + Math.sin(t * 7) * kick * 0.06, 0);
        board.position.z = -kick * 0.05;
        board.userData.eye.material.emissiveIntensity = 0.1 + kick * 0.5;

        if (!reduced && t > nextAt) { throwDart(stage); nextAt = t + rand(0.9, 1.5); }
        board.updateMatrixWorld();
        darts.forEach(d => {
            if (d.state === 'idle') return;
            d.t += dt;
            // The hit point, in the group's space (the board is turned).
            to.copy(d.hit).applyMatrix4(board.matrix);
            if (d.state === 'fly') {
                // In the board's space: from FLIGHT units in front of its face
                // to the hit point, with a slight arc. Still fast on impact.
                const k = Math.min(1, d.t / 0.55);
                const e = k * (1.3 - 0.3 * k), de = 1.3 - 0.6 * k;
                const arc = Math.sin(k * Math.PI) * 0.3;
                v.copy(d.hit).addScaledVector(d.axis, -FLIGHT * (1 - e));
                v.y += arc;
                d.dart.position.copy(v).applyMatrix4(board.matrix);
                // Pointing where it goes, easing into its resting angle.
                from.copy(d.axis).multiplyScalar(FLIGHT * de);
                from.y += Math.cos(k * Math.PI) * Math.PI * 0.3;
                q.setFromUnitVectors(d.axis, from.normalize()).multiply(d.rest);
                q.slerp(d.rest, THREE.MathUtils.smoothstep(k, 0.6, 1));
                d.dart.quaternion.copy(board.quaternion).multiply(q);
                if (k >= 1) { d.state = 'stuck'; d.t = 0; hits++; kick = 1; }
            } else if (d.state === 'stuck') {
                // Stays in the board, then goes.
                d.dart.position.copy(to);
                d.dart.quaternion.copy(board.quaternion).multiply(d.rest);
                const life = 4.2;
                if (d.t > life) d.dart.scale.setScalar(Math.max(0.0001, 1 - (d.t - life) / 0.35));
                if (d.t > life + 0.35) { d.state = 'idle'; d.dart.visible = false; }
            }
        });

        stage.shadow.x = group.position.x;
        stage.shadow.y = -unit * 1.25;
        stage.shadow.r = unit * 1.1;
    };

    const onResize = stage => { unit = Math.min(stage.visH * 0.3, stage.visW * 0.3); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
