import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('logos-app');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderDenied() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">No se ha podido cargar tu perfil. Recarga la página en unos segundos.</p>`;
}

function logoRow(logo, isAdmin) {
  return `
    <div class="flex items-center gap-4 ${T.surface} ${T.radiusCard} p-3" data-id="${logo.id}">
      <div class="w-10 h-10 flex items-center justify-center bg-white/5 ${T.radiusSm} p-1">
        <img src="${escapeHtml(logo.image_url)}" alt="${escapeHtml(logo.name)}"
          class="max-w-full max-h-full object-contain brightness-0 invert" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(logo.name)}</p>
      </div>
      ${isAdmin ? `
        <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
          <input type="checkbox" class="toggle-active" ${logo.is_active ? 'checked' : ''} />
          Activo
        </label>
        <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
      ` : `
        <span class="text-xs px-2 py-1 ${T.radiusSm} ${logo.is_active ? `${T.success} ${T.successBg} border ${T.successBorder}` : `${T.textMuted} border border-[#2E2E2E]`}">${logo.is_active ? '✓ Activo' : 'Inactivo'}</span>
      `}
    </div>
  `;
}

async function loadLogos() {
  const { data, error } = await supabase
    .from('partner_logos')
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
    .from('partner_logos')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  return data && data.length ? data[0].position + 1 : 1;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/logos',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const logos = await loadLogos();

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Barra de logos</h1>
      <p class="${T.textMuted} text-sm mb-6">Logos de partners y herramientas mostrados en el carrusel de la home.</p>

      ${!isAdmin ? `<p class="${T.textMuted} text-sm mb-6">Solo lectura — no tienes rol de administrador.</p>` : ''}

      ${isAdmin ? `
        <form id="add-form" class="${T.surface} ${T.radiusCard} p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <h2 class="sm:col-span-2 ${T.textPrimary} text-sm font-medium">Añadir logo</h2>
          <input type="text" id="new-name" placeholder="Nombre (ej. Figma)" required
            class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <input type="file" id="new-logo" accept="image/svg+xml,image/png,image/webp" required
            class="sm:col-span-2 ${T.fileInput}" />
          <p class="sm:col-span-2 ${T.textMuted} text-xs -mt-1">El logo se muestra en blanco automáticamente en la barra (filtro aplicado en la web), no hace falta editar su color.</p>
          <button type="submit" class="sm:col-span-2 ${T.accent} ${T.radiusSm} py-2 text-sm">
            Añadir
          </button>
          <p id="add-error" class="sm:col-span-2 ${T.destructive} text-xs hidden"></p>
        </form>
      ` : ''}

      <div id="logos-list" class="space-y-2">${logos.map((l) => logoRow(l, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Sin logos.</p>`}</div>
    </div>
  `;

  if (!isAdmin) return;

  content.querySelectorAll('.toggle-active').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('partner_logos')
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
      const name = row.querySelector('p')?.textContent || 'este logo';
      if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;

      const logo = logos.find((l) => l.id === id);
      const { error } = await supabase.from('partner_logos').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      if (logo?.image_url?.includes('/storage/v1/object/public/partner-logos/')) {
        const path = logo.image_url.split('/partner-logos/')[1];
        if (path) await supabase.storage.from('partner-logos').remove([path]);
      }
      renderPanel(profile);
    });
  });

  const addForm = document.getElementById('add-form');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('add-error');
    errorEl.classList.add('hidden');

    const name = document.getElementById('new-name').value.trim();
    const file = document.getElementById('new-logo').files[0];

    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      errorEl.textContent = 'El logo no puede superar 2MB.';
      errorEl.classList.remove('hidden');
      return;
    }

    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('partner-logos').upload(path, file);
    if (uploadError) {
      errorEl.textContent = 'Error subiendo el logo: ' + uploadError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('partner-logos').getPublicUrl(path);
    const position = await nextPosition();

    const { error: insertError } = await supabase.from('partner_logos').insert({
      name,
      image_url: publicUrl,
      position,
      is_active: true,
    });

    if (insertError) {
      errorEl.textContent = 'Error guardando: ' + insertError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    renderPanel(profile);
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
