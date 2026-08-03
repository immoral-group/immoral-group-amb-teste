import { createHexCubesScene } from './hex-cubes-scene.js';

// Replaces the old Spline iframe in publicidad-en-medios.html with the hex-cubes
// WebGL background, scoped to its own container (not the full window).
let sceneHandle = null;
let cubesCanvas = null;

export function initPublicidadMediosCubes() {
    // --- CLEANUP previous instance (matches the site's other init*() conventions) ---
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }
    if (cubesCanvas) {
        cubesCanvas.remove();
        cubesCanvas = null;
    }

    const container = document.getElementById('publi-medios-cubes');
    if (!container) return;

    container.innerHTML = '';

    async function start() {
        const currentContainer = document.getElementById('publi-medios-cubes');
        if (!currentContainer) return;

        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }
        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Publicidad Medios Cubes: Container has no dimensions after waiting.');
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
