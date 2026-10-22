import gsap from 'gsap';

// Footer wordmark: the brand animation ("immoral", then the bar that crosses
// it) is played by the scroll, frame by frame, over the last stretch of the page.
// public/imgs/logo-footer.webm has a keyframe on every frame, so any of them
// seeks at once. Without motion the static SVG next to it stays (.js-motion).
// Shared by the home (src/home-prisma.js) and the inner pages (src/prisma-site.js).
const FPS = 25;
// Only frames 2–8 move (the bar crossing the word); the rest are a still hold.
const FROM = 2;
const TO = 8;
// The motion is tied to the end of the page (the footer is the last thing on it),
// not to a ScrollTrigger range: the home's layout settles after its triggers are
// measured and that shifted the start by hundreds of px. It plays over the last
// RUN px of scroll, so the mark is already fully in view when it starts.
const RUN_MIN = 120;
const RUN_OF_MARK = 0.55;

export function footMark() {
    const video = document.querySelector('.foot__anim');
    if (!video) return;
    let wanted = FROM, shown = -1;
    // One seek at a time: while one is running, the latest frame asked for waits.
    const seek = () => {
        if (video.readyState < 1 || video.seeking || wanted === shown) return;
        shown = wanted;
        video.currentTime = (wanted + 0.5) / FPS;
    };
    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('seeked', seek);

    const state = { p: 0 };
    const target = () => {
        const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
        const run = Math.max(RUN_MIN, video.getBoundingClientRect().height * RUN_OF_MARK);
        return Math.min(1, Math.max(0, 1 - left / run));
    };
    const update = () => {
        gsap.to(state, {
            p: target(), duration: 0.4, ease: 'power2.out', overwrite: true,
            onUpdate: () => { wanted = Math.round(FROM + state.p * (TO - FROM)); seek(); },
        });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}
