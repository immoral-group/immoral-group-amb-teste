import { supabase } from './supabaseClient.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

function logoImgHTML(logo) {
    return `<img src="${escapeHtml(logo.image_url)}" alt="${escapeHtml(logo.name)}"
        class="h-6 w-auto brightness-0 invert opacity-50 hover:opacity-100 transition-opacity" />`;
}

/**
 * Carga los logos activos desde Supabase y los renderiza duplicados (dos
 * copias seguidas) dentro del track del carrusel de la home, para mantener
 * el scroll infinito vía CSS (@keyframes scroll-brands, translateX(-50%)).
 * Si no hay ninguno activo, oculta la sección completa.
 */
export async function renderPartnerLogos(track) {
    if (!track) return;

    const { data, error } = await supabase
        .from('partner_logos')
        .select('name, image_url')
        .eq('is_active', true)
        .order('position', { ascending: true });

    const section = document.getElementById('partner-logos-section');

    if (error) {
        console.error('Error cargando logos de partners desde Supabase:', error);
        if (section) section.style.display = 'none';
        return;
    }

    const logos = data || [];
    if (!logos.length) {
        if (section) section.style.display = 'none';
        return;
    }

    const html = logos.map(logoImgHTML).join('');
    track.innerHTML = html + html;
}
