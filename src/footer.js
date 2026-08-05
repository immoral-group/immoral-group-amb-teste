const FOOTER_HTML = `
<footer class="relative z-10 bg-black py-16 text-white overflow-hidden">
    <video
        id="hablemos-video"
        class="hidden md:block absolute right-0 top-8 h-48 w-auto object-contain pointer-events-none select-none z-10 opacity-0 transition-opacity duration-300 ease-out"
        src="/imgs/HABLEMOS.webm"
        muted
        loop
        playsinline
        disablepictureinpicture
        aria-hidden="true"
        tabindex="-1"
    ></video>
    <div class="max-w-full mx-auto px-6 lg:px-24">
        <!-- Top Section - Mensaje + CTA -->
        <div class="grid md:grid-cols-2 gap-8 items-center mb-8 pb-8">
            <div>
                <h2 class="font-light text-4xl text-white">
                    Transformamos tu<br />
                    incertidumbre en prosperidad
                </h2>
            </div>
            <div class="flex items-center justify-start md:justify-end md:pr-16">
                <a href="contacto.html" id="hablemos-cta-btn"
                    class="bg-white text-[#0B0F14] px-8 py-4 rounded-lg hover:bg-[#E9EDF2] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20">
                    HABLEMOS
                </a>
            </div>
        </div>

        <!-- Main Footer Content -->
        <div class="grid md:grid-cols-2 gap-12 lg:gap-16">
            <!-- Social -->
            <div class="space-y-6">
                <h3 class="text-blue-500">Síguenos y crea un gran impacto</h3>
                <div class="flex items-center gap-4 flex-wrap">

                    <!-- WhatsApp -->
                    <a href="https://wa.link/rb585t" target="_blank" rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="WhatsApp">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                    </a>
                    <!-- Instagram -->
                    <a href="https://www.instagram.com/immoral.group/" target="_blank" rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="Instagram">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill-rule="evenodd"
                                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.451 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                                clip-rule="evenodd" />
                        </svg>
                    </a>
                    <!-- Behance -->
                    <a href="https://www.behance.net/immoralgroup" target="_blank" rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="Behance">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                        </svg>
                    </a>
                    <!-- LinkedIn -->
                    <a href="https://www.linkedin.com/company/immoral-group/" target="_blank"
                        rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="LinkedIn">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h5v-8.306c0-4.613 5.48-4.515 5.48 0v8.306h5v-10.502c0-8.118-8.74-7.93-8.74-2.688 0-1.11.12-2.306-.76-2.81z" />
                        </svg>
                    </a>
                    <!-- TikTok -->
                    <a href="https://www.tiktok.com/@immoral.group" target="_blank" rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="TikTok">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                        </svg>
                    </a>
                    <!-- YouTube -->
                    <a href="https://www.youtube.com/@immoralmarketing" target="_blank" rel="noopener noreferrer"
                        class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA] hover:text-[#1E63FF] hover:border-[#1E63FF] transition-all duration-200 group"
                        aria-label="YouTube">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </a>
                </div>
            </div>

            <!-- Ubicación -->
            <div class="space-y-6 ml-0 lg:ml-44">
                <h3 class="text-blue-500">¿Dónde estamos?</h3>
                <div class="flex items-center gap-3">
                    <div class="p-3 border border-[#2A2F36] rounded-full text-[#B9C0CA]">
                        <!-- MapPin -->
                        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                    <div class="text-[#B9C0CA] leading-relaxed">
                        Paseo de Gràcia 12, 1º, 08007 Barcelona
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Section -->
        <div class="mt-16 pt-8 border-t border-[#2A2F36]">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
                <!-- Logo -->
                <div class="flex items-center">
                    <a href="https://immoral.marketing/" target="_blank" rel="noopener noreferrer">
                        <img src="/imgs/Menues/logo-menu-claro.png" alt="Logo Immoral"
                            class="h-6 w-auto opacity-90" />
                    </a>
                </div>
                <!-- Links -->
                <div class="flex items-center gap-8">
                    <a href="aviso-legal.html" data-footer-link
                        class="text-[#B9C0CA] hover:text-white transition-colors duration-200 text-sm">Aviso legal</a>
                    <a href="privacidad.html" data-footer-link
                        class="text-[#B9C0CA] hover:text-white transition-colors duration-200 text-sm">Privacidad</a>
                    <a href="cookies.html" data-footer-link
                        class="text-[#B9C0CA] hover:text-white transition-colors duration-200 text-sm">Cookies</a>
                </div>
            </div>
            <div class="mt-8 text-center">
                <p class="text-[#B9C0CA] text-sm">© 2026 Immoral Group SLU. Todos los derechos reservados.</p>
            </div>
        </div>
    </div>
</footer>
`;

export function initFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;

    mount.outerHTML = FOOTER_HTML.trim();

    // Normaliza sin ".html" para que funcione tanto en dev (URLs con .html)
    // como en producción, donde vercel.json sirve las páginas con cleanUrls (sin .html).
    const currentPage = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
    document.querySelectorAll('footer [data-footer-link]').forEach((link) => {
        const linkPage = link.getAttribute('href').replace(/\.html$/, '');
        if (linkPage === currentPage) {
            link.classList.remove('text-[#B9C0CA]', 'hover:text-white', 'transition-colors', 'duration-200');
            link.classList.add('text-white', 'font-semibold');
        }
    });
}
