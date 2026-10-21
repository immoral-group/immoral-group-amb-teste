import * as THREE from 'three';
import { glassParams } from './home-prisma-hero.js';
import { createGlassStage } from './glass-stage.js';

// Hero of /posicionamiento-geo: a magnifying glass (src/glass-stage.js). Its
// lens is a real biconvex lens, so it magnifies what is behind it: the ruled
// wall, the names of the engines people now ask (Google, ChatGPT, Gemini,
// Perplexity, Copilot) linked by their mentions to a pair of brand-blue
// quotation marks. As the copy goes from "salir el primero" to "que te
// nombren" (setProgress), the glass leaves the search engine and settles over
// the quote.

const ENGINES = [
    ['Google', -1.05, 0.72], ['ChatGPT', 0.98, 0.86], ['Gemini', 1.22, -0.22], ['Perplexity', -1.1, -0.6], ['Copilot', 0.28, -1.08],
];
const QUOTE = new THREE.Vector3(0.18, -0.02, -0.35);

// A pill with the engine's name, drawn once the web font is in.
function pillTexture(text) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = '600 64px Lexend, system-ui, sans-serif';
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 96, h = 120;
    c.width = w; c.height = h;
    ctx.font = font;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, (h - 4) / 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#C3CEE6'; ctx.stroke();
    ctx.fillStyle = '#0C1A3D'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 3);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, aspect: w / h };
}

function quoteTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1F5EFF';
    ctx.font = '800 640px Lexend, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('”', 256, 400);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export function createScene(canvas, { reduced = false } = {}) {
    let unit = 30;
    const group = new THREE.Group();
    const loupe = new THREE.Group();
    const pills = [];
    let quote, links;

    const build = stage => {
        stage.scene.add(group);
        // What sits behind the glass. Alpha-tested (opaque to the renderer), so
        // the lens refracts it like it refracts the wall.
        quote = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: false, alphaTest: 0.5, toneMapped: false }));
        quote.position.copy(QUOTE);
        group.add(quote);
        ENGINES.forEach(([name, x, y]) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ alphaTest: 0.5, toneMapped: false }));
            m.position.set(x, y, -0.35);
            m.userData = { name, x, y, phase: x * 3 + y };
            group.add(m);
            pills.push(m);
        });
        // The mentions: thin lines from each engine to the quote.
        const pts = [];
        ENGINES.forEach(([, x, y]) => pts.push(new THREE.Vector3(x, y, -0.4), QUOTE.clone().setZ(-0.4)));
        links = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#9DBBFF' }));
        group.add(links);
        // Textures need the web font (Lexend): drawn once it is in.
        (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
            quote.material.map = quoteTexture(); quote.material.needsUpdate = true;
            pills.forEach(m => {
                const { tex, aspect } = pillTexture(m.userData.name);
                m.material.map = tex; m.material.needsUpdate = true;
                m.userData.aspect = aspect;
            });
        });

        // The loupe: a biconvex lens (a lathe of its cross-section, turned to
        // face the viewer), a blue rim and a dark handle.
        const R = 0.62, H = 0.21, prof = [];
        for (let i = 0; i <= 32; i++) { const r = (i / 32) * R; prof.push(new THREE.Vector2(r, H * (1 - (r / R) ** 2) + 0.004)); }
        for (let i = 32; i >= 0; i--) { const r = (i / 32) * R; prof.push(new THREE.Vector2(r, -H * (1 - (r / R) ** 2) - 0.004)); }
        const lens = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), new THREE.MeshPhysicalMaterial({ ...glassParams(), thickness: 1.6, ior: 1.85, dispersion: 2, attenuationDistance: 600 }));
        lens.rotation.x = Math.PI / 2;
        loupe.add(lens);
        // Rim and handle are flagged transparent (still fully opaque) so they
        // stay out of the transmission pass: otherwise the lens refracts its
        // own rim and shows a second, smaller ring inside the glass.
        const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.045, 32, 160), new THREE.MeshPhysicalMaterial({ color: '#1F5EFF', roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true }));
        loupe.add(rim);
        const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.62, 12, 32), new THREE.MeshPhysicalMaterial({ color: '#0C1A3D', roughness: 0.35, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true }));
        handle.position.set(Math.cos(-Math.PI / 4) * (R + 0.42), Math.sin(-Math.PI / 4) * (R + 0.42), 0);
        handle.rotation.z = Math.PI / 4;
        loupe.add(handle);
        loupe.position.z = 0.55;
        group.add(loupe);
    };

    const from = new THREE.Vector3(), to = new THREE.Vector3();
    const update = (stage, dt) => {
        const t = stage.t, px = stage.smooth.x, py = stage.smooth.y, p = stage.progress;
        group.scale.setScalar(unit);
        group.position.set(px * unit * 0.06, py * unit * 0.04, 0);
        group.rotation.set(-py * 0.1, px * 0.14, 0);

        pills.forEach(m => {
            const a = m.userData.aspect || 3;
            m.scale.set(0.2 * a, 0.2, 1);
            m.position.set(m.userData.x + Math.sin(t * 0.5 + m.userData.phase) * 0.02, m.userData.y + Math.cos(t * 0.6 + m.userData.phase) * 0.02, -0.35);
        });
        quote.scale.setScalar(0.62 + p * 0.12);

        // From over the search engine to over the quote: "que te nombren".
        const e = THREE.MathUtils.smoothstep(p, 0.05, 0.85);
        from.set(-0.95, 0.62, 0.55);
        to.set(QUOTE.x, QUOTE.y + 0.04, 0.55);
        loupe.position.lerpVectors(from, to, e);
        loupe.position.x += Math.sin(t * 0.55) * 0.06 * (1 - e * 0.6);
        loupe.position.y += Math.cos(t * 0.7) * 0.05 * (1 - e * 0.6);
        loupe.rotation.set(Math.sin(t * 0.4) * 0.12 - py * 0.15, Math.cos(t * 0.35) * 0.15 + px * 0.2, Math.sin(t * 0.3) * 0.05);

        stage.shadow.x = group.position.x + loupe.position.x * unit * 0.6;
        stage.shadow.y = -unit * 1.25;
        stage.shadow.r = unit * 0.9;
    };

    const onResize = stage => { unit = Math.min(stage.visH * 0.3, stage.visW * 0.27); };

    return createGlassStage(canvas, { reduced, build, update, onResize });
}
