import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('logos-app');

const SIZE_OPTIONS = [1, 2, 2.5, 3];

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

// Misma altura base y clases que src/partnerLogos.js (el renderer real de la
// home) — si esa función cambia, esta preview se desactualiza a propósito
// hasta que se toquen ambas a la vez, no hay una fuente compartida por lo
// chico que es el snippet.
function previewLogoHTML(logo) {
  const multiplier = Number(logo.size_multiplier) || 1;
  return `<img src="${escapeHtml(logo.image_url)}" alt="${escapeHtml(logo.name)}"
    style="height: calc(1.5rem * ${multiplier})"
    class="w-auto brightness-0 invert opacity-50 hover:opacity-100 transition-opacity" />`;
}

// Barra idéntica a la de la home (mismas clases: brands-carousel,
// animate-scroll-brands, la máscara de degradado) para previsualizar en vivo
// cómo queda cada cambio, sin tener que ir a mirar index.html.
function renderPreviewBar(logos) {
  const active = logos.filter((l) => l.is_active);
  if (!active.length) {
    return `<p class="${T.textMuted} text-sm">Sin logos activos — la sección se ocultaría en la home.</p>`;
  }
  const html = active.map(previewLogoHTML).join('');
  return `
    <div class="w-full max-w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div class="brands-carousel flex items-center gap-16 animate-scroll-brands py-4">${html}${html}</div>
    </div>
  `;
}

function logoRow(logo, isAdmin) {
  const multiplier = Number(logo.size_multiplier) || 1;
  return `
    <div class="flex items-center gap-4 ${T.surface} ${T.radiusCard} p-3" data-id="${logo.id}">
      <div class="w-10 h-10 flex items-center justify-center bg-white/5 ${T.radiusSm} p-1 flex-shrink-0">
        <img src="${escapeHtml(logo.image_url)}" alt="${escapeHtml(logo.name)}"
          class="max-w-full max-h-full object-contain brightness-0 invert" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(logo.name)}</p>
      </div>
      ${isAdmin ? `
        <select class="size-select ${T.input} ${T.radiusSm} px-2 py-1.5 text-xs">
          ${SIZE_OPTIONS.map((v) => `<option value="${v}" ${v === multiplier ? 'selected' : ''}>${v}x</option>`).join('')}
        </select>
        <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
          <input type="checkbox" class="toggle-active" ${logo.is_active ? 'checked' : ''} />
          Activo
        </label>
        <button class="replace-image-btn ${T.accentText} text-xs">Cambiar imagen</button>
        <input type="file" class="replace-image-input hidden" accept="image/svg+xml,image/png,image/webp" />
        <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
      ` : `
        <span class="${T.textMuted} text-xs">${multiplier}x</span>
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

// Sube el archivo nuevo antes de borrar el viejo — si la subida falla, el
// logo actual se queda intacto en vez de quedar sin imagen.
async function replaceLogoImage(logo, file) {
  const path = `${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('partner-logos').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('partner-logos').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('partner_logos')
    .update({ image_url: publicUrl })
    .eq('id', logo.id);
  if (updateError) throw updateError;

  if (logo.image_url?.includes('/storage/v1/object/public/partner-logos/')) {
    const oldPath = logo.image_url.split('/partner-logos/')[1];
    if (oldPath) await supabase.storage.from('partner-logos').remove([oldPath]);
  }
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
      <p class="${T.textMuted} text-sm mb-6">Logos de clientes mostrados en el carrusel de la home.</p>

      <div class="bg-black ${T.radiusCard} p-6 mb-8">
        <p class="text-white/40 text-xs uppercase tracking-wider mb-4">Preview — así se ve en la home</p>
        <div id="preview-bar">${renderPreviewBar(logos)}</div>
      </div>

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
        return;
      }
      renderPanel(profile);
    });
  });

  content.querySelectorAll('.size-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('partner_logos')
        .update({ size_multiplier: Number(e.target.value) })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar el tamaño: ' + error.message);
        return;
      }
      renderPanel(profile);
    });
  });

  content.querySelectorAll('.replace-image-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      row.querySelector('.replace-image-input').click();
    });
  });

  content.querySelectorAll('.replace-image-input').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('El logo no puede superar 2MB.');
        return;
      }

      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const logo = logos.find((l) => l.id === id);

      try {
        await replaceLogoImage(logo, file);
      } catch (error) {
        alert('No se pudo reemplazar la imagen: ' + error.message);
        return;
      }
      renderPanel(profile);
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
