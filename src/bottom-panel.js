export function initBottomPanel() {
    if (localStorage.getItem('cookie_consent') === 'true') return;
    if (document.getElementById('site-bottom-panel')) return;

    const gradient = document.createElement('div');
    gradient.id = 'site-bottom-panel-gradient';
    gradient.setAttribute('aria-hidden', 'true');
    gradient.className = 'fixed inset-x-0 bottom-0 z-[190] h-48 sm:h-64 xl:h-80 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none opacity-0 transition-opacity duration-500 ease-out';
    document.body.appendChild(gradient);

    const banner = document.createElement('div');
    banner.id = 'site-bottom-panel';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.className = 'fixed inset-x-0 bottom-0 z-[200] px-4 sm:px-6 flex justify-center translate-y-full opacity-0 transition-all duration-500 ease-out';
    banner.innerHTML = `
        <div class="w-full max-w-7xl flex items-end justify-center gap-3 sm:gap-4">
            <div class="min-w-0 w-full flex-1 bg-[#0B0F14] text-white rounded-2xl shadow-2xl border border-[#2A2F36] p-4 sm:p-5 mb-4 sm:mb-6 flex flex-col xl:flex-row items-start xl:items-center gap-3 sm:gap-4">
                <div class="flex-1 min-w-0">
                    <p class="font-black text-[10px] uppercase tracking-widest text-blue-500 mb-1.5">Tu privacidad</p>
                    <p class="text-xs text-gray-300 leading-relaxed">
                        Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido.
                        <a href="cookies.html" class="text-blue-400 hover:text-blue-300 underline underline-offset-2">Más información</a>
                    </p>
                </div>
                <div class="flex flex-wrap gap-2 shrink-0 w-full xl:w-auto">
                    <button type="button" id="site-bottom-panel-reject" class="flex-1 xl:flex-none border border-gray-600 text-gray-300 px-4 py-2 rounded-full text-xs font-bold hover:border-gray-400 hover:text-white transition-colors whitespace-nowrap">Rechazar opcionales</button>
                    <a href="cookies.html" id="site-bottom-panel-settings" class="flex-1 xl:flex-none text-center border border-gray-600 text-gray-300 px-4 py-2 rounded-full text-xs font-bold hover:border-gray-400 hover:text-white transition-colors whitespace-nowrap">Personalizar</a>
                    <button type="button" id="site-bottom-panel-accept" class="flex-1 xl:flex-none bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-600 transition-colors whitespace-nowrap">Aceptar todas</button>
                </div>
            </div>
            <video
                class="hidden xl:block h-48 md:h-64 w-auto object-contain shrink-0 pointer-events-none select-none"
                src="/imgs/personaje1.webm"
                autoplay
                muted
                loop
                playsinline
                disablepictureinpicture
                aria-hidden="true"
                tabindex="-1"
            ></video>
        </div>
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
        banner.classList.remove('translate-y-full', 'opacity-0');
        gradient.classList.remove('opacity-0');
    }, 50);

    function closeBanner() {
        banner.classList.add('translate-y-full', 'opacity-0');
        gradient.classList.add('opacity-0');
        setTimeout(() => {
            banner.remove();
            gradient.remove();
        }, 500);
    }

    function savePreferences(analytics, marketing) {
        localStorage.setItem('cookie_analytics', analytics);
        localStorage.setItem('cookie_marketing', marketing);
        localStorage.setItem('cookie_consent', 'true');
        closeBanner();
    }

    banner.querySelector('#site-bottom-panel-accept').addEventListener('click', () => savePreferences(true, true));
    banner.querySelector('#site-bottom-panel-reject').addEventListener('click', () => savePreferences(false, false));
}
