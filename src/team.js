import { supabase } from './supabaseClient.js';

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

function teamCardHTML(member, altIndex) {
    return `
        <div class="team-member flex-shrink-0 w-32 h-48 xl:w-[197px] xl:h-[236px] mx-2 xl:mx-4 relative group cursor-pointer">
            <img class="w-full h-full object-cover rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                src="${escapeHtml(member.image_url)}" alt="Miembro del equipo ${altIndex}" />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 rounded-lg flex items-end justify-center opacity-0 group-hover:opacity-100">
                <div class="text-white text-center p-4">
                    <h3 class="font-semibold text-sm xl:text-base">${escapeHtml(member.name)}</h3>
                    <p class="text-xs xl:text-sm opacity-90">${escapeHtml(member.role)}</p>
                </div>
            </div>
        </div>
    `;
}

function fillTrack(track, members) {
    if (!track) return;
    if (!members.length) {
        track.innerHTML = '';
        return;
    }
    const cardsHTML = members.map((m, i) => teamCardHTML(m, i + 1)).join('');
    // Duplicado una vez para mantener el efecto de scroll infinito (igual que el HTML original).
    track.innerHTML = cardsHTML + cardsHTML;
}

function toggleRowVisibility(track, hasMembers) {
    const section = track?.closest('.team-carousel-container-right, .team-carousel-container-left');
    if (section) section.style.display = hasMembers ? '' : 'none';
}

/**
 * Carga las personas activas del equipo desde Supabase y las renderiza
 * en las dos filas del carrusel de /equipo.
 */
export async function renderTeamMembers(trackRight, trackLeft) {
    const { data, error } = await supabase
        .from('team_members')
        .select('name, role, image_url, row_number, position')
        .eq('is_active', true)
        .order('position', { ascending: true });

    if (error) {
        console.error('Error cargando el equipo desde Supabase:', error);
        toggleRowVisibility(trackRight, false);
        toggleRowVisibility(trackLeft, false);
        return;
    }

    const members = data || [];
    const row1 = members.filter((m) => m.row_number === 1);
    const row2 = members.filter((m) => m.row_number === 2);

    fillTrack(trackRight, row1);
    fillTrack(trackLeft, row2);
    toggleRowVisibility(trackRight, row1.length > 0);
    toggleRowVisibility(trackLeft, row2.length > 0);
}
