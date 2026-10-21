import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /influencer-marketing: the creators themselves (src/glass-stage.js).
// Their real clips, portrait, each set in a body of glass like a phone, turn
// on a slow carousel that leans toward the pointer. As the hero scrolls away
// (setProgress) the ring opens and tilts back. The clips only play while the
// hero is on screen.

const CLIPS = Array.from({ length: 9 }, (_, i) => `/videos/influencers/influencer-${i + 1}.webm`);
const W = 0.56, H = 1;

// Rounded corners for the clip: an alpha map drawn once.
function cornerMask() {
    const c = document.createElement('canvas');
    c.width = 112; c.height = 200;
    const x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(0, 0, c.width, c.height, 14); x.fill();
    return new THREE.CanvasTexture(c);
}

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 30;
    const group = new THREE.Group();
    const ring = new THREE.Group();
    const cards = [];
    const videos = [];

    const build = stage => {
        stage.scene.add(group);
        group.add(ring);
        const clips = stage.small() ? CLIPS.slice(0, 6) : CLIPS;
        const mask = cornerMask();
        const body = new RoundedBoxGeometry(W + 0.06, H + 0.06, 0.05, 6, 0.045);
        const glass = new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 0.2, dispersion: 3, attenuationDistance: 140 });
        clips.forEach((src, i) => {
            const video = Object.assign(document.createElement('video'), { src, muted: true, loop: true, playsInline: true, preload: 'auto', crossOrigin: 'anonymous' });
            video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
            videos.push(video);
            const tex = new THREE.VideoTexture(video);
            tex.colorSpace = THREE.SRGBColorSpace;
            const card = new THREE.Group();
            card.add(new THREE.Mesh(body, glass));
            const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, alphaMap: mask, alphaTest: 0.5, toneMapped: false }));
            screen.position.z = 0.03;
            card.add(screen);
            ring.add(card);
            cards.push({ card, i, n: clips.length, phase: i * 0.9 });
        });
        // Play only while on screen (the stage stops drawing too).
        new IntersectionObserver(([en]) => videos.forEach(v => (en.isIntersecting && !reduced ? v.play().catch(() => {}) : v.pause())), { rootMargin: '80px' }).observe(canvas);
    };

    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y, p = stage.progress;
        group.scale.setScalar(unit);
        group.position.set(px * unit * 0.08, py * unit * 0.05 - unit * 0.05, 0);
        // Leans toward the pointer; opens and tips back as the hero leaves.
        group.rotation.set(0.12 - py * 0.12 + p * 0.35, px * 0.25, 0);
        ring.rotation.y = t * 0.16;
        const R = 1.45 + p * 0.6;
        cards.forEach(c => {
            const a = (c.i / c.n) * Math.PI * 2;
            c.card.position.set(Math.sin(a) * R, Math.sin(t * 0.8 + c.phase) * 0.05, Math.cos(a) * R);
            // Facing out of the ring, with a slight sway.
            c.card.rotation.set(0, a + Math.sin(t * 0.5 + c.phase) * 0.06, Math.sin(t * 0.6 + c.phase) * 0.02);
        });
        stage.shadow.x = group.position.x;
        stage.shadow.y = -unit * 0.95;
        stage.shadow.r = unit * 1.6;
    };

    const onResize = stage => { unit = Math.min(stage.visH * 0.36, stage.visW * 0.25); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
