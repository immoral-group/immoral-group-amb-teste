import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('postulaciones-app');

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

// El CV se guarda en un bucket privado (job-applications): a diferencia de
// job-icons/team-photos, aquí no hay URL pública — cada descarga pide una
// URL firmada de corta duración.
async function loadApplications() {
  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

function applicationRow(application) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-4 flex flex-col gap-2" data-id="${application.id}" data-cv-path="${escapeHtml(application.cv_path)}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(application.full_name)}</p>
          <a href="mailto:${escapeHtml(application.email)}" class="${T.accentText} text-xs">${escapeHtml(application.email)}</a>
          ${application.phone ? `<span class="${T.textMuted} text-xs ml-2">${escapeHtml(application.phone)}</span>` : ''}
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="${T.textMuted} text-xs">${formatFecha(application.created_at)}</span>
          <span class="text-xs px-2 py-0.5 ${T.radiusSm} bg-white/10 ${T.textSecondary}">${escapeHtml(application.job_title)}</span>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2 mt-1">
        <div class="flex items-center gap-4">
          <button class="download-btn ${T.accentText} text-xs">Descargar CV</button>
          <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
            <input type="checkbox" class="toggle-read" ${application.is_read ? 'checked' : ''} />
            Leída
          </label>
        </div>
        <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
      </div>
    </div>
  `;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/postulaciones',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  if (!isAdmin) {
    content.innerHTML = `<p class="${T.textSecondary} text-sm">Solo administradores pueden ver las postulaciones (contienen CVs, un dato personal sensible).</p>`;
    return;
  }

  const applications = await loadApplications();
  const sinLeer = applications.filter((a) => !a.is_read).length;

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Postulaciones</h1>
      <p class="${T.textMuted} text-sm mb-6">Candidaturas enviadas desde las páginas de detalle de "Ofertas activas".${sinLeer ? ` <span class="${T.accentText}">${sinLeer} sin leer.</span>` : ''}</p>

      <div id="applications-list" class="flex flex-col gap-3">
        ${applications.map(applicationRow).join('') || `<p class="${T.textMuted} text-sm">Todavía no hay postulaciones.</p>`}
      </div>
    </div>
  `;

  content.querySelectorAll('.toggle-read').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('job_applications')
        .update({ is_read: e.target.checked })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        e.target.checked = !e.target.checked;
      }
    });
  });

  content.querySelectorAll('.download-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const path = row.dataset.cvPath;
      const { data, error } = await supabase.storage.from('job-applications').createSignedUrl(path, 60);
      if (error) {
        alert('No se pudo generar el enlace de descarga: ' + error.message);
        return;
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    });
  });

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const path = row.dataset.cvPath;
      if (!confirm('¿Eliminar esta postulación? Esta acción no se puede deshacer.')) return;

      const { error } = await supabase.from('job_applications').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      if (path) await supabase.storage.from('job-applications').remove([path]);
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
