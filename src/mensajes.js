import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('mensajes-app');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderDenied() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">No se ha podido cargar tu perfil. Recarga la página en unos segundos.</p>`;
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

function messageRow(msg, isAdmin) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-4 flex flex-col gap-2" data-id="${msg.id}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(msg.nombre)}</p>
          <a href="mailto:${escapeHtml(msg.email)}" class="${T.accentText} text-xs">${escapeHtml(msg.email)}</a>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="${T.textMuted} text-xs">${formatFecha(msg.created_at)}</span>
          ${msg.etiqueta ? `<span class="text-xs px-2 py-0.5 ${T.radiusSm} bg-white/10 ${T.textSecondary}">${escapeHtml(msg.etiqueta)}</span>` : ''}
        </div>
      </div>
      <p class="${T.textSecondary} text-sm whitespace-pre-wrap">${escapeHtml(msg.mensaje)}</p>
      <div class="flex items-center justify-between gap-2 mt-1">
        <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
          <input type="checkbox" class="toggle-leido" ${msg.leido ? 'checked' : ''} ${isAdmin ? '' : 'disabled'} />
          Leído
        </label>
        ${isAdmin ? `<button class="delete-btn ${T.destructive} text-xs">Eliminar</button>` : ''}
      </div>
    </div>
  `;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/mensajes',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const messages = await loadMessages();
  const sinLeer = messages.filter((m) => !m.leido).length;

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Mensajes de contacto</h1>
      <p class="${T.textMuted} text-sm mb-6">Enviados desde el formulario de /contacto.${sinLeer ? ` <span class="${T.accentText}">${sinLeer} sin leer.</span>` : ''}</p>

      <div id="messages-list" class="flex flex-col gap-3">
        ${messages.map((m) => messageRow(m, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Todavía no hay mensajes.</p>`}
      </div>
    </div>
  `;

  content.querySelectorAll('.toggle-leido').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('contact_messages')
        .update({ leido: e.target.checked })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        e.target.checked = !e.target.checked;
      }
    });
  });

  if (!isAdmin) return;

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      if (!confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) return;

      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      renderPanel(profile);
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
