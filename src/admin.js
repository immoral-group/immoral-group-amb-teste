import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('admin-app');

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

function memberCard(member, isAdmin) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-3 flex flex-col gap-3" data-id="${member.id}">
      <img src="${escapeHtml(member.image_url)}" alt="${escapeHtml(member.name)}"
        class="w-full aspect-square object-cover ${T.radiusSm}" />
      <div class="min-w-0">
        <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(member.name)}</p>
        <p class="${T.textSecondary} text-xs truncate">${escapeHtml(member.role)}</p>
      </div>
      ${isAdmin ? `
        <div class="flex items-center justify-between gap-2">
          <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
            <input type="checkbox" class="toggle-active" ${member.is_active ? 'checked' : ''} />
            Activo
          </label>
          <div class="flex items-center gap-3">
            <button class="edit-btn ${T.accentText} text-xs">Editar</button>
            <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
          </div>
        </div>
      ` : `
        <span class="text-xs px-2 py-1 ${T.radiusSm} self-start ${member.is_active ? `${T.success} ${T.successBg} border ${T.successBorder}` : `${T.textMuted} border border-[#2E2E2E]`}">${member.is_active ? '✓ Activo' : 'Inactivo'}</span>
      `}
    </div>
  `;
}

function closeEditModal() {
  document.getElementById('edit-modal')?.remove();
}

function openEditModal(member, onSaved) {
  closeEditModal();

  const modal = document.createElement('div');
  modal.id = 'edit-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4';
  modal.innerHTML = `
    <div class="${T.surface} ${T.radiusCard} p-5 w-full max-w-md">
      <h2 class="${T.textPrimary} text-sm font-medium mb-4">Editar persona</h2>
      <form id="edit-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="text" id="edit-name" placeholder="Nombre" required value="${escapeHtml(member.name)}"
          class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
        <input type="text" id="edit-role" placeholder="Cargo" required value="${escapeHtml(member.role)}"
          class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
        <select id="edit-row" class="sm:col-span-2 ${T.input} ${T.radiusSm} px-3 py-2 text-sm">
          <option value="1" ${member.row_number === 1 ? 'selected' : ''}>Fila 1</option>
          <option value="2" ${member.row_number === 2 ? 'selected' : ''}>Fila 2</option>
        </select>
        <input type="file" id="edit-photo" accept="image/png,image/jpeg,image/webp"
          class="sm:col-span-2 ${T.textPrimary} text-sm" />
        <p class="sm:col-span-2 ${T.textMuted} text-xs -mt-1">Deja el campo de foto vacío para conservar la foto actual.</p>
        <div class="sm:col-span-2 flex gap-2 mt-1">
          <button type="submit" class="flex-1 ${T.accent} ${T.radiusSm} py-2 text-sm">Guardar</button>
          <button type="button" id="edit-cancel" class="flex-1 ${T.surface} ${T.textSecondary} ${T.radiusSm} py-2 text-sm">Cancelar</button>
        </div>
        <p id="edit-error" class="sm:col-span-2 ${T.destructive} text-xs hidden"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeEditModal();
  });
  document.getElementById('edit-cancel').addEventListener('click', closeEditModal);

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('edit-error');
    errorEl.classList.add('hidden');

    const name = document.getElementById('edit-name').value.trim();
    const role = document.getElementById('edit-role').value.trim();
    const rowNumber = Number(document.getElementById('edit-row').value);
    const file = document.getElementById('edit-photo').files[0];

    const updates = { name, role, row_number: rowNumber };

    if (rowNumber !== member.row_number) {
      updates.position = await nextPosition(rowNumber);
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        errorEl.textContent = 'La foto no puede superar 5MB.';
        errorEl.classList.remove('hidden');
        return;
      }
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('team-photos').upload(path, file);
      if (uploadError) {
        errorEl.textContent = 'Error subiendo la foto: ' + uploadError.message;
        errorEl.classList.remove('hidden');
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('team-photos').getPublicUrl(path);
      updates.image_url = publicUrl;
    }

    const { error: updateError } = await supabase.from('team_members').update(updates).eq('id', member.id);
    if (updateError) {
      errorEl.textContent = 'Error guardando: ' + updateError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    if (file && member.image_url?.includes('/storage/v1/object/public/team-photos/')) {
      const oldPath = member.image_url.split('/team-photos/')[1];
      if (oldPath) await supabase.storage.from('team-photos').remove([oldPath]);
    }

    closeEditModal();
    onSaved();
  });
}

async function loadTeamMembers() {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('row_number', { ascending: true })
    .order('position', { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}

async function nextPosition(rowNumber) {
  const { data } = await supabase
    .from('team_members')
    .select('position')
    .eq('row_number', rowNumber)
    .order('position', { ascending: false })
    .limit(1);
  return data && data.length ? data[0].position + 1 : 1;
}

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/admin',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const members = await loadTeamMembers();
  const row1 = members.filter((m) => m.row_number === 1);
  const row2 = members.filter((m) => m.row_number === 2);

  const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4';

  content.innerHTML = `
    <div class="max-w-6xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Equipo</h1>
      <p class="${T.textMuted} text-sm mb-6">Personas mostradas en /equipo, agrupadas por fila del carrusel.</p>

      ${!isAdmin ? `<p class="${T.textMuted} text-sm mb-6">Solo lectura — no tienes rol de administrador.</p>` : ''}

      ${isAdmin ? `
        <form id="add-form" class="${T.surface} ${T.radiusCard} p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <h2 class="sm:col-span-2 ${T.textPrimary} text-sm font-medium">Añadir persona</h2>
          <input type="text" id="new-name" placeholder="Nombre" required
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <input type="text" id="new-role" placeholder="Cargo" required
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <select id="new-row" class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">
            <option value="1">Fila 1</option>
            <option value="2">Fila 2</option>
          </select>
          <input type="file" id="new-photo" accept="image/png,image/jpeg,image/webp" required
            class="${T.textPrimary} text-sm" />
          <button type="submit" class="sm:col-span-2 ${T.accent} ${T.radiusSm} py-2 text-sm">
            Añadir
          </button>
          <p id="add-error" class="sm:col-span-2 ${T.destructive} text-xs hidden"></p>
        </form>
      ` : ''}

      <h2 class="${T.textSecondary} text-sm mb-2">Fila 1</h2>
      <div id="row1-list" class="${gridClasses} mb-8">${row1.map((m) => memberCard(m, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Sin personas.</p>`}</div>

      <h2 class="${T.textSecondary} text-sm mb-2">Fila 2</h2>
      <div id="row2-list" class="${gridClasses}">${row2.map((m) => memberCard(m, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Sin personas.</p>`}</div>
    </div>
  `;

  if (!isAdmin) return;

  content.querySelectorAll('.toggle-active').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: e.target.checked })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        e.target.checked = !e.target.checked;
      }
    });
  });

  content.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const member = members.find((m) => m.id === id);
      if (member) openEditModal(member, () => renderPanel(profile));
    });
  });

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const name = row.querySelector('p')?.textContent || 'esta persona';
      if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;

      const member = members.find((m) => m.id === id);
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      if (member?.image_url?.includes('/storage/v1/object/public/team-photos/')) {
        const path = member.image_url.split('/team-photos/')[1];
        if (path) await supabase.storage.from('team-photos').remove([path]);
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
    const role = document.getElementById('new-role').value.trim();
    const rowNumber = Number(document.getElementById('new-row').value);
    const file = document.getElementById('new-photo').files[0];

    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      errorEl.textContent = 'La foto no puede superar 5MB.';
      errorEl.classList.remove('hidden');
      return;
    }

    const path = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('team-photos').upload(path, file);
    if (uploadError) {
      errorEl.textContent = 'Error subiendo la foto: ' + uploadError.message;
      errorEl.classList.remove('hidden');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('team-photos').getPublicUrl(path);
    const position = await nextPosition(rowNumber);

    const { error: insertError } = await supabase.from('team_members').insert({
      name,
      role,
      image_url: publicUrl,
      row_number: rowNumber,
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

// Solo re-renderizamos en transiciones reales de login/logout — reaccionar
// también a TOKEN_REFRESHED (que ocurre periódicamente en segundo plano)
// resetearía cualquier formulario que el admin tenga a medio rellenar.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    boot();
  }
});
boot();
