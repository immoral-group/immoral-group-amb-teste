import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

const PLATFORMS = [
    {
        icon: '/imgs/publi-ico-1.svg', alt: 'Meta', iconClass: 'h-7', color: '#1877F2',
        desc: 'Te acompañamos desde la visibilidad hasta la conversión, con estrategias claras y recorridos personalizados para el usuario objetivo.',
        wig: [2.5, 4.2]
    },
    {
        icon: '/imgs/publi-ico-2.svg', alt: 'Google Ads', iconClass: 'h-8', color: '#34A853',
        desc: 'Estamos presentes cuando te buscan y también cuando aún no saben que te necesitan.',
        wig: [3, 3.8]
    },
    {
        icon: '/imgs/publi-ico-4.svg', alt: 'TikTok', iconClass: 'h-8', invert: true, color: '#25F4EE',
        desc: 'Combinamos creatividad y datos para crear contenido que encaja de forma natural en el feed y genera impacto.',
        wig: [3.5, 3.6]
    },
    {
        icon: '/imgs/publi-ico-6.svg', alt: 'YouTube', iconClass: 'h-7', color: '#FF0000',
        desc: 'Diseñamos campañas para construir recuerdo, explicar propuestas de valor y acompañar al usuario a lo largo del funnel.',
        wig: [2.5, 4.6]
    },
    {
        icon: '/imgs/publi-ico-3.svg', alt: 'LinkedIn', iconClass: 'h-10', color: '#0073B1',
        desc: 'Conectamos tu marca con los perfiles que toman decisiones, de forma directa, profesional y relevante.',
        wig: [2, 4.4]
    },
    {
        icon: '/imgs/publi-ico-7.svg', alt: 'Pinterest', iconClass: 'h-7', color: '#E60023',
        desc: 'Aparecemos cuando tu marca todavía está siendo inspiración, un canal de descubrimiento antes de que exista una búsqueda activa.',
        wig: [3, 4]
    },
    {
        icon: '/imgs/publi-ico-5.svg', alt: 'Spotify', iconClass: 'h-10', invert: true, color: '#1ED760',
        desc: 'Impactamos a tu audiencia en momentos de atención real, cuando escucha, conecta y está receptiva al mensaje.',
        wig: [2.2, 4.2]
    },
];

function computeVisible() {
    const w = window.innerWidth;
    if (w < 640) return 1;
    if (w < 1024) return 2;
    return 4;
}

export function initPlatformCarousel() {
    const container = document.querySelector('.platform-carousel');
    const prevBtn = document.getElementById('platform-prev');
    const nextBtn = document.getElementById('platform-next');
    if (!container || !prevBtn || !nextBtn) return;

    let VISIBLE = computeVisible();
    let cursor = 0;
    let isAnimating = false;

    const cardHTML = (data) => `
        <div class="platform-card shrink-0 w-[min(70vw,240px)] h-[300px]" style="--wig-a:${data.wig[0]}px; --wig-dur:${data.wig[1]}s;">
            <div class="platform-card-wave w-full h-full">
                <div class="platform-card-inner group relative w-full h-full overflow-hidden rounded-[1.75rem]" style="--brand:${data.color}; ${data.glassDark !== undefined ? `--glass-dark:${data.glassDark};` : ''} ${data.glass ? `--glass-1:${data.glass[0]}%; --glass-2:${data.glass[1]}%; --glass-3:${data.glass[2]}%;` : ''}">
                    <div class="platform-content absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center px-7 w-full">
                        <img src="${data.icon}" alt="${data.alt}"
                            class="platform-icon w-auto ${data.iconClass} ${data.invert ? 'group-hover:invert' : ''} group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]">
                        <div class="platform-desc-wrap max-h-0 opacity-0 group-hover:max-h-48 group-hover:opacity-100 group-hover:mt-4 transition-all duration-500 overflow-hidden" style="transition-timing-function: cubic-bezier(.22,1,.36,1);">
                            <p class="platform-desc text-sm font-light leading-snug ${data.invert ? 'text-black' : 'text-white'}">${data.desc}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    function renderInitial() {
        container.innerHTML = '';
        for (let i = 0; i < VISIBLE; i++) {
            container.insertAdjacentHTML('beforeend', cardHTML(PLATFORMS[i % PLATFORMS.length]));
        }
        cursor = VISIBLE % PLATFORMS.length;
    }

    function step(forward) {
        if (isAnimating) return;
        isAnimating = true;

        const cards = gsap.utils.toArray('.platform-card', container);
        const leaving = forward ? cards[0] : cards[cards.length - 1];
        const state = Flip.getState(cards);

        const incomingIndex = forward
            ? cursor
            : (cursor - VISIBLE - 1 + PLATFORMS.length * 2) % PLATFORMS.length;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = cardHTML(PLATFORMS[incomingIndex]);
        const incoming = wrapper.firstElementChild;
        gsap.set(incoming, { scale: 0, opacity: 0 });

        if (forward) {
            container.appendChild(incoming);
            cursor = (cursor + 1) % PLATFORMS.length;
        } else {
            container.insertBefore(incoming, cards[0]);
            cursor = (cursor - 1 + PLATFORMS.length) % PLATFORMS.length;
        }
        leaving.classList.add('is-leaving');

        Flip.from(state, {
            targets: '.platform-card',
            duration: 0.6,
            ease: 'power2.inOut',
            fade: true,
            absoluteOnLeave: true,
            onEnter: (els) => {
                gsap.to(els, {
                    opacity: 1,
                    scale: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    transformOrigin: forward ? 'bottom right' : 'bottom left',
                });
            },
            onLeave: (els) => {
                gsap.to(els, {
                    opacity: 0,
                    scale: 0,
                    duration: 0.5,
                    ease: 'power2.in',
                    transformOrigin: forward ? 'bottom left' : 'bottom right',
                    onComplete: () => {
                        els.forEach((el) => el.remove());
                        isAnimating = false;
                    },
                });
            },
        });
    }

    nextBtn.addEventListener('click', () => step(true));
    prevBtn.addEventListener('click', () => step(false));

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const next = computeVisible();
            if (next !== VISIBLE && !isAnimating) {
                VISIBLE = next;
                renderInitial();
            }
        }, 200);
    });

    renderInitial();
}
