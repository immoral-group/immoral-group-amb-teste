import { createHexCubesScene } from './hex-cubes-scene.js';

// Reutiliza el grid de cubos de diseño-de-marca/publicidad-en-medios (mismo
// componente) para el fondo del hero de esta página, en vez del shader de
// filamentos de luz que tenía antes.
let sceneHandle = null;
let cubesCanvas = null;

export function initAutomatizacionHero() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }
    if (cubesCanvas) {
        cubesCanvas.remove();
        cubesCanvas = null;
    }

    const container = document.getElementById('automation-shader');
    if (!container) return;

    container.innerHTML = '';

    async function start() {
        const currentContainer = document.getElementById('automation-shader');
        if (!currentContainer) return;

        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }
        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Automatización Cubes: Container has no dimensions after waiting.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        currentContainer.appendChild(canvas);
        cubesCanvas = canvas;

        sceneHandle = createHexCubesScene(canvas, currentContainer);
    }

    start();
}
