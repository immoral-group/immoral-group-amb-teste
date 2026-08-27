import './style.css';
import QRCode from 'qrcode';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('qr-codes-app');

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

function shortUrl(slug) {
  return `${window.location.origin}/qr/${slug}`;
}

// 6 caracteres alfanuméricos — suficiente entropía para este volumen, y el
// índice único de slug en Supabase es la garantía real ante colisión.
function generateSlug() {
  return Math.random().toString(36).slice(2, 8);
}

async function loadQrCodes() {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

function qrRow(qr, isAdmin) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-4 flex flex-col gap-3" data-id="${qr.id}" data-slug="${escapeHtml(qr.slug)}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(qr.nombre)}</p>
          <p class="${T.textMuted} text-xs truncate">${escapeHtml(shortUrl(qr.slug))}</p>
          <p class="${T.textSecondary} text-xs truncate mt-1">→ ${escapeHtml(qr.target_url)}</p>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="${T.textMuted} text-xs">${qr.scan_count} escaneo${qr.scan_count === 1 ? '' : 's'}</span>
          ${isAdmin ? `
            <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
              <input type="checkbox" class="toggle-active" ${qr.is_active ? 'checked' : ''} />
              Activo
            </label>
          ` : `
            <span class="text-xs px-2 py-1 ${T.radiusSm} ${qr.is_active ? `${T.success} ${T.successBg} border ${T.successBorder}` : `${T.textMuted} border border-[#2E2E2E]`}">${qr.is_active ? '✓ Activo' : 'Inactivo'}</span>
          `}
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="toggle-qr-btn ${T.accentText} text-xs">Ver QR</button>
        <button class="copy-link-btn ${T.accentText} text-xs">Copiar enlace</button>
        ${isAdmin ? `
          <button class="edit-btn ${T.accentText} text-xs">Editar destino</button>
          <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
        ` : ''}
      </div>
      <div class="qr-panel hidden"></div>
      ${isAdmin ? `<div class="edit-panel hidden pt-3 border-t border-[#2E2E2E]"></div>` : ''}
    </div>
  `;
}

function editForm(qr) {
  return `
    <form class="edit-form grid grid-cols-1 gap-3">
      <input type="text" class="edit-nombre ${T.input} ${T.radiusSm} px-3 py-2 text-sm" value="${escapeHtml(qr.nombre)}" placeholder="Nombre" required />
      <input type="url" class="edit-target-url ${T.input} ${T.radiusSm} px-3 py-2 text-sm" value="${escapeHtml(qr.target_url)}" placeholder="URL de destino" required />
      <p class="${T.textMuted} text-xs">El código impreso (${escapeHtml(shortUrl(qr.slug))}) no cambia — solo el destino.</p>
      <div class="flex items-center gap-2">
        <button type="submit" class="edit-save ${T.accent} ${T.radiusSm} px-4 py-2 text-sm">Guardar</button>
        <button type="button" class="edit-cancel ${T.textSecondary} text-sm">Cancelar</button>
      </div>
      <p class="edit-error ${T.destructive} text-xs hidden"></p>
    </form>
  `;
}

async function renderQrPanel(panel, qr) {
  const url = shortUrl(qr.slug);
  const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 2, color: { dark: '#0D0D0D', light: '#FFFFFF' } });
  panel.innerHTML = `
    <div class="flex flex-col items-center gap-3 py-2">
      <img src="${dataUrl}" alt="QR de ${escapeHtml(qr.nombre)}" class="w-40 h-40 ${T.radiusSm} bg-white p-2" />
      <a href="${dataUrl}" download="qr-${escapeHtml(qr.slug)}.png" class="${T.accent} ${T.radiusSm} px-4 py-2 text-sm">Descargar PNG</a>
    </div>
  `;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/qr-codes',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const qrCodes = await loadQrCodes();

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Códigos QR</h1>
      <p class="${T.textMuted} text-sm mb-6">QR dinámicos: el código impreso no cambia, pero el destino se puede editar en cualquier momento.</p>

      ${!isAdmin ? `<p class="${T.textMuted} text-sm mb-6">Solo lectura — no tienes rol de administrador.</p>` : ''}

      ${isAdmin ? `
        <form id="add-form" class="${T.surface} ${T.radiusCard} p-4 mb-8 grid grid-cols-1 gap-3">
          <h2 class="${T.textPrimary} text-sm font-medium">Crear código QR</h2>
          <input type="text" id="new-nombre" placeholder="Nombre (ej. Flyer evento verano)" required
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <input type="url" id="new-target-url" placeholder="URL de destino (ej. https://immoral.es/contacto)" required
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <button type="submit" class="${T.accent} ${T.radiusSm} py-2 text-sm">
            Crear
          </button>
          <p id="add-error" class="${T.destructive} text-xs hidden"></p>
        </form>
      ` : ''}

      <div id="qr-list" class="space-y-2">${qrCodes.map((q) => qrRow(q, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Todavía no hay códigos QR.</p>`}</div>
    </div>
  `;

  content.querySelectorAll('.toggle-qr-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const panel = row.querySelector('.qr-panel');
      const isOpen = panel.dataset.open === 'true';

      if (isOpen) {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        panel.dataset.open = 'false';
        return;
      }

      const qr = qrCodes.find((q) => q.id === id);
      panel.innerHTML = `<p class="${T.textMuted} text-xs py-2">Generando…</p>`;
      panel.classList.remove('hidden');
      panel.dataset.open = 'true';
      await renderQrPanel(panel, qr);
    });
  });

  content.querySelectorAll('.copy-link-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const slug = row.dataset.slug;
      try {
        await navigator.clipboard.writeText(shortUrl(slug));
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        setTimeout(() => { btn.textContent = original; }, 1500);
      } catch {
        alert('No se pudo copiar el enlace: ' + shortUrl(slug));
      }
    });
  });

  if (!isAdmin) return;

  content.querySelectorAll('.toggle-active').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('qr_codes')
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
      const qr = qrCodes.find((q) => q.id === id);
      if (!confirm(`¿Eliminar "${qr?.nombre || 'este código QR'}"? El enlace impreso dejará de funcionar. Esta acción no se puede deshacer.`)) return;

      const { error } = await supabase.from('qr_codes').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      renderPanel(profile);
    });
  });

  content.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const qr = qrCodes.find((q) => q.id === id);
      const panel = row.querySelector('.edit-panel');

      if (panel.dataset.open === 'true') {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        panel.dataset.open = 'false';
        return;
      }

      panel.innerHTML = editForm(qr);
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

        const nombre = panel.querySelector('.edit-nombre').value.trim();
        const targetUrl = panel.querySelector('.edit-target-url').value.trim();

        const { error } = await supabase
          .from('qr_codes')
          .update({ nombre, target_url: targetUrl })
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

  const addForm = document.getElementById('add-form');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('add-error');
    errorEl.classList.add('hidden');

    const nombre = document.getElementById('new-nombre').value.trim();
    const targetUrl = document.getElementById('new-target-url').value.trim();

    // Reintenta con un slug nuevo si hay colisión (índice único en Supabase) —
    // con 6 caracteres alfanuméricos es rarísimo, pero no imposible.
    let insertError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = generateSlug();
      const { error } = await supabase.from('qr_codes').insert({
        nombre,
        slug,
        target_url: targetUrl,
        is_active: true,
      });
      insertError = error;
      if (!error || error.code !== '23505') break;
    }

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
