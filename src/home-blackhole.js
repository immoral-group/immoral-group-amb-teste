import { createBlackholeScene } from './blackhole-scene.js';

// Replaces the "glassmorphlandingpage" Spline iframe in the home CTA section
// with the blackhole WebGL background, scoped to its own container.
let sceneHandle = null;

export function initHomeBlackhole() {
    if (sceneHandle) {
        sceneHandle.dispose();
        sceneHandle = null;
    }

    const container = document.getElementById('home-blackhole');
    if (!container) return;

    container.innerHTML = '';
    sceneHandle = createBlackholeScene(container);
}
