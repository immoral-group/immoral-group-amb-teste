import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('tokens-app');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Token con la misma pinta que los ya emitidos a mano (48 caracteres hex) —
// se usa como identificador de escritura ante /api/contact.js, no como
// contraseña de un usuario, por eso basta con crypto.getRandomValues.
function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function renderLoading() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans p-6">Cargando…</p>`;
}

function renderDenied() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">No se ha podido cargar tu perfil. Recarga la página en unos segundos.</p>`;
}

function renderOnlyAdmin() {
  app.innerHTML = `<p class="${T.textSecondary} font-sans max-w-md mx-auto mt-24 text-center">Solo un administrador puede ver esta página.</p>`;
}

async function loadTokens() {
  const { data, error } = await supabase
    .from('tokens_validos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

function tokenRow(row) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-4 flex items-center justify-between gap-4" data-token="${escapeHtml(row.token)}">
      <div class="min-w-0">
        <p class="${T.textPrimary} text-sm font-medium">${escapeHtml(row.etiqueta)}</p>
        <p class="${T.textMuted} text-xs font-mono truncate">${escapeHtml(row.token)}</p>
      </div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <button class="copy-btn ${T.accentText} text-xs">Copiar</button>
        <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
      </div>
    </div>
  `;
}

async function renderPanel(profile) {
  const content = renderShell(app, {
    activeHref: '/tokens',
    email: profile.email,
    role: profile.app_role,
    isAdmin: true,
  });

  const tokens = await loadTokens();

  content.innerHTML = `
    <div class="max-w-3xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Tokens de contacto</h1>
      <p class="${T.textMuted} text-sm mb-6">
        Cada web del grupo (immoralia, imcontent, etc.) usa su propio token para escribir en <code>contact_messages</code>
        a través del endpoint de ingesta centralizado (<code>/api/contact</code>). Generá uno nuevo por cada web que
        conectes — no hace falta tocar código ni SQL.
      </p>

      <div class="flex gap-2 mb-6">
        <input id="new-etiqueta" type="text" placeholder="Etiqueta (ej. contacto-web-imfilms)"
          class="${T.input} ${T.radiusSm} px-3 py-2 text-sm flex-1" />
        <button id="add-token-btn" class="${T.accent} ${T.radiusSm} px-4 py-2 text-sm whitespace-nowrap">Agregar token</button>
      </div>
      <p id="new-token-result" class="hidden text-sm mb-6"></p>

      <div id="tokens-list" class="flex flex-col gap-3">
        ${tokens.map((t) => tokenRow(t)).join('') || `<p class="${T.textMuted} text-sm">Todavía no hay tokens.</p>`}
      </div>
    </div>
  `;

  document.getElementById('add-token-btn').addEventListener('click', async () => {
    const input = document.getElementById('new-etiqueta');
    const etiqueta = input.value.trim();
    if (!etiqueta) return;

    const token = generateToken();
    const { error } = await supabase.from('tokens_validos').insert({ token, etiqueta });

    const resultEl = document.getElementById('new-token-result');
    resultEl.classList.remove('hidden');
    if (error) {
      resultEl.className = `${T.destructive} text-sm mb-6`;
      resultEl.textContent = 'No se pudo crear el token: ' + error.message;
      return;
    }

    resultEl.className = `${T.success} text-sm mb-6 font-mono break-all`;
    resultEl.textContent = `Token generado para "${etiqueta}": ${token}`;
    input.value = '';
    renderPanel(profile);
  });

  content.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-token]');
      navigator.clipboard.writeText(row.dataset.token);
      e.target.textContent = 'Copiado';
      setTimeout(() => { e.target.textContent = 'Copiar'; }, 1500);
    });
  });

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-token]');
      const token = row.dataset.token;
      const etiqueta = row.querySelector('p').textContent;
      if (!confirm(`¿Eliminar el token de "${etiqueta}"? Esa web dejará de poder enviar mensajes de contacto.`)) return;

      const { error } = await supabase.from('tokens_validos').delete().eq('token', token);
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
  if (profile.app_role !== 'admin') {
    renderOnlyAdmin();
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
