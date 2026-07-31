import { supabase } from './supabaseClient.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

function offerCardHTML(offer) {
    return `
        <div class="group bg-gray-50 hover:bg-gray-900 p-8 rounded-3xl flex flex-col min-h-[180px] border border-gray-200 hover:border-black transition-all duration-300 hover:rotate-2 cursor-pointer">
            <img src="${escapeHtml(offer.icon_url)}" alt="icon" class="w-12 h-12 mb-6 brightness-0 group-hover:invert">
            <h4 class="font-light text-3xl mb-3 text-[#4889eb] group-hover:text-[#4889eb] transition-all duration-300">
                ${escapeHtml(offer.title)}
            </h4>
        </div>
    `;
}

/**
 * Carga las ofertas activas desde Supabase y las renderiza en el grid de
 * "Ofertas activas" de /equipo. Si no hay ninguna activa, oculta la sección
 * completa (título + intro + grid) para no dejar un hueco vacío.
 */
export async function renderJobOpenings(grid) {
    if (!grid) return;

    const { data, error } = await supabase
        .from('job_openings')
        .select('title, icon_url')
        .eq('is_active', true)
        .order('position', { ascending: true });

    const section = grid.closest('section');

    if (error) {
        console.error('Error cargando ofertas activas desde Supabase:', error);
        if (section) section.style.display = 'none';
        return;
    }

    const offers = data || [];
    if (!offers.length) {
        if (section) section.style.display = 'none';
        return;
    }

    grid.innerHTML = offers.map(offerCardHTML).join('');
}
