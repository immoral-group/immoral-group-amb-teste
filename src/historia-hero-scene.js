// Fondo del hero de "Nuestra Historia": hilos de luz que ondulan como el
// recorrido de una historia y se apartan del cursor al pasar cerca. Canvas 2D
// (no WebGL) a propósito — técnica distinta a los otros heroes del sitio
// (raymarching en Diseño de Marca, plasma+dither en Automatización de
// Procesos), para que cada uno tenga su propia identidad visual.
import gsap from 'gsap';

const THREADS = [
    { baseY: 0.14, amplitude: 26, wavelength: 340, speed: 0.35, phase: 0.4, width: 1.4, color: '255,255,255' },
    { baseY: 0.26, amplitude: 34, wavelength: 260, speed: 0.50, phase: 1.8, width: 1.8, color: '156,163,175' },
    { baseY: 0.38, amplitude: 22, wavelength: 400, speed: 0.28, phase: 3.1, width: 1.2, color: '255,255,255' },
    { baseY: 0.50, amplitude: 40, wavelength: 300, speed: 0.42, phase: 0.9, width: 2.2, color: '156,163,175' },
    { baseY: 0.62, amplitude: 24, wavelength: 360, speed: 0.33, phase: 2.4, width: 1.4, color: '255,255,255' },
    { baseY: 0.74, amplitude: 30, wavelength: 280, speed: 0.46, phase: 4.2, width: 1.8, color: '156,163,175' },
];

const PUSH_RADIUS = 220; // px de radio de influencia del cursor
const PUSH_STRENGTH = 70; // px de desplazamiento máximo del hilo

export function createHistoriaHeroScene(container) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block; width:100%; height:100%;';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0, height = 0;

    function resize() {
        const rect = container.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // --- Cursor suavizado (misma técnica que el hero de Automatización de
    // Procesos): gsap.quickTo evita que el empuje "salte" con movimientos
    // rápidos del mouse. ---
    const mouse = { x: -9999, y: -9999 };
    const setMouseX = gsap.quickTo(mouse, 'x', { duration: 0.35, ease: 'power3' });
    const setMouseY = gsap.quickTo(mouse, 'y', { duration: 0.35, ease: 'power3' });

    function onPointerMove(e) {
        const rect = container.getBoundingClientRect();
        setMouseX(e.clientX - rect.left);
        setMouseY(e.clientY - rect.top);
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // --- Estado animado por GSAP: entrada "escribiéndose" de izquierda a
    // derecha al cargar, y una respiración lenta de amplitud en reposo. ---
    const state = { drawProgress: 0, ampMultiplier: 1 };
    const introTween = gsap.fromTo(
        state,
        { drawProgress: 0 },
        { drawProgress: 1, duration: 2.4, ease: 'power2.out', delay: 0.15 }
    );
    const breatheTween = gsap.to(state, {
        ampMultiplier: 1.2,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
    });

    function threadY(thread, x, t) {
        const wave = Math.sin(x / thread.wavelength + t * thread.speed + thread.phase);
        let y = thread.baseY * height + wave * thread.amplitude * state.ampMultiplier;

        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PUSH_RADIUS) {
            const falloff = 1 - dist / PUSH_RADIUS;
            const push = falloff * falloff * PUSH_STRENGTH;
            y += dy >= 0 ? push : -push;
        }
        return y;
    }

    function render(t) {
        // Self-heal defensivo: si el ResizeObserver no llega a disparar (ver
        // TASK-LOG, ya documentado para el hero de Automatización), el canvas
        // no se queda atascado en un tamaño viejo.
        if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
            resize();
        }

        // Relleno sólido (no clearRect): así el fondo queda negro puro dentro
        // del hero, sin que se transparenten los orbes del fondo global fijo
        // de la página, que sigue existiendo detrás para el resto del sitio.
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        const maxX = width * state.drawProgress;
        if (maxX <= 0) return;
        const step = 6;

        THREADS.forEach((thread) => {
            ctx.beginPath();
            for (let x = 0; x <= maxX; x += step) {
                const y = threadY(thread, x, t);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            const gradient = ctx.createLinearGradient(0, 0, maxX, 0);
            gradient.addColorStop(0, `rgba(${thread.color},0)`);
            gradient.addColorStop(0.15, `rgba(${thread.color},0.55)`);
            gradient.addColorStop(0.85, `rgba(${thread.color},0.55)`);
            gradient.addColorStop(1, `rgba(${thread.color},0.9)`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = thread.width;
            ctx.shadowColor = `rgba(${thread.color},0.6)`;
            ctx.shadowBlur = 10;
            ctx.stroke();
        });
    }

    gsap.ticker.add(render);

    function dispose() {
        gsap.ticker.remove(render);
        introTween.kill();
        breatheTween.kill();
        window.removeEventListener('pointermove', onPointerMove);
        ro.disconnect();
        canvas.remove();
    }

    return { dispose, resize };
}
