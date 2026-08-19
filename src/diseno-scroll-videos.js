import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Galería de vídeos con scroll 3D en diseno-de-marca.html:
// 1. Cada vídeo vuela hacia la cámara con escala moderada y desvanecimiento temprano.
// 2. Al final de la secuencia, se revela un mural carrusel en ojo de pez con mayor
//    distanciamiento entre filas y tarjeta central de cristal translúcido (brand-glass).

const CLIPS = [
    '/page-diseno/diseno-scroll-1.webm',
    '/page-diseno/diseno-scroll-2.webm',
    '/page-diseno/diseno-scroll-3.webm',
    '/page-diseno/diseno-scroll-4.webm',
    '/page-diseno/diseno-scroll-5.webm',
];

const MOBILE_COUNT = CLIPS.length;

// Una entrada por clip — 5 vídeos, sin repetición, tamaños y trayectorias variados.
const ITEMS = [
    { width: 52, dx: -0.9,  dy: -0.5,  rotate: -6 },
    { width: 28, portrait: true, dx: 0.9,  dy: -0.65, rotate:  7 },
    { width: 46, dx: -0.85, dy:  0.7,  rotate:  4 },
    { width: 38, dx:  0.9,  dy:  0.5,  rotate: -5 },
    { width: 54, dx:  0.3,  dy: -0.95, rotate: -4 },
];

// Campo estelar más liviano (menos elementos animados en simultáneo = menos
// carga de CPU/GPU) pero con mayor dispersión angular y de alcance para que
// no se lea como un anillo uniforme "pegado" — cada partícula se desvía más
// de su posición radial ideal y viaja a una distancia más variable.
const PARTICLE_COUNT = 180;
const FRAME_COUNT = 16;

function makeRng(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function radialDirection(index, count, rng) {
    const angle = (index / count) * Math.PI * 2 + (rng() - 0.5) * 1.8;
    const reach = 0.45 + rng() * 1.2;
    return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach };
}

function buildDecor(stage) {
    const rng = makeRng(20260805);
    const frag = document.createDocumentFragment();
    const created = [];

    // Paleta de 4 colores: blanco, azul de marca, azul claro, lavanda
    const COLORS = ['#ffffff', '#4889eb', '#93c5fd', '#c4b5fd'];

    // Inyectamos los @keyframes de deriva y pulso en el <head> (solo una vez).
    if (!document.getElementById('dsv-particle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'dsv-particle-keyframes';
        const kf = [];
        for (let k = 0; k < 12; k++) {
            // Desplazamientos de deriva en px — se acumulan sobre el transform que GSAP ya aplica.
            const ox  = (Math.sin(k * 2.4) * 110).toFixed(1);
            const oy  = (Math.cos(k * 1.7) * 75).toFixed(1);
            const ox2 = (Math.sin(k * 1.1 + 1) * 85).toFixed(1);
            const oy2 = (Math.cos(k * 2.9 + 0.5) * 55).toFixed(1);
            kf.push(`
                @keyframes dsv-drift-${k} {
                    0%   { translate: 0px 0px; }
                    33%  { translate: ${ox}px ${oy}px; }
                    66%  { translate: ${ox2}px ${oy2}px; }
                    100% { translate: 0px 0px; }
                }
                @keyframes dsv-shine-${k} {
                    0%,100% { filter: brightness(1); }
                    50%     { filter: brightness(0.3); }
                }
            `);
        }
        style.textContent = kf.join('');
        document.head.appendChild(style);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const el = document.createElement('div');
        const isStar = i % 8 === 0;
        el.className = 'dsv-decor absolute top-1/2 left-1/2 rounded-full pointer-events-none';
        const size = isStar ? 4 + Math.round(rng() * 6) : 1 + Math.round(rng() * 3);
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        const color = COLORS[i % COLORS.length];
        el.style.backgroundColor = color;
        if (isStar) {
            el.style.boxShadow = `0 0 ${size * 3}px ${size}px ${color}55`;
        }
        el.setAttribute('aria-hidden', 'true');

        // Deriva autónoma (translate, separado del transform de GSAP) + parpadeo via brightness.
        // opacity queda en manos exclusivas de GSAP para no generar conflicto.
        const variant = i % 12;
        const driftDur  = (10 + rng() * 16).toFixed(1);
        const shineDur  = (3  + rng() * 6).toFixed(1);
        const driftDel  = (-(rng() * 20)).toFixed(1);
        const shineDel  = (-(rng() * 10)).toFixed(1);
        el.style.animation = [
            `dsv-drift-${variant} ${driftDur}s ${driftDel}s linear infinite`,
            `dsv-shine-${variant} ${shineDur}s ${shineDel}s ease-in-out infinite`,
        ].join(', ');
        el.style.willChange = 'translate, filter, opacity';

        const dir = radialDirection(i, PARTICLE_COUNT, rng);
        const depth = -2400 + rng() * 1800;
        const peak = isStar ? 0.55 + rng() * 0.4 : 0.2 + rng() * 0.6;
        created.push({ el, ...dir, depth, peak });
        frag.appendChild(el);
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'dsv-decor absolute top-1/2 left-1/2 rounded-2xl pointer-events-none';
        const size = 6 + rng() * 14;
        el.style.width = `${size.toFixed(1)}vw`;
        el.style.height = `${(size * (0.55 + rng() * 0.75)).toFixed(1)}vw`;
        const frameColor = i % 3 === 0 ? 'rgba(72,137,235,0.22)' : i % 3 === 1 ? 'rgba(196,181,253,0.15)' : 'rgba(255,255,255,0.12)';
        el.style.border = `1px solid ${frameColor}`;
        el.style.backgroundColor = i % 3 === 0 ? 'rgba(72,137,235,0.03)' : 'rgba(255,255,255,0.02)';
        el.setAttribute('aria-hidden', 'true');

        const dir = radialDirection(i, FRAME_COUNT, rng);
        created.push({ el, ...dir, depth: -1800 + rng() * 900, peak: 0.25 + rng() * 0.35 });
        frag.appendChild(el);
    }

    stage.appendChild(frag);
    return created;
}

function buildItems(stage) {
    const frag = document.createDocumentFragment();
    const created = [];

    ITEMS.forEach((data, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = data.portrait
            ? 'dsv-item relative md:absolute w-full md:w-auto md:top-1/2 md:left-1/2 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10'
            : 'dsv-item relative md:absolute w-full md:w-auto md:top-1/2 md:left-1/2 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10';

        const video = document.createElement('video');
        video.className = 'w-full h-full object-cover';
        // Cada ítem usa su clip dedicado (sin repetición — ITEMS.length === CLIPS.length)
        video.src = CLIPS[i];
        // Sin autoplay: arranca en pausa y solo se reproduce cuando la sección
        // entra en el viewport (ver IntersectionObserver más abajo).
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('aria-hidden', 'true');

        wrapper.appendChild(video);
        frag.appendChild(wrapper);
        created.push(wrapper);
    });

    stage.appendChild(frag);
    return created;
}

// Construye el mural carrusel en ojo de pez con mayor espacio entre filas y tarjeta transparente
function buildFisheyeWall(stage) {
    const wall = document.createElement('div');
    wall.id = 'dsv-fisheye-wall';
    wall.className = 'absolute inset-0 w-full h-full flex flex-col justify-center items-center overflow-hidden opacity-0 pointer-events-none z-20 transition-all duration-700';

    // Viñeta de gradiente radial para efecto de curvatura de lente
    const vignette = document.createElement('div');
    vignette.className = 'absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.80)_75%,rgba(0,0,0,0.98)_100%)]';
    wall.appendChild(vignette);

    // Contenedor 3D del mural ojo de pez
    const gridContainer = document.createElement('div');
    gridContainer.className = 'dsv-fisheye-grid-container relative w-[135%] -left-[17.5%] h-[130%] flex flex-col justify-center transform-gpu';
    gridContainer.style.perspective = '950px';
    gridContainer.style.transformStyle = 'preserve-3d';

    const wallInner = document.createElement('div');
    wallInner.className = 'dsv-fisheye-wall-inner w-full flex flex-col gap-8 md:gap-12';
    wallInner.style.transform = 'rotateX(8deg) scale(1.1)';
    wallInner.style.transformStyle = 'preserve-3d';

    // Configuración de filas con mayor separación vertical
    const rowConfigs = [
        { dir: 'left', speed: '36s', transform: 'translateY(55px) rotateX(-8deg) scale(0.88)' },
        { dir: 'right', speed: '28s', transform: 'translateY(18px) rotateX(-2deg) scale(1.02)' },
        { dir: 'left', speed: '32s', transform: 'translateY(-18px) rotateX(2deg) scale(1.02)' },
        { dir: 'right', speed: '38s', transform: 'translateY(-55px) rotateX(8deg) scale(0.88)' }
    ];

    rowConfigs.forEach((config, rowIndex) => {
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'dsv-marquee-row-wrapper w-full overflow-hidden flex';
        rowWrapper.style.transform = config.transform;
        rowWrapper.style.transformStyle = 'preserve-3d';

        const rowTrack = document.createElement('div');
        rowTrack.className = `dsv-marquee-track flex gap-6 md:gap-8 w-max ${config.dir === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`;
        rowTrack.style.animationDuration = config.speed;
        rowTrack.style.willChange = 'transform';

        const clipsToUse = [...CLIPS, ...CLIPS];
        const shiftedClips = [...clipsToUse.slice(rowIndex % CLIPS.length), ...clipsToUse.slice(0, rowIndex % CLIPS.length)];

        // Bloque 1
        const block1 = document.createElement('div');
        block1.className = 'flex gap-6 md:gap-8 shrink-0';
        shiftedClips.forEach((src) => {
            const card = document.createElement('div');
            card.className = 'dsv-fisheye-card flex-shrink-0 w-60 md:w-80 lg:w-96 aspect-video rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-gray-950/80 transition-all duration-300 hover:scale-105 hover:border-white/40';
            
            const video = document.createElement('video');
            video.className = 'w-full h-full object-cover';
            video.src = src;
            // Sin autoplay, mismo motivo que en buildItems.
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute('aria-hidden', 'true');

            card.appendChild(video);
            block1.appendChild(card);
        });

        // Bloque 2 (copia exacta para seamless infinite scrolling)
        const block2 = block1.cloneNode(true);
        block2.setAttribute('aria-hidden', 'true');

        rowTrack.appendChild(block1);
        rowTrack.appendChild(block2);
        rowWrapper.appendChild(rowTrack);
        wallInner.appendChild(rowWrapper);
    });

    gridContainer.appendChild(wallInner);
    wall.appendChild(gridContainer);

    // Texto Central con estilo brand-glass (en español de España, sin tag ni subtítulo, botón a la siguiente sección)
    const centerOverlay = document.createElement('div');
    centerOverlay.id = 'dsv-center-overlay';
    centerOverlay.className = 'absolute z-30 inset-0 flex items-center justify-center pointer-events-auto px-4';
    centerOverlay.innerHTML = `
        <div class="dsv-center-card px-8 py-9 md:px-12 md:py-10 text-center max-w-lg shadow-2xl transform transition-all duration-500">
            <h2 class="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-[1.08] tracking-tight mb-6 drop-shadow-md">
                Tu próxima gran<br>idea empieza aquí
            </h2>
            <div class="flex items-center justify-center">
                <a href="#servicios-grid" id="dsv-cta-btn" class="inline-flex items-center gap-3 px-9 py-4 rounded-full bg-white text-black font-extrabold text-xs md:text-sm uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all shadow-xl transform hover:scale-105">
                    <span>CREAR</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                </a>
            </div>
        </div>
    `;

    // Smooth scroll event para el botón CREAR
    const btn = centerOverlay.querySelector('#dsv-cta-btn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('servicios-grid');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    wall.appendChild(centerOverlay);
    stage.appendChild(wall);
    return wall;
}

export function initDisenoScrollVideos() {
    const pinSection = document.getElementById('dsv-pin');
    const stage = document.getElementById('dsv-stage');
    if (!pinSection || !stage) return;

    stage.innerHTML = '';
    const decor = buildDecor(stage);
    const items = buildItems(stage);
    const fisheyeWall = buildFisheyeWall(stage);

    if (items.length === 0) return;

    // Control de reproducción por visibilidad: con los vídeos de vuelo (5) +
    // el mural carrusel (hasta 40 más) puede haber ~45 vídeos <video> en esta
    // página — todos arrancan en pausa (ver buildItems/buildFisheyeWall) y solo
    // se reproducen mientras la sección está en el viewport, para no gastar
    // CPU/GPU con vídeos fuera de pantalla.
    const itemVideos = items.map((item) => item.querySelector('video')).filter(Boolean);
    const fisheyeVideos = Array.from(fisheyeWall.querySelectorAll('video'));
    const allVideos = [...itemVideos, ...fisheyeVideos];

    function playVideos(vids) {
        vids.forEach((v) => { if (v.paused) v.play().catch(() => {}); });
    }
    function pauseVideos(vids) {
        vids.forEach((v) => { if (!v.paused) v.pause(); });
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
        items.forEach((item, i) => {
            gsap.set(item, {
                width: `${ITEMS[i].width}vw`,
                xPercent: -50,
                yPercent: -50,
                x: 0,
                y: 0,
                z: -1600,
                scale: 0.30,
                opacity: 0,
                rotateZ: 0,
            });
        });

        // Los 5 vídeos se agrupan en pares: [0,1] juntos → [2,3] juntos → [4] solo.
        const flightDuration = 0.85;
        const pairOffset = 0.06;   // pequeño desfase visual dentro del par
        const groupGap   = 0.38;   // pausa entre pares (llena de partículas)
        const STARTS = [
            0,                          // par 1 — vídeo A
            pairOffset,                 // par 1 — vídeo B
            groupGap,                   // par 2 — vídeo A
            groupGap + pairOffset,      // par 2 — vídeo B
            groupGap * 2,               // vídeo solo (5º)
        ];
        const flyoutEndTime = STARTS[STARTS.length - 1] + flightDuration;

        // Antes el pin se sostenía 1.2 unidades de timeline (≈163% de scroll)
        // sin animar nada tras revelar el mural — se sentía como scroll muerto.
        // Ahora es solo un pequeño respiro (0.2) antes de soltar el pin; `end`
        // se recalcula para mantener el mismo ritmo que tenía el vuelo de
        // vídeos (mismo scroll-por-unidad-de-timeline que con el hold viejo).
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: pinSection,
                start: 'top top',
                end: '+=315%',
                scrub: 0.4,
                pin: true,
                anticipatePin: 1,
                refreshPriority: 1,
            },
        });

        // 1. Animación 3D de vuelo — dos vídeos simultáneos por par
        items.forEach((item, i) => {
            const data  = ITEMS[i];
            const start = STARTS[i];

            tl.to(item, { opacity: 1, duration: flightDuration * 0.12 }, start)
                .to(item, {
                    z: 900,
                    x: () => window.innerWidth  * data.dx * 1.5,
                    y: () => window.innerHeight * data.dy * 1.5,
                    scale: 2.6,
                    rotateZ: data.rotate * 2,
                    duration: flightDuration,
                    ease: 'power1.in',
                }, start)
                .to(item, { opacity: 0, duration: flightDuration * 0.25 }, start + flightDuration * 0.55);
        });

        // 2. Animación de decorativos: se reparten por TODA la duración incluyendo entre vídeos
        // decorFlight más largo que el stagger para que las partículas "llenen" los huecos entre clips.
        const decorFlight = 1.0;
        // Se distribuyen sobre el rango completo del timeline de vídeos
        const decorSpread = Math.max(flyoutEndTime, 0.1);

        decor.forEach((d, i) => {
            // Distribución no lineal: más partículas al principio y al final (donde no hay vídeo)
            const progress = i / Math.max(decor.length - 1, 1);
            const start = progress * decorSpread;

            gsap.set(d.el, { xPercent: -50, yPercent: -50, x: 0, y: 0, z: d.depth, scale: 0.2, opacity: 0 });

            tl.to(d.el, { opacity: d.peak, duration: decorFlight * 0.2 }, start)
                .to(d.el, {
                    z: 1100,
                    x: () => window.innerWidth * d.dx * 1.1,
                    y: () => window.innerHeight * d.dy * 1.1,
                    scale: 2.2,
                    duration: decorFlight,
                    ease: 'power1.in',
                }, start)
                .to(d.el, { opacity: 0, duration: decorFlight * 0.25 }, start + decorFlight * 0.65);
        });

        // 3. Transición hacia la sección Fisheye con tarjeta brand-glass
        const fisheyeStart = flyoutEndTime - 0.45;
        const centerCard = fisheyeWall.querySelector('.dsv-center-card');

        gsap.set(fisheyeWall, { opacity: 0, scale: 0.92, pointerEvents: 'none' });
        if (centerCard) gsap.set(centerCard, { opacity: 0, y: 30, scale: 0.92 });

        tl.to(fisheyeWall, {
            opacity: 1,
            scale: 1,
            pointerEvents: 'auto',
            duration: 0.8,
            ease: 'power2.out',
            // Al entrar a la zona del mural (scrolleando hacia adelante) paramos
            // los 5 vídeos de vuelo y arrancamos los del mural; al volver a
            // scrollear hacia atrás por debajo de este punto, es al revés. Así
            // nunca hay más de una etapa reproduciendo vídeo a la vez.
            onStart: () => { pauseVideos(itemVideos); playVideos(fisheyeVideos); },
            onReverseComplete: () => { playVideos(itemVideos); pauseVideos(fisheyeVideos); },
        }, fisheyeStart);

        if (centerCard) {
            tl.to(centerCard, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                ease: 'back.out(1.4)',
            }, fisheyeStart + 0.25);
        }

        tl.to({}, { duration: 0.2 });

        // Gate general: mientras #dsv-pin no esté en el viewport (todavía no
        // llegamos scrolleando, o ya lo pasamos hacia "Servicios"), ningún
        // vídeo de esta sección reproduce. Al volver a entrar, se retoma la
        // etapa que corresponda según en qué punto del timeline scrubbeado
        // estemos (vuelo o mural), no siempre la primera.
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if (tl.time() >= fisheyeStart) {
                    playVideos(fisheyeVideos);
                } else {
                    playVideos(itemVideos);
                }
            } else {
                pauseVideos(allVideos);
            }
        }, { rootMargin: '-10% 0px -10% 0px' }); // exige que entre de verdad, no solo tocar el borde
        io.observe(pinSection);

        return () => {
            io.disconnect();
            pauseVideos(allVideos);
            tl.scrollTrigger?.kill();
            tl.kill();
            gsap.set(items, { clearProps: 'all' });
            gsap.set(decor.map((d) => d.el), { clearProps: 'all' });
            gsap.set(fisheyeWall, { clearProps: 'all' });
        };
    });

    mm.add('(max-width: 767px)', () => {
        const shown = items.slice(0, MOBILE_COUNT);
        const hidden = items.slice(MOBILE_COUNT);

        gsap.set(items, { clearProps: 'all' });
        hidden.forEach((item) => { item.style.display = 'none'; });
        decor.forEach((d) => { d.el.style.display = 'none'; });

        gsap.set(fisheyeWall, { opacity: 1, pointerEvents: 'auto', position: 'relative', height: 'auto', margin: '3rem 0' });

        const triggers = shown.map((item) =>
            gsap.fromTo(item,
                { opacity: 0, scale: 0.9, y: 40 },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse',
                    },
                }
            ).scrollTrigger
        );

        // En mobile no hay una etapa "vuelo" vs "mural" excluyente como en
        // desktop (todo vive en el flujo normal de la página, uno debajo del
        // otro), así que alcanza con un único gate: reproducir todos los
        // vídeos de esta sección mientras siga en el viewport, pausarlos
        // cuando se scrollea a otra parte de la página.
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) playVideos(allVideos);
            else pauseVideos(allVideos);
        }, { rootMargin: '-10% 0px -10% 0px' });
        io.observe(pinSection);

        return () => {
            io.disconnect();
            pauseVideos(allVideos);
            triggers.forEach((t) => t?.kill());
            hidden.forEach((item) => { item.style.display = ''; });
            decor.forEach((d) => { d.el.style.display = ''; });
            gsap.set(fisheyeWall, { clearProps: 'all' });
        };
    });
}
