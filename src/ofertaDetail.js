import { supabase } from './supabaseClient.js';
// TEMPORAL (decisión 11/08): sin reCAPTCHA mientras se prueba en amb-teste —
// ver la misma nota en api/job-application.js. Volver a importar
// getRecaptchaToken de './recaptcha.js' y mandar el token al reactivarlo.

const MAX_CV_BYTES = 3 * 1024 * 1024;
const ALLOWED_CV_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderNotFound(root) {
    root.innerHTML = `
        <section class="w-full bg-black min-h-[70vh] flex items-center pt-32 pb-20 px-6 sm:px-12 xl:px-24">
            <div class="max-w-2xl mx-auto text-center">
                <h1 class="text-3xl sm:text-4xl font-black text-white mb-4">Oferta no encontrada</h1>
                <p class="text-gray-400 font-light mb-8">Esta oferta ya no está disponible o el enlace no es correcto.</p>
                <a href="/equipo.html" class="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-all duration-300">Ver ofertas activas</a>
            </div>
        </section>
    `;
}

function renderOffer(root, offer) {
    root.innerHTML = `
        <section class="w-full bg-black pt-40 pb-20 px-6 sm:px-12 xl:px-24">
            <div class="max-w-4xl">
                <a href="/equipo.html" class="text-blue-500 text-sm font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2 hover:text-blue-400 transition-colors">
                    ← Ofertas activas
                </a>
                <h1 class="mt-4 text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-tight">${escapeHtml(offer.title)}</h1>
            </div>
        </section>

        <section class="w-full bg-white py-20 px-6 sm:px-12 xl:px-24">
            <div class="max-w-4xl mx-auto">
                <div class="w-16 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-16 rounded-full"></div>

                <div class="space-y-16 text-gray-700 leading-relaxed">
                    <div>
                        <h2 class="text-2xl font-black text-black mb-6">Sobre el puesto</h2>
                        <p class="whitespace-pre-line">${escapeHtml(offer.description)}</p>
                    </div>

                    <div>
                        <div class="bg-black rounded-2xl p-8 text-white">
                            <h3 class="font-black text-lg mb-3">Postúlate a esta oferta</h3>
                            <p class="text-gray-400 text-sm mb-6">Cuéntanos quién eres y sube tu CV en PDF o Word (máx. 3MB).</p>

                            <form id="application-form" class="space-y-4">
                                <input type="text" id="app-name" placeholder="Nombre completo" required
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                <input type="email" id="app-email" placeholder="Email" required
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                <input type="tel" id="app-phone" placeholder="Teléfono (opcional)"
                                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                                <input type="file" id="app-cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required
                                    class="w-full text-gray-400 text-sm cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-600 file:transition-colors" />
                                <button type="submit" id="app-submit" class="w-full bg-blue-500 text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    Enviar candidatura
                                </button>
                                <p id="app-status" class="hidden text-sm"></p>
                            </form>
                        </div>
                    </div>

                    ${offer.survey_url ? `
                    <div>
                        <div class="border border-gray-200 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
                            <div>
                                <h3 class="font-black text-lg text-black mb-1">¿Quieres contarnos algo más?</h3>
                                <p class="text-gray-500 text-sm">Si quieres, puedes responder una breve encuesta adicional.</p>
                            </div>
                            <a href="${escapeHtml(offer.survey_url)}" target="_blank" rel="noopener noreferrer"
                                class="shrink-0 inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all duration-300">
                                Responder encuesta
                            </a>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </section>
    `;

    const form = document.getElementById('application-form');
    const statusEl = document.getElementById('app-status');
    const submitBtn = document.getElementById('app-submit');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.classList.add('hidden');
        statusEl.classList.remove('text-red-400', 'text-green-400');

        const file = document.getElementById('app-cv').files[0];
        if (!file) return;

        if (!ALLOWED_CV_TYPES.includes(file.type)) {
            statusEl.textContent = 'El CV debe ser un PDF o un documento de Word (.doc/.docx).';
            statusEl.classList.remove('hidden');
            statusEl.classList.add('text-red-400');
            return;
        }
        if (file.size > MAX_CV_BYTES) {
            statusEl.textContent = 'El CV no puede superar 3MB.';
            statusEl.classList.remove('hidden');
            statusEl.classList.add('text-red-400');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'ENVIANDO...';

        try {
            const cvBase64 = await fileToBase64(file);

            const response = await fetch('/api/job-application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobOpeningId: offer.id,
                    fullName: document.getElementById('app-name').value.trim(),
                    email: document.getElementById('app-email').value.trim(),
                    phone: document.getElementById('app-phone').value.trim(),
                    cvBase64,
                    cvFilename: file.name,
                    cvMimeType: file.type,
                }),
            });

            // response.json() explota con "Unexpected end of JSON input" si el
            // servidor responde sin body JSON (ej. un 404 sirviendo /api/* fuera
            // de Vercel, como en `npm run dev`), tapando el mensaje de error real.
            let result = null;
            try {
                result = await response.json();
            } catch {
                throw new Error('No se pudo contactar con el servidor. Si estás en local, las rutas /api solo funcionan en producción o con `vercel dev`.');
            }
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Error al enviar la candidatura');
            }

            statusEl.textContent = 'Candidatura enviada correctamente. ¡Gracias por tu interés!';
            statusEl.classList.remove('hidden');
            statusEl.classList.add('text-green-400');
            form.reset();
            submitBtn.textContent = 'Enviar candidatura';
        } catch (error) {
            console.error('Error:', error);
            statusEl.textContent = error.message || 'Hubo un error al enviar la candidatura. Intenta de nuevo.';
            statusEl.classList.remove('hidden');
            statusEl.classList.add('text-red-400');
            submitBtn.textContent = 'Enviar candidatura';
        } finally {
            submitBtn.disabled = false;
        }
    });
}

export async function initOfertaDetail() {
    const root = document.getElementById('oferta-detail-root');
    if (!root) return;

    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
        renderNotFound(root);
        return;
    }

    const { data, error } = await supabase
        .from('job_openings')
        .select('id, title, description, survey_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('Error cargando la oferta:', error);
        renderNotFound(root);
        return;
    }
    if (!data) {
        renderNotFound(root);
        return;
    }

    renderOffer(root, data);
}
