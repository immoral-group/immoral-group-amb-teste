import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// "Agujero negro" background: a still, top-down accretion disk that stays dim
// until the mouse moves over it, at which point a soft glow (with inertia, no
// permanent trail) reveals the area near the cursor — like the Spline hero it
// replaces. Scoped to `container` (not the window), so it works embedded in a
// page section instead of fullscreen.

const noiseChunk = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }
`;

export function createBlackholeScene(container) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute; inset:0; transform-origin:center center; transition:transform 0.6s ease; overflow:hidden;';

    const threeCanvas = document.createElement('canvas');
    threeCanvas.style.cssText = 'display:block; position:absolute; inset:0; width:100%; height:100%;';

    const maskCanvas = document.createElement('canvas');
    maskCanvas.style.cssText = 'display:block; position:absolute; inset:0; width:100%; height:100%; z-index:2;';

    wrapper.appendChild(threeCanvas);
    wrapper.appendChild(maskCanvas);
    container.appendChild(wrapper);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(18, 82, 18); // vista casi cenital

    const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.03;
    controls.autoRotate = false; // cámara fija, sin ir a la deriva
    controls.enableRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bhGeo = new THREE.SphereGeometry(4, 64, 64);
    coreGroup.add(new THREE.Mesh(bhGeo, bhMat));

    const instanceCount = 1800;
    const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
    streakGeo.rotateX(Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMorph: { value: 0.1 },
            uCompression: { value: 1.0 },
            uIntensity: { value: 1.0 },
            uOrbitScale: { value: 1.0 },
        },
        vertexShader: `
            ${noiseChunk}
            uniform float uTime;
            uniform float uMorph;
            uniform float uCompression;
            uniform float uIntensity;
            uniform float uOrbitScale;
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
                vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
                float rOriginal = length(instPos.xz);
                float r = rOriginal * uCompression;
                float initialAngle = atan(instPos.z, instPos.x);
                float orbitalVelocity = (1.5 / sqrt(rOriginal)) * uOrbitScale;
                float currentAngle = initialAngle + (uTime * orbitalVelocity);
                vec3 morphedWorldPos = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
                float noise = snoise(vec3(morphedWorldPos.x * 0.08, morphedWorldPos.z * 0.08, uTime * 0.3));
                morphedWorldPos.y += noise * uMorph * 4.0;
                vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
                vec3 orbitDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
                float doppler = dot(orbitDir, viewDir);
                vec3 hot = vec3(0.88, 0.90, 0.93);
                vec3 warm = vec3(0.5, 0.56, 0.66);
                vec3 cool = vec3(0.18, 0.5, 0.93);
                vec3 color = mix(cool, warm, smoothstep(45.0, 12.0, r));
                color = mix(color, hot, smoothstep(10.0, 4.0, r));
                vColor = color * (1.3 + doppler * 0.7) * uIntensity;
                vOpacity = (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(38.0, 48.0, r))) * 0.8;
                float deltaAngle = currentAngle - initialAngle;
                float c = cos(deltaAngle);
                float s = sin(deltaAngle);
                mat3 rotY = mat3(
                    c, 0, s,
                    0, 1, 0,
                   -s, 0, c
                );
                vec3 localPos = (instanceMatrix * vec4(position, 0.0)).xyz;
                vec3 rotatedLocalPos = rotY * localPos;
                gl_Position = projectionMatrix * viewMatrix * vec4(morphedWorldPos + rotatedLocalPos, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vOpacity;
            void main() {
                gl_FragColor = vec4(vColor, vOpacity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < instanceCount; i++) {
        // exponent < 1 (sqrt-like) spreads points toward a uniform-area disk instead of
        // piling them up near the event horizon.
        const r = 6.5 + Math.pow(Math.random(), 0.55) * 38.5;
        const angle = Math.random() * Math.PI * 2;
        dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * (8 / r), Math.sin(angle) * r);
        dummy.lookAt(dummy.position.x + Math.sin(angle), dummy.position.y, dummy.position.z - Math.cos(angle));
        dummy.updateMatrix();
        instancedDisk.setMatrixAt(i, dummy.matrix);
    }
    scene.add(instancedDisk);

    // ---- Máscara de brillo: fondo apagado en todos lados, brillo suave con
    // inercia siguiendo al cursor (relativo al contenedor), sin dejar rastro. ----
    const maskCtx = maskCanvas.getContext('2d');
    const GLOW_RADIUS = 110;
    const GLOW_RADIUS_HOVER = GLOW_RADIUS * 1.4;
    const BASE_DIM = 0.9;
    const FOLLOW_EASE = 0.08;

    const liveMouse = { x: 0, y: 0 };
    const glowPos = { x: 0, y: 0 };
    let hasMouse = false;
    let isHovering = false;
    let currentRadius = GLOW_RADIUS;

    const onPointerMove = (e) => {
        const rect = container.getBoundingClientRect();
        liveMouse.x = e.clientX - rect.left;
        liveMouse.y = e.clientY - rect.top;
        hasMouse = true;
    };
    const onEnter = () => {
        isHovering = true;
        wrapper.style.transform = 'scale(1.12)';
    };
    const onLeave = () => {
        isHovering = false;
        wrapper.style.transform = 'scale(1)';
    };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);

    function drawMask() {
        glowPos.x += (liveMouse.x - glowPos.x) * FOLLOW_EASE;
        glowPos.y += (liveMouse.y - glowPos.y) * FOLLOW_EASE;
        const targetRadius = isHovering ? GLOW_RADIUS_HOVER : GLOW_RADIUS;
        currentRadius += (targetRadius - currentRadius) * 0.06;

        const w = maskCanvas.width, h = maskCanvas.height;
        maskCtx.clearRect(0, 0, w, h);
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.fillStyle = `rgba(1,1,3,${BASE_DIM})`;
        maskCtx.fillRect(0, 0, w, h);

        if (!hasMouse) return;
        maskCtx.globalCompositeOperation = 'destination-out';
        const g = maskCtx.createRadialGradient(glowPos.x, glowPos.y, 0, glowPos.x, glowPos.y, currentRadius);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.55)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        maskCtx.fillStyle = g;
        maskCtx.beginPath();
        maskCtx.arc(glowPos.x, glowPos.y, currentRadius, 0, Math.PI * 2);
        maskCtx.fill();
    }

    function resize() {
        const w = container.clientWidth || 1;
        const h = container.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        maskCanvas.width = w;
        maskCanvas.height = h;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId = null;
    let lastFrameTime = performance.now();
    function animate() {
        rafId = requestAnimationFrame(animate);
        const now = performance.now();
        const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
        lastFrameTime = now;
        diskMaterial.uniforms.uTime.value += dt;
        instancedDisk.rotation.y += 0.0005;
        controls.update();
        renderer.render(scene, camera);
        drawMask();
    }
    animate();

    function dispose() {
        if (rafId !== null) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('mouseenter', onEnter);
        container.removeEventListener('mouseleave', onLeave);
        controls.dispose();
        bhGeo.dispose();
        bhMat.dispose();
        streakGeo.dispose();
        diskMaterial.dispose();
        renderer.dispose();
        wrapper.remove();
    }

    return { dispose, resize };
}
