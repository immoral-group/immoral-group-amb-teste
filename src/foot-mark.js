import gsap from 'gsap';

// Footer wordmark: the brand animation ("immoral", then the bar that crosses
// it) is played by the scroll, frame by frame, as the mark comes into view.
// public/imgs/logo-footer.webm has a keyframe on every frame, so any of them
// seeks at once. Without motion the static SVG next to it stays (.js-motion).
// Shared by the home (src/home-prisma.js) and the inner pages (src/prisma-site.js).
const FRAMES = 33;
const FPS = 25;

export function footMark() {
    const video = document.querySelector('.foot__anim');
    if (!video) return;
    let wanted = 0, shown = -1;
    // One seek at a time: while one is running, the latest frame asked for waits.
    const seek = () => {
        if (video.readyState < 1 || video.seeking || wanted === shown) return;
        shown = wanted;
        video.currentTime = (wanted + 0.5) / FPS;
    };
    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('seeked', seek);
    const state = { p: 0 };
    gsap.to(state, {
        p: 1, ease: 'none',
        scrollTrigger: { trigger: '.foot__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 },
        onUpdate: () => { wanted = Math.round(state.p * (FRAMES - 1)); seek(); },
    });
}
