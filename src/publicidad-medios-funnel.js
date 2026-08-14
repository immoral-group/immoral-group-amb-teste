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
// CAMERA_DIR flattened onto the ring's own horizontal (XZ) plane — the
// "which way is the camera" direction used to fade the ring's glow accents to
// only their camera-facing half (see updateFrontFacingColors in animate()).
const CAMERA_XZ = new THREE.Vector2(CAMERA_DIR.x, CAMERA_DIR.z).normalize();
const TARGET_HEIGHT_FRACTION = 0.76; // object should occupy ~70-80% of visible height
const MIN_CAMERA_DISTANCE = 6;

// Bloom — this scene owns its own EffectComposer, so these only affect the
// funnel. Was (0.55, 0.4, 0.45): low threshold + wide radius meant almost
// every white line/point on the black background crossed the bloom threshold,
// and dense areas (many overlapping point sprites where the ring curves away
// from camera) stacked up even brighter — the whole ring, lines included,
// read as soft/blurred rather than crisp. Threshold is lower again here (0.62)
// specifically to give the ring a visible glow/"resplandor" — it now reliably
// catches the ring's own bright accents (see RING_GLOW_* below and the
// re-enabled additive glow points) while the far more numerous, darker-shaded
// dim points (topping out around ~0.5 luminance, see RING_GRADIENT_MIN_BRIGHTNESS)
// stay under it and read crisp. Radius stays tight so the glow stays a
// contained halo around those bright accents instead of spreading into a blur.
const BLOOM_STRENGTH = 0.35; // was 0.5 — down 30% per request to tone down the glow overall
const BLOOM_RADIUS = 0.15;
const BLOOM_THRESHOLD = 0.62;

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

// Same fake-lighting trick, now also applied to the funnel rings themselves
// (their rib cross-sections and point cloud, both in the tube's own local
// radial/vertical plane): the ring previously stayed one flat, uniform
// brightness all the way around, which is exactly why it read as a flat disc
// instead of a round 3D tube. Lighting the top of the tube brighter than the
// bottom gives it real shaded roundness, like the icons already have.
const RING_LIGHT_DIR = new THREE.Vector2(-0.3, 0.85).normalize();
const RING_GRADIENT_MIN_BRIGHTNESS = 0.35; // higher floor than the icons' — the ring should never go near-invisible, just shaded

// Colors — monochrome, slightly cool white. Swap these three to retint everything.
const COLOR_PRIMARY = 0xffffff;
const COLOR_SECONDARY = 0xaeb8c2;
const COLOR_GLOW = 0xd9e1e8;

// Real shaded solid geometry — currently only the badge backdrop (see
// buildBadge) uses this. Opacity dropped way down (was 0.62, then 0.18, then
// 0.09, then 0.07, now 20% lower again) per request: the badge should read
// almost entirely as its white line rim/glow border (see gradientLineLoop +
// badgeGlowMat in buildBadge), with the fill behind it nearly invisible.
const SOLID_COLOR = 0xc4cad2;
const SOLID_OPACITY = 0.056;
const SOLID_ROUGHNESS = 0.55;
const SOLID_METALNESS = 0.15;
const ICON_EXTRUDE_DEPTH = 0.06; // real depth for the heart/message solids

// Inner symbol fill (person/heart/message glyphs themselves, not their badge
// backdrop) — unlit flat white (MeshBasicMaterial, fog disabled) so it always
// reads as solid white regardless of scene lighting/distance, matching the
// reference image's icons: solid white shapes inside a glassy frame.
const SYMBOL_COLOR = 0xffffff;
const SYMBOL_OPACITY = 0.97;

// Badge backdrop for the floating icons — a thick rounded disc/plaque (circle
// for the "person" glyphs, rounded square for heart/message) that the actual
// symbol sits raised on top of. Inspired by a reference the user shared (each
// icon as a complete framed badge) instead of a bare shape floating on its
// own, which read as an unfinished default-primitive ("figura de Blender").
const BADGE_DEPTH = 0.055;
const BADGE_RIM_INSET = 0.9; // was 0.82 — tighter, so the inner bevel line sits close to the outer rim (a close double-line edge, per the reference) instead of a wide gap
const BADGE_SYMBOL_LIFT = 0.06; // how far in front of the badge's own face the inner symbol sits — clears BADGE_DEPTH/2 so it reads as raised/embossed instead of z-fighting

// Opacity bands (spec: primary lines visible, secondary near-invisible, points vary)
const OPACITY_LINE_PRIMARY = 0.65;
const OPACITY_LINE_SECONDARY = 0.32; // was 0.16 — too faint to read as real depth/volume cues
const OPACITY_POINT_DIM = 0.7; // was 0.5 — bumped alongside the much higher particle count below
const OPACITY_POINT_BRIGHT = 0.95;

// Point sizes
const POINT_SIZE_DIM = 0.034;
const POINT_SIZE_BRIGHT = 0.065;

// Funnel-ring particle size — deliberately a single, small size (no dim/bright
// split like the icons above): the previous ~2x bright-vs-dim spread plus
// AdditiveBlending on the bright ones read as oversized blurred glow blobs
// scattered among the small ones once bloom picked them up. Matches the
// uniform small-speck look of the site's other particle piece (hex-cubes-scene.js,
// diseño de marca — SPECK_BASE_SIZE relative to its cube size lands in the same range).
const RING_POINT_SIZE = 0.024;

// Glow accent for the ring: a soft additive-blended duplicate of the outer
// contour, layered behind the crisp primary line, plus additive blending
// back on the "glow" points (safe now that they use the hardened
// ringDotTexture — the earlier blur came from a soft texture at small sizes,
// already fixed, not from additive blending itself). Bloom (lowered
// threshold above) turns both into a visible radiance around the spiral.
const RING_GLOW_LINE_OPACITY = 0.154; // was 0.55, then 0.385, then 0.308 — down another 50% per request
// Split out from RING_GLOW_LINE_OPACITY so the badge rim's glow (see
// badgeGlowMat) doesn't move when the ring's own glow above is tuned.
const BADGE_GLOW_LINE_OPACITY = 0.385;

// Tube fill — the particle cloud used to sit exactly ON the tube's outer
// shell (fixed distance from the ring's centerline), which reads as a flat
// hollow ring rather than a solid 3D tube. Sampling with a gaussian falloff
// per axis instead (same approach as hex-cubes-scene.js's scatterVolumetric,
// diseño de marca — points cluster toward the cube's own center) fills the
// tube's actual cross-section, concentrated toward its central axis and
// thinning toward the edge: real volumetric depth/parallax as it rotates,
// and the particles read as centered in the middle of each spiral instead of
// smeared out to its rim.
const TUBE_FILL_SIGMA = 0.32; // fraction of tube radius — std. deviation of the gaussian spread. Was 0.55 — tightened so particles bunch up around the tube's centerline much more, per the "aglomerar en el centro" ask, instead of spreading fairly evenly across it.
const TUBE_FILL_MARGIN = 0.65; // clamp bound so points stay inside the tube, don't poke out. Was 0.9 — tightened alongside sigma so the rare far-tail sample doesn't still land near the rim.

// Animation speed (radians/sec-ish, all intentionally tiny — "apenas se perciba")
const ROTATE_SPEED = 0.028; // whole-system idle spin
const ICON_BOB_SPEED = 0.5;
const ICON_BOB_AMOUNT = 0.05;
const RING_DIFFERENTIAL_SPEED = 0.05; // extra per-level rotation on top of ROTATE_SPEED
const GLOW_PULSE_SPEED = 0.8;

// Mouse-hover on an ICON — the whole icon grows via a plain uniform scale
// (smoothly lerped, see animate()), not a per-vertex bulge — keeps its shape
// intact, just bigger.
const HOVER_SCALE = 1.18;
const HOVER_LERP_SPEED = 10; // higher = snappier grow/shrink transition

// Mouse-hover on the RING — plain uniform scale like the icons (no per-vertex
// deformation): hovering one ring level grows that level as a whole, AND the
// whole spiral (the `funnel` group holding all 4 levels) grows a bit too, so
// hovering any part of it reads as "the whole spiral responds", not just an
// isolated level in place.
const HOVER_RING_LEVEL_SCALE = 1.1; // the specific level under the cursor
const HOVER_FUNNEL_SCALE = 1.05; // the whole 4-level stack, layered on top of the above
const HOVER_RING_LERP_SPEED = 8; // eases both of the above in/out

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
    // Harder-edged texture for the ring particles only: sizeAttenuation shrinks
    // points on the far side of each ring (the side "dando la vuelta atrás"), and
    // at a few pixels across, the soft radial gradient's opaque core all but
    // disappears — nearly the whole sprite becomes soft falloff, which reads as
    // pure blur instead of a small crisp dot. A much larger opaque plateau keeps
    // it looking like a defined point at any size the far side shrinks to.
    const ringDotTexture = makeDotTexture(0.75);

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
    // Ring-only variants: same look as pointMatDim/pointMatBright (size,
    // opacity, color) but a single small RING_POINT_SIZE for both. The bright
    // one has AdditiveBlending back on for a visible "resplandor" sparkle —
    // safe now with the hardened ringDotTexture (the earlier blur came from a
    // soft texture at small sizes, not from additive blending itself). Icons
    // keep their own dim/bright materials above unchanged.
    // vertexColors:true here too — the per-point shading colors set by
    // ringPointsShaded (below) multiply against this base color, giving the
    // cloud itself real lit-top/shadowed-bottom roundness.
    const ringPointMatDim = () =>
        new THREE.PointsMaterial({
            color: COLOR_SECONDARY,
            map: ringDotTexture,
            size: RING_POINT_SIZE,
            transparent: true,
            opacity: OPACITY_POINT_DIM,
            depthWrite: false,
            sizeAttenuation: true,
            vertexColors: true,
        });
    const ringPointMatBright = () =>
        new THREE.PointsMaterial({
            color: COLOR_GLOW,
            map: ringDotTexture,
            size: RING_POINT_SIZE,
            transparent: true,
            opacity: OPACITY_POINT_BRIGHT,
            depthWrite: false,
            sizeAttenuation: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
        });
    // Soft additive duplicate of the ring's outer contour — layered behind
    // the crisp primary line (see ringLineA below), it's what bloom turns
    // into the ring's own visible glow/"resplandor" instead of relying only
    // on the sparse bright points for it. vertexColors:true so the per-frame
    // front/back fade below (see updateFrontFacingColors) can dim it to
    // black — effectively invisible — on the half of the ring facing away
    // from camera, per the "solo en la parte de al frente" request.
    const ringGlowLineMat = () =>
        new THREE.LineBasicMaterial({ color: COLOR_GLOW, transparent: true, opacity: RING_GLOW_LINE_OPACITY, blending: THREE.AdditiveBlending, vertexColors: true });
    // Same idea for the icon badges' rim (see buildBadge) — static, no
    // vertexColors/per-frame fade needed since icons don't rotate.
    const badgeGlowMat = () =>
        new THREE.LineBasicMaterial({ color: COLOR_GLOW, transparent: true, opacity: BADGE_GLOW_LINE_OPACITY, blending: THREE.AdditiveBlending });
    const solidMat = () =>
        new THREE.MeshStandardMaterial({
            color: SOLID_COLOR,
            roughness: SOLID_ROUGHNESS,
            metalness: SOLID_METALNESS,
            transparent: true,
            opacity: SOLID_OPACITY,
        });
    // Bright near-opaque fill for the symbol itself (see SYMBOL_* above) —
    // the badge backdrop stays on solidMat's glassy translucency.
    // Unlit on purpose (MeshBasicMaterial, not MeshStandardMaterial like
    // solidMat) — ignores scene lights entirely so the symbol always renders
    // as flat solid white, never shaded toward grey on faces angled away from
    // the key light. fog:false so distance/fog can't dim it either.
    const symbolMat = () =>
        new THREE.MeshBasicMaterial({
            color: SYMBOL_COLOR,
            transparent: true,
            opacity: SYMBOL_OPACITY,
            fog: false,
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
    function gradientBrightness(nx, ny, lightDir, minBrightness = GRADIENT_MIN_BRIGHTNESS) {
        const len = Math.hypot(nx, ny) || 1;
        const dot = (nx / len) * lightDir.x + (ny / len) * lightDir.y;
        const t = Math.pow(Math.max(0, dot * 0.5 + 0.5), GRADIENT_FALLOFF_POWER);
        return minBrightness + (1 - minBrightness) * t;
    }

    // Builds the 'color' BufferAttribute a gradient material needs. `axisFn`
    // picks which 2 coordinates of each point represent the shape's own local
    // "facing" plane (XZ for the flat-lying funnel rings, XY for the
    // flat-facing icons).
    function setGradientColors(geometry, points, lightDir, axisFn, minBrightness = GRADIENT_MIN_BRIGHTNESS) {
        const colors = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
            const [nx, ny] = axisFn(p);
            const b = gradientBrightness(nx, ny, lightDir, minBrightness);
            colors[i * 3] = b;
            colors[i * 3 + 1] = b;
            colors[i * 3 + 2] = b;
        });
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    const XY_AXES = (p) => [p.x, p.y];

    function gradientLineLoop(points, lightDir, axisFn, closed = true, material = lineMatGradient(), minBrightness = GRADIENT_MIN_BRIGHTNESS) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        setGradientColors(geo, points, lightDir, axisFn, minBrightness);
        const LineType = closed ? THREE.LineLoop : THREE.Line;
        return new LineType(geo, material);
    }

    function pointsFromArray(points, material) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Points(geo, material);
    }

    // Same idea as gradientLineLoop but for a Points cloud: colors each point
    // by how much it "faces" RING_LIGHT_DIR in the tube's own local
    // radial/vertical plane (recovered straight from its world position —
    // radial offset = distance from the ring's centerline minus its radius,
    // vertical offset = its own y) — gives the point cloud itself real shaded
    // roundness instead of one flat brightness everywhere.
    function ringPointsShaded(points, material, radius) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const colors = new Float32Array(points.length * 3);
        points.forEach((p, i) => {
            const dRadial = Math.hypot(p.x, p.z) - radius;
            const b = gradientBrightness(dRadial, p.y, RING_LIGHT_DIR, RING_GRADIENT_MIN_BRIGHTNESS);
            colors[i * 3] = b;
            colors[i * 3 + 1] = b;
            colors[i * 3 + 2] = b;
        });
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return new THREE.Points(geo, material);
    }

    // Geometry pre-wired with a 'color' attribute for the front-only glow
    // fade (see updateFrontFacingColors in animate()) — vertexColors:true
    // materials need this attribute present even before the first update.
    function dynamicColorLineLoop(points, material) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
        return new THREE.LineLoop(geo, material);
    }

    function dynamicColorPoints(points, material) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(points.length * 3), 3));
        return new THREE.Points(geo, material);
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
    // Hover interaction — the icon or ring level under the cursor scales up
    // as a whole (see HOVER_SCALE/HOVER_LERP_SPEED), smoothly lerped every
    // frame in animate(). animate() raycasts against hoverRaycastTargets
    // (the icon badge meshes + one invisible proxy torus per ring level,
    // since the rings themselves are lines/points only, nothing solid to
    // hit-test against); a hit's mesh.userData.hoverGroup says which group
    // to grow. hoverScaleGroups lists every group that participates.
    // ---------------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(2, 2); // starts off-screen — no hover until the first real pointermove
    let mouseActive = false;
    function onPointerMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        mouseActive = true;
    }
    function onPointerLeave() {
        mouseActive = false;
    }
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const hoverRaycastTargets = [];
    // Every entry is { group, targetScale } — icons push HOVER_SCALE, ring
    // levels push HOVER_RING_LEVEL_SCALE (see animate()); plain uniform
    // scale, no per-vertex geometry changes.
    const hoverScaleGroups = [];

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

    function roundedRectShape(w, h, r) {
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
        return shape;
    }

    // Same rounded-rect outline as roundedRectShape, but with a triangular
    // tail cut into the bottom edge (offset toward the left) — the speech-
    // bubble "pico" the reference image has and the plain rounded rect below
    // was missing.
    function bubbleWithTailShape(w, h, r, tailCx, tailW, tailDrop) {
        const shape = new THREE.Shape();
        const left = -w / 2;
        const right = w / 2;
        const bottom = -h / 2;
        const top = h / 2;
        const tailLeft = tailCx - tailW / 2;
        const tailRight = tailCx + tailW / 2;
        shape.moveTo(left + r, bottom);
        shape.lineTo(tailLeft, bottom);
        shape.lineTo(tailCx - tailW * 0.2, bottom - tailDrop);
        shape.lineTo(tailRight, bottom);
        shape.lineTo(right - r, bottom);
        shape.absarc(right - r, bottom + r, r, -Math.PI / 2, 0, false);
        shape.lineTo(right, top - r);
        shape.absarc(right - r, top - r, r, 0, Math.PI / 2, false);
        shape.lineTo(left + r, top);
        shape.absarc(left + r, top - r, r, Math.PI / 2, Math.PI, false);
        shape.lineTo(left, bottom + r);
        shape.absarc(left + r, bottom + r, r, Math.PI, Math.PI * 1.5, false);
        return shape;
    }

    // Builds the badge disc itself from a flat Shape — shared by the circular
    // and rounded-square badges below. The fill is barely-there (see
    // SOLID_OPACITY) on purpose: the badge is meant to read as a shape
    // "delimited" by its line rims, not as a filled disc. To sell that at
    // this opacity, the rim is now traced at BOTH the front and back face of
    // the extrude (not one loop floating at its mid-depth) plus a few struts
    // between them — the same front/back-contour idea the funnel rings use
    // to read as a real 3D tube instead of a flat ring.
    function buildBadge(group, shape, outline, innerOutline) {
        const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: BADGE_DEPTH, bevelEnabled: false, curveSegments: 24 }), solidMat());
        mesh.position.z = -BADGE_DEPTH / 2;
        group.add(mesh);

        // Hover hit-testing: the badge's own (barely-visible) fill mesh
        // doubles as the raycast target — real geometry, so opacity doesn't
        // affect raycasting. A hit resolves back to this icon's root group
        // via userData.hoverGroup, which animate() scales up on hover.
        mesh.userData.hoverGroup = group;
        hoverRaycastTargets.push(mesh);
        hoverScaleGroups.push({ group, targetScale: HOVER_SCALE });

        const frontZ = BADGE_DEPTH / 2;
        const backZ = -BADGE_DEPTH / 2;
        const frontOutline = outline.map((p) => new THREE.Vector3(p.x, p.y, frontZ));
        const backOutline = outline.map((p) => new THREE.Vector3(p.x, p.y, backZ));
        const frontInner = innerOutline.map((p) => new THREE.Vector3(p.x, p.y, frontZ));

        // Front rim — lit gradient line + additive glow duplicate (same
        // technique as the ring's ringGlowLineMat; bloom turns it into the
        // "acrylic edge" glow from the reference).
        group.add(gradientLineLoop(frontOutline, ICON_LIGHT_DIR, XY_AXES));
        group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(frontOutline), badgeGlowMat()));
        group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(frontInner), lineMatSecondary()));

        // Back rim — plain secondary-color loop, no glow (keeps the glow
        // reserved for the front-facing edge, same as the front/back split
        // elsewhere in this file).
        group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(backOutline), lineMatSecondary()));

        // Struts connecting front to back rim at a handful of points — makes
        // the extruded depth read as a real 3D box outline instead of two
        // unconnected flat loops.
        const strutCount = 8;
        for (let i = 0; i < strutCount; i++) {
            const idx = Math.floor((i / strutCount) * outline.length);
            group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([frontOutline[idx], backOutline[idx]]), lineMatSecondary()));
        }
    }

    function addCircleBadge(group, radius) {
        const outline = circlePoints(radius, 48);
        const innerOutline = circlePoints(radius * BADGE_RIM_INSET, 40);
        const shape = new THREE.Shape();
        shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
        buildBadge(group, shape, outline, innerOutline);
    }

    function addRoundedSquareBadge(group, w, h, r) {
        const shape = roundedRectShape(w, h, r);
        const outline = shape.getPoints(8);
        outline.push(outline[0].clone());
        const innerShape = roundedRectShape(w * BADGE_RIM_INSET, h * BADGE_RIM_INSET, r * BADGE_RIM_INSET);
        const innerOutline = innerShape.getPoints(8);
        innerOutline.push(innerOutline[0].clone());
        buildBadge(group, shape, outline, innerOutline);
    }

    // A single "person": filled solid disc for the head plus a filled,
    // flat-bottomed dome for the shoulders/torso — the classic avatar-glyph
    // silhouette from the reference image (a full white shape, not a thin
    // wireframe arc). Sits raised on a circular badge (see addCircleBadge).
    function createUserGlyph(scale) {
        const group = new THREE.Group();
        addCircleBadge(group, 0.24 * scale);

        const symbol = new THREE.Group();
        symbol.position.z = BADGE_SYMBOL_LIFT;
        group.add(symbol);

        // 40% smaller than the previous pass (was overflowing the badge rim)
        // and recentered vertically — head-top/body-bottom now sit at equal
        // distance from the badge's own center (y=0).
        const headR = 0.048 * scale;
        const headCy = 0.069 * scale;

        const headShape = new THREE.Shape();
        headShape.absarc(0, 0, headR, 0, Math.PI * 2, false);
        const headMesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(headShape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false, curveSegments: 20 }),
            symbolMat()
        );
        headMesh.position.set(0, headCy, -ICON_EXTRUDE_DEPTH / 2);
        symbol.add(headMesh);
        const headOutline = circlePoints(headR, 20, 0, headCy);
        symbol.add(gradientLineLoop(headOutline, ICON_LIGHT_DIR, XY_AXES));

        // Shoulders — a half-ellipse dome (flat cut across the bottom), filled
        // solid rather than a bare arc, so it reads as one continuous filled
        // silhouette with the head, matching the reference.
        const bodyRX = 0.09 * scale;
        const bodyRY = 0.075 * scale;
        const bodyCy = -0.042 * scale;
        const bodySegments = 24;
        const bodyPts = [];
        for (let i = 0; i <= bodySegments; i++) {
            const a = (i / bodySegments) * Math.PI;
            bodyPts.push(new THREE.Vector3(Math.cos(a) * bodyRX, bodyCy + Math.sin(a) * bodyRY, 0));
        }
        const bodyShape = new THREE.Shape();
        bodyPts.forEach((p, i) => (i === 0 ? bodyShape.moveTo(p.x, p.y) : bodyShape.lineTo(p.x, p.y)));
        const bodyMesh = new THREE.Mesh(
            new THREE.ExtrudeGeometry(bodyShape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false, curveSegments: 20 }),
            symbolMat()
        );
        bodyMesh.position.z = -ICON_EXTRUDE_DEPTH / 2;
        symbol.add(bodyMesh);
        const bodyLine = gradientLineLoop(bodyPts, ICON_LIGHT_DIR, (p) => [p.x, p.y - bodyCy], false);
        symbol.add(bodyLine);

        const scatter = scatterAlongPath([...headOutline, ...bodyPts], 35);
        symbol.add(pointsFromArray(scatter, pointMatDim()));
        return group;
    }

    // Solid heart via the classic parametric heart curve, extruded into real
    // depth, raised on a rounded-square badge (see addRoundedSquareBadge).
    // Reference image shows the heart filling most of its badge — bigger than
    // the previous pass, using the bright symbolMat fill instead of the
    // badge's own translucent glass material.
    function createHeartGlyph(scale) {
        const group = new THREE.Group();
        addRoundedSquareBadge(group, 0.34 * scale, 0.3 * scale, 0.08 * scale);

        const symbol = new THREE.Group();
        symbol.position.z = BADGE_SYMBOL_LIFT;
        group.add(symbol);

        // Shrunk ~35% from the previous pass (was filling almost the whole
        // badge). The curve's own x/y ranges are already symmetric around 0
        // (see the +6 shift below), so a uniform scale keeps it centered —
        // no extra offset needed here, unlike the message bubble's tail.
        const s = 0.0053 * scale;
        const pts = [];
        const segments = 40;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            // +6 recenters the curve vertically (its raw y range is ~[-17, 5],
            // not symmetric around 0) so it sits centered in its badge.
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) + 6;
            pts.push(new THREE.Vector3(x * s, y * s, 0));
        }

        const heartShape = new THREE.Shape();
        pts.forEach((p, i) => (i === 0 ? heartShape.moveTo(p.x, p.y) : heartShape.lineTo(p.x, p.y)));
        const heartMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false }), symbolMat());
        heartMesh.position.z = -ICON_EXTRUDE_DEPTH / 2;
        symbol.add(heartMesh);

        const line = gradientLineLoop(pts, ICON_LIGHT_DIR, XY_AXES);
        symbol.add(line);
        symbol.add(pointsFromArray(scatterAlongPath(pts, 30), pointMatDim()));
        return group;
    }

    // Speech bubble with a bottom-left tail and 3 interior dots ("message"
    // icon), raised on its own rounded-square badge. The reference image's
    // bubble has a pointed tail (missing from the previous flat rounded
    // rect) — added via bubbleWithTailShape.
    function createMessageGlyph(scale) {
        const group = new THREE.Group();
        addRoundedSquareBadge(group, 0.34 * scale, 0.26 * scale, 0.07 * scale);

        const symbol = new THREE.Group();
        symbol.position.z = BADGE_SYMBOL_LIFT;
        // The tail hangs below the bubble's own rect, so the shape's true
        // vertical center sits below y=0, not on it — this shift brings it
        // back to the badge's own center instead of just eyeballing it.
        symbol.position.y = 0.016 * scale;
        group.add(symbol);

        // Shrunk ~35% from the previous pass (bubble + tail were touching
        // the badge edges).
        const w = 0.143 * scale;
        const h = 0.0975 * scale;
        const r = 0.0247 * scale;
        const tailCx = -w * 0.22;
        const tailW = 0.039 * scale;
        const tailDrop = 0.0325 * scale;
        const shape = bubbleWithTailShape(w, h, r, tailCx, tailW, tailDrop);
        const bubbleMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: ICON_EXTRUDE_DEPTH, bevelEnabled: false }), symbolMat());
        bubbleMesh.position.z = -ICON_EXTRUDE_DEPTH / 2;
        symbol.add(bubbleMesh);

        const outline = shape.getPoints(6);
        outline.push(outline[0]);
        const line = gradientLineLoop(outline, ICON_LIGHT_DIR, XY_AXES);
        symbol.add(line);

        const dots = [
            new THREE.Vector3(-w * 0.22, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(w * 0.22, 0, 0),
        ];
        symbol.add(pointsFromArray(dots, pointMatBright()));
        symbol.add(pointsFromArray(scatterAlongPath(outline, 25), pointMatDim()));
        return group;
    }

    // "Audience" — a loose cluster of small bare circles (no shoulders), reading
    // as a crowd rather than one individual, raised on its own circular badge.
    function createAudienceGlyph(scale) {
        const group = new THREE.Group();
        addCircleBadge(group, 0.24 * scale);

        const symbol = new THREE.Group();
        symbol.position.z = BADGE_SYMBOL_LIFT;
        group.add(symbol);

        const offsets = [
            [0, 0, 0],
            [0.09 * scale, 0.04 * scale, -0.02 * scale], // was 0.11/0.05/-0.04 — pulled in so the cluster fits inside its badge
            [-0.08 * scale, 0.03 * scale, 0.02 * scale], // was -0.1/0.03/0.05
        ];
        const allPts = [];
        const sphereR = 0.05 * scale; // was 0.06
        offsets.forEach(([ox, oy, oz]) => {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(sphereR, 12, 10), solidMat());
            sphere.position.set(ox, oy, oz);
            symbol.add(sphere);
            const pts = circlePoints(sphereR, 14, ox, oy).map((p) => new THREE.Vector3(p.x, p.y, oz));
            symbol.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lineMatSecondary()));
            allPts.push(...pts);
        });
        symbol.add(pointsFromArray(scatterAlongPath(allPts, 20), pointMatDim()));
        return group;
    }

    // Irregular layout: different x/y/z per icon so nothing lines up on a grid —
    // edit this array to reposition or rescale any single icon. Reference:
    // 4 person + 1 heart + 1 message, scattered at varied depths/heights,
    // per the shared reference image.
    // x/y/z from the previous pass scaled outward ~1.55x from the shared
    // centroid (0,0,0) — same relative arrangement, more distance between
    // each icon so their badges stop overlapping. Person badges also scaled
    // down (~0.82x) so they read as smaller than the heart/message ones.
    // Centroid stays at (0,0,0): a uniform scale from the origin doesn't
    // shift it.
    const ICON_LAYOUT = [
        { build: createUserGlyph, x: -1.07, y: 0.17, z: 0.02, scale: 0.94, phase: 0.0 },
        { build: createUserGlyph, x: 0.14, y: 0.33, z: -0.53, scale: 0.78, phase: 1.4 },
        // This user badge and the message badge below were the closest pair
        // (badges touching) — pushed apart along their shared axis, keeping
        // their midpoint fixed, so the group's overall centroid is unaffected.
        { build: createUserGlyph, x: 1.12, y: 0.01, z: 0.39, scale: 0.86, phase: 2.6 },
        { build: createUserGlyph, x: -0.05, y: 0.48, z: 0.4, scale: 0.9, phase: 2.0 },
        { build: createHeartGlyph, x: -0.51, y: -0.36, z: 0.29, scale: 1.0, phase: 0.8 },
        { build: createMessageGlyph, x: 0.36, y: -0.66, z: -0.59, scale: 1.0, phase: 3.6 },
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

    // radius = ring radius (its overall diameter — what "ancho" meant),
    // tube = ring thickness. tube is back to the earlier chunkier pass
    // (0.14-0.094) — that got reverted by mistake, the actual "too wide"
    // complaint was about radius, not tube. radius itself is down ~20% here
    // (was 1.3/1.05/0.8/0.55) so each ring's own diameter is narrower.
    // particleCount stays high: a dense cloud is what makes the ring stand
    // out, independent of its size.
    const FUNNEL_LEVELS = [
        { radius: 1.05, tube: 0.14, particleCount: 3000 },
        { radius: 0.85, tube: 0.123, particleCount: 2500 },
        { radius: 0.65, tube: 0.108, particleCount: 2000 },
        { radius: 0.45, tube: 0.094, particleCount: 1500 },
    ];

    // Box-Muller gaussian sample, same helper hex-cubes-scene.js uses for its
    // volumetric point cloud.
    function gaussianRandom() {
        let a = 0, b = 0;
        while (a === 0) a = Math.random();
        while (b === 0) b = Math.random();
        return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
    }

    function clampAbs(v, bound) {
        return Math.max(-bound, Math.min(bound, v));
    }

    // A point sampled INSIDE the tube's cross-section at contour angle u,
    // clustered toward the tube's own center axis (gaussian, clamped so it
    // never pokes past the tube's edge) instead of sitting exactly on the
    // tube's outer shell — see TUBE_FILL_SIGMA/MARGIN above.
    function ringVolumePoint(radius, tube, u) {
        const bound = tube * TUBE_FILL_MARGIN;
        const dRadial = clampAbs(gaussianRandom() * tube * TUBE_FILL_SIGMA, bound);
        const dVertical = clampAbs(gaussianRandom() * tube * TUBE_FILL_SIGMA, bound);
        const rad = radius + dRadial;
        return new THREE.Vector3(rad * Math.cos(u), dVertical, rad * Math.sin(u));
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

        // Hover hit-testing: the ring has no solid mesh to raycast against
        // (lines/points only), so an invisible torus proxy stands in — same
        // radius/tube as the level's own contours, DoubleSide so the exact
        // winding direction from the 90°-rotation below doesn't matter. A hit
        // scales this level up as a whole (see hoverScaleGroups in animate()),
        // plus the whole `funnel` group (all 4 levels) scales up too.
        hoverScaleGroups.push({ group: level, targetScale: HOVER_RING_LEVEL_SCALE });
        const hoverProxyMat = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
            side: THREE.DoubleSide,
        });
        const hoverProxy = new THREE.Mesh(new THREE.TorusGeometry(cfg.radius, cfg.tube, 8, 32), hoverProxyMat);
        hoverProxy.rotation.x = Math.PI / 2; // default torus lies flat in XY — rotate so its main circle sits in XZ, matching the ring
        hoverProxy.userData.hoverRingLevel = level;
        level.add(hoverProxy);
        hoverRaycastTargets.push(hoverProxy);

        // Line-only on purpose: the funnel rings stay wireframe (per the user's
        // call) — solid geometry is reserved for the icons floating above.

        // Outer + inner contour — the rim, at the widest/narrowest of the tube.
        // Full, uniform opacity on purpose (no facing-based gradient here, and
        // fog disabled below): the ring should stay fully visible all the way
        // around as it rotates, not dim on the side swinging away from camera.
        const ringLineA = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius + cfg.tube, 0)), lineMatPrimary());
        const ringLineB = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius - cfg.tube, 0)), lineMatPrimary());
        ringLineA.material.fog = false;
        ringLineB.material.fog = false;
        level.add(ringLineA, ringLineB);

        // Top + bottom contours — the tube's own rounded top/underside,
        // completing line coverage across the WHOLE tube profile.
        const ringLineTop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius, cfg.tube)), lineMatPrimary());
        const ringLineBottom = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringContourPoints(cfg.radius, -cfg.tube)), lineMatPrimary());
        ringLineTop.material.fog = false;
        ringLineBottom.material.fog = false;
        level.add(ringLineTop, ringLineBottom);

        // Additive glow duplicates of all 4 contours — see ringGlowLineMat
        // above. Bloom is what turns these into the ring's visible
        // "resplandor". Their vertex colors are recomputed every frame in
        // animate() (updateFrontFacingColors) so the glow only shows on the
        // half of the ring currently facing the camera.
        const contourUs = Array.from({ length: 65 }, (_, idx) => (idx / 64) * Math.PI * 2);
        const ringGlowA = dynamicColorLineLoop(ringContourPoints(cfg.radius + cfg.tube, 0), ringGlowLineMat());
        const ringGlowB = dynamicColorLineLoop(ringContourPoints(cfg.radius - cfg.tube, 0), ringGlowLineMat());
        const ringGlowTop = dynamicColorLineLoop(ringContourPoints(cfg.radius, cfg.tube), ringGlowLineMat());
        const ringGlowBottom = dynamicColorLineLoop(ringContourPoints(cfg.radius, -cfg.tube), ringGlowLineMat());
        [ringGlowA, ringGlowB, ringGlowTop, ringGlowBottom].forEach((g) => {
            g.material.fog = false;
            level.add(g);
        });

        // Point cloud filling the tube's cross-section volume (see
        // ringVolumePoint above), not just its outer shell — reads as a real
        // 3D tube with depth/parallax as it rotates, particles clustered
        // toward the center of each spiral (TUBE_FILL_SIGMA/MARGIN above).
        const glowCount = Math.round(cfg.particleCount * 0.12);
        const dimCount = cfg.particleCount - glowCount;
        const dimPts = Array.from({ length: dimCount }, () => ringVolumePoint(cfg.radius, cfg.tube, Math.random() * Math.PI * 2));
        // Dim points keep the static roundness shading (ringPointsShaded) and
        // stay visible all the way around — fog stays disabled, same
        // reasoning as the contours above.
        const dimPoints = ringPointsShaded(dimPts, ringPointMatDim(), cfg.radius);
        dimPoints.material.fog = false;
        level.add(dimPoints);

        // Glow points keep their own random angle `u` (glowUs) so their
        // color, like the glow lines' above, can be recomputed every frame
        // to fade out on the back half instead of the static roundness tint.
        const glowUs = [];
        const glowPts = [];
        for (let g = 0; g < glowCount; g++) {
            const u = Math.random() * Math.PI * 2;
            glowUs.push(u);
            glowPts.push(ringVolumePoint(cfg.radius, cfg.tube, u));
        }
        const glowPoints = dynamicColorPoints(glowPts, ringPointMatBright());
        glowPoints.material.fog = false;
        glowPoints.name = 'glow';
        level.add(glowPoints);

        level.userData.spinSpeed = (i % 2 === 0 ? 1 : -1) * RING_DIFFERENTIAL_SPEED * (1 + i * 0.15);
        funnel.add(level);
        return { level, ringGlowA, ringGlowB, ringGlowTop, ringGlowBottom, contourUs, glowPoints, glowUs };
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
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD);
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

    // Recomputes a glow element's per-vertex brightness from its stored
    // angles (`us`, one per vertex/point, captured when it was built) plus
    // the ring's CURRENT total rotation — front-facing (toward CAMERA_XZ)
    // comes out bright, the back half comes out black (additive-blended
    // black = invisible), so the glow only ever shows on the side of the
    // ring currently facing the camera. Called every frame since the ring
    // keeps slowly rotating underneath the fixed camera.
    function updateFrontFacingColors(obj, us, totalRotation) {
        const colorAttr = obj.geometry.attributes.color;
        const arr = colorAttr.array;
        for (let idx = 0; idx < us.length; idx++) {
            const angle = us[idx] + totalRotation;
            const facing = Math.cos(angle) * CAMERA_XZ.x + Math.sin(angle) * CAMERA_XZ.y;
            const b = Math.max(0, facing);
            arr[idx * 3] = b;
            arr[idx * 3 + 1] = b;
            arr[idx * 3 + 2] = b;
        }
        colorAttr.needsUpdate = true;
    }

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

        // Applied to `funnel` (the rings only), not `funnelSystem` — the
        // icons live in the sibling `audienceIcons` group, so they no longer
        // orbit/spin along with the rings, just their own bob below.
        funnel.rotation.y += ROTATE_SPEED * dt;

        iconGroups.forEach((g) => {
            g.position.y = g.userData.baseY + Math.sin(elapsed * ICON_BOB_SPEED + g.userData.phase) * ICON_BOB_AMOUNT;
        });

        funnelLevels.forEach(({ level, ringGlowA, ringGlowB, ringGlowTop, ringGlowBottom, contourUs, glowPoints, glowUs }) => {
            level.rotation.y += level.userData.spinSpeed * dt;
            const totalRotation = funnel.rotation.y + level.rotation.y;
            updateFrontFacingColors(ringGlowA, contourUs, totalRotation);
            updateFrontFacingColors(ringGlowB, contourUs, totalRotation);
            updateFrontFacingColors(ringGlowTop, contourUs, totalRotation);
            updateFrontFacingColors(ringGlowBottom, contourUs, totalRotation);
            updateFrontFacingColors(glowPoints, glowUs, totalRotation);
            glowPoints.material.opacity = OPACITY_POINT_BRIGHT * (0.75 + 0.25 * Math.sin(elapsed * GLOW_PULSE_SPEED));
        });

        // Hover — raycast against the icon badges + ring proxies (see
        // hoverRaycastTargets) using this frame's up-to-date transforms
        // (updateMatrixWorld before raycasting, since rotations/positions
        // above were just changed and haven't propagated to matrixWorld yet).
        // Plain uniform scale everywhere, no per-vertex deformation: the hit
        // icon or ring level grows on its own (hoverScaleGroups, per-entry
        // targetScale), and on top of that, hovering ANY ring level also
        // grows the whole `funnel` group (all 4 levels together).
        funnelSystem.updateMatrixWorld(true);
        let hitIconGroup = null;
        let hitRingLevel = null;
        if (mouseActive) {
            raycaster.setFromCamera(mouseNDC, camera);
            const hits = raycaster.intersectObjects(hoverRaycastTargets, false);
            if (hits.length) {
                const hitObject = hits[0].object;
                if (hitObject.userData.hoverGroup) {
                    hitIconGroup = hitObject.userData.hoverGroup;
                } else if (hitObject.userData.hoverRingLevel) {
                    hitRingLevel = hitObject.userData.hoverRingLevel;
                }
            }
        }
        const hitGroup = hitIconGroup || hitRingLevel;

        const scaleStep = Math.min(1, dt * HOVER_LERP_SPEED);
        hoverScaleGroups.forEach(({ group, targetScale }) => {
            const target = group === hitGroup ? targetScale : 1;
            const next = group.scale.x + (target - group.scale.x) * scaleStep;
            group.scale.setScalar(next);
        });

        const funnelScaleStep = Math.min(1, dt * HOVER_RING_LERP_SPEED);
        const funnelTarget = hitRingLevel ? HOVER_FUNNEL_SCALE : 1;
        const funnelNext = funnel.scale.x + (funnelTarget - funnel.scale.x) * funnelScaleStep;
        funnel.scale.setScalar(funnelNext);

        composer.render();
    }
    animate();

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
                else obj.material.dispose();
            }
        });
        dotTexture.dispose();
        ringDotTexture.dispose();
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
