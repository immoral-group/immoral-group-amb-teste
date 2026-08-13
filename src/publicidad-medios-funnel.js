import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Procedural wireframe / point-cloud marketing-funnel: audience icons above a
// tapering stack of funnel rings, built only from LineSegments/LineLoop/Points
// — no solid meshes anywhere. Mounted in its own half-width column in
// publicidad-en-medios.html (see #publi-medios-funnel), mirroring the init/dispose
// lifecycle every other init*() scene in this codebase uses (see particle-tower-scene.js).

// ---------------------------------------------------------------------------
// TUNABLES — the knobs called out in the spec (size, position, particle density,
// opacity, animation speed). Everything else below reads from these.
// ---------------------------------------------------------------------------

// Camera / framing
const CAMERA_FOV = 38;
// Direction the camera sits at relative to whatever it's looking at (normalized
// below). Mostly front-on (dominant Z) with only a small downward-look tilt
// (small Y) and a touch of side offset (small X) — matches the reference's
// near-frontal look, just enough elevation for the rings to read as shallow
// ellipses instead of edge-on lines or full face-on circles.
const CAMERA_DIR = new THREE.Vector3(0.4, 0.3, 1).normalize();
const TARGET_HEIGHT_FRACTION = 0.76; // object should occupy ~70-80% of visible height
const MIN_CAMERA_DISTANCE = 6;

// Fake-lighting vertex-color gradient — a volume cue for the icons' flat
// accent outlines (circles/heart/bubble): each vertex is tinted from bright
// white down toward black based on which way it faces, instead of one flat
// opacity for the whole shape. On this black background, dark = effectively
// transparent, so this reads as "faded to transparent" without needing real
// per-vertex alpha (LineBasicMaterial only supports per-vertex RGB, not
// per-vertex opacity, without a custom shader). Not used on the funnel rings —
// those stay at full, uniform opacity all the way around as they rotate.
const ICON_LIGHT_DIR = new THREE.Vector2(-0.45, 0.6).normalize(); // fixed upper-left "light" for flat icon shapes (local XY-plane)
const GRADIENT_MIN_BRIGHTNESS = 0.12;
const GRADIENT_FALLOFF_POWER = 1;

// Colors — monochrome, slightly cool white. Swap these three to retint everything.
const COLOR_PRIMARY = 0xffffff;
const COLOR_SECONDARY = 0xaeb8c2;
const COLOR_GLOW = 0xd9e1e8;

// Real shaded solid geometry (icons, funnel rings) — actual volume via real
// lit surfaces instead of faking it with lines/points, per the request that
// these read as objects, not line traces. Kept as its own grayscale material
// (moderate opacity, not fully opaque) so the point cloud/wireframe accents
// layered on top of each shape still show through.
const SOLID_COLOR = 0xc4cad2;
const SOLID_OPACITY = 0.62;
const SOLID_ROUGHNESS = 0.55;
const SOLID_METALNESS = 0.15;
const ICON_EXTRUDE_DEPTH = 0.06; // real depth for the heart/message solids

// Opacity bands (spec: primary lines visible, secondary near-invisible, points vary)
const OPACITY_LINE_PRIMARY = 0.65;
const OPACITY_LINE_SECONDARY = 0.32; // was 0.16 — too faint to read as real depth/volume cues
const OPACITY_POINT_DIM = 0.7; // was 0.5 — bumped alongside the much higher particle count below
const OPACITY_POINT_BRIGHT = 0.95;

// Point sizes
const POINT_SIZE_DIM = 0.034;
const POINT_SIZE_BRIGHT = 0.065;

// Animation speed (radians/sec-ish, all intentionally tiny — "apenas se perciba")
const ROTATE_SPEED = 0.028; // whole-system idle spin
const ICON_BOB_SPEED = 0.5;
const ICON_BOB_AMOUNT = 0.05;
const RING_DIFFERENTIAL_SPEED = 0.05; // extra per-level rotation on top of ROTATE_SPEED
const GLOW_PULSE_SPEED = 0.8;

// Vertical layout (world units, Y up). Edit these to restack the icons/funnel.
// Compact on purpose: the 4 rings are close enough to read as one continuous
// funnel silhouette — a tall, airy layout looks sparse/unreadable once the
// auto-fit camera (see fitCameraToObject below) zooms out to fit it all in.
const ICONS_Y = 1.55;
const FUNNEL_TOP_Y = 0.55;
const FUNNEL_GAP = 0.42; // vertical spacing between the 4 funnel rings — tight, near-touching

function makeDotTexture(hardness = 0.35) {
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

export function createMarketingFunnelScene(canvas, container) {
    const dotTexture = makeDotTexture();

    const lineMatPrimary = () =>
        new THREE.LineBasicMaterial({ color: COLOR_PRIMARY, transparent: true, opacity: OPACITY_LINE_PRIMARY });
    const lineMatSecondary = () =>
        new THREE.LineBasicMaterial({ color: COLOR_SECONDARY, transparent: true, opacity: OPACITY_LINE_SECONDARY });
    const pointMatDim = () =>
        new THREE.PointsMaterial({
            color: COLOR_SECONDARY,
            map: dotTexture,
            size: POINT_SIZE_DIM,
            transparent: true,
            opacity: OPACITY_POINT_DIM,
            depthWrite: false,
            sizeAttenuation: true,
        });
    const pointMatBright = () =>
        new THREE.PointsMaterial({
            color: COLOR_GLOW,
            map: dotTexture,
            size: POINT_SIZE_BRIGHT,
            transparent: true,
            opacity: OPACITY_POINT_BRIGHT,
            depthWrite: false,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
        });
    const solidMat = () =>
        new THREE.MeshStandardMaterial({
            color: SOLID_COLOR,
            roughness: SOLID_ROUGHNESS,
            metalness: SOLID_METALNESS,
            transparent: true,
            opacity: SOLID_OPACITY,
        });

    // vertexColors:true material for the fake-lighting gradient (see
    // GRADIENT_MIN_BRIGHTNESS above) — only used with geometry that actually
    // carries a 'color' attribute (see the gradient-color helpers below).
    const lineMatGradient = () =>
        new THREE.LineBasicMaterial({ color: COLOR_PRIMARY, transparent: true, opacity: OPACITY_LINE_PRIMARY, vertexColors: true });

    // Brightness for a point based on which way it faces relative to `lightDir`
    // (a 2D direction in whatever plane the shape lives in) — 1 facing the
    // "light", GRADIENT_MIN_BRIGHTNESS facing away. The power curve pushes more
    // of the falloff toward the dark end, so the bright side reads as a clear
    // highlight instead of a wide, subtle half-and-half fade.
    function gradientBrightness(nx, ny, lightDir) {
        const len = Math.hypot(nx, ny) || 1;
        const dot = (nx / len) * lightDir.x + (ny / len) * lightDir.y;
        const t = Math.pow(Math.max(0, dot * 0.5 + 0.5), GRADIENT_FALLOFF_POWER);
        return GRADIENT_MIN_BRIGHTNESS + (1 - GRADIENT_MIN_BRIGHTNESS) * t;
    }

    // Builds the 'color' BufferAttribute a gradient material needs. `axisFn`
    // picks which 2 coordinates of each point represent the shape's own local
    // "facing" plane (XZ for the flat-lying funnel rings, XY for the
    // flat-facing icons).
    function setGradientColors(geometry, points, lightDir, axisFn) {
        const colors = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
            const [nx, ny] = axisFn(p);
            const b = gradientBrightness(nx, ny, lightDir);
            colors[i * 3] = b;
            colors[i * 3 + 1] = b;
            colors[i * 3 + 2] = b;
        });
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    const XY_AXES = (p) => [p.x, p.y];

    function gradientLineLoop(points, lightDir, axisFn, closed = true) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        setGradientColors(geo, points, lightDir, axisFn);
        const LineType = closed ? THREE.LineLoop : THREE.Line;
        return new LineType(geo, lineMatGradient());
    }

    function pointsFromArray(points, material) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Points(geo, material);
    }


    // Gives a flat outline real volume without THREE.ExtrudeGeometry: adds a
    // second copy of the same outline offset by `depthOffset`, plus a handful
    // of straight struts connecting corresponding points on the two copies —
    // reads as a thin 3D shell/slab instead of a flat decal. (Extrude + a
    // rounded feature fans out into dozens of facet edges — see the funnel
    // ring/puzzle history above — so this stays deliberately strut-based.)
    const ICON_DEPTH = new THREE.Vector3(0, 0, -0.14); // was -0.05 — too shallow to read as real thickness
    function addDepthShell(group, frontPoints, strutCount = 5, closed = true) {
        const backPoints = frontPoints.map((p) => p.clone().add(ICON_DEPTH));
        const BackLine = closed ? THREE.LineLoop : THREE.Line;
        group.add(new BackLine(new THREE.BufferGeometry().setFromPoints(backPoints), lineMatSecondary()));
        const n = frontPoints.length;
        for (let i = 0; i < strutCount; i++) {
            const idx = Math.floor((i / strutCount) * n);
            group.add(
                new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([frontPoints[idx], backPoints[idx]]),
                    lineMatSecondary()
                )
            );
        }
    }

    // Scatters `count` points sampled evenly-ish along a closed/open polyline (used
    // to sprinkle particles over icon outlines, per the spec's "puntos distribuidos
    // sobre su geometría").
    function scatterAlongPath(points, count) {
        const out = [];
        for (let i = 0; i < count; i++) {
            const t = (i / count) * (points.length - 1);
            const i0 = Math.floor(t);
            const i1 = Math.min(i0 + 1, points.length - 1);
            const f = t - i0;
            out.push(new THREE.Vector3().lerpVectors(points[i0], points[i1], f));
        }
        return out;
    }

    // ---------------------------------------------------------------------
    // Root group — everything lives under here so idle rotation spins the
    // whole composition as one rigid system.
    // ---------------------------------------------------------------------
    const funnelSystem = new THREE.Group();
    funnelSystem.name = 'funnelSystem';

    // =======================================================================
    // 1. AUDIENCE ICONS — six small wireframe glyphs, irregular heights/depths.
    // =======================================================================
    const audienceIcons = new THREE.Group();
    audienceIcons.name = 'audienceIcons';
    funnelSystem.add(audienceIcons);

    function circlePoints(radius, segments, cx = 0, cy = 0) {
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0));
        }
        return pts;
    }

    function arcPoints(radius, startAngle, endAngle, segments, cx = 0, cy = 0) {
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const a = startAngle + (i / segments) * (endAngle - startAngle);
            pts.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0));
        }
        return pts;
    }

    // A single "person": a real solid sphere for the head (not a flat circle
    // outline) plus an arc of shoulders below it.
    function createUserGlyph(scale) {
        const group = new THREE.Group();
        const headR = 0.075 * scale;
        const headCy = headR * 1.7;

        const headMesh = new THREE.Mesh(new THREE.SphereGeometry(headR, 16, 12), solidMat());
        headMesh.position.set(0, headCy, 0);
        group.add(headMesh);
        // Thin equatorial accent line — the sphere itself carries the shape now.
        const head = circlePoints(headR, 16, 0, headCy);
        group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(head), lineMatSecondary()));

        const shoulderR = 0.13 * scale;
        const shoulderCy = -headR * 0.15;
        const shoulders = arcPoints(shoulderR, Math.PI * 0.12, Math.PI * 0.88, 14, 0, shoulderCy);
        const shoulderLine = gradientLineLoop(shoulders, ICON_LIGHT_DIR, (p) => [p.x, p.y - shoulderCy], false);
        group.add(shoulderLine);
        addDepthShell(group, shoulders, 6, false);

        const scatter = scatterAlongPath([...head, ...shoulders], 35);
        group.add(pointsFromArray(scatter, pointMatDim()));
        return group;
    }

    // Solid heart via the classic parametric heart curve, extruded into real depth.
    function createHeartGlyph(scale) {
        const group = new THREE.Group();
        const s = 0.0085 * scale;
        const pts = [];
        const segments = 40;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            pts.push(new THREE.Vector3(x * s, y * s, 0));
        }

        const heartShape = new THREE.Shape();
        pts.forEach((p, i) => (i === 0 ? heartShape.moveTo(p.x, p.y) : heartShape.lineTo(p.x, p.y)));
        const heartMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false }), solidMat());
        heartMesh.position.z = -ICON_EXTRUDE_DEPTH / 2;
        group.add(heartMesh);

        const line = gradientLineLoop(pts, ICON_LIGHT_DIR, XY_AXES);
        group.add(line);
        group.add(pointsFromArray(scatterAlongPath(pts, 30), pointMatDim()));
        return group;
    }

    // Rounded rectangular bubble with 3 interior dots ("message" icon).
    function createMessageGlyph(scale) {
        const group = new THREE.Group();
        const w = 0.26 * scale;
        const h = 0.18 * scale;
        const r = 0.045 * scale;
        const shape = new THREE.Shape();
        shape.moveTo(-w / 2 + r, -h / 2);
        shape.lineTo(w / 2 - r, -h / 2);
        shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
        shape.lineTo(w / 2, h / 2 - r);
        shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
        shape.lineTo(-w / 2 + r, h / 2);
        shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
        shape.lineTo(-w / 2, -h / 2 + r);
        shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
        const bubbleMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false }), solidMat());
        bubbleMesh.position.z = -ICON_EXTRUDE_DEPTH / 2;
        group.add(bubbleMesh);

        const outline = shape.getPoints(6);
        outline.push(outline[0]);
        const line = gradientLineLoop(outline, ICON_LIGHT_DIR, XY_AXES);
        group.add(line);

        const dots = [
            new THREE.Vector3(-w * 0.22, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(w * 0.22, 0, 0),
        ];
        group.add(pointsFromArray(dots, pointMatBright()));
        group.add(pointsFromArray(scatterAlongPath(outline, 25), pointMatDim()));
        return group;
    }

    // "Audience" — a loose cluster of small bare circles (no shoulders), reading as
    // a crowd rather than one individual.
    function createAudienceGlyph(scale) {
        const group = new THREE.Group();
        const offsets = [
            [0, 0, 0],
            [0.11 * scale, 0.05 * scale, -0.04 * scale],
            [-0.1 * scale, 0.03 * scale, 0.05 * scale],
        ];
        const allPts = [];
        const sphereR = 0.06 * scale;
        offsets.forEach(([ox, oy, oz]) => {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(sphereR, 12, 10), solidMat());
            sphere.position.set(ox, oy, oz);
            group.add(sphere);
            const pts = circlePoints(sphereR, 14, ox, oy).map((p) => new THREE.Vector3(p.x, p.y, oz));
            group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMatSecondary()));
            allPts.push(...pts);
        });
        group.add(pointsFromArray(scatterAlongPath(allPts, 20), pointMatDim()));
        return group;
    }

    // Irregular layout: different x/y/z per icon so nothing lines up on a grid —
    // edit this array to reposition or rescale any single icon.
    const ICON_LAYOUT = [
        { build: createUserGlyph, x: -0.68, y: 0.22, z: 0.1, scale: 1.15, phase: 0.0 },
        { build: createUserGlyph, x: 0.1, y: 0.32, z: -0.25, scale: 0.95, phase: 1.4 },
        { build: createUserGlyph, x: 0.62, y: 0.02, z: 0.2, scale: 1.05, phase: 2.6 },
        { build: createHeartGlyph, x: -0.32, y: -0.12, z: 0.28, scale: 1.0, phase: 0.8 },
        { build: createMessageGlyph, x: 0.35, y: -0.22, z: -0.15, scale: 1.0, phase: 3.6 },
        { build: createAudienceGlyph, x: -0.02, y: 0.42, z: 0.35, scale: 1.2, phase: 2.0 },
    ];

    const iconGroups = ICON_LAYOUT.map((cfg) => {
        const glyph = cfg.build(cfg.scale);
        glyph.name = 'icon';
        glyph.position.set(cfg.x, ICONS_Y + cfg.y, cfg.z);
        glyph.userData.baseY = glyph.position.y;
        glyph.userData.phase = cfg.phase;
        audienceIcons.add(glyph);
        return glyph;
    });

    // (No target group: the concentric circles kept foreshortening into an
    // overlapping diagonal spiral under this scene's near-frontal camera, no
    // matter the tilt — removed rather than keep guessing at angles blind.)

    // =======================================================================
    // 3. FUNNEL — 4 rings, radius shrinking top to bottom, lying flat (hole
    //    facing the vertical Y axis, like a real stacked funnel) instead of
    //    standing up facing the camera.
    //
    //    Built from a HANDFUL of explicit circles instead of
    //    THREE.WireframeGeometry(TorusGeometry): a full torus wireframe exposes
    //    every quad of its radial x tubular grid, which reads as a dense hairy
    //    "coiled hose" once radial/tubular segments are non-trivial. 4 contour
    //    circles (outer/inner/top/bottom of the tube) plus a few small diamond
    //    cross-sections give the same "see-through torus" volume with an order
    //    of magnitude fewer vertices, and no facet clutter.
    // =======================================================================
    const funnel = new THREE.Group();
    funnel.name = 'funnel';
    funnelSystem.add(funnel);

    // radius = ring radius, tube = ring thickness (bumped up from the previous
    // 0.04-0.07 range — a thin tube reads as a flat line no matter how many
    // contour circles trace it; a chunkier tube is what makes the roundness
    // actually visible).
    // particleCount bumped ~5x — matches the density of the site's other
    // particle hero (hex-cubes-scene.js uses 700 points per cube).
    const FUNNEL_LEVELS = [
        { radius: 1.3, tube: 0.11, particleCount: 1300 },
        { radius: 1.05, tube: 0.097, particleCount: 1100 },
        { radius: 0.8, tube: 0.086, particleCount: 900 },
        { radius: 0.55, tube: 0.075, particleCount: 650 },
    ];

    // A point on the ring's own tube surface at contour angle u (around the
    // funnel's Y axis) and cross-section angle v (around the tube) — ring lies
    // flat in XZ, Y is the tube-thickness direction.
    function ringSurfacePoint(radius, tube, u, v) {
        const rad = radius + tube * Math.cos(v);
        return new THREE.Vector3(rad * Math.cos(u), tube * Math.sin(v), rad * Math.sin(u));
    }

    function ringContourPoints(radius, yOffset = 0, segments = 64) {
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const u = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(u) * radius, yOffset, Math.sin(u) * radius));
        }
        return pts;
    }

    const funnelLevels = FUNNEL_LEVELS.map((cfg, i) => {
        const level = new THREE.Group();
        level.name = `funnelLevel0${i + 1}`;
        level.position.y = FUNNEL_TOP_Y - i * FUNNEL_GAP;

        // Line-only on purpose: the funnel rings stay wireframe (per the user's
        // call) — solid geometry is reserved for the icons floating above.

        // Outer + inner contour — the rim, at the widest/narrowest of the tube.
        // Full, uniform opacity on purpose (no facing-based gradient here, and
        // fog disabled below): the ring should stay fully visible all the way
        // around as it rotates, not dim on the side swinging away from camera.
        // (Also tried adding top/bottom mid-radius contours here, at the same
        // radius as the ring's own centerline — from this near-frontal camera
        // they read as a stray line cutting across the middle of each ring
        // rather than hinting volume, so dropped.)
        const ringLineA = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius + cfg.tube, 0)), lineMatPrimary());
        const ringLineB = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius - cfg.tube, 0)), lineMatPrimary());
        ringLineA.material.fog = false;
        ringLineB.material.fog = false;
        level.add(ringLineA, ringLineB);

        // (No diamond rib cross-sections: at a few angles they stood out as an
        // odd stray rhombus among the contour lines instead of reading as
        // roundness — the point cloud on the tube surface already implies it.)

        // Point cloud sampled directly on the ring's tube surface.
        const glowCount = Math.round(cfg.particleCount * 0.12);
        const dimCount = cfg.particleCount - glowCount;
        const surfacePoint = () =>
            ringSurfacePoint(cfg.radius, cfg.tube, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
        const dimPts = Array.from({ length: dimCount }, surfacePoint);
        const glowPts = Array.from({ length: glowCount }, surfacePoint);
        // Full opacity, fog disabled — same reasoning as the contours above.
        const dimPoints = pointsFromArray(dimPts, pointMatDim());
        dimPoints.material.fog = false;
        level.add(dimPoints);
        const glowPoints = pointsFromArray(glowPts, pointMatBright());
        glowPoints.material.fog = false;
        glowPoints.name = 'glow';
        level.add(glowPoints);

        level.userData.spinSpeed = (i % 2 === 0 ? 1 : -1) * RING_DIFFERENTIAL_SPEED * (1 + i * 0.15);
        funnel.add(level);
        return level;
    });

    // (No inter-ring connector scaffolding: at this near-frontal camera angle
    // those thin diagonal lines read as stray clutter crossing other parts of
    // the composition instead of a subtle structural hint.)

    // (No puzzle-result group.)

    // ---------------------------------------------------------------------
    // Scene / camera / renderer
    // ---------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = null;
    scene.add(funnelSystem);

    // Lights for the solid meshes below (icons/rings) — grayscale to match the
    // monochrome palette, same idea as the site's other 3D piece
    // (hex-cubes-scene.js): ambient fill + a key light + a soft rim light.
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const boundingBox = new THREE.Box3().setFromObject(funnelSystem);
    const boxCenter = boundingBox.getCenter(new THREE.Vector3());
    const boxSize = boundingBox.getSize(new THREE.Vector3());
    const objectSpan = Math.max(boxSize.x, boxSize.y, boxSize.z);

    // Depth cueing instead of solid/translucent fills: geometry near the
    // camera stays crisp, geometry further back fades toward the page's own
    // black — real perceived depth across the object's own thickness, without
    // adding any filled surface. Distances get set for real once the camera's
    // distance is known (see fitCameraToObject).
    scene.fog = new THREE.Fog(0x000000, 1, 100);

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.4, 0.45);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    // Frames the whole object at TARGET_HEIGHT_FRACTION of the visible height (and
    // never lets it clip horizontally) by sliding the camera along the fixed
    // CAMERA_DIR — keeps the same 3/4 elevated angle at any container aspect ratio,
    // so this doesn't need special-casing for tablet vs. desktop.
    function fitCameraToObject(width, height) {
        const aspect = width / Math.max(height, 1);
        camera.aspect = aspect;
        const vFov = (camera.fov * Math.PI) / 180;
        const distForHeight = boxSize.y / TARGET_HEIGHT_FRACTION / (2 * Math.tan(vFov / 2));
        const distForWidth = boxSize.x / TARGET_HEIGHT_FRACTION / (2 * Math.tan(vFov / 2) * aspect);
        const dist = Math.max(distForHeight, distForWidth, MIN_CAMERA_DISTANCE);
        camera.position.copy(boxCenter).addScaledVector(CAMERA_DIR, dist);
        camera.lookAt(boxCenter);
        camera.updateProjectionMatrix();

        // Fade zone spans well past the object's own depth either side of its
        // center — was 0.9x (same as the object's own size), which faded the
        // back half of each ring noticeably as it rotated into view. Widening
        // it keeps that far side considerably more opaque while still fading
        // things well outside the object's own bounds.
        scene.fog.near = Math.max(0.1, dist - objectSpan * 2.2);
        scene.fog.far = dist + objectSpan * 2.2;
    }

    function resize() {
        const width = container.clientWidth || 1;
        const height = container.clientHeight || 1;
        renderer.setSize(width, height, false);
        composer.setSize(width, height);
        fitCameraToObject(width, height);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // ---------------------------------------------------------------------
    // Idle animation — everything here is intentionally tiny ("apenas se perciba").
    // ---------------------------------------------------------------------
    let elapsed = 0;
    let lastTime = performance.now();
    let rafId = null;

    function animate() {
        rafId = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        elapsed += dt;

        funnelSystem.rotation.y += ROTATE_SPEED * dt;

        iconGroups.forEach((g) => {
            g.position.y = g.userData.baseY + Math.sin(elapsed * ICON_BOB_SPEED + g.userData.phase) * ICON_BOB_AMOUNT;
        });

        funnelLevels.forEach((level) => {
            level.rotation.y += level.userData.spinSpeed * dt;
            const glow = level.getObjectByName('glow');
            if (glow) glow.material.opacity = OPACITY_POINT_BRIGHT * (0.75 + 0.25 * Math.sin(elapsed * GLOW_PULSE_SPEED));
        });

        composer.render();
    }
    animate();

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                else obj.material.dispose();
            }
        });
        dotTexture.dispose();
        composer.dispose();
        renderer.dispose();
    }

    return { dispose, resize, scene, camera, funnelSystem };
}

// ---------------------------------------------------------------------------
// Page wrapper — owns the container/canvas lifecycle (matches every other
// init*() scene in main.js: dispose the previous instance, wait for the
// container to have real dimensions, then build).
// ---------------------------------------------------------------------------
let sceneHandle = null;
let funnelCanvas = null;

export function initPublicidadMediosFunnel() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }
    if (funnelCanvas) {
        funnelCanvas.remove();
        funnelCanvas = null;
    }

    const container = document.getElementById('publi-medios-funnel');
    if (!container) return;

    container.innerHTML = '';

    async function start() {
        const currentContainer = document.getElementById('publi-medios-funnel');
        if (!currentContainer) return;

        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }
        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Publicidad Medios Funnel: Container has no dimensions after waiting.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        currentContainer.appendChild(canvas);
        funnelCanvas = canvas;

        sceneHandle = createMarketingFunnelScene(canvas, currentContainer);
    }

    start();
}
