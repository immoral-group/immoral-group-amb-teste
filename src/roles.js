import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';

const app = document.getElementById('roles-app');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderNeedsLogin() {
  app.innerHTML = `
    <div class="min-h-screen ${T.page} flex items-center justify-center font-sans">
      <div class="max-w-md mx-auto text-center">
        <p class="${T.textSecondary} mb-4">Necesitas iniciar sesión primero.</p>
        <a href="/admin" class="${T.accentText}">Ir a /admin</a>
      </div>
    </div>
  `;
}

function renderDenied() {
  app.innerHTML = `
    <div class="min-h-screen ${T.page} flex items-center justify-center font-sans">
      <div class="max-w-md mx-auto text-center">
        <p class="${T.textSecondary} mb-4">Acceso denegado — necesitas rol de administrador para ver esta página.</p>
        <a href="/admin" class="${T.accentText}">Volver al panel</a>
      </div>
    </div>
  `;
}

async function loadProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, app_role, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function renderRolesPage(profile) {
  const content = renderShell(app, {
    activeHref: '/roles',
    email: profile.email,
    role: profile.app_role,
    isAdmin: true,
  });

  const profiles = await loadProfiles();
  const adminCount = profiles.filter((p) => p.app_role === 'admin').length;
  const currentUserId = profile.id;

  content.innerHTML = `
    <div class="max-w-2xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Roles</h1>
      <p class="${T.textMuted} text-sm mb-6">Quién puede gestionar el equipo y las ofertas activas.</p>
      <div class="space-y-2">
        ${profiles.map((p) => {
          const isSelf = p.id === currentUserId;
          const isLastAdmin = p.app_role === 'admin' && adminCount <= 1;
          const disable = isSelf && isLastAdmin;
          return `
            <div class="flex items-center gap-4 ${T.surface} ${T.radiusCard} p-3" data-id="${p.id}">
              <div class="flex-1 min-w-0">
                <p class="${T.textPrimary} text-sm truncate">${escapeHtml(p.email)}${isSelf ? ` <span class="${T.textMuted}">(tú)</span>` : ''}</p>
              </div>
              <label class="flex items-center gap-2 text-xs ${T.textSecondary} ${disable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}">
                <input type="checkbox" class="toggle-admin" ${p.app_role === 'admin' ? 'checked' : ''} ${disable ? 'disabled title="No puedes quitarte el rol de admin siendo el único"' : ''} />
                Admin
              </label>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('.toggle-admin').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const newRole = e.target.checked ? 'admin' : 'usuario';
      const { error } = await supabase.from('profiles').update({ app_role: newRole }).eq('id', id);
      if (error) {
        alert('No se pudo cambiar el rol: ' + error.message);
        e.target.checked = !e.target.checked;
        return;
      }
      renderRolesPage(profile);
    });
  });
}

async function boot() {
  renderLoading();
  const { session, profile } = await getSessionAndProfile();
  if (!session) {
    renderNeedsLogin();
    return;
  }
  if (!profile || profile.app_role !== 'admin') {
    renderDenied();
    return;
  }
  renderRolesPage(profile);
}

boot();
