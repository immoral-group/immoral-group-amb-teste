import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /gestion-de-redes: a conversation in glass (src/glass-stage.js). A
// speech bubble with the three dots of someone typing, in brand blue, and the
// five networks of the page orbiting it as glass coins with their icon. The
// scroll of the hero (setProgress) is the copy — "no publicamos por publicar…
// diseñamos, ejecutamos y optimizamos con precisión": the loose, wobbly orbit
// settles into an even, precise one, and the dots start typing in time.

const ICONS = ['/imgs/ico-gestion-1.svg', '/imgs/ico-gestion-2.svg', '/imgs/ico-gestion-3.svg', '/imgs/ico-gestion-4.svg', '/imgs/ico-gestion-5.svg'];
const BLUE = new THREE.Color('#1F5EFF');

const loadTexture = (src, px = 512) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
        // SVGs rasterised at a size that stays sharp on the coin.
        const c = document.createElement('canvas');
        c.width = c.height = px;
        c.getContext('2d').drawImage(img, 0, 0, px, px);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = src;
});

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 20;
    const group = new THREE.Group();
    const coins = [];
    const dots = [];
    let bubble;

    const build = stage => {
        stage.scene.add(group);
        // The bubble: a rounded slab with a tail, one glass body.
        const body = new RoundedBoxGeometry(1.5, 1.05, 0.42, 8, 0.22);
        const tail = new THREE.ConeGeometry(0.17, 0.42, 48, 1);
        tail.rotateZ(Math.PI * 0.82);
        tail.translate(-0.46, -0.62, 0);
        const shape = mergeGeometries([body.toNonIndexed(), tail.toNonIndexed()]);
        shape.computeVertexNormals();
        bubble = new THREE.Mesh(shape, new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.3, dispersion: 4, attenuationDistance: 110 }));
        group.add(bubble);
        // Typing: three solid brand-blue dots inside.
        for (let i = 0; i < 3; i++) {
            const d = new THREE.Mesh(new THREE.SphereGeometry(0.095, 48, 32), new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }));
            d.userData.x = (i - 1) * 0.32;
            bubble.add(d);
            dots.push(d);
        }
        // The networks: glass coins with the icon on their face.
        const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 96, 1);
        coinGeo.rotateX(Math.PI / 2);
        ICONS.forEach((src, i) => {
            const coin = new THREE.Group();
            coin.add(new THREE.Mesh(coinGeo, new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.25, dispersion: 3, attenuationDistance: 90 })));
            const face = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
            face.position.z = 0.075;
            face.renderOrder = 2;
            coin.add(face);
            loadTexture(src).then(tex => { if (tex) { face.material.map = tex; face.material.needsUpdate = true; } });
            group.add(coin);
            coins.push({ coin, i, phase: i * 1.3, jitter: 0.6 + (i % 3) * 0.35 });
        });
    };

    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y;
        const p = stage.progress;
        // 0: loose and wobbly; 1: precise.
        const order = THREE.MathUtils.smoothstep(p, 0.15, 0.9);

        group.position.set(px * unit * 0.12, py * unit * 0.08, 0);
        group.rotation.set(-py * 0.14, px * 0.2, 0);

        // The bubble floats and turns a little toward the pointer.
        bubble.scale.setScalar(unit * 1.25);
        bubble.position.set(0, Math.sin(t * 0.8) * unit * 0.05, 0);
        bubble.rotation.set(Math.sin(t * 0.5) * 0.08, -0.25 + Math.sin(t * 0.35) * 0.12, Math.sin(t * 0.6) * 0.03);
        // Typing: each dot hops in turn; loose at first, in time as it settles.
        dots.forEach((d, i) => {
            const beat = t * (2.4 + order * 0.8) - i * (0.55 + order * 0.25) + (1 - order) * i * 1.7;
            const hop = Math.max(0, Math.sin(beat)) ** 2;
            d.position.set(d.userData.x, hop * 0.14, 0);
            d.scale.setScalar(1 + hop * 0.25);
        });

        // The orbit: a tilted ring around the bubble. Uneven radii and speeds,
        // and a wobble, until the copy says "con precisión".
        const R = unit * 2.2, tilt = 0.42;
        coins.forEach(c => {
            const even = (c.i / coins.length) * Math.PI * 2;
            const loose = even + Math.sin(t * 0.3 + c.phase) * 0.55;
            const a = t * 0.32 + THREE.MathUtils.lerp(loose, even, order);
            const r = R * THREE.MathUtils.lerp(0.82 + 0.22 * Math.sin(c.phase * 2.3), 1, order);
            const wob = (1 - order) * unit * 0.18 * Math.sin(t * c.jitter * 1.4 + c.phase);
            c.coin.position.set(Math.cos(a) * r, Math.sin(a) * r * Math.sin(tilt) * 0.62 + wob, Math.sin(a) * r * Math.cos(tilt) * 0.55);
            // Always facing the viewer, with a slight tumble while loose.
            c.coin.rotation.set(Math.sin(t * 0.7 + c.phase) * 0.35 * (1 - order) - group.rotation.x, -group.rotation.y + Math.sin(t * 0.5 + c.phase) * 0.25 * (1 - order), 0);
            c.coin.scale.setScalar(unit * 0.62 * (0.92 + 0.08 * Math.sin(t + c.phase)));
        });

        stage.shadow.x = group.position.x;
        stage.shadow.y = -unit * 1.6;
        stage.shadow.r = unit * 1.7;
    };

    // The orbit (about 2.2 units out) fills the column with room to spare.
    const onResize = stage => { unit = Math.min(stage.visH * 0.2, stage.visW * 0.215); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
