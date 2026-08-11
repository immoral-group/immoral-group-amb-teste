export function initHablemosScroll(sectionSelector, videoSelector) {
    const section = document.querySelector(sectionSelector);
    const video = document.querySelector(videoSelector);
    if (!section || !video) return;

    function showVideo() {
        video.currentTime = 0;
        video.classList.remove('opacity-0');
        video.classList.add('opacity-100');
        video.play();
    }

    function hideVideo() {
        video.classList.remove('opacity-100');
        video.classList.add('opacity-0');
    }

    video.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' && video.classList.contains('opacity-0')) {
            video.pause();
        }
    });

    // threshold: 0 -> se activa en cuanto un solo píxel del footer entra en el
    // viewport (no hace falta scrollear hasta ver un 30% de un footer largo).
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                showVideo();
            } else {
                hideVideo();
            }
        });
    }, { threshold: 0 });

    observer.observe(section);
}
