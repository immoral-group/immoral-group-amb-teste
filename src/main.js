import './style.css'
import { initLoader } from './loader.js';
import { initHeroAnimation } from './hero-animation.js';
import { initFAQAccordion } from './faq-accordion.js';
import { initFooter } from './footer.js';
import { renderTeamMembers } from './team.js';
import { renderJobOpenings } from './jobOpenings.js';
import { renderPartnerLogos } from './partnerLogos.js';
import { initHablemosHover } from './hablemos-hover.js';
import { initPublicidadMediosCubes } from './publicidad-medios-cubes.js';
import { initHomeBlackhole } from './home-blackhole.js';
import { initMarbleReveal } from './marble-reveal.js';
import { initDisenoMarcaHero } from './diseno-marca-hero.js';
import { initComoLoHacemosScroll } from './como-lo-hacemos-scroll.js';
import { initDisenoScrollVideos } from './diseno-scroll-videos.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Initialize Loader
initLoader();

// Initial Hero Animation setup
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Content Loaded - Initializing scripts");

    try { initHeroAnimation(); } catch (e) { console.error("Error in initHeroAnimation:", e); }
    try { initEmailHero(); } catch (e) { console.error("Error in initEmailHero:", e); }
    try { initServicesCarousel(); } catch (e) { console.error("Error in initServicesCarousel:", e); }
    try { initMarbleReveal(); } catch (e) { console.error("Error in initMarbleReveal:", e); }

    try {
        console.log("Attaching contact form listener...");
        initContactForm();
    } catch (e) {
        console.error("Error in initContactForm:", e);
    }
});

function initContactForm() {
    const form = document.getElementById('contactForm');
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar estado previo
        statusDiv.classList.add('hidden');
        statusDiv.classList.remove('text-red-500', 'text-green-500');
        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = 'ENVIANDO...';

        const formData = new FormData(form);
        const jsonData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });

            const result = await response.json();

            if (response.ok) {
                statusDiv.innerText = 'Mensaje enviado correctamente. Nos pondremos en contacto pronto.';
                statusDiv.classList.add('text-green-500');
                statusDiv.classList.remove('hidden');
                form.reset();
            } else {
                throw new Error(result.message || 'Error al enviar el mensaje');
            }
        } catch (error) {
            console.error('Error:', error);
            statusDiv.innerText = 'Hubo un error al enviar el mensaje. Por favor intenta de nuevo.';
            statusDiv.classList.add('text-red-500');
            statusDiv.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
}

function initDropdowns() {
    const setupDropdown = (btnId, dropdownId) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        let newDropdown = newBtn.querySelector(`#${dropdownId}`);

        if (!newDropdown) {
            const dropdown = document.getElementById(dropdownId);
            if (dropdown) {
                newDropdown = dropdown.cloneNode(true);
                dropdown.parentNode.replaceChild(newDropdown, dropdown);
            }
        }

        if (!newDropdown) return;

        let timeout;
        const show = () => {
            clearTimeout(timeout);
            newDropdown.classList.remove('hidden');
        };
        const hide = () => {
            timeout = setTimeout(() => {
                newDropdown.classList.add('hidden');
            }, 200);
        };

        newBtn.addEventListener('mouseenter', show);
        newBtn.addEventListener('mouseleave', hide);
        newDropdown.addEventListener('mouseenter', show);
        newDropdown.addEventListener('mouseleave', hide);
    };

    setupDropdown('dropdownButton', 'dropdown');
    setupDropdown('dropdownButton2', 'dropdown2');
    setupDropdown('dropdownButton3', 'dropdown3');
}

// --- 2. FUNCIÓN DEL MENÚ ---
function initMenu() {
    const mobileMenuOpenBtn = document.getElementById('mobileMenuOpenBtn');
    const mobileMenuCloseBtn = document.getElementById('mobileMenuCloseBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileSubmenuButtons = document.querySelectorAll('[data-target]');

    if (mobileMenuOpenBtn) {
        const newBtn = mobileMenuOpenBtn.cloneNode(true);
        mobileMenuOpenBtn.parentNode.replaceChild(newBtn, mobileMenuOpenBtn);
        newBtn.addEventListener('click', () => {
            if (mobileMenuOverlay) {
                mobileMenuOverlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';

                gsap.fromTo(mobileMenuOverlay,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: "power2.out" }
                );

                const menuItems = mobileMenuOverlay.querySelectorAll('.border-b, a[href="#"]');
                gsap.fromTo(menuItems,
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.4, stagger: 0.02, ease: "power2.out", delay: 0.1 }
                );
            }
        });
    }

    if (mobileMenuCloseBtn) {
        const newBtn = mobileMenuCloseBtn.cloneNode(true);
        mobileMenuCloseBtn.parentNode.replaceChild(newBtn, mobileMenuCloseBtn);
        newBtn.addEventListener('click', () => {
            if (mobileMenuOverlay) {
                gsap.to(mobileMenuOverlay, {
                    opacity: 0,
                    duration: 0.25,
                    ease: "power2.in",
                    onComplete: () => {
                        mobileMenuOverlay.classList.add('hidden');
                        document.body.style.overflow = '';
                    }
                });
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOverlay && !mobileMenuOverlay.classList.contains('hidden')) {
            gsap.to(mobileMenuOverlay, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => {
                    mobileMenuOverlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
            });
        }
    });

    mobileSubmenuButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', () => {
            const targetId = newBtn.getAttribute('data-target');
            const targetSubmenu = document.getElementById(targetId);
            const arrow = newBtn.querySelector('.arrow-icon');

            if (targetSubmenu) {
                const isExpanded = newBtn.getAttribute('aria-expanded') === 'true';
                if (isExpanded) {
                    gsap.to(targetSubmenu, {
                        height: 0,
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.inOut",
                        onComplete: () => {
                            targetSubmenu.classList.add('hidden');
                            targetSubmenu.style.height = '';
                            targetSubmenu.style.opacity = '';
                        }
                    });
                    newBtn.setAttribute('aria-expanded', 'false');
                    if (arrow) {
                        gsap.to(arrow, { rotation: 0, duration: 0.3, ease: "power2.inOut" });
                    }
                } else {
                    targetSubmenu.classList.remove('hidden');
                    const fullHeight = targetSubmenu.scrollHeight;
                    gsap.fromTo(targetSubmenu,
                        { height: 0, opacity: 0 },
                        {
                            height: fullHeight, opacity: 1, duration: 0.4, ease: "power2.out", onComplete: () => {
                                targetSubmenu.style.height = 'auto';
                            }
                        }
                    );
                    newBtn.setAttribute('aria-expanded', 'true');
                    if (arrow) {
                        gsap.to(arrow, { rotation: 180, duration: 0.3, ease: "power2.inOut" });
                    }
                }
            }
        });
    });

    const nav = document.querySelector('nav.hidden.xl\\:flex');
    const logoImg = nav?.querySelector('div:first-child img');
    const navLinksContainer = nav?.querySelector('.list-none');
    const navArrows = navLinksContainer?.querySelectorAll('img[alt="arrowDown"]');

    if (nav && logoImg && navLinksContainer) {
        const isInitialDark = logoImg.src.includes('logo-menu-oscuro.png');

        const handleScroll = () => {
            if (window.scrollY > 50) {
                if (!isInitialDark) {
                    // Caso: Empieza Blanco -> Scroll -> Fondo Blur Negro, Mantiene Blanco
                    nav.classList.add('backdrop-blur-md', 'bg-black/70', 'shadow-sm');
                    nav.classList.remove('bg-transparent');

                    // Asegurar elementos blancos
                    logoImg.src = '/imgs/Menues/logo-menu-claro.png';
                    navLinksContainer.classList.add('text-white');
                    navLinksContainer.classList.remove('text-black');
                    if (navArrows) navArrows.forEach(arrow => arrow.classList.remove('invert'));
                } else {
                    // Caso: Empieza Oscuro -> Scroll -> Fondo Blur Blanco, Mantiene Negro
                    nav.classList.add('backdrop-blur-md', 'bg-white/50', 'shadow-sm');
                    nav.classList.remove('bg-transparent');
                    logoImg.src = '/imgs/Menues/logo-menu-oscuro.png';
                    navLinksContainer.classList.remove('text-white');
                    navLinksContainer.classList.add('text-black');
                    if (navArrows) navArrows.forEach(arrow => arrow.classList.add('invert'));
                }
            } else {
                nav.classList.remove('backdrop-blur-md', 'bg-white/50', 'bg-black/70', 'shadow-sm');
                nav.classList.add('bg-transparent');

                if (!isInitialDark) {
                    logoImg.src = '/imgs/Menues/logo-menu-claro.png';
                    navLinksContainer.classList.add('text-white');
                    navLinksContainer.classList.remove('text-black');
                    if (navArrows) navArrows.forEach(arrow => arrow.classList.remove('invert'));
                } else {
                    if (navArrows) navArrows.forEach(arrow => arrow.classList.add('invert'));
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
    }

    // FIX: Cerrar menú al hacer click en cualquier link
    const menuLinks = mobileMenuOverlay?.querySelectorAll('a[href]:not([data-target])');
    if (menuLinks) {
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenuOverlay && !mobileMenuOverlay.classList.contains('hidden')) {
                    gsap.to(mobileMenuOverlay, {
                        opacity: 0,
                        duration: 0.25,
                        ease: "power2.in",
                        onComplete: () => {
                            mobileMenuOverlay.classList.add('hidden');
                            document.body.style.overflow = '';
                        }
                    });
                }
            });
        });
    }
}

// --- 3. FUNCIÓN CÓMO LO HACEMOS ---
function initHowWeDo() {
    const processItems = document.querySelectorAll('.proceso-item');
    const processImage = document.querySelector('img[alt="imagen de como hacemos 1"]');

    if (processItems.length > 0 && processImage) {
        processItems.forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);

            newItem.addEventListener('mouseenter', () => {
                document.querySelectorAll('.proceso-item').forEach(i => {
                    const sub = i.querySelector('.proceso-subtitulo');
                    if (sub) sub.classList.add('hidden');
                });

                const sub = newItem.querySelector('.proceso-subtitulo');
                if (sub) sub.classList.remove('hidden');

                const processId = newItem.getAttribute('data-proceso');
                processImage.src = `/imgs/img-como-hacemos-${processId}.webp`;
            });
        });
    }
}

// --- 4. FUNCIÓN TESTIMONIOS SIMPLES ---
function initSimpleTestimonials() {
    const track = document.querySelector('.testimonials-track');
    const prevBtn = document.getElementById('simple-testimonials-prev');
    const nextBtn = document.getElementById('simple-testimonials-next');

    if (track && prevBtn && nextBtn) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        const cards = document.querySelectorAll('.testimonial-card');
        if (cards.length > 0) {
            let currentIndex = 0;
            const updateCarousel = () => {
                const cardWidth = cards[0].offsetWidth + 24;
                const translateX = -(currentIndex * cardWidth);
                track.style.transform = `translateX(${translateX}px)`;
            };

            newNextBtn.addEventListener('click', () => {
                if (currentIndex < cards.length - 1) {
                    currentIndex++;
                } else {
                    currentIndex = 0;
                }
                updateCarousel();
            });

            newPrevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    currentIndex--;
                } else {
                    currentIndex = cards.length - 1;
                }
                updateCarousel();
            });

            window.addEventListener('resize', updateCarousel);
        }
    }
}

// --- 5. FUNCIÓN CALENDLY ---
function initCalendly() {
    if (document.querySelector('.calendly-inline-widget')) {
        const script = document.createElement('script');
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.async = true;
        document.body.appendChild(script);
    }
}

// --- 6. CARRUSEL INFINITO LOGOS ---
function initCarousel() {
    const carousel = document.querySelector('.carousel-container');
    const logosContainer = document.querySelector('.logos-container');
    if (!carousel || !logosContainer) return;

    if (logosContainer.getAttribute('data-initialized') === 'true') return;

    const originalLogos = logosContainer.innerHTML;
    logosContainer.innerHTML = originalLogos + originalLogos;
    logosContainer.setAttribute('data-initialized', 'true');

    let currentPosition = 0;
    const speed = 0.5;
    let isPaused = false;
    let animationId;

    function animateCarousel() {
        if (!isPaused) {
            currentPosition -= speed;
            const containerWidth = logosContainer.scrollWidth / 2;
            if (Math.abs(currentPosition) >= containerWidth) currentPosition = 0;
            logosContainer.style.transform = `translateX(${currentPosition}px)`;
        }
        animationId = requestAnimationFrame(animateCarousel);
    }

    carousel.addEventListener('mouseenter', () => isPaused = true);
    carousel.addEventListener('mouseleave', () => isPaused = false);

    const logos = logosContainer.querySelectorAll('img');
    logos.forEach(logo => {
        logo.addEventListener('mouseenter', () => isPaused = true);
        logo.addEventListener('mouseleave', () => isPaused = false);
    });

    animateCarousel();
}

// --- 7. TEAM CAROUSEL ---
async function initTeamCarousel() {
    const carouselRight = document.querySelector('.team-carousel-container-right');
    const trackRight = document.querySelector('.team-carousel-track-right');
    const carouselLeft = document.querySelector('.team-carousel-container-left');
    const trackLeft = document.querySelector('.team-carousel-track-left');

    if (!carouselRight || !trackRight || !carouselLeft || !trackLeft) return;

    // El equipo se carga dinámicamente desde Supabase (SPEC-08) antes de
    // arrancar la animación, para que scrollWidth ya refleje el contenido real.
    await renderTeamMembers(trackRight, trackLeft);

    let currentPositionRight = 0;
    const speedRight = 0.8;
    let currentPositionLeft = -(trackLeft.scrollWidth / 2);
    const speedLeft = 0.8;

    function animateTeamCarouselRight() {
        currentPositionRight -= speedRight;
        const trackWidth = trackRight.scrollWidth / 2;
        if (Math.abs(currentPositionRight) >= trackWidth) currentPositionRight += trackWidth;
        trackRight.style.transform = `translateX(${currentPositionRight}px)`;
        requestAnimationFrame(animateTeamCarouselRight);
    }

    function animateTeamCarouselLeft() {
        currentPositionLeft += speedLeft;
        const trackWidth = trackLeft.scrollWidth / 2;
        if (currentPositionLeft >= 0) currentPositionLeft = -trackWidth;
        trackLeft.style.transform = `translateX(${currentPositionLeft}px)`;
        requestAnimationFrame(animateTeamCarouselLeft);
    }

    animateTeamCarouselRight();
    animateTeamCarouselLeft();
}

// --- 7.5. OFERTAS ACTIVAS (equipo.html) ---
function initJobOpenings() {
    const grid = document.getElementById('job-openings-grid');
    if (!grid) return;
    renderJobOpenings(grid);
}

// --- 7.6. BARRA DE LOGOS DE PARTNERS/HERRAMIENTAS (index.html) ---
function initPartnerLogos() {
    const track = document.getElementById('partner-logos-track');
    if (!track) return;
    renderPartnerLogos(track);
}

// --- 8. CASOS DE ÉXITO GRID FILTER ---
function initCasosFilter() {
    const grid = document.getElementById('casos-grid');
    const filters = document.getElementById('casos-filters');
    const cards = document.querySelectorAll('.case-card');
    const countLabel = document.getElementById('casos-count');
    const emptyState = document.getElementById('casos-empty');

    if (!grid || !filters || cards.length === 0) return;

    const activeFilters = { sector: 'todos', resultado: 'todos' };

    function applyFilters() {
        let visibleCount = 0;

        cards.forEach(card => {
            const matchesSector = activeFilters.sector === 'todos' || card.dataset.sector === activeFilters.sector;
            const matchesResultado = activeFilters.resultado === 'todos' || card.dataset.resultado === activeFilters.resultado;
            const isVisible = matchesSector && matchesResultado;

            card.classList.toggle('hidden', !isVisible);
            if (isVisible) visibleCount++;
        });

        countLabel.textContent = `Mostrando ${visibleCount} de ${cards.length} casos`;
        emptyState.classList.toggle('hidden', visibleCount !== 0);
    }

    filters.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;

        const group = pill.dataset.filterGroup;
        const value = pill.dataset.filterValue;
        activeFilters[group] = value;

        filters.querySelectorAll(`.filter-pill[data-filter-group="${group}"]`).forEach(btn => {
            btn.classList.toggle('is-active', btn === pill);
        });

        applyFilters();
    });

    applyFilters();
}

// --- 9. TESTIMONIALS CAROUSEL ---
function initTestimonialsCarousel() {
    const container = document.getElementById('testimonials-carousel');
    const track = document.querySelector('.testimonials-track');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('testimonials-prev');
    const nextBtn = document.getElementById('testimonials-next');

    if (!container || !track || slides.length === 0) return;

    let currentTranslateX = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let initialTransform = 0;
    let slideWidth = 0;
    let maxTranslateX = 0;
    let minTranslateX = 0;
    let hasDragged = false;
    const dragThreshold = 5;
    let autoplayInterval;
    let currentSlideIndex = 0;

    function calculateDimensions() {
        slideWidth = container.offsetWidth;
        maxTranslateX = 0;
        minTranslateX = -(slideWidth * (slides.length - 1));
    }

    function updateCarousel() {
        track.style.transform = `translateX(${currentTranslateX}px)`;
    }

    function nextSlide() {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        currentTranslateX = -currentSlideIndex * slideWidth;
        track.style.transition = 'transform 0.3s ease-out';
        updateCarousel();
        setTimeout(() => track.style.transition = 'none', 300);
    }

    function prevSlide() {
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        currentTranslateX = -currentSlideIndex * slideWidth;
        track.style.transition = 'transform 0.3s ease-out';
        updateCarousel();
        setTimeout(() => track.style.transition = 'none', 300);
    }

    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    function snapToClosestSlide() {
        const slideIndex = Math.round(-currentTranslateX / slideWidth);
        const targetTranslateX = -slideIndex * slideWidth;
        currentTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, targetTranslateX));
        currentSlideIndex = Math.round(-currentTranslateX / slideWidth);
        track.style.transition = 'transform 0.3s ease-out';
        updateCarousel();
        setTimeout(() => track.style.transition = 'none', 300);
    }

    function handleMouseDown(e) {
        isDragging = true;
        hasDragged = false;
        startX = e.clientX;
        currentX = e.clientX;
        initialTransform = currentTranslateX;
        container.style.cursor = 'grabbing';
        track.style.transition = 'none';
        stopAutoplay();
        e.preventDefault();
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        currentX = e.clientX;
        const deltaX = currentX - startX;
        if (Math.abs(deltaX) > dragThreshold) hasDragged = true;
        currentTranslateX = initialTransform + deltaX;
        currentTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, currentTranslateX));
        updateCarousel();
    }

    function handleMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        container.style.cursor = 'grab';
        if (hasDragged) snapToClosestSlide();
        startAutoplay();
    }

    function handleTouchStart(e) {
        isDragging = true;
        hasDragged = false;
        startX = e.touches[0].clientX;
        currentX = e.touches[0].clientX;
        initialTransform = currentTranslateX;
        track.style.transition = 'none';
        stopAutoplay();
    }
    function handleTouchMove(e) {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        if (Math.abs(deltaX) > dragThreshold) hasDragged = true;
        currentTranslateX = initialTransform + deltaX;
        currentTranslateX = Math.max(minTranslateX, Math.min(maxTranslateX, currentTranslateX));
        updateCarousel();
    }
    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        if (hasDragged) snapToClosestSlide();
        startAutoplay();
    }

    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => {
            stopAutoplay();
            prevSlide();
            startAutoplay();
        });
    }
    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => {
            stopAutoplay();
            nextSlide();
            startAutoplay();
        });
    }

    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    window.addEventListener('resize', () => {
        calculateDimensions();
        snapToClosestSlide();
    });

    calculateDimensions();
    updateCarousel();
    startAutoplay();
}

// --- 10. STACKING CARDS ---
function initStackingCards() {
    const triggers = document.querySelectorAll('.scroll-trigger');
    const cards = document.querySelectorAll('.stacking-card');
    if (!triggers.length || !cards.length) return;

    let currentCard = -1;
    let maxCardReached = -1;
    let lastScrollY = window.scrollY;
    let scrollDirection = 'down';
    let lastTriggerReached = false;

    function updateCardsOnScroll() {
        const currentScrollY = window.scrollY;
        scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
        lastScrollY = currentScrollY;
        const viewportHeight = window.innerHeight;
        let activeCard = -1;

        triggers.forEach((trigger, index) => {
            const rect = trigger.getBoundingClientRect();
            const triggerCenter = rect.top + rect.height / 2;
            if (triggerCenter >= 0 && triggerCenter <= viewportHeight) {
                activeCard = index;
                if (index === triggers.length - 1) lastTriggerReached = true;
                if (scrollDirection === 'up' && index === triggers.length - 1 && lastTriggerReached) {
                    lastTriggerReached = false;
                    maxCardReached = index;
                }
            }
        });

        if (lastTriggerReached) {
            activeCard = cards.length - 1;
        } else if (activeCard === -1) {
            const lastTrigger = triggers[triggers.length - 1];
            const lastTriggerRect = lastTrigger.getBoundingClientRect();
            const stackingSection = document.querySelector('.stacking-cards-container').closest('section');
            const sectionRect = stackingSection.getBoundingClientRect();

            if (scrollDirection === 'down' && lastTriggerRect.bottom < 0) {
                activeCard = cards.length - 1;
            } else if (scrollDirection === 'up' && sectionRect.bottom < -viewportHeight) {
                activeCard = -1;
            } else if (lastTriggerRect.bottom < 0 && sectionRect.bottom > -viewportHeight) {
                activeCard = cards.length - 1;
            }
        }

        if (activeCard > maxCardReached) maxCardReached = activeCard;
        else if (activeCard !== -1 && activeCard < maxCardReached && scrollDirection === 'up' && !lastTriggerReached) maxCardReached = activeCard;

        if (activeCard !== currentCard) {
            currentCard = activeCard;
            cards.forEach((card, index) => {
                card.classList.remove('card-hidden', 'card-visible', 'card-stacked', 'card-final');
                card.style.zIndex = index + 1;
                if (activeCard !== -1) {
                    if (index === currentCard) {
                        if (currentCard === cards.length - 1) card.classList.add('card-final');
                        else card.classList.add('card-visible');
                    } else {
                        card.classList.add('card-hidden');
                    }
                } else {
                    card.classList.add('card-hidden');
                }
            });
        }
    }

    window.addEventListener('scroll', () => requestAnimationFrame(updateCardsOnScroll));
    updateCardsOnScroll();
    updateCardsOnScroll();
}

// --- 10.5. FUNCIÓN GESTION HERO SCROLL ---
function initGestionHero() {
    // Solo ejecutar si existe el elemento en el DOM actual
    if (!document.getElementById("hero-pin")) return;

    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
        // Horizontal Scroll only on Desktop
        let heroContent = document.getElementById("hero-content");

        if (heroContent) {
            let tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#hero-pin",
                    pin: true,
                    scrub: 1,
                    snap: 0,
                    end: "+=2000"
                }
            });

            tl.to(heroContent, {
                xPercent: -50,
                ease: "none",
            }, 0); // Start at time 0

            let heroBg = document.getElementById("hero-bg");
            if (heroBg) {
                tl.to(heroBg, {
                    xPercent: -50, // Move background with content
                    ease: "none",
                }, 0); // Sync with content
            }
        }
    });

    // Add floating animation CSS if not exists
    if (!document.getElementById('gestion-hero-styles')) {
        const style = document.createElement('style');
        style.id = 'gestion-hero-styles';
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
                100% { transform: translateY(0px); }
            }
            .animate-float-slow { animation: float 6s ease-in-out infinite; }
            .animate-float-medium { animation: float 5s ease-in-out infinite; }
            .animate-float-fast { animation: float 4s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    }
}

// --- 11. SERVICE EVENTS ---
function setupServiceEvents() {
    const serviceItems = document.querySelectorAll('.service-item');
    if (!serviceItems.length) return;

    function isDesktop() { return window.innerWidth >= 1280; }

    function activateService(activeItem) {
        const desktop = isDesktop();
        serviceItems.forEach(item => {
            const img = item.querySelector('img');
            const paragraph = item.querySelector('p');
            const link = item.querySelector('a');

            if (item === activeItem) {
                if (desktop) {
                    item.classList.remove('xl:w-[16.6%]');
                    item.classList.add('xl:w-[33.3%]');
                } else {
                    item.classList.remove('h-[120px]');
                    item.classList.add('h-[300px]');
                }
                img.classList.remove('blur-sm', 'grayscale');
                setTimeout(() => {
                    paragraph.classList.remove('hidden', 'opacity-0');
                    paragraph.classList.add('opacity-100');
                    link.classList.remove('hidden', 'opacity-0');
                    link.classList.add('opacity-100');
                }, 250);
            } else {
                paragraph.classList.add('hidden', 'opacity-0');
                paragraph.classList.remove('opacity-100');
                link.classList.add('hidden', 'opacity-0');
                link.classList.remove('opacity-100');
                if (desktop) {
                    item.classList.remove('xl:w-[33.3%]');
                    item.classList.add('xl:w-[16.6%]');
                } else {
                    item.classList.remove('h-[300px]');
                    item.classList.add('h-[120px]');
                }
                img.classList.add('blur-sm', 'grayscale');
            }
        });
    }

    serviceItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);

        newItem.addEventListener('mouseenter', () => { if (isDesktop()) activateService(newItem); });
        newItem.addEventListener('click', () => { if (!isDesktop()) activateService(newItem); });
    });

    const foundationService = document.querySelector('[data-service="foundation"]');
    if (foundationService) activateService(foundationService);
}

// --- 12. NAVIGATION COLOR SYSTEM ---
function initNavigationColorSystem() {
    const nav = document.getElementById('main-nav');
    const navLine = document.getElementById('nav-line');
    const serviciosBtn = document.getElementById('servicios-btn');
    const casosBtn = document.getElementById('casos-btn');
    const equipoBtn = document.getElementById('equipo-btn');
    const contactoBtn = document.getElementById('contacto-btn');

    if (!nav || !navLine || !serviciosBtn || !casosBtn || !equipoBtn || !contactoBtn) return;

    function getBackgroundBrightness() {
        const navRect = nav.getBoundingClientRect();
        const elementBehind = document.elementFromPoint(navRect.left + navRect.width / 2, navRect.top + navRect.height + 10);
        if (!elementBehind) return 255;

        if (elementBehind.closest('section') && (elementBehind.closest('section').classList.contains('bg-black') || elementBehind.closest('section').querySelector('img[src*="bg"]'))) {
            return 50;
        }

        const computedStyle = window.getComputedStyle(elementBehind);
        let backgroundColor = computedStyle.backgroundColor;
        let currentElement = elementBehind;
        let depth = 0;
        while ((backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') && depth < 10) {
            currentElement = currentElement.parentElement;
            if (!currentElement || currentElement === document.body) {
                backgroundColor = 'rgb(255, 255, 255)';
                break;
            }
            backgroundColor = window.getComputedStyle(currentElement).backgroundColor;
            depth++;
        }

        const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!rgbMatch) return 255;
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        return (r * 0.299 + g * 0.587 + b * 0.114);
    }

    function updateNavColors() {
        const brightness = getBackgroundBrightness();
        const isDarkBackground = brightness < 128;

        if (isDarkBackground) {
            navLine.classList.remove('bg-black');
            navLine.classList.add('bg-white');
            serviciosBtn.classList.remove('text-black');
            serviciosBtn.classList.add('text-white');
            casosBtn.classList.remove('text-black');
            casosBtn.classList.add('text-white');
            equipoBtn.classList.remove('text-black');
            equipoBtn.classList.add('text-white');
            contactoBtn.classList.remove('text-black');
            contactoBtn.classList.add('text-white');
        } else {
            navLine.classList.remove('bg-white');
            navLine.classList.add('bg-black');
            serviciosBtn.classList.remove('text-white');
            serviciosBtn.classList.add('text-black');
            casosBtn.classList.remove('text-white');
            casosBtn.classList.add('text-black');
            equipoBtn.classList.remove('text-white');
            equipoBtn.classList.add('text-black');
            contactoBtn.classList.remove('text-white');
            contactoBtn.classList.add('text-black');
        }
    }

    window.addEventListener('scroll', () => requestAnimationFrame(updateNavColors));
    updateNavColors();
}

// --- 13. MODAL EVENTS ---
function initModals() {
    const agendaLlamadaBtn = document.getElementById('agenda-llamada-btn');
    const agendaLlamadaMenu = document.getElementById('agenda-llamada-menu');
    const escribenosBtn = document.getElementById('escribenos-btn');
    const escribenosMenu = document.getElementById('escribenos-menu');

    function openAgendaModal() {
        const modalComponent = document.querySelector('modal-component');
        if (modalComponent) modalComponent.openAgendaModal();
    }

    function openEscribenosModal() {
        const modalComponent = document.querySelector('modal-component');
        if (modalComponent) modalComponent.openEscribenosModal();
    }

    if (agendaLlamadaBtn) {
        const newBtn = agendaLlamadaBtn.cloneNode(true);
        agendaLlamadaBtn.parentNode.replaceChild(newBtn, agendaLlamadaBtn);
        newBtn.addEventListener('click', (e) => { e.preventDefault(); openAgendaModal(); });
    }
    if (agendaLlamadaMenu) {
        const newBtn = agendaLlamadaMenu.cloneNode(true);
        agendaLlamadaMenu.parentNode.replaceChild(newBtn, agendaLlamadaMenu);
        newBtn.addEventListener('click', (e) => { e.preventDefault(); openAgendaModal(); });
    }
    if (escribenosBtn) {
        const newBtn = escribenosBtn.cloneNode(true);
        escribenosBtn.parentNode.replaceChild(newBtn, escribenosBtn);
        newBtn.addEventListener('click', (e) => { e.preventDefault(); openEscribenosModal(); });
    }
    if (escribenosMenu) {
        const newBtn = escribenosMenu.cloneNode(true);
        escribenosMenu.parentNode.replaceChild(newBtn, escribenosMenu);
        newBtn.addEventListener('click', (e) => { e.preventDefault(); openEscribenosModal(); });
    }
}

// --- 14. HERO PHYSICS ---
let physicsRunner = null;
let physicsRender = null;
let physicsEngine = null;

let physicsResizeHandler = null; // Variable para manejar el evento resize

function initHeroPhysics() {
    const container = document.getElementById('hero-physics');

    // --- CLEANUP (Limpieza robusta) ---
    // Detener y limpiar Runner anterior
    if (physicsRunner) {
        Matter.Runner.stop(physicsRunner);
        physicsRunner = null;
    }
    // Detener y limpiar Render anterior
    if (physicsRender) {
        Matter.Render.stop(physicsRender);
        if (physicsRender.canvas) {
            physicsRender.canvas.remove();
        }
        physicsRender.canvas = null;
        physicsRender.context = null;
        physicsRender.textures = {};
        physicsRender = null;
    }
    // Limpiar Engine y World anterior
    if (physicsEngine) {
        Matter.World.clear(physicsEngine.world);
        Matter.Engine.clear(physicsEngine);
        physicsEngine.events = {};
        physicsEngine = null;
    }
    // Remover Event Listener de Resize anterior
    if (physicsResizeHandler) {
        window.removeEventListener('resize', physicsResizeHandler);
        physicsResizeHandler = null;
    }

    // Si no hay contenedor en esta página, terminamos aquí (después de limpiar)
    if (!container) return;

    container.innerHTML = ''; // Asegurar que el contenedor esté vacío

    const WALL_THICKNESS = 60;
    // Detectar si es mobile
    const isMobile = window.innerWidth < 768;

    // Tamaños más pequeños en mobile
    const TEAM_CIRCLE_SIZE_MIN = isMobile ? 50 : 90;
    const TEAM_CIRCLE_SIZE_MAX = isMobile ? 70 : 130;
    const DOT_SIZE = isMobile ? 15 : 25;

    const TEAM_IMAGES = ['/imgs/port1.png', '/imgs/port2.png', '/imgs/port3.png', '/imgs/port4.png'];
    const DOT_COLORS = ['#3B82F6', '#67E8F9'];

    function processImage(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const size = 500;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
                resolve(canvas.toDataURL());
            };
            img.onerror = () => resolve(src);
            img.src = src;
        });
    }

    async function startPhysics() {
        // Verificar de nuevo si el contenedor existe (por si cambió la página durante el await)
        if (!document.getElementById('hero-physics')) return;

        const processedImages = await Promise.all(TEAM_IMAGES.map(processImage));

        // Verificar OTRA VEZ después del await
        const currentContainer = document.getElementById('hero-physics');
        if (!currentContainer) return;

        // ESPERAR A QUE EL CONTENEDOR TENGA DIMENSIONES (Fix para View Transitions)
        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }

        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Hero Physics: Container has no dimensions after waiting.');
            return;
        }

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            MouseConstraint = Matter.MouseConstraint,
            Mouse = Matter.Mouse,
            Events = Matter.Events;

        physicsEngine = Engine.create();
        const world = physicsEngine.world;

        physicsRender = Render.create({
            element: currentContainer,
            engine: physicsEngine,
            options: {
                width: currentContainer.clientWidth,
                height: currentContainer.clientHeight,
                background: 'transparent',
                wireframes: false,
                pixelRatio: window.devicePixelRatio
            }
        });

        const ground = Bodies.rectangle(currentContainer.clientWidth / 2, currentContainer.clientHeight + WALL_THICKNESS / 2, currentContainer.clientWidth, WALL_THICKNESS, { isStatic: true, render: { visible: false } });
        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, currentContainer.clientHeight / 2, WALL_THICKNESS, currentContainer.clientHeight * 5, { isStatic: true, render: { visible: false } });
        const rightWall = Bodies.rectangle(currentContainer.clientWidth + WALL_THICKNESS / 2, currentContainer.clientHeight / 2, WALL_THICKNESS, currentContainer.clientHeight * 5, { isStatic: true, render: { visible: false } });
        const topWall = Bodies.rectangle(currentContainer.clientWidth / 2, -WALL_THICKNESS * 2, currentContainer.clientWidth, WALL_THICKNESS, { isStatic: true, render: { visible: false } });

        Composite.add(world, [ground, leftWall, rightWall, topWall]);

        const bodies = [];
        processedImages.forEach((imgSrc) => {
            const radius = TEAM_CIRCLE_SIZE_MIN + Math.random() * (TEAM_CIRCLE_SIZE_MAX - TEAM_CIRCLE_SIZE_MIN);
            const x = Math.random() * (currentContainer.clientWidth * 0.3) + (currentContainer.clientWidth * 0.05);
            const y = Math.random() * (currentContainer.clientHeight / 2);
            const circle = Bodies.circle(x, y, radius, {
                restitution: 0.5,
                friction: 0.01,
                frictionAir: 0.005,
                render: { sprite: { texture: imgSrc, xScale: (radius * 2) / 500, yScale: (radius * 2) / 500 } }
            });
            bodies.push(circle);
        });

        for (let i = 0; i < 2; i++) {
            const radius = DOT_SIZE;
            const x = Math.random() * (currentContainer.clientWidth * 0.3) + (currentContainer.clientWidth * 0.05);
            const y = -Math.random() * 500 - 50;
            const color = DOT_COLORS[i % DOT_COLORS.length];
            const dot = Bodies.circle(x, y, radius, {
                restitution: 0.9,
                friction: 0.001,
                render: { fillStyle: color, strokeStyle: 'transparent' }
            });
            bodies.push(dot);
        }

        Composite.add(world, bodies);

        const mouse = Mouse.create(physicsRender.canvas);
        mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

        // SOLO crear MouseConstraint en desktop
        if (!isMobile) {
            const mouseConstraint = MouseConstraint.create(physicsEngine, {
                mouse: mouse,
                constraint: { stiffness: 0.2, render: { visible: false } }
            });
            Composite.add(world, mouseConstraint);
            physicsRender.mouse = mouse;

            // Evento de repulsión SOLO en desktop
            Events.on(physicsEngine, 'beforeUpdate', function () {
                const mousePosition = mouse.position;
                const repulsionRange = 150;
                const repulsionForce = 0.005;
                Composite.allBodies(world).forEach(body => {
                    if (body.isStatic) return;
                    const dx = body.position.x - mousePosition.x;
                    const dy = body.position.y - mousePosition.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < repulsionRange) {
                        const forceMagnitude = (1 - distance / repulsionRange) * repulsionForce;
                        Matter.Body.applyForce(body, body.position, {
                            x: (dx / distance) * forceMagnitude,
                            y: (dy / distance) * forceMagnitude
                        });
                    }
                });
            });
        } else {
            // En mobile, desactivar pointer events del canvas para permitir scroll
            if (physicsRender.canvas) {
                physicsRender.canvas.style.pointerEvents = 'none';
            }
        }

        Render.run(physicsRender);
        physicsRunner = Runner.create();
        Runner.run(physicsRunner, physicsEngine);

        // Definir el handler de resize
        physicsResizeHandler = () => {
            if (!physicsRender || !physicsRender.canvas || !currentContainer) return;
            physicsRender.canvas.width = currentContainer.clientWidth;
            physicsRender.canvas.height = currentContainer.clientHeight;
            Matter.Body.setPosition(ground, { x: currentContainer.clientWidth / 2, y: currentContainer.clientHeight + WALL_THICKNESS / 2 });
            Matter.Body.setPosition(rightWall, { x: currentContainer.clientWidth + WALL_THICKNESS / 2, y: currentContainer.clientHeight / 2 });
            Matter.Body.setPosition(topWall, { x: currentContainer.clientWidth / 2, y: -WALL_THICKNESS * 2 });
        };

        window.addEventListener('resize', physicsResizeHandler);
    }

    startPhysics();
}

// --- 14b. EQUIPO NETWORK (rejilla fija + foco que la recorre, "Nuestra Historia") ---
// Réplica del motion graphic de referencia: una rejilla de puntos fija (nunca se mueve) y un
// "foco" invisible que recorre TODA la rejilla en bucle; los puntos que quedan cerca del foco
// crecen y se conectan a él, los que se alejan vuelven a su tamaño mínimo. Es matemática pura
// (sin física ni colisiones), por eso ya no usa Matter.js para esta sección.
let networkFrameId = null;
let networkCanvas = null;
let networkResizeHandler = null;
let networkMouseCleanup = null;
let networkObserver = null;

function initEquipoNetwork() {
    const container = document.getElementById('equipo-network');

    // --- CLEANUP ---
    if (networkObserver) {
        networkObserver.disconnect();
        networkObserver = null;
    }
    if (networkFrameId) {
        cancelAnimationFrame(networkFrameId);
        networkFrameId = null;
    }
    if (networkResizeHandler) {
        window.removeEventListener('resize', networkResizeHandler);
        networkResizeHandler = null;
    }
    if (networkMouseCleanup) {
        networkMouseCleanup();
        networkMouseCleanup = null;
    }
    if (networkCanvas) {
        networkCanvas.remove();
        networkCanvas = null;
    }

    // En móvil no se anima con JS: el fallback CSS del HTML ya cubre esa vista
    if (!container || window.innerWidth < 768) return;

    container.innerHTML = '';

    async function startNetwork() {
        const currentContainer = document.getElementById('equipo-network');
        if (!currentContainer) return;

        let attempts = 0;
        while ((currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) && attempts < 50) {
            await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
            attempts++;
        }
        if (currentContainer.clientWidth === 0 || currentContainer.clientHeight === 0) {
            console.warn('Equipo Network: Container has no dimensions after waiting.');
            return;
        }

        let w = currentContainer.clientWidth;
        let h = currentContainer.clientHeight;

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 1s ease';
        currentContainer.appendChild(canvas);
        networkCanvas = canvas;
        const ctx = canvas.getContext('2d');

        function resizeCanvas() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        }
        resizeCanvas();
        requestAnimationFrame(() => { canvas.style.opacity = '1'; });

        // Puntos de la rejilla: pequeños, fijos, cubren todo el contenedor. Se recalculan si cambia el tamaño.
        const GRID_SPACING = Math.min(w, h) / 9;
        const DOT_RADIUS = 1.6;
        const ACTIVE_RADIUS_MAX = 6.5;
        const CORE_RADIUS = 8;
        const ACTIVATION_RADIUS = GRID_SPACING * 3.2;
        const HOVER_RADIUS = 46;
        const HOVER_BOOST = 1.7;

        // Margen mínimo respecto al borde superior: sin esto, la primera fila de puntos cae justo en el
        // borde del contenedor y se ve como si asomara "por debajo" de la foto de la sección de arriba.
        const TOP_MARGIN = 24;

        let gridPoints = [];
        function buildGrid() {
            const points = [];
            const offsetX = (w % GRID_SPACING) / 2;
            let offsetY = (h % GRID_SPACING) / 2;
            if (offsetY < TOP_MARGIN) offsetY += GRID_SPACING;
            for (let gx = offsetX; gx < w; gx += GRID_SPACING) {
                for (let gy = offsetY; gy < h; gy += GRID_SPACING) {
                    points.push({ x: gx, y: gy, displayScale: 1 });
                }
            }
            return points;
        }
        gridPoints = buildGrid();

        // Seguimiento propio del ratón (coordenadas CSS puras).
        // 'liveMouse' solo vale mientras el ratón está encima (para el boost puntual de hover).
        // 'stickyMouse' guarda la ÚLTIMA posición conocida y nunca se resetea al salir el ratón:
        // así el foco se queda "congelado" ahí en vez de volver a moverse solo.
        const liveMouse = { x: -9999, y: -9999 };
        const stickyMouse = { x: w / 2, y: h / 2 };
        let hasInteracted = false;
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            liveMouse.x = e.clientX - rect.left;
            liveMouse.y = e.clientY - rect.top;
            stickyMouse.x = liveMouse.x;
            stickyMouse.y = liveMouse.y;
            hasInteracted = true;
        };
        const handleMouseLeave = () => { liveMouse.x = -9999; liveMouse.y = -9999; };
        currentContainer.addEventListener('mousemove', handleMouseMove);
        currentContainer.addEventListener('mouseleave', handleMouseLeave);
        networkMouseCleanup = () => {
            currentContainer.removeEventListener('mousemove', handleMouseMove);
            currentContainer.removeEventListener('mouseleave', handleMouseLeave);
        };

        // El foco persigue al ratón (con inercia, no salto instantáneo). Antes del primer contacto
        // recorre un camino lento tipo Lissajous; en cuanto el usuario mueve el ratón por encima, el
        // foco lo sigue, y si el ratón sale de la sección, se queda quieto justo en su última posición.
        const FOCUS_EASE = 0.07;
        const focusPos = { x: w / 2, y: h / 2 };

        function draw(now) {
            const t = now / 1000;
            let targetX, targetY;
            if (hasInteracted) {
                // Sigue al ratón mientras se mueve, y se queda fijo en su última posición al salir
                targetX = stickyMouse.x;
                targetY = stickyMouse.y;
            } else {
                // Antes del primer contacto: recorrido lento por defecto
                targetX = w / 2 + Math.sin(t * 0.05) * (w * 0.32) + Math.sin(t * 0.021) * (w * 0.14);
                targetY = h / 2 + Math.cos(t * 0.037) * (h * 0.32) + Math.cos(t * 0.017) * (h * 0.1);
            }
            focusPos.x += (targetX - focusPos.x) * FOCUS_EASE;
            focusPos.y += (targetY - focusPos.y) * FOCUS_EASE;
            const focusX = focusPos.x, focusY = focusPos.y;

            ctx.clearRect(0, 0, w, h);

            // 1) Líneas del foco a los puntos cercanos: quedan debajo de los puntos
            ctx.save();
            gridPoints.forEach(p => {
                const dx = p.x - focusX, dy = p.y - focusY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < ACTIVATION_RADIUS) {
                    const proximity = 1 - dist / ACTIVATION_RADIUS;
                    ctx.globalAlpha = proximity * 0.4;
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(focusX, focusY);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            });
            ctx.restore();

            // 2) Puntos de la rejilla: crecen cuando el foco pasa cerca, y un poco más al pasar el ratón
            gridPoints.forEach(p => {
                const dx = p.x - focusX, dy = p.y - focusY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const proximity = dist < ACTIVATION_RADIUS ? (1 - dist / ACTIVATION_RADIUS) : 0;

                const hdx = p.x - liveMouse.x, hdy = p.y - liveMouse.y;
                const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
                const hoverT = hdist < HOVER_RADIUS ? (1 - hdist / HOVER_RADIUS) : 0;

                const targetRadius = DOT_RADIUS + proximity * (ACTIVE_RADIUS_MAX - DOT_RADIUS);
                const targetScale = 1 + hoverT * (HOVER_BOOST - 1);
                p.displayScale += (targetScale - p.displayScale) * 0.25;

                ctx.globalAlpha = 0.22 + proximity * 0.78;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(p.x, p.y, targetRadius * p.displayScale, 0, Math.PI * 2);
                ctx.fill();
            });

            // 3) El foco en sí: el punto más brillante, el "centro del equipo"
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(focusX, focusY, CORE_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            networkFrameId = requestAnimationFrame(draw);
        }
        networkFrameId = requestAnimationFrame(draw);

        networkResizeHandler = () => {
            if (!currentContainer) return;
            w = currentContainer.clientWidth;
            h = currentContainer.clientHeight;
            resizeCanvas();
            gridPoints = buildGrid();
        };
        window.addEventListener('resize', networkResizeHandler);
    }

    // Arranque perezoso: solo cuando la sección entra en viewport (mismo mecanismo que initScrollAnimations)
    networkObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startNetwork();
                obs.disconnect();
                networkObserver = null;
            }
        });
    }, { threshold: 0.2 });
    networkObserver.observe(container);
}

// --- 15. SCROLL ANIMATIONS ---
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animamos solo una vez
            }
        });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach(el => observer.observe(el));
}

// --- 17. IMMORAL ECOSYSTEM ---
// --- 17. IMMORAL ECOSYSTEM ---
function initImmoralEcosystem() {
    const section = document.getElementById('immoral-ecosystem');
    if (!section) return;

    const items = section.querySelectorAll('.brand-item');
    const bgImages = section.querySelectorAll('[data-bg]');
    const defaultBg = section.querySelector('[data-bg="default"]');

    items.forEach(item => {
        const target = item.dataset.target;
        const bg = section.querySelector(`[data-bg="${target}"]`);
        const body = item.querySelector('.brand-body');
        const header = item.querySelector('.brand-header');
        const logo = item.querySelector('img'); // New: Target logic on image

        const light = item.querySelector('.brand-light');

        // --- HOVER EFFECT: OPEN & SHOW ---
        item.addEventListener('mouseenter', () => {
            // 1. Mostrar Fondo
            bgImages.forEach(img => img.classList.add('opacity-0'));
            if (bg) bg.classList.remove('opacity-0');

            // 2. Abrir Descripción (Accordion)
            if (body) {
                body.classList.remove('grid-rows-[0fr]');
                body.classList.add('grid-rows-[1fr]');
            }
            // 3. Resaltar Logo (antes Header)
            if (logo) {
                logo.classList.remove('opacity-50');
                logo.classList.add('opacity-100');
            }
            // 4. Encender Luz (Glow)
            if (light) {
                light.classList.remove('animate-pulse');
                // Ensure pure opacity 1 and glow
                light.classList.add('opacity-100', 'shadow-[0_0_10px_rgba(255,255,255,0.8)]', 'scale-125');
            }
        });

        // --- MOUSE LEAVE: CLOSE & RESET ---
        item.addEventListener('mouseleave', () => {
            // 1. Resetear Fondo a Negro (Default)
            bgImages.forEach(img => img.classList.add('opacity-0'));
            if (defaultBg) defaultBg.classList.remove('opacity-0');

            // 2. Cerrar Descripción
            if (body) {
                body.classList.remove('grid-rows-[1fr]');
                body.classList.add('grid-rows-[0fr]');
            }
            // 3. Atenuar Logo (antes Header)
            if (logo) {
                logo.classList.remove('opacity-100');
                logo.classList.add('opacity-50');
            }
            // 4. Apagar Luz (Volver a Pulse)
            if (light) {
                light.classList.add('animate-pulse');
                // Remove glow and fixed opacity, let pulse handle it (pulse oscillates opacity)
                light.classList.remove('opacity-100', 'shadow-[0_0_10px_rgba(255,255,255,0.8)]', 'scale-125');
            }
        });
    });
}

// --- COUNTER NUMBER ANIMATION ---
function initCounters() {
    const counters = document.querySelectorAll('.counter-value');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: counter,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });

        const obj = { val: 0 };
        tl.to(obj, {
            val: target,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
                counter.innerText = Math.round(obj.val);
            }
        });
    });
}

// --- EMAIL HERO ANIMATION ---
function initEmailHero() {
    const section = document.querySelector('.email-hero-section');
    if (!section) return;

    const bg1 = section.querySelector('.bg-image-1');
    if (!bg1) return;

    // Una sola montaña que se acerca (zoom) a medida que se hace scroll por la sección.
    gsap.to(bg1, {
        scale: 1.6,
        ease: "none",
        scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
        }
    });
}

// --- SERVICES CAROUSEL ---
function initServicesCarousel() {
    const container = document.querySelector('.services-scroll-container');
    if (!container) return;

    const wrapper = container.parentElement;

    // Check if already initialized
    if (container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';

    const originalContent = container.innerHTML;
    container.innerHTML = originalContent + originalContent;

    const originalHeight = container.scrollHeight / 2;

    let isDragging = false;
    let startY = 0;
    let scrollOffset = 0;
    let currentOffset = 0;
    let velocity = 0;
    let lastY = 0;
    let lastTime = Date.now();
    let isAutoScrolling = true;

    function wrapPosition(offset) {
        if (offset < -originalHeight) return offset + originalHeight;
        if (offset > 0) return offset - originalHeight;
        return offset;
    }

    function setPosition(offset) {
        currentOffset = wrapPosition(offset);
        container.style.transform = `translateY(${currentOffset}px)`;
    }

    const autoScrollSpeed = -0.5;

    function autoScroll() {
        if (isAutoScrolling && !isDragging) {
            currentOffset = wrapPosition(currentOffset + autoScrollSpeed);
            container.style.transform = `translateY(${currentOffset}px)`;
        }
        requestAnimationFrame(autoScroll);
    }

    container.style.animation = 'none';
    autoScroll();

    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        isAutoScrolling = false;
        startY = e.clientY;
        scrollOffset = currentOffset;
        wrapper.style.cursor = 'grabbing';
        lastY = e.clientY;
        lastTime = Date.now();
        velocity = 0;
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        const newOffset = scrollOffset + deltaY;
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) velocity = (e.clientY - lastY) / dt * 15;
        lastY = e.clientY;
        lastTime = now;
        setPosition(newOffset);
        e.preventDefault();
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.style.cursor = 'grab';
        let momentumVelocity = velocity;
        function applyMomentum() {
            if (Math.abs(momentumVelocity) > 0.5) {
                currentOffset = wrapPosition(currentOffset + momentumVelocity);
                container.style.transform = `translateY(${currentOffset}px)`;
                momentumVelocity *= 0.95;
                requestAnimationFrame(applyMomentum);
            } else {
                setTimeout(() => { isAutoScrolling = true; }, 500);
            }
        }
        applyMomentum();
    });

    wrapper.addEventListener('touchstart', (e) => {
        isDragging = true;
        isAutoScrolling = false;
        startY = e.touches[0].clientY;
        scrollOffset = currentOffset;
        lastY = e.touches[0].clientY;
        lastTime = Date.now();
        velocity = 0;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const deltaY = e.touches[0].clientY - startY;
        const newOffset = scrollOffset + deltaY;
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) velocity = (e.touches[0].clientY - lastY) / dt * 15;
        lastY = e.touches[0].clientY;
        lastTime = now;
        setPosition(newOffset);
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        let momentumVelocity = velocity;
        function applyMomentum() {
            if (Math.abs(momentumVelocity) > 0.5) {
                currentOffset = wrapPosition(currentOffset + momentumVelocity);
                container.style.transform = `translateY(${currentOffset}px)`;
                momentumVelocity *= 0.95;
                requestAnimationFrame(applyMomentum);
            } else {
                setTimeout(() => { isAutoScrolling = true; }, 500);
            }
        }
        applyMomentum();
    });

    wrapper.addEventListener('mouseenter', () => { if (!isDragging) isAutoScrolling = false; });
    wrapper.addEventListener('mouseleave', () => { if (!isDragging) isAutoScrolling = true; });
    wrapper.style.cursor = 'grab';
}

// --- INICIALIZACIÓN GLOBAL ---
function initAll() {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    initDropdowns();
    initMenu();
    initHowWeDo();
    initSimpleTestimonials();
    initCarousel();
    initTeamCarousel();
    initJobOpenings();
    initPartnerLogos();
    initCasosFilter();
    initTestimonialsCarousel();
    initStackingCards();
    setupServiceEvents();
    initNavigationColorSystem();
    initModals();
    initCalendly();
    initHeroPhysics();
    initEquipoNetwork();
    try { initPublicidadMediosCubes(); } catch (e) { console.error("Error in initPublicidadMediosCubes:", e); }
    try { initHomeBlackhole(); } catch (e) { console.error("Error in initHomeBlackhole:", e); }
    try { initDisenoMarcaHero(); } catch (e) { console.error("Error in initDisenoMarcaHero:", e); }
    initImmoralEcosystem();
    initCounters();
    initScrollAnimations();
    initGsapAnimations();
    initHeroAnimation();
    initFAQAccordion();
    initGestionHero();
    initEmailHero();
    initServicesCarousel();
    try { initMarbleReveal(); } catch (e) { console.error("Error in initMarbleReveal:", e); }
    // Orden importante: en diseno-de-marca.html ambas secciones están pineadas
    // y la galería de vídeos va antes en el DOM — inicializarla primero hace
    // que su pin spacer exista antes de que "Cómo lo hacemos" calcule su rango.
    try { initDisenoScrollVideos(); } catch (e) { console.error("Error in initDisenoScrollVideos:", e); }
    try { initComoLoHacemosScroll(); } catch (e) { console.error("Error in initComoLoHacemosScroll:", e); }

    // Import dinámico (no estático): si algún día un ad-blocker bloquea este archivo,
    // solo falla esta promesa — no tumba el resto de main.js como pasaba antes.
    import('./bottom-panel.js')
        .then(({ initBottomPanel }) => initBottomPanel())
        .catch((e) => console.error("Error in initBottomPanel:", e));
    try { initFooter(); } catch (e) { console.error("Error in initFooter:", e); }
    try { initHablemosHover('#hablemos-cta-btn', '#hablemos-video'); } catch (e) { console.error("Error in initHablemosHover:", e); }
}

// --- 16. GSAP ANIMATIONS ---
function splitTextIntoSpans(element) {
    const text = element.textContent; // Use textContent to get text even if hidden
    element.innerHTML = '';
    const words = text.split(' ');

    words.forEach((word, wordIndex) => {
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('word');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.overflow = 'hidden';
        wordSpan.style.verticalAlign = 'top'; // Asegura alineación correcta

        // Split word into chars
        const chars = word.split('');
        chars.forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.classList.add('char');
            charSpan.style.display = 'inline-block';
            charSpan.innerText = char;
            wordSpan.appendChild(charSpan);
        });

        element.appendChild(wordSpan);

        // Add space after word (except last one)
        if (wordIndex < words.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.innerHTML = '&nbsp;';
            spaceSpan.style.display = 'inline-block';
            element.appendChild(spaceSpan);
        }
    });
}

function splitTextIntoLines(element) {
    const text = element.textContent.replace(/\s+/g, ' ').trim();
    element.innerHTML = '';
    const words = text.split(' ');

    // Create temporary word spans to measure positions
    const tempWords = [];
    words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.textContent = word;
        element.appendChild(wordSpan);
        tempWords.push(wordSpan);

        // Add space (except last word)
        if (index < words.length - 1) {
            element.appendChild(document.createTextNode(' '));
        }
    });

    // Group words by line based on offsetTop
    const lines = [];
    let currentLine = [];
    let currentTop = tempWords[0]?.offsetTop;

    tempWords.forEach(wordSpan => {
        if (wordSpan.offsetTop !== currentTop) {
            // New line detected
            lines.push(currentLine);
            currentLine = [wordSpan.textContent];
            currentTop = wordSpan.offsetTop;
        } else {
            currentLine.push(wordSpan.textContent);
        }
    });
    if (currentLine.length > 0) lines.push(currentLine);

    // Clear and rebuild with INLINE wrappers (like GSAP SplitText)
    element.innerHTML = '';

    lines.forEach((lineWords, index) => {
        const lineWrapper = document.createElement('span'); // SPAN, no DIV
        lineWrapper.classList.add('line-reveal-wrapper');
        lineWrapper.style.display = 'inline-block'; // inline-block preserva el flow
        lineWrapper.style.overflow = 'hidden';
        lineWrapper.style.verticalAlign = 'top';

        const innerSpan = document.createElement('span');
        innerSpan.classList.add('line-reveal-inner');
        innerSpan.style.display = 'inline-block';
        innerSpan.textContent = lineWords.join(' ');

        lineWrapper.appendChild(innerSpan);
        element.appendChild(lineWrapper);

        // Add space between wrappers (except last)
        if (index < lines.length - 1) {
            element.appendChild(document.createTextNode(' '));
        }
    });
}

function initGsapAnimations() {
    // IMPORTANTE: Esperamos a que las fuentes estén listas para calcular las líneas correctamente.
    // Esto evita que el texto se rompa mal y funciona perfecto con View Transitions.
    document.fonts.ready.then(() => {

        // 1. Block Reveal Animation (Lando Norris style)
        const blockRevealElements = document.querySelectorAll('.block-reveal');

        // Phase 1: Setup DOM for ALL block-reveal elements
        blockRevealElements.forEach(element => {
            // Create mask if not exists
            if (!element.querySelector('.block-reveal-mask')) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('block-reveal-wrapper');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.overflow = 'hidden';

                // Determine wrapper type: use 'span' if element is 'A' to avoid nesting, otherwise 'a'
                const wrapperType = element.tagName.toLowerCase() === 'a' ? 'span' : 'a';
                const textWrapper = document.createElement(wrapperType);
                textWrapper.style.display = 'inline-block';
                textWrapper.style.textDecoration = 'none';
                textWrapper.style.color = 'inherit';
                textWrapper.style.pointerEvents = 'none'; // Prevent interaction

                // Wrap content
                while (element.firstChild) {
                    textWrapper.appendChild(element.firstChild);
                }
                wrapper.appendChild(textWrapper);
                element.appendChild(wrapper);

                const mask = document.createElement('div');
                mask.classList.add('block-reveal-mask');
                mask.style.position = 'absolute';
                mask.style.top = '0';
                mask.style.left = '0';
                mask.style.width = '100%';
                mask.style.height = '100%';
                mask.style.backgroundColor = 'currentColor'; // Usa el color del texto
                mask.style.zIndex = '2';
                mask.style.transform = 'translateX(-101%)'; // Start hidden to the left
                wrapper.appendChild(mask);

                // Set initial state of content
                gsap.set(wrapper.children[0], { opacity: 0 }); // Hide text initially
            }

            // Unhide wrapper (handled by CSS visibility: hidden)
            const wrapper = element.querySelector('.block-reveal-wrapper');
            wrapper.style.visibility = 'visible';

            // Unhide the original element (handled by CSS .block-reveal { visibility: hidden })
            element.style.visibility = 'visible';
        });

        // Phase 2: Animate Groups (Staggered)
        const groups = document.querySelectorAll('.reveal-group');
        groups.forEach(group => {
            const children = group.querySelectorAll('.block-reveal');
            if (children.length === 0) return;

            children.forEach(child => child.classList.add('has-group-animation')); // Mark as handled

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: group,
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            });

            children.forEach((child, index) => {
                const mask = child.querySelector('.block-reveal-mask');
                const content = child.querySelector('.block-reveal-wrapper').children[0];

                // Force initial state
                gsap.set(mask, { x: '-101%' });
                gsap.set(content, { opacity: 0 });

                // Create a nested timeline for this child
                const childTl = gsap.timeline();

                childTl.to(mask, {
                    duration: 0.4, // ⬅️ VELOCIDAD: Máscara cubre
                    x: '0%',
                    ease: "power2.inOut"
                })
                    .set(content, { opacity: 1 })
                    .to(mask, {
                        duration: 0.3, // ⬅️ VELOCIDAD: Máscara descubre
                        x: '101%',
                        ease: "power2.inOut"
                    });

                // Add to master timeline with overlap/stagger (0.2s delay between starts)
                tl.add(childTl, index * 0.2);
            });
        });

        // Phase 3: Animate Standalone Elements
        blockRevealElements.forEach(element => {
            if (element.classList.contains('has-group-animation')) return;

            const mask = element.querySelector('.block-reveal-mask');
            const content = element.querySelector('.block-reveal-wrapper').children[0];

            // Force initial state
            gsap.set(mask, { x: '-101%' });
            gsap.set(content, { opacity: 0 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: element,
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            });

            tl.to(mask, {
                duration: 0.3, // Slower
                x: '0%',
                ease: "power2.inOut"
            })
                .set(content, { opacity: 1 })
                .to(mask, {
                    duration: 0.3, // Slower
                    x: '101%',
                    ease: "power2.inOut"
                });
        });

        // 2. Staggered Text Reveal (SplitText simulation)
        const splitTextElements = document.querySelectorAll('.reveal-text');

        splitTextElements.forEach(element => {
            if (!element.classList.contains('split-done')) {
                splitTextIntoSpans(element);
                element.classList.add('split-done');
            }

            // Unhide element (handled by CSS visibility: hidden)
            element.style.visibility = 'visible';

            const chars = element.querySelectorAll('.char');

            if (chars.length > 0) {
                // Ensure chars are visible for calculation but hidden by opacity
                gsap.set(chars, { opacity: 0, y: 50 });

                gsap.to(chars, {
                    y: 0,
                    opacity: 1,
                    duration: 1.6, // Slower
                    stagger: 0.02,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none none" // Disable reverse
                    }
                });
            }
        });

        // 3. Line Reveal Animation (for long texts)
        const lineRevealElements = document.querySelectorAll('.reveal-lines');

        lineRevealElements.forEach(element => {
            // Reiniciamos el contenido si ya se había dividido (para recalcular bien al cambiar de página o redimensionar)
            if (element.classList.contains('lines-split-done')) {
                // Opcional: Si quisieras recalcular en resize, podrías limpiar aquí. 
                // Por ahora, asumimos que si ya está hecho, está bien, PERO como estamos esperando a las fuentes,
                // es seguro que el cálculo inicial será correcto.
            }

            if (!element.classList.contains('lines-split-done')) {
                element.style.visibility = 'hidden'; // Hide initially
                splitTextIntoLines(element);
                element.classList.add('lines-split-done');
            }

            element.style.visibility = 'visible'; // Unhide after split

            const lines = element.querySelectorAll('.line-reveal-wrapper');

            if (lines.length > 0) {
                // Animate lines (GSAP SplitText style with yPercent)
                const innerSpans = element.querySelectorAll('.line-reveal-inner');

                // Animate from below (gsap.from animates FROM these values TO natural state)
                gsap.from(innerSpans, {
                    duration: 0.6,
                    yPercent: 100,
                    opacity: 0,
                    stagger: 0.1,
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                });
            }
        });

        // Refrescamos ScrollTrigger para asegurar que las posiciones sean correctas después de cargar fuentes
        ScrollTrigger.refresh();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initAll();
});

// --- VIEW TRANSITIONS LOGIC ---
// Manejo de navegación SPA (Single Page Application)
document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    // Ignorar links externos, ctrl+click, target blank o anclas
    if (link.hostname !== window.location.hostname || e.ctrlKey || link.target === '_blank' || link.href.includes('#')) return;

    e.preventDefault();
    const url = link.href;

    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(text, 'text/html');

        // Eliminar loader si existe en el nuevo documento para evitar que aparezca de nuevo
        const newLoader = newDoc.getElementById('global-loader');
        if (newLoader) newLoader.remove();

        // Si no soporta View Transitions, actualizamos normal
        if (!document.startViewTransition) {
            updateDOM(newDoc, url, true); // true = hacer pushState
            return;
        }

        // Con View Transitions
        const transition = document.startViewTransition(() => {
            updateDOM(newDoc, url, true); // true = hacer pushState
        });

        await transition.finished;

    } catch (err) {
        console.error('Error en navegación:', err);
        window.location.href = url; // Fallback
    }
});

// Escuchar el evento popstate (Botón Atrás/Adelante del navegador)
window.addEventListener('popstate', async () => {
    const url = window.location.href;
    try {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(text, 'text/html');

        const newLoader = newDoc.getElementById('global-loader');
        if (newLoader) newLoader.remove();

        if (!document.startViewTransition) {
            updateDOM(newDoc, url, false); // false = NO hacer pushState (ya cambió la URL)
            return;
        }

        const transition = document.startViewTransition(() => {
            updateDOM(newDoc, url, false);
        });

    } catch (err) {
        console.error('Error al volver atrás:', err);
        window.location.reload(); // Fallback seguro
    }
});

function updateDOM(newDoc, url, doPushState = true) {
    document.body.innerHTML = newDoc.body.innerHTML;
    document.title = newDoc.title;

    // Solo hacemos pushState si es una navegación nueva (click), no si es volver atrás (popstate)
    if (doPushState) {
        history.pushState({}, '', url);
    }

    // Scroll al inicio
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reinicializar scripts
    requestAnimationFrame(() => {
        initAll();
    });
}