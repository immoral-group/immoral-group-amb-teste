import { createAutomationShaderScene } from './automation-shader-scene.js';

let sceneHandle = null;

export function initAutomatizacionHero() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }

    const container = document.getElementById('automation-shader');
    const textBlock = document.querySelector('#hero-start .max-w-5xl');
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    container.innerHTML = '';
    sceneHandle = createAutomationShaderScene(container, textBlock);
}
