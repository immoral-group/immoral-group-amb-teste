import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('ofertas-app');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Mismo criterio que casosAdmin.js: minúsculas, sin espacios/acentos.
function slugify(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderDenied() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">No se ha podido cargar tu perfil. Recarga la página en unos segundos.</p>`;
}

function offerRow(offer, isAdmin) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-3" data-id="${offer.id}">
      <div class="flex items-center gap-4">
        <img src="${escapeHtml(offer.icon_url)}" alt="${escapeHtml(offer.title)}"
          class="w-10 h-10 object-contain ${T.radiusSm} bg-white/5 p-1" />
        <div class="flex-1 min-w-0">
          <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(offer.title)}</p>
          <p class="${T.textMuted} text-xs truncate">/oferta.html?slug=${escapeHtml(offer.slug)}</p>
        </div>
        ${isAdmin ? `
          <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
            <input type="checkbox" class="toggle-active" ${offer.is_active ? 'checked' : ''} />
            Activa
          </label>
          <button class="edit-btn ${T.accentText} text-xs">Editar</button>
          <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
        ` : `
          <span class="text-xs px-2 py-1 ${T.radiusSm} ${offer.is_active ? `${T.success} ${T.successBg} border ${T.successBorder}` : `${T.textMuted} border border-[#2E2E2E]`}">${offer.is_active ? '✓ Activa' : 'Inactiva'}</span>
        `}
      </div>
      ${isAdmin ? `<div class="edit-panel hidden mt-3 pt-3 border-t border-[#2E2E2E]"></div>` : ''}
    </div>
  `;
}

function editForm(offer) {
  return `
    <form class="edit-form grid grid-cols-1 gap-3">
      <input type="text" class="edit-title ${T.input} ${T.radiusSm} px-3 py-2 text-sm" value="${escapeHtml(offer.title)}" placeholder="Puesto" required />
      <textarea class="edit-description ${T.input} ${T.radiusSm} px-3 py-2 text-sm" rows="3" placeholder="Descripción del puesto" required>${escapeHtml(offer.description)}</textarea>
      <input type="url" class="edit-survey-url ${T.input} ${T.radiusSm} px-3 py-2 text-sm" value="${escapeHtml(offer.survey_url)}" placeholder="URL de encuesta (opcional)" />
      <div class="flex items-center gap-2">
        <button type="submit" class="edit-save ${T.accent} ${T.radiusSm} px-4 py-2 text-sm">Guardar</button>
        <button type="button" class="edit-cancel ${T.textSecondary} text-sm">Cancelar</button>
      </div>
      <p class="edit-error ${T.destructive} text-xs hidden"></p>
    </form>
  `;
}

async function loadOffers() {
  const { data, error } = await supabase
    .from('job_openings')
    .select('*')
    .order('position', { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function nextPosition() {
  const { data } = await supabase
    .from('job_openings')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  return data && data.length ? data[0].position + 1 : 1;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/ofertas',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const offers = await loadOffers();

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Ofertas activas</h1>
      <p class="${T.textMuted} text-sm mb-6">Puestos mostrados en la sección "Ofertas activas" de /equipo.</p>

      ${!isAdmin ? `<p class="${T.textMuted} text-sm mb-6">Solo lectura — no tienes rol de administrador.</p>` : ''}

      ${isAdmin ? `
        <form id="add-form" class="${T.surface} ${T.radiusCard} p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <h2 class="sm:col-span-2 ${T.textPrimary} text-sm font-medium">Añadir oferta</h2>
          <input type="text" id="new-title" placeholder="Puesto (ej. Paid Media Specialist)" required
            class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <textarea id="new-description" placeholder="Descripción del puesto (se muestra en la página de la oferta)" required rows="3"
            class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm"></textarea>
          <input type="url" id="new-survey-url" placeholder="URL de encuesta (opcional)"
            class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <input type="file" id="new-icon" accept="image/png,image/jpeg,image/webp,image/svg+xml" required
            class="sm:col-span-2 ${T.fileInput}" />
          <button type="submit" class="sm:col-span-2 ${T.accent} ${T.radiusSm} py-2 text-sm">
            Añadir
          </button>
          <p id="add-error" class="sm:col-span-2 ${T.destructive} text-xs hidden"></p>
        </form>
      ` : ''}

      <div id="offers-list" class="space-y-2">${offers.map((o) => offerRow(o, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Sin ofertas.</p>`}</div>
    </div>
  `;

  if (!isAdmin) return;

  content.querySelectorAll('.toggle-active').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('job_openings')
        .update({ is_active: e.target.checked })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        e.target.checked = !e.target.checked;
      }
    });
  });

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const title = row.querySelector('p')?.textContent || 'esta oferta';
      if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;

      const offer = offers.find((o) => o.id === id);
      const { error } = await supabase.from('job_openings').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      if (offer?.icon_url?.includes('/storage/v1/object/public/job-icons/')) {
        const path = offer.icon_url.split('/job-icons/')[1];
        if (path) await supabase.storage.from('job-icons').remove([path]);
      }
      renderPanel(profile);
    });
  });

  const addForm = document.getElementById('add-form');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('add-error');
    errorEl.classList.add('hidden');

    const title = document.getElementById('new-title').value.trim();
    const description = document.getElementById('new-description').value.trim();
    const surveyUrl = document.getElementById('new-survey-url').value.trim();
    const file = document.getElementById('new-icon').files[0];

    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      errorEl.textContent = 'El icono no puede superar 2MB.';
      errorEl.classList.remove('hidden');
      return;
    }

    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('job-icons').upload(path, file);
    if (uploadError) {
      errorEl.textContent = 'Error subiendo el icono: ' + uploadError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('job-icons').getPublicUrl(path);
    const position = await nextPosition();
    const slug = slugify(title);

    const { error: insertError } = await supabase.from('job_openings').insert({
      title,
      slug,
      description,
      survey_url: surveyUrl || null,
      icon_url: publicUrl,
      position,
      is_active: true,
    });

    if (insertError) {
      errorEl.textContent = insertError.code === '23505'
        ? 'Ya existe una oferta con un título muy similar (el slug generado ya está en uso).'
        : 'Error guardando: ' + insertError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    renderPanel(profile);
  });

  content.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const offer = offers.find((o) => o.id === id);
      const panel = row.querySelector('.edit-panel');

      if (!panel.classList.contains('hidden') && panel.dataset.open === 'true') {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        panel.dataset.open = 'false';
        return;
      }

      panel.innerHTML = editForm(offer);
      panel.classList.remove('hidden');
      panel.dataset.open = 'true';

      panel.querySelector('.edit-cancel').addEventListener('click', () => {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        panel.dataset.open = 'false';
      });

      panel.querySelector('.edit-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const errorEl = panel.querySelector('.edit-error');
        errorEl.classList.add('hidden');

        const title = panel.querySelector('.edit-title').value.trim();
        const description = panel.querySelector('.edit-description').value.trim();
        const surveyUrl = panel.querySelector('.edit-survey-url').value.trim();

        const { error } = await supabase
          .from('job_openings')
          .update({ title, description, survey_url: surveyUrl || null })
          .eq('id', id);

        if (error) {
          errorEl.textContent = 'Error guardando: ' + error.message;
          errorEl.classList.remove('hidden');
          return;
        }

        renderPanel(profile);
      });
    });
  });
}

async function boot() {
  renderLoading();
  const { session, profile } = await getSessionAndProfile();
  if (!session) {
    renderLoginView(app, boot);
    return;
  }
  if (!profile) {
    renderDenied();
    return;
  }
  renderPanel(profile);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    boot();
  }
});
boot();
