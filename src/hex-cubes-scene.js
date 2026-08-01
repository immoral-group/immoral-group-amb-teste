import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

// Reusable "hex cubes" background: a grid of wireframe cubes at varying elevation,
// each holding a dense volumetric point cloud, with hover-to-rotate + hover-to-flicker.
// Used both by the isolated prototype page and by the production section — sized to
// whatever `container` element is passed in, not the window, so it works embedded.
export function createHexCubesScene(canvas, container) {
    const scene = new THREE.Scene();
    scene.background = null; // transparent — let the page's own background show through

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(9.5, 7, 11.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(6, 10, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8899ff, 0.35);
    rimLight.position.set(-8, 3, -6);
    scene.add(rimLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = true; // click-drag rotates, like before
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;

    // Custom cursor: a circular ring (with a small glowing center dot) that follows
    // the pointer while it's over the piece, replacing the default arrow — a visual
    // hint that it's draggable, shaped like an actual cursor ring rather than a blob.
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    renderer.domElement.style.cursor = 'none';
    const CURSOR_SIZE = 32;
    const cursorDot = document.createElement('div');
    cursorDot.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: ${CURSOR_SIZE}px;
        height: ${CURSOR_SIZE}px;
        border-radius: 50%;
        border: 1.5px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 10px 2px rgba(255,255,255,0.5), inset 0 0 6px 1px rgba(255,255,255,0.3);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        transform: translate(-9999px, -9999px);
        z-index: 5;
    `;
    const cursorCenterDot = document.createElement('div');
    cursorCenterDot.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255,255,255,0.95);
        box-shadow: 0 0 6px 2px rgba(255,255,255,0.8);
        transform: translate(-50%, -50%);
    `;
    cursorDot.appendChild(cursorCenterDot);
    container.appendChild(cursorDot);

    const onPointerMoveCursor = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cursorDot.style.transform = `translate(${x - CURSOR_SIZE / 2}px, ${y - CURSOR_SIZE / 2}px)`;
    };
    const onPointerEnterCursor = () => { cursorDot.style.opacity = '1'; };
    const onPointerLeaveCursor = () => { cursorDot.style.opacity = '0'; };
    renderer.domElement.addEventListener('pointermove', onPointerMoveCursor);
    renderer.domElement.addEventListener('pointerenter', onPointerEnterCursor);
    renderer.domElement.addEventListener('pointerleave', onPointerLeaveCursor);

    // ---------- Simple value-noise (fbm) for cube elevation, no deps ----------
    function hash(x, y) {
        const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return s - Math.floor(s);
    }
    function noise2D(x, y) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);
        const a = hash(xi, yi), b = hash(xi + 1, yi);
        const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    function fbm(x, y) {
        return noise2D(x, y) * 0.6 + noise2D(x * 2.1, y * 2.1) * 0.3 + noise2D(x * 4.3, y * 4.3) * 0.1;
    }

    // ---------- Square grid of real cubes (4-edge faces, not hexagons) ----------
    const CUBE_SIZE = 1.7;
    const PRISM_BASE_HEIGHT = 1.5; // fixed depth — only elevation (position) animates, never scale
    const GRID_RADIUS = 2;
    const GAP_CHANCE = 0.22; // leave holes — the reference isn't a fully filled grid either

    const HALF = CUBE_SIZE / 2;
    const HALF_H = PRISM_BASE_HEIGHT / 2;

    const cells = [];
    for (let col = -GRID_RADIUS; col <= GRID_RADIUS; col++) {
        for (let row = -GRID_RADIUS; row <= GRID_RADIUS; row++) {
            const dist = Math.sqrt(col * col + row * row);
            if (dist > GRID_RADIUS + 0.4) continue;
            if (Math.random() < GAP_CHANCE) continue;
            cells.push({ col, row, x: col * CUBE_SIZE, y: row * CUBE_SIZE });
        }
    }

    const hexGroup = new THREE.Group();
    scene.add(hexGroup);

    // near-invisible shell (depthWrite off) so the internal point cloud stays
    // visible from any rotation angle — the cube reads by its wireframe + points, not its faces.
    const solidMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
    });
    // LineBasicMaterial's linewidth is ignored by WebGL on most platforms — use the
    // fat-lines addon so the cube edges actually render thicker.
    const edgeMaterial = new LineMaterial({
        color: 0x888888,
        linewidth: 1.3, // pixels
        transparent: true,
        opacity: 0.45,
    });

    function makeDotTexture(hardness = 0.4) {
        const size = 64;
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(hardness, 'rgba(255,255,255,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(c);
    }
    const dotTexture = makeDotTexture(0.4);
    const speckTexture = makeDotTexture(0.2);

    // dense volumetric cloud — packed toward the cube's center, thinning out toward
    // (and a little past) the faces, so it reads as a point-cloud core, not a shell.
    const POINTS_PER_CUBE = 700;
    const SPECK_BASE_OPACITY = 0.85;
    const SPECK_BASE_SIZE = 0.048;

    const prisms = [];
    const vertexPositions = new Map(); // dedup shared top corners

    function gaussianRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    function clamp(v, bound) {
        return Math.max(-bound, Math.min(bound, v));
    }

    // margin keeps points from touching/crossing the cube's own edge, so neighboring
    // cubes' clouds never bleed into each other.
    const SPECK_MARGIN = 0.9;

    function scatterVolumetric(target, count) {
        const sigmaXZ = HALF * 0.5;
        const sigmaY = HALF_H * 0.5;
        const boundXZ = HALF * SPECK_MARGIN;
        const boundY = HALF_H * SPECK_MARGIN;
        for (let i = 0; i < count; i++) {
            target.push(
                clamp(gaussianRandom() * sigmaXZ, boundXZ),
                clamp(gaussianRandom() * sigmaY, boundY),
                clamp(gaussianRandom() * sigmaXZ, boundXZ)
            );
        }
    }

    const disposableGeometries = [];
    const disposableMaterials = [speckTexture, dotTexture, solidMaterial, edgeMaterial];

    cells.forEach((cell) => {
        const geo = new THREE.BoxGeometry(CUBE_SIZE, PRISM_BASE_HEIGHT, CUBE_SIZE);
        const mesh = new THREE.Mesh(geo, solidMaterial);
        mesh.position.set(cell.x, 0, cell.y);
        hexGroup.add(mesh);
        disposableGeometries.push(geo);

        // full cube wireframe (4 top + 4 bottom + 4 vertical = 12 edges) as a child
        // so it automatically follows the elevation animation.
        const rawEdges = new THREE.EdgesGeometry(geo);
        const lineGeo = new LineSegmentsGeometry().setPositions(rawEdges.attributes.position.array);
        const edges = new LineSegments2(lineGeo, edgeMaterial);
        mesh.add(edges);
        disposableGeometries.push(rawEdges, lineGeo);

        // dense fixed point cloud, packed toward the cube's center
        const facePositions = [];
        scatterVolumetric(facePositions, POINTS_PER_CUBE);

        const speckGeo = new THREE.BufferGeometry();
        speckGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(facePositions), 3));
        const speckMaterial = new THREE.PointsMaterial({
            size: SPECK_BASE_SIZE,
            map: speckTexture,
            transparent: true,
            depthWrite: false,
            opacity: SPECK_BASE_OPACITY,
            color: 0xffffff,
        });
        const specks = new THREE.Points(speckGeo, speckMaterial);
        mesh.add(specks);
        disposableGeometries.push(speckGeo);
        disposableMaterials.push(speckMaterial);

        prisms.push({ cell, mesh, geo, specks, speckMaterial });

        // shared top corners for the glowing vertex dots
        const corners = [
            { x: cell.x - HALF, z: cell.y - HALF },
            { x: cell.x + HALF, z: cell.y - HALF },
            { x: cell.x + HALF, z: cell.y + HALF },
            { x: cell.x - HALF, z: cell.y + HALF },
        ];
        corners.forEach((c) => {
            const key = `${c.x.toFixed(2)}_${c.z.toFixed(2)}`;
            if (!vertexPositions.has(key)) vertexPositions.set(key, { x: c.x, z: c.z, cells: [cell] });
            else vertexPositions.get(key).cells.push(cell);
        });
    });

    // ---------- Glowing vertex dots (shared corners, in world space) ----------
    const vertexList = Array.from(vertexPositions.entries());
    const dotCount = vertexList.length;
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(dotCount * 3);
    dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    disposableGeometries.push(dotGeo);

    const dotMaterial = new THREE.PointsMaterial({
        size: 0.22,
        map: dotTexture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xffffff,
    });
    disposableMaterials.push(dotMaterial);
    const dotPoints = new THREE.Points(dotGeo, dotMaterial);
    hexGroup.add(dotPoints);

    // center the whole cluster
    const bbox = new THREE.Box3().setFromObject(hexGroup);
    const center = bbox.getCenter(new THREE.Vector3());
    hexGroup.position.x = -center.x;
    hexGroup.position.z = -center.z;

    // ---------- Hover detection (raycast) — only the hovered cube's specks flicker ----------
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2(-10, -10);
    let hoveredPrism = null;

    function resetSpeckMaterial(p) {
        p.speckMaterial.opacity = SPECK_BASE_OPACITY;
        p.speckMaterial.size = SPECK_BASE_SIZE;
    }

    const onPointerMoveHover = (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onPointerLeaveHover = () => { pointerNDC.set(-10, -10); };
    renderer.domElement.addEventListener('pointermove', onPointerMoveHover);
    renderer.domElement.addEventListener('pointerleave', onPointerLeaveHover);

    function updateHover() {
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(prisms.map((p) => p.mesh));
        const hit = hits.length > 0 ? prisms.find((p) => p.mesh === hits[0].object) : null;

        if (hit !== hoveredPrism) {
            if (hoveredPrism) resetSpeckMaterial(hoveredPrism);
            hoveredPrism = hit || null;
        }
    }

    // ---------- Bloom post-processing ----------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.4, 0.82);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function resize() {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
        edgeMaterial.resolution.set(width, height);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // scroll feeds the same noise field the idle animation uses, so scrolling nudges
    // cubes to different tiers (some rise, some fall) instead of only drifting on their own.
    let scrollOffset = 0;
    const onScroll = () => {
        scrollOffset = window.scrollY * 0.004;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    function updateHeights(time) {
        prisms.forEach(({ cell, mesh }) => {
            const n = fbm(cell.col * 0.6 + time * 0.12 + scrollOffset, cell.row * 0.6 + time * 0.12 - scrollOffset);
            const tiers = [-1.3, -0.5, 0.4, 1.3, 2.1];
            const tierPos = n * (tiers.length - 1);
            const lo = Math.floor(tierPos);
            const hi = Math.min(lo + 1, tiers.length - 1);
            const blend = tierPos - lo;
            const eased = blend < 0.5 ? Math.pow(blend * 2, 3) / 2 : 1 - Math.pow((1 - blend) * 2, 3) / 2;
            const targetElevation = tiers[lo] + (tiers[hi] - tiers[lo]) * eased;

            if (mesh.userData.elevation === undefined) mesh.userData.elevation = targetElevation;
            mesh.userData.elevation += (targetElevation - mesh.userData.elevation) * 0.02;
            mesh.position.y = mesh.userData.elevation;
        });

        let i = 0;
        for (const [, v] of vertexList) {
            const tops = v.cells.map((c) => {
                const p = prisms.find((pp) => pp.cell === c);
                return p ? (p.mesh.userData.elevation ?? 0) + HALF_H : HALF_H;
            });
            const avgTop = tops.reduce((a, b) => a + b, 0) / tops.length;
            dotPositions[i * 3] = v.x;
            dotPositions[i * 3 + 1] = avgTop;
            dotPositions[i * 3 + 2] = v.z;
            i++;
        }
        dotGeo.attributes.position.needsUpdate = true;
    }

    function updateSpeckFlicker() {
        if (!hoveredPrism) return;
        const { speckMaterial } = hoveredPrism;
        speckMaterial.opacity = 0.35 + Math.random() * 0.65;
        speckMaterial.size = SPECK_BASE_SIZE * (0.7 + Math.random() * 0.8);
    }

    let lastFrameTime = performance.now();
    let elapsedTime = 0;
    let rafId = null;

    function animate() {
        rafId = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
        lastFrameTime = now;
        elapsedTime += dt;
        updateHeights(elapsedTime);
        updateHover();
        updateSpeckFlicker();
        controls.update();
        composer.render();
    }
    animate();

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        window.removeEventListener('scroll', onScroll);
        renderer.domElement.removeEventListener('pointermove', onPointerMoveCursor);
        renderer.domElement.removeEventListener('pointerenter', onPointerEnterCursor);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeaveCursor);
        renderer.domElement.removeEventListener('pointermove', onPointerMoveHover);
        renderer.domElement.removeEventListener('pointerleave', onPointerLeaveHover);
        cursorDot.remove();
        controls.dispose();
        disposableGeometries.forEach((g) => g.dispose());
        disposableMaterials.forEach((m) => m.dispose());
        composer.dispose();
        renderer.dispose();
    }

    return { dispose, resize };
}
