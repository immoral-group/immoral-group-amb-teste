import { createHexCubesScene } from './hex-cubes-scene.js';

// Reutiliza el grid de cubos de Diseño de Marca / Publicidad en Medios para la
// imagen junto a "Misión" en manifesto.html, pero en modo no interactivo: la
// cámara se queda fija en su composición inicial (sin auto-rotación ni
// arrastre) — solo los cubos siguen animando su elevación, como pidió el
// usuario ("que se mueva los cuadrados como esta ahora", sin que la pieza
// entera gire sola).
let sceneHandle = null;
let cubesCanvas = null;

export function initManifestoMisionCubes() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }
    if (cubesCanvas) {
        cubesCanvas.remove();
        cubesCanvas = null;
    }

    const container = document.getElementById('manifesto-mision-cubes');
    if (!container) return;

    container.innerHTML = '';

    async function start() {
        const currentContainer = document.getElementById('manifesto-mision-cubes');
        if (!currentContainer) return;

        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }
        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Manifesto Misión Cubes: Container has no dimensions after waiting.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        currentContainer.appendChild(canvas);
        cubesCanvas = canvas;

        // Misma distancia que el hero de Diseño de Marca, pero con un ángulo
        // mucho más cenital (vista desde arriba) en vez del ángulo bajo/oblicuo
        // original — pedido explícito del usuario.
        sceneHandle = createHexCubesScene(canvas, currentContainer, {
            interactive: false,
            cameraPosition: [3.6, 15.5, 4.3],
        });
    }

    start();
}
