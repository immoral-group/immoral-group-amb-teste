import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import gsap from 'gsap';

// Floating particle field: a loose cloud of circular points drifting in place.
// Hovering the container slowly pulls every particle toward a fixed central axis,
// stacking them into a vertical tower from the base up; leaving immediately reverses
// it, dissolving the tower back into the floating field. Sized to `container`, not
// the window, so it works embedded (mirrors the previous hex-cubes piece it replaces).
export function createParticleTowerScene(canvas, container) {
    const scene = new THREE.Scene();
    scene.background = null; // transparent — let the page's own background show through

    // The camera never moves — dragging spins the particle group itself (see
    // dragGroup below), not the camera around it. That sidesteps every keystone/
    // lean issue a moving or re-aiming camera caused in earlier attempts, since
    // the tower's geometry is only ever viewed from this one fixed orientation.
    const IDLE_TARGET = new THREE.Vector3(0, 0.5, 0);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(9.5, 7, 11.5);
    camera.lookAt(IDLE_TARGET);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(6, 10, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8899ff, 0.35);
    rimLight.position.set(-8, 3, -6);
    scene.add(rimLight);

    // ---------- Particle field ----------
    // Fewer particles so there's visibly more black between them instead of
    // reading as a packed/stacked cluster. Halved again from the previous round's
    // 2100, since the field now only occupies the right half of the section (see
    // TEXT_ZONE_U below) instead of the full width — same density, less area.
    const PARTICLE_COUNT = 1050;
    const SPECK_BASE_SIZE = 0.095; // 10% smaller than the previous round's 0.106
    // Lower than the old specks' 0.85 — once thousands of points stack into the tower
    // column, high per-point opacity makes overlapping dots fuse into a solid blob
    // instead of reading as individual points.
    const SPECK_BASE_OPACITY = 0.55;
    // A minority of particles render bigger/brighter with additive blending so they
    // stand out as "glow" points among the rest, adding visual hierarchy instead of
    // every point looking identical.
    const GLOW_FRACTION = 0.08;
    const GLOW_SIZE_MULT = 2.07; // +15% over the previous round's 1.8
    const GLOW_OPACITY = 1; // was 0.9 — raised as far as opacity allows toward that same +15%
    // Kept shallow-ish on purpose: with sizeAttenuation on, a very wide depth range
    // would make far particles render much smaller/dimmer than near ones, so moving
    // toward the tower's more central depth would make them suddenly look bigger —
    // reading as new points appearing rather than the same floating ones traveling in.
    const FIELD_RADIUS_Z = 1.3;
    // Safety margin so the field fills the visible frustum without particles clipping
    // right at the edge — pushed as close to 1 as practical now that the box is
    // properly aligned to the camera's own axes (see generateField). A little room is
    // still kept below 1 so a particle's own wiggle amplitude (ampXZ/ampY) doesn't push
    // it just past the true edge on any given frame.
    const FRUSTUM_MARGIN = 0.98;
    // The particle field only occupies the right portion of the section — the left
    // half is the text column (see publicidad-en-medios.html's grid overlay), and
    // no particle should render behind it. u is normalized horizontal position
    // (0 = section center, matching the text column's CSS md:w-1/2 edge; positive
    // = toward the right edge). TEXT_FEATHER_U ramps density up gradually just past
    // that edge instead of a hard wall, so the boundary doesn't read as a seam.
    const TEXT_ZONE_U = 0;
    const TEXT_FEATHER_U = 0.18;
    // Tower's horizontal position, in the same normalized units — 0.5 sits in the
    // middle of the right half, matching where the tower sat back when the canvas
    // itself was only the right half-width column.
    const TOWER_CENTER_U = 0.5;
    // Funnel shape (real funnel icon, not a plain cone): a straight, constant-
    // radius "neck" for the bottom slice of the height, then a cone widening
    // out to the mouth for the rest — instead of tapering all the way to a
    // point at the base.
    const TOWER_NECK_RADIUS = 0.12;
    const TOWER_TOP_RADIUS = 1.4;
    const TOWER_NECK_FRACTION = 0.35; // bottom 35% of the height is the straight neck
    const TOWER_HEIGHT_FACTOR = 0.85; // tower height as a multiple of the field's vertical radius — shorter, more compact funnel

    // Each particle starts converging at a point along the global progress ramp that
    // matches its final height in the tower (lower slots go first). Lower than the
    // previous 0.85 so each individual particle's own travel window is longer and
    // reads as a graceful float-in rather than a fast snap across a wide field,
    // while still keeping a clear base-to-top build-up cascade.
    const STAGGER_SPAN = 0.6;

    function makeDotTexture(hardness = 0.3) {
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
    const dotTexture = makeDotTexture(0.3);

    // Samples a normalized horizontal position u restricted to the right side of
    // the text boundary, with density ramping up over TEXT_FEATHER_U instead of
    // snapping straight to full density right at the edge.
    function sampleTextSafeU() {
        for (let tries = 0; tries < 20; tries++) {
            const u = TEXT_ZONE_U + Math.random() * (FRUSTUM_MARGIN - TEXT_ZONE_U);
            const acceptProb = Math.min(1, (u - TEXT_ZONE_U) / TEXT_FEATHER_U);
            if (Math.random() < acceptProb) return u;
        }
        return TEXT_ZONE_U + TEXT_FEATHER_U; // fallback: safely past the feather zone
    }

    // Glow particles are simply the last slice of the array (see generateField for
    // how `slotOrder` keeps that slice from also being the last slice of tower
    // height/timing, so glow points end up scattered through the whole tower).
    const GLOW_COUNT = Math.round(PARTICLE_COUNT * GLOW_FRACTION);
    const NORMAL_COUNT = PARTICLE_COUNT - GLOW_COUNT;

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const homeX = new Float32Array(PARTICLE_COUNT);
    const homeY = new Float32Array(PARTICLE_COUNT);
    const homeZ = new Float32Array(PARTICLE_COUNT);
    const towerX = new Float32Array(PARTICLE_COUNT);
    const towerY = new Float32Array(PARTICLE_COUNT);
    const towerZ = new Float32Array(PARTICLE_COUNT);
    const freq = new Float32Array(PARTICLE_COUNT);
    const phase = new Float32Array(PARTICLE_COUNT);
    const phase2 = new Float32Array(PARTICLE_COUNT);
    const ampY = new Float32Array(PARTICLE_COUNT);
    const ampXZ = new Float32Array(PARTICLE_COUNT);
    const staggerOffset = new Float32Array(PARTICLE_COUNT);
    const slotOrder = new Uint32Array(PARTICLE_COUNT);

    // Two BufferAttributes over the SAME underlying `positions` array (not two
    // copies) — updateParticles only has to write the array once, and each
    // attribute's `needsUpdate` flag re-uploads its own slice to the GPU.
    const normalGeo = new THREE.BufferGeometry();
    normalGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    normalGeo.setDrawRange(0, NORMAL_COUNT);
    const normalMaterial = new THREE.PointsMaterial({
        size: SPECK_BASE_SIZE,
        map: dotTexture,
        transparent: true,
        depthWrite: false,
        opacity: SPECK_BASE_OPACITY,
        color: 0xffffff,
    });
    // Everything lives inside this group so dragging can spin the whole particle
    // field/tower around its own vertical axis (see the drag handlers below) —
    // the group is positioned at the tower's own location (set in generateField),
    // not the world origin, so it spins in place instead of orbiting some distant
    // point.
    const dragGroup = new THREE.Group();
    scene.add(dragGroup);

    const normalPoints = new THREE.Points(normalGeo, normalMaterial);
    dragGroup.add(normalPoints);

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    glowGeo.setDrawRange(NORMAL_COUNT, GLOW_COUNT);
    const glowMaterial = new THREE.PointsMaterial({
        size: SPECK_BASE_SIZE * GLOW_SIZE_MULT,
        map: dotTexture,
        transparent: true,
        depthWrite: false,
        opacity: GLOW_OPACITY,
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
    });
    const glowPoints = new THREE.Points(glowGeo, glowMaterial);
    dragGroup.add(glowPoints);

    // Reused scratch vectors for generateField — avoids allocating per particle.
    const camRight = new THREE.Vector3();
    const camUpAxis = new THREE.Vector3();
    const camBack = new THREE.Vector3();
    const camForward = new THREE.Vector3();
    const scratchPos = new THREE.Vector3();
    const scratchTowerCenter = new THREE.Vector3();

    // Regenerates the field to fill whatever frustum the current container/camera
    // aspect produces — same idea as resize(), but for the particle layout itself
    // rather than the renderer, so the cloud actually uses the available space
    // instead of a fixed guessed size.
    //
    // The box is built in the CAMERA's own right/up/forward directions, not world
    // X/Y/Z: this camera sits off at an angle (9.5, 7, 11.5) looking at the target,
    // so "screen-right" and "screen-depth" are each a mix of world X and Z — a box
    // built straight from world axes projects as a skewed, partly-clipped shape
    // instead of a clean rectangle filling the view.
    function generateField(width, height) {
        const aspect = width / Math.max(height, 1);
        camera.updateMatrixWorld(true);
        camera.matrixWorld.extractBasis(camRight, camUpAxis, camBack);
        camForward.copy(camBack).negate();

        const camDist = camera.position.distanceTo(IDLE_TARGET);
        const vHalf = camDist * Math.tan((camera.fov * Math.PI) / 360);
        const hHalf = vHalf * aspect;
        const fieldRadiusY = vHalf * FRUSTUM_MARGIN;
        const towerHeight = fieldRadiusY * TOWER_HEIGHT_FACTOR;
        // Anchored to the camera's own up/right/forward, not world Y/X/Z: this
        // camera is pitched (looking down at the target from above), so a column
        // built from plain world-Y height + world-XZ jitter leans once it's off to
        // the side (screen-space keystone/perspective distortion) — building it
        // from the camera's own basis instead keeps it perfectly upright on screen
        // regardless of how far right it sits.
        scratchTowerCenter.copy(IDLE_TARGET).addScaledVector(camRight, TOWER_CENTER_U * hHalf);
        // Group pivots at the tower's own X/Z (world Y untouched — everything below
        // is stored relative to this point) so drag-rotating spins the tower and
        // field around the tower's own axis instead of the world origin.
        dragGroup.position.set(scratchTowerCenter.x, 0, scratchTowerCenter.z);

        // Shuffled independently of array order so the glow particles (a fixed
        // trailing slice of the array, for drawRange) land at random heights and
        // random stagger timings in the tower, instead of all ending up together
        // at the top / arriving last.
        for (let i = 0; i < PARTICLE_COUNT; i++) slotOrder[i] = i;
        for (let i = PARTICLE_COUNT - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = slotOrder[i];
            slotOrder[i] = slotOrder[j];
            slotOrder[j] = tmp;
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ox = sampleTextSafeU() * hHalf;
            const oy = (Math.random() * 2 - 1) * fieldRadiusY;
            const oz = (Math.random() * 2 - 1) * FIELD_RADIUS_Z;
            scratchPos
                .copy(IDLE_TARGET)
                .addScaledVector(camRight, ox)
                .addScaledVector(camUpAxis, oy)
                .addScaledVector(camForward, oz);
            homeX[i] = scratchPos.x - dragGroup.position.x;
            homeY[i] = scratchPos.y;
            homeZ[i] = scratchPos.z - dragGroup.position.z;

            const angle = Math.random() * Math.PI * 2;
            const slot = slotOrder[i];
            const heightFrac = slot / PARTICLE_COUNT; // 0 at the base, 1 at the mouth
            const coneFrac = Math.max(0, (heightFrac - TOWER_NECK_FRACTION) / (1 - TOWER_NECK_FRACTION));
            const columnRadius = TOWER_NECK_RADIUS + (TOWER_TOP_RADIUS - TOWER_NECK_RADIUS) * coneFrac;
            const r = Math.sqrt(Math.random()) * columnRadius;
            const heightOffset = -towerHeight / 2 + heightFrac * towerHeight;
            scratchPos
                .copy(scratchTowerCenter)
                .addScaledVector(camUpAxis, heightOffset)
                .addScaledVector(camRight, Math.cos(angle) * r)
                .addScaledVector(camForward, Math.sin(angle) * r);
            towerX[i] = scratchPos.x - dragGroup.position.x;
            towerY[i] = scratchPos.y;
            towerZ[i] = scratchPos.z - dragGroup.position.z;

            freq[i] = 0.15 + Math.random() * 0.25;
            phase[i] = Math.random() * Math.PI * 2;
            phase2[i] = Math.random() * Math.PI * 2;
            ampY[i] = 0.12 + Math.random() * 0.18;
            ampXZ[i] = 0.05 + Math.random() * 0.08;
            staggerOffset[i] = (slot / PARTICLE_COUNT) * STAGGER_SPAN;

            positions[i * 3] = homeX[i];
            positions[i * 3 + 1] = homeY[i];
            positions[i * 3 + 2] = homeZ[i];
        }
        normalGeo.attributes.position.needsUpdate = true;
        glowGeo.attributes.position.needsUpdate = true;
    }

    // ---------- Hover → converge into a tower, leave → dissolve immediately ----------
    // The container itself spans the full section width (see publicidad-en-medios.html),
    // but the particles only live in its right half (past TEXT_ZONE_U). The
    // interaction should track THAT zone, not the whole container — otherwise
    // hovering the empty text-side area would still count as "still hovering".
    const PARTICLE_ZONE_FRACTION = 0.5; // matches TEXT_ZONE_U = 0
    const state = { progress: 0 };
    let insideParticleZone = false;

    function startConverge() {
        gsap.killTweensOf(state);
        // In case this interrupts a dissolve's rotation reset still in progress.
        gsap.killTweensOf(dragGroup.rotation);
        // Slow and fluid — long enough that the stagger above reads as the tower
        // visibly stacking up from its base, not an instant snap.
        gsap.to(state, { progress: 1, duration: 3.8, ease: 'sine.inOut' });
    }

    function startDissolve() {
        gsap.killTweensOf(state);
        // No hold — dissolves back to the floating field as soon as the mouse
        // leaves the particle zone, but just as slow/smooth as assembling.
        gsap.to(state, { progress: 0, duration: 3.3, ease: 'sine.inOut' });

        // Whatever the user rotated it to, the floating field always settles back
        // facing the same way it started.
        gsap.killTweensOf(dragGroup.rotation);
        gsap.to(dragGroup.rotation, { y: 0, duration: 3.3, ease: 'sine.inOut' });
    }

    // ---------- Drag to spin the tower in place ----------
    // A plain manual drag instead of OrbitControls: it rotates the particle GROUP
    // (see dragGroup above), never the camera, so there's no camera re-aiming to
    // desync from the tower's fixed geometry. 1:1 with the pointer — no inertia —
    // so the rotation always tracks exactly where the mouse drags it.
    const ROTATE_SPEED = 0.008; // radians per pixel of horizontal drag
    let isDragging = false;
    let dragLastX = 0;

    const onDragPointerDown = (e) => {
        isDragging = true;
        dragLastX = e.clientX;
    };
    const onDragPointerMove = (e) => {
        if (!isDragging) return;
        dragGroup.rotation.y += (e.clientX - dragLastX) * ROTATE_SPEED;
        dragLastX = e.clientX;
    };
    const onDragPointerUp = () => {
        isDragging = false;
    };
    container.addEventListener('pointerdown', onDragPointerDown);
    window.addEventListener('pointermove', onDragPointerMove);
    window.addEventListener('pointerup', onDragPointerUp);

    const onPointerMove = (e) => {
        const rect = container.getBoundingClientRect();
        const fracX = (e.clientX - rect.left) / rect.width;
        const nowInside = fracX >= PARTICLE_ZONE_FRACTION;
        if (nowInside && !insideParticleZone) {
            insideParticleZone = true;
            startConverge();
        } else if (!nowInside && insideParticleZone) {
            insideParticleZone = false;
            startDissolve();
        }
    };
    const onPointerLeaveContainer = () => {
        // Safety net for exiting the container directly through an edge (top/
        // bottom/right) without the pointermove handler ever seeing fracX drop
        // back below the boundary first.
        if (insideParticleZone) {
            insideParticleZone = false;
            startDissolve();
        }
    };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeaveContainer);

    // ---------- Bloom post-processing ----------
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.3, 0.86);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function resize() {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
        generateField(width, height);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function updateParticles(time) {
        const progress = state.progress;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const idx = i * 3;
            const fx = homeX[i] + Math.sin(time * freq[i] + phase2[i]) * ampXZ[i];
            const fy = homeY[i] + Math.sin(time * freq[i] + phase[i]) * ampY[i];
            const fz = homeZ[i] + Math.cos(time * freq[i] * 0.8 + phase2[i]) * ampXZ[i];

            let local = (progress - staggerOffset[i]) / (1 - STAGGER_SPAN);
            local = local < 0 ? 0 : local > 1 ? 1 : local;
            const eased = local * local * (3 - 2 * local); // smoothstep

            positions[idx] = fx + (towerX[i] - fx) * eased;
            positions[idx + 1] = fy + (towerY[i] - fy) * eased;
            positions[idx + 2] = fz + (towerZ[i] - fz) * eased;
        }
        normalGeo.attributes.position.needsUpdate = true;
        glowGeo.attributes.position.needsUpdate = true;
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
        updateParticles(elapsedTime);
        composer.render();
    }
    animate();

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        gsap.killTweensOf(state);
        gsap.killTweensOf(dragGroup.rotation);
        resizeObserver.disconnect();
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerleave', onPointerLeaveContainer);
        container.removeEventListener('pointerdown', onDragPointerDown);
        window.removeEventListener('pointermove', onDragPointerMove);
        window.removeEventListener('pointerup', onDragPointerUp);
        normalGeo.dispose();
        normalMaterial.dispose();
        glowGeo.dispose();
        glowMaterial.dispose();
        dotTexture.dispose();
        composer.dispose();
        renderer.dispose();
    }

    return { dispose, resize };
}
