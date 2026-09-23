import * as THREE from 'three';

let dispose;

// The SVG keeps the labels and provides a static fallback. WebGL adds only
// the dimensional quotation marks, in the same monochrome language as the other heroes.
export function initGeoMentionScene() {
    dispose?.();
    dispose = undefined;
    const container = document.getElementById('geo-mention-scene');
    if (!container) return;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
        return; // Leave the outlined SVG visible on devices without WebGL.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-280, 280, 240, -240, 1, 1200);
    camera.position.z = 600;
    const sculpture = new THREE.Group();
    sculpture.position.y = -8;
    sculpture.scale.setScalar(1.28);
    scene.add(sculpture);

    // A reproducible field of particles inside the curved punctuation volumes.
    let seed = 71423;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    const shape = new THREE.Shape();
    shape.moveTo(-36.5, 79);
    shape.lineTo(36.5, 79);
    shape.lineTo(36.5, 3);
    shape.bezierCurveTo(36.5, -42, 11.5, -69, -30.5, -79);
    shape.lineTo(-30.5, -49);
    shape.bezierCurveTo(-6.5, -40, 4.5, -25, 4.5, -5);
    shape.lineTo(-36.5, -5);
    shape.closePath();
    const contour = shape.getPoints(28);
    const inside = (x, y) => {
        let contained = false;
        for (let i = 0, j = contour.length - 1; i < contour.length; j = i++) {
            const a = contour[i], b = contour[j];
            if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) contained = !contained;
        }
        return contained;
    };

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(.08, 'rgba(255,255,255,.95)');
    gradient.addColorStop(.22, 'rgba(255,255,255,.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    const glows = [];

    for (const offset of [-49, 49]) {
        const quote = new THREE.Group();
        quote.position.x = offset;
        sculpture.add(quote);

        // Parallel contours and sparsely spaced depth edges expose the curved shape.
        for (let layer = 0; layer < 5; layer++) {
            const depth = -22 + layer * 11;
            const geometry = new THREE.BufferGeometry().setFromPoints(contour.map(p => new THREE.Vector3(p.x, p.y, depth)));
            quote.add(new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({
                color: 0xe7edf4, transparent: true, opacity: layer === 4 ? .85 : layer === 0 ? .42 : .17,
                depthWrite: false,
            })));
        }
        const edgePositions = [];
        contour.forEach((p, i) => {
            if (i % 7 === 0 || i < 3) edgePositions.push(p.x, p.y, -22, p.x, p.y, 22);
        });
        const edges = new THREE.BufferGeometry();
        edges.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
        quote.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xcad3df, transparent: true, opacity: .28, depthWrite: false })));

        const positions = [], colors = [];
        while (positions.length < 1900 * 3) {
            const x = random() * 73 - 36.5;
            const y = random() * 158 - 79;
            if (!inside(x, y)) continue;
            positions.push(x, y, random() * 44 - 22);
            const value = .28 + random() * .48;
            colors.push(value * .89, value * .94, value);
        }
        const particles = new THREE.BufferGeometry();
        particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        quote.add(new THREE.Points(particles, new THREE.PointsMaterial({
            size: 1.05, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .72, depthWrite: false,
        })));

        [0, 1, 2, 22, 34, 58].forEach((index, i) => {
            const p = contour[Math.min(index, contour.length - 1)];
            const material = new THREE.SpriteMaterial({ map: glowTexture, color: 0xffffff, transparent: true, opacity: .65, blending: THREE.AdditiveBlending, depthWrite: false });
            const glow = new THREE.Sprite(material);
            glow.position.set(p.x, p.y, 22);
            glow.scale.setScalar(i < 3 ? 10 : 7);
            quote.add(glow);
            glows.push(glow);
        });
    }

    const events = new AbortController();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    let contextLost = false;
    let frame = 0;
    let elapsed = 0;
    let lastTime = 0;
    let pointerX = 0, pointerY = 0;
    let tiltX = 0, tiltY = 0;

    function draw() {
        sculpture.rotation.set(.12 + tiltY, -.32 + tiltX, -.045);
        renderer.render(scene, camera);
    }
    function tick(now) {
        frame = 0;
        elapsed += Math.min((now - lastTime) / 1000, .05);
        lastTime = now;
        tiltX += (pointerX * .15 + Math.sin(elapsed * .35) * .07 - tiltX) * .035;
        tiltY += (pointerY * .08 + Math.sin(elapsed * .28) * .035 - tiltY) * .035;
        glows.forEach((glow, i) => { glow.material.opacity = .5 + Math.sin(elapsed * .9 + i * 1.7) * .2; });
        draw();
        syncAnimation();
    }
    function syncAnimation() {
        const animate = visible && !document.hidden && !motion.matches && !contextLost;
        if (animate && !frame) {
            lastTime = performance.now();
            frame = requestAnimationFrame(tick);
        } else if (!animate && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        if (motion.matches && !contextLost) {
            tiltX = tiltY = 0;
            draw();
        }
    }
    const resize = new ResizeObserver(() => {
        if (!container.clientWidth || !container.clientHeight || contextLost) return;
        renderer.setSize(container.clientWidth, container.clientHeight, false);
        draw();
        container.classList.add('is-ready');
    });
    resize.observe(container);
    const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncAnimation();
    });
    intersection.observe(container);
    container.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse') return;
        const bounds = container.getBoundingClientRect();
        pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
        pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    }, { signal: events.signal });
    container.addEventListener('pointerleave', () => { pointerX = pointerY = 0; }, { signal: events.signal });
    document.addEventListener('visibilitychange', syncAnimation, { signal: events.signal });
    motion.addEventListener('change', syncAnimation, { signal: events.signal });
    renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault();
        contextLost = true;
        renderer.domElement.hidden = true;
        container.classList.remove('is-ready');
        syncAnimation();
    }, { signal: events.signal });
    renderer.domElement.addEventListener('webglcontextrestored', () => {
        contextLost = false;
        renderer.domElement.hidden = false;
        renderer.setSize(container.clientWidth, container.clientHeight, false);
        draw();
        container.classList.add('is-ready');
        syncAnimation();
    }, { signal: events.signal });

    dispose = () => {
        cancelAnimationFrame(frame);
        events.abort();
        resize.disconnect();
        intersection.disconnect();
        scene.traverse(object => {
            object.geometry?.dispose();
            object.material?.dispose();
        });
        glowTexture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        container.classList.remove('is-ready');
    };
}
