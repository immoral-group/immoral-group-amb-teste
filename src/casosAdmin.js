import './style.css';
import { supabase } from './supabaseClient.js';
import { getSessionAndProfile } from './adminAuth.js';
import { renderShell, T } from './dashboardShell.js';
import { renderLoginView } from './loginView.js';

const app = document.getElementById('casos-admin-app');

const SECTORES = ['Moda & Lifestyle', 'Alimentación & Bebidas', 'Salud & Bienestar', 'Servicios B2B & SaaS'];
const RESULTADOS = ['Ventas', 'Leads', 'Awareness'];
const BUCKET = 'case-study-media';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Mismo criterio que los 19 casos actuales: nombre en minúsculas, sin
// acentos ni separadores (ej. "Grupo Mimara" -> "grupomimara"), usado tanto
// en el fichero caso-<slug>.html como en la URL pública.
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

async function triggerDeployHook() {
  const hookUrl = import.meta.env.VITE_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    console.warn('[casosAdmin] VITE_DEPLOY_HOOK_URL no configurado — el cambio se guardó en Supabase pero no se disparó ningún redeploy automático. La web no lo reflejará hasta el próximo build.');
    return false;
  }
  try {
    await fetch(hookUrl, { method: 'POST' });
    return true;
  } catch (e) {
    console.error('[casosAdmin] Error disparando el Deploy Hook de Vercel:', e);
    return false;
  }
}

async function uploadCaseImage(file, folder, maxSizeMB = 5) {
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`La imagen no puede superar ${maxSizeMB}MB.`);
  }
  const path = `${folder}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw new Error('Error subiendo la imagen: ' + error.message);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

async function removeCaseImageIfOwned(url) {
  if (url?.includes(`/storage/v1/object/public/${BUCKET}/`)) {
    const path = url.split(`/${BUCKET}/`)[1];
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
}

function caseCard(cs, isAdmin) {
  return `
    <div class="${T.surface} ${T.radiusCard} p-3 flex flex-col gap-3" data-id="${cs.id}">
      <img src="${escapeHtml(cs.cover_image_url)}" alt="${escapeHtml(cs.cover_image_alt)}"
        class="w-full aspect-video object-cover ${T.radiusSm}" />
      <div class="min-w-0">
        <p class="${T.textPrimary} text-sm font-medium truncate">${escapeHtml(cs.brand_name)}</p>
        <p class="${T.textSecondary} text-xs truncate">${escapeHtml(cs.sector)} · ${escapeHtml(cs.resultado)}</p>
      </div>
      ${isAdmin ? `
        <div class="flex items-center justify-between gap-2">
          <label class="flex items-center gap-2 text-xs ${T.textSecondary} cursor-pointer">
            <input type="checkbox" class="toggle-active" ${cs.is_active ? 'checked' : ''} />
            Activo
          </label>
          <div class="flex items-center gap-3">
            <button class="edit-btn ${T.accentText} text-xs">Editar</button>
            <button class="delete-btn ${T.destructive} text-xs">Eliminar</button>
          </div>
        </div>
      ` : `
        <span class="text-xs px-2 py-1 ${T.radiusSm} self-start ${cs.is_active ? `${T.success} ${T.successBg} border ${T.successBorder}` : `${T.textMuted} border border-[#2E2E2E]`}">${cs.is_active ? '✓ Activo' : 'Inactivo'}</span>
      `}
    </div>
  `;
}

async function loadCaseStudies() {
  const { data, error } = await supabase
    .from('case_studies')
    .select('*, case_study_results(*), case_study_testimonials(*)')
    .order('position', { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map((cs) => ({
    ...cs,
    case_study_results: [...(cs.case_study_results || [])].sort((a, b) => a.position - b.position),
    case_study_testimonials: [...(cs.case_study_testimonials || [])].sort((a, b) => a.position - b.position),
  }));
}

async function nextPosition() {
  const { data } = await supabase
    .from('case_studies')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  return data && data.length ? data[0].position + 1 : 1;
}

// ---------------------------------------------------------------------------
// Filas repetibles de Resultados (KPIs) y Testimonios dentro del modal
// ---------------------------------------------------------------------------

function resultRowHtml(value = '', label = '') {
  return `
    <div class="result-row flex gap-2 items-start">
      <input type="text" placeholder="Valor (ej. +310M)" value="${escapeHtml(value)}"
        class="result-value w-32 flex-shrink-0 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
      <input type="text" placeholder="Etiqueta (ej. de alcance total)" value="${escapeHtml(label)}"
        class="result-label flex-1 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
      <button type="button" class="remove-row ${T.destructive} text-xs px-2 py-2">×</button>
    </div>
  `;
}

function testimonialRowHtml(highlight = '', quote = '', authorName = '', authorRole = '') {
  return `
    <div class="testimonial-row flex flex-col gap-2 ${T.surface} ${T.radiusSm} p-3">
      <div class="flex gap-2">
        <input type="text" placeholder="Frase destacada (título corto)" value="${escapeHtml(highlight)}"
          class="testimonial-highlight flex-1 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
        <button type="button" class="remove-row ${T.destructive} text-xs px-2 py-2">×</button>
      </div>
      <textarea placeholder="Cita completa" rows="2"
        class="testimonial-quote ${T.input} ${T.radiusSm} px-3 py-2 text-sm">${escapeHtml(quote)}</textarea>
      <div class="flex gap-2">
        <input type="text" placeholder="Nombre" value="${escapeHtml(authorName)}"
          class="testimonial-author flex-1 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
        <input type="text" placeholder="Cargo (opcional)" value="${escapeHtml(authorRole)}"
          class="testimonial-role flex-1 ${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
      </div>
    </div>
  `;
}

function wireRepeatableRows(container, addBtn, rowHtmlFn) {
  addBtn.addEventListener('click', () => {
    container.insertAdjacentHTML('beforeend', rowHtmlFn());
  });
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-row')) {
      e.target.closest('.result-row, .testimonial-row')?.remove();
    }
  });
}

function optionsHtml(options, selected) {
  return options.map((o) => `<option value="${escapeHtml(o)}" ${o === selected ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('');
}

// ---------------------------------------------------------------------------
// Modal de alta / edición
// ---------------------------------------------------------------------------

function closeCaseModal() {
  document.getElementById('case-modal')?.remove();
}

function openCaseModal(caseStudy, onSaved) {
  closeCaseModal();
  const isEdit = Boolean(caseStudy);
  const cs = caseStudy || {
    brand_name: '', sector: SECTORES[0], resultado: RESULTADOS[0],
    cover_image_alt: '', description: '', challenge_text: '', mid_image_alt: '', solution_text: '',
    case_study_results: [{ value: '', label: '' }, { value: '', label: '' }],
    case_study_testimonials: [],
  };

  const modal = document.createElement('div');
  modal.id = 'case-modal';
  modal.className = 'fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto';
  modal.innerHTML = `
    <div class="${T.surface} ${T.radiusCard} p-5 w-full max-w-2xl my-8">
      <h2 class="${T.textPrimary} text-sm font-medium mb-4">${isEdit ? 'Editar caso de éxito' : 'Añadir caso de éxito'}</h2>
      <form id="case-form" class="flex flex-col gap-5">

        <section class="flex flex-col gap-3">
          <h3 class="${T.textSecondary} text-xs uppercase tracking-wide">Portada (grid de casos de éxito)</h3>
          <input type="text" id="case-brand-name" placeholder="Nombre de la marca" required value="${escapeHtml(cs.brand_name)}"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-3">
            <select id="case-sector" class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">${optionsHtml(SECTORES, cs.sector)}</select>
            <select id="case-resultado" class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">${optionsHtml(RESULTADOS, cs.resultado)}</select>
          </div>
          ${isEdit ? `<img src="${escapeHtml(cs.cover_image_url)}" alt="" class="w-full h-32 object-cover ${T.radiusSm}" />` : ''}
          <input type="file" id="case-cover-file" accept="image/png,image/jpeg,image/webp" ${isEdit ? '' : 'required'}
            class="${T.fileInput}" />
          <input type="text" id="case-cover-alt" placeholder="Texto alternativo de la portada" required value="${escapeHtml(cs.cover_image_alt)}"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          ${isEdit ? `<p class="${T.textMuted} text-xs -mt-1">Deja el campo de imagen vacío para conservar la portada actual.</p>` : ''}
        </section>

        <section class="flex flex-col gap-3">
          <h3 class="${T.textSecondary} text-xs uppercase tracking-wide">Contenido del caso</h3>
          <textarea id="case-description" placeholder="Descripción (párrafo bajo el título)" required rows="3"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">${escapeHtml(cs.description)}</textarea>
          ${isEdit ? `<img src="${escapeHtml(cs.logo_url)}" alt="" class="h-16 object-contain ${T.radiusSm} bg-white/5 p-1" />` : ''}
          <input type="file" id="case-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" ${isEdit ? '' : 'required'}
            class="${T.fileInput}" />
          ${isEdit ? `<p class="${T.textMuted} text-xs -mt-1">Deja el campo de logo vacío para conservar el logo actual.</p>` : ''}
          <textarea id="case-challenge" placeholder="Reto" required rows="3"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">${escapeHtml(cs.challenge_text)}</textarea>
          ${isEdit ? `<img src="${escapeHtml(cs.mid_image_url)}" alt="" class="w-full h-32 object-cover ${T.radiusSm}" />` : ''}
          <input type="file" id="case-mid-file" accept="image/png,image/jpeg,image/webp" ${isEdit ? '' : 'required'}
            class="${T.fileInput}" />
          <input type="text" id="case-mid-alt" placeholder="Texto alternativo de la imagen" required value="${escapeHtml(cs.mid_image_alt)}"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm" />
          ${isEdit ? `<p class="${T.textMuted} text-xs -mt-1">Deja el campo de imagen vacío para conservar la imagen actual.</p>` : ''}
          <textarea id="case-solution" placeholder="La solución" required rows="4"
            class="${T.input} ${T.radiusSm} px-3 py-2 text-sm">${escapeHtml(cs.solution_text)}</textarea>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="${T.textSecondary} text-xs uppercase tracking-wide">Resultados</h3>
            <button type="button" id="add-result" class="${T.accentText} text-xs">+ Añadir resultado</button>
          </div>
          <div id="results-rows" class="flex flex-col gap-2">
            ${cs.case_study_results.map((r) => resultRowHtml(r.value, r.label)).join('')}
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="${T.textSecondary} text-xs uppercase tracking-wide">Testimonios (opcional)</h3>
            <button type="button" id="add-testimonial" class="${T.accentText} text-xs">+ Añadir testimonio</button>
          </div>
          <div id="testimonials-rows" class="flex flex-col gap-2">
            ${cs.case_study_testimonials.map((t) => testimonialRowHtml(t.highlight, t.quote, t.author_name, t.author_role)).join('')}
          </div>
        </section>

        <div class="flex gap-2">
          <button type="submit" class="flex-1 ${T.accent} ${T.radiusSm} py-2 text-sm">Guardar</button>
          <button type="button" id="case-cancel" class="flex-1 ${T.surface} ${T.textSecondary} ${T.radiusSm} py-2 text-sm">Cancelar</button>
        </div>
        <p id="case-error" class="${T.destructive} text-xs hidden"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCaseModal();
  });
  document.getElementById('case-cancel').addEventListener('click', closeCaseModal);

  wireRepeatableRows(document.getElementById('results-rows'), document.getElementById('add-result'), () => resultRowHtml());
  wireRepeatableRows(document.getElementById('testimonials-rows'), document.getElementById('add-testimonial'), () => testimonialRowHtml());

  document.getElementById('case-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('case-error');
    errorEl.classList.add('hidden');

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const brandName = document.getElementById('case-brand-name').value.trim();
      const sector = document.getElementById('case-sector').value;
      const resultado = document.getElementById('case-resultado').value;
      const coverAlt = document.getElementById('case-cover-alt').value.trim();
      const description = document.getElementById('case-description').value.trim();
      const challengeText = document.getElementById('case-challenge').value.trim();
      const midAlt = document.getElementById('case-mid-alt').value.trim();
      const solutionText = document.getElementById('case-solution').value.trim();

      const coverFile = document.getElementById('case-cover-file').files[0];
      const logoFile = document.getElementById('case-logo-file').files[0];
      const midFile = document.getElementById('case-mid-file').files[0];

      const results = Array.from(document.querySelectorAll('#results-rows .result-row'))
        .map((row) => ({
          value: row.querySelector('.result-value').value.trim(),
          label: row.querySelector('.result-label').value.trim(),
        }))
        .filter((r) => r.value && r.label);

      const testimonials = Array.from(document.querySelectorAll('#testimonials-rows .testimonial-row'))
        .map((row) => ({
          highlight: row.querySelector('.testimonial-highlight').value.trim(),
          quote: row.querySelector('.testimonial-quote').value.trim(),
          author_name: row.querySelector('.testimonial-author').value.trim(),
          author_role: row.querySelector('.testimonial-role').value.trim() || null,
        }))
        .filter((t) => t.highlight && t.quote && t.author_name);

      if (!results.length) {
        throw new Error('Añade al menos un resultado.');
      }

      const payload = {
        brand_name: brandName,
        sector,
        resultado,
        cover_image_alt: coverAlt,
        description,
        challenge_text: challengeText,
        mid_image_alt: midAlt,
        solution_text: solutionText,
      };

      if (coverFile) payload.cover_image_url = await uploadCaseImage(coverFile, 'covers');
      if (logoFile) payload.logo_url = await uploadCaseImage(logoFile, 'logos', 2);
      if (midFile) payload.mid_image_url = await uploadCaseImage(midFile, 'mid');

      let caseId = cs.id;

      if (isEdit) {
        const { error: updateError } = await supabase.from('case_studies').update(payload).eq('id', caseId);
        if (updateError) throw new Error('Error guardando: ' + updateError.message);

        if (coverFile) await removeCaseImageIfOwned(cs.cover_image_url);
        if (logoFile) await removeCaseImageIfOwned(cs.logo_url);
        if (midFile) await removeCaseImageIfOwned(cs.mid_image_url);

        // Estrategia simple: reemplazar por completo los hijos (resultados y
        // testimonios) en cada guardado, en vez de diffear fila a fila — son
        // pocas filas por caso y así no hay que rastrear altas/bajas/cambios.
        await supabase.from('case_study_results').delete().eq('case_study_id', caseId);
        await supabase.from('case_study_testimonials').delete().eq('case_study_id', caseId);
      } else {
        payload.slug = slugify(brandName);
        payload.position = await nextPosition();
        payload.is_active = true;

        const { data: inserted, error: insertError } = await supabase.from('case_studies').insert(payload).select().single();
        if (insertError) throw new Error('Error guardando: ' + insertError.message);
        caseId = inserted.id;
      }

      if (results.length) {
        const { error: resultsError } = await supabase.from('case_study_results').insert(
          results.map((r, i) => ({ ...r, case_study_id: caseId, position: i + 1 }))
        );
        if (resultsError) throw new Error('Error guardando los resultados: ' + resultsError.message);
      }

      if (testimonials.length) {
        const { error: testimonialsError } = await supabase.from('case_study_testimonials').insert(
          testimonials.map((t, i) => ({ ...t, case_study_id: caseId, position: i + 1 }))
        );
        if (testimonialsError) throw new Error('Error guardando los testimonios: ' + testimonialsError.message);
      }

      await triggerDeployHook();
      closeCaseModal();
      onSaved();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// Panel principal
// ---------------------------------------------------------------------------

async function renderPanel(profile) {
  const isAdmin = profile.app_role === 'admin';
  const content = renderShell(app, {
    activeHref: '/casos-admin',
    email: profile.email,
    role: profile.app_role,
    isAdmin,
  });

  const cases = await loadCaseStudies();

  content.innerHTML = `
    <div class="max-w-6xl">
      <h1 class="${T.textPrimary} text-xl font-semibold mb-1">Casos de éxito</h1>
      <p class="${T.textMuted} text-sm mb-1">Casos mostrados en /casos-de-exito y sus páginas de detalle.</p>
      <p class="${T.textMuted} text-xs mb-6">Los cambios se guardan al instante, pero la web tarda 1-2 minutos en publicarlos (se regeneran las páginas en un nuevo build).</p>

      ${!isAdmin ? `<p class="${T.textMuted} text-sm mb-6">Solo lectura — no tienes rol de administrador.</p>` : ''}

      ${isAdmin ? `<button id="add-case-btn" class="${T.accent} ${T.radiusSm} px-4 py-2 text-sm mb-6">Añadir caso de éxito</button>` : ''}

      <div id="cases-list" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        ${cases.map((cs) => caseCard(cs, isAdmin)).join('') || `<p class="${T.textMuted} text-sm">Sin casos de éxito.</p>`}
      </div>
    </div>
  `;

  if (!isAdmin) return;

  document.getElementById('add-case-btn').addEventListener('click', () => {
    openCaseModal(null, () => renderPanel(profile));
  });

  content.querySelectorAll('.toggle-active').forEach((checkbox) => {
    checkbox.addEventListener('change', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const { error } = await supabase
        .from('case_studies')
        .update({ is_active: e.target.checked })
        .eq('id', id);
      if (error) {
        alert('No se pudo actualizar: ' + error.message);
        e.target.checked = !e.target.checked;
        return;
      }
      await triggerDeployHook();
    });
  });

  content.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const cs = cases.find((c) => c.id === id);
      if (cs) openCaseModal(cs, () => renderPanel(profile));
    });
  });

  content.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      const id = row.dataset.id;
      const cs = cases.find((c) => c.id === id);
      const name = cs?.brand_name || 'este caso';
      if (!confirm(`¿Eliminar el caso "${name}"? Esta acción no se puede deshacer.`)) return;

      const { error } = await supabase.from('case_studies').delete().eq('id', id);
      if (error) {
        alert('No se pudo eliminar: ' + error.message);
        return;
      }
      if (cs) {
        await removeCaseImageIfOwned(cs.cover_image_url);
        await removeCaseImageIfOwned(cs.logo_url);
        await removeCaseImageIfOwned(cs.mid_image_url);
      }
      await triggerDeployHook();
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
