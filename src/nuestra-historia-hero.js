import { createHistoriaHeroScene } from './historia-hero-scene.js';

let sceneHandle = null;

export function initNuestraHistoriaHero() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }

    const container = document.getElementById('historia-hero-bg');
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    container.innerHTML = '';
    sceneHandle = createHistoriaHeroScene(container);
}
