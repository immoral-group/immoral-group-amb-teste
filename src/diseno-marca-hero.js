import { createDesignShaderScene } from './design-shader-scene.js';

let sceneHandle = null;

export function initDisenoMarcaHero() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }

    const container = document.getElementById('diseno-marca-shader');
    if (!container) return;

    container.innerHTML = '';
    sceneHandle = createDesignShaderScene(container);
}
