import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';
import { renderChangelog } from './changelog.js';
// Import en crudo: el contenido se compila dentro del bundle de esta página
// en build time. Al ser un fichero estático de texto (sin datos de clientes,
// credenciales ni nada sensible — ver CLAUDE.md), no hace falta servirlo
// desde Supabase; la protección de login es solo para no exponerlo a
// visitantes normales de la web, no una barrera de seguridad real sobre el
// contenido en sí.
import taskLogRaw from '../.claude/TASK-LOG.md?raw';

const app = document.getElementById('logs-app');

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderDenied() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">No se ha podido cargar tu perfil. Recarga la página en unos segundos.</p>`;
}

function renderLogsPage(profile) {
  const content = renderShell(app, {
    activeHref: '/logs',
    email: profile.email,
    role: profile.app_role,
    isAdmin: profile.app_role === 'admin',
  });

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Logs</h1>
      <p class="${T.textMuted} text-sm mb-8">Changelog del desarrollo del sitio — cada cambio de código, quién lo hizo y por qué. No registra acciones de usuarios del panel (ver CLAUDE.md).</p>
      <div class="${T.textSecondary} text-sm leading-relaxed [&_strong]:text-[#F5F5F5] [&_strong]:font-medium">
        ${renderChangelog(taskLogRaw)}
      </div>
    </div>
  `;
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
  renderLogsPage(profile);
}

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    boot();
  }
});
boot();
