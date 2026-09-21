export function initIncluyeCarousel() {
    const track = document.getElementById('incluye-track');
    const prevBtn = document.getElementById('incluye-prev');
    const nextBtn = document.getElementById('incluye-next');
    const dotsContainer = document.getElementById('incluye-dots');
    if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    const slides = track.querySelectorAll('.incluye-slide');
    if (!slides.length) return;

    dotsContainer.innerHTML = '';
    const dots = Array.from(slides).map((_, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Ir al bloque ${i + 1}`);
        dot.className = 'incluye-dot w-2 h-2 rounded-full transition-colors duration-300';
        dotsContainer.appendChild(dot);
        dot.addEventListener('click', () => goTo(i));
        return dot;
    });

    let current = 0;

    function updateDots() {
        dots.forEach((dot, i) => {
            dot.classList.toggle('bg-[#2f80ed]', i === current);
            dot.classList.toggle('bg-black/15', i !== current);
        });
    }

    function goTo(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        updateDots();
    }

    newNextBtn.addEventListener('click', () => goTo(current + 1));
    newPrevBtn.addEventListener('click', () => goTo(current - 1));

    goTo(0);
}
