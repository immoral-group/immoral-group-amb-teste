import { supabase } from './supabaseClient.js';
// TEMPORAL (decisión 11/08): sin reCAPTCHA mientras se prueba en amb-teste —
// ver la misma nota en api/job-application.js. Volver a importar
// getRecaptchaToken de './recaptcha.js' y mandar el token al reactivarlo.

// /oferta.html?slug=… on the Prisma design: the job opening comes from
// Supabase (job_openings, managed in /ofertas) and is drawn into
// #oferta-detail-root. Styles: "Oferta" in src/prisma-pages.css.

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

// Blank line = new paragraph; a single line break stays as it is.
function paragraphs(text) {
    return String(text ?? '')
        .replace(/\r\n/g, '\n')
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');
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
    document.title = 'Oferta no disponible · Immoral';
    root.innerHTML = `
        <section class="hero-offer hero-offer--empty" data-hero data-grain-off aria-labelledby="page-title">
            <div class="wrap hero-offer__wrap">
                <a class="hero-case__back" href="/equipo.html#ofertas" data-hero-fade><span aria-hidden="true">←</span> Ofertas activas</a>
                <h1 class="hero-title hero-offer__title" id="page-title" data-hero-title>Esta oferta ya no está disponible</h1>
                <p class="hero-note" data-hero-fade>Puede que se haya cerrado o que el enlace no sea correcto. Mira las que tenemos abiertas ahora.</p>
                <a class="btn btn--blue btn--lg" href="/equipo.html#ofertas" data-hero-fade data-magnetic><span>Ver ofertas activas</span><i class="btn__arrow" aria-hidden="true"></i></a>
            </div>
        </section>
    `;
}

function renderOffer(root, offer) {
    document.title = `${offer.title} · Trabaja en Immoral`;
    root.innerHTML = `
        <section class="hero-offer" data-hero data-grain-off aria-labelledby="page-title">
            <div class="wrap hero-offer__wrap">
                <a class="hero-case__back" href="/equipo.html#ofertas" data-hero-fade><span aria-hidden="true">←</span> Ofertas activas</a>
                <p class="hero-offer__eyebrow" data-hero-fade>Trabaja en Immoral</p>
                <h1 class="hero-title hero-offer__title" id="page-title" data-hero-title>${escapeHtml(offer.title)}</h1>
            </div>
        </section>

        <section class="offer-body section" aria-labelledby="puesto-title">
            <div class="wrap offer-body__wrap">
                <div class="offer-body__text">
                    <h2 class="h2" id="puesto-title">Sobre el puesto</h2>
                    <div class="offer-body__desc">${paragraphs(offer.description)}</div>
                    ${offer.survey_url ? `
                    <aside class="offer-body__survey">
                        <div>
                            <p class="offer-body__survey-title">¿Quieres contarnos algo más?</p>
                            <p class="offer-body__survey-text">Si quieres, puedes responder una breve encuesta adicional.</p>
                        </div>
                        <a class="btn" href="${escapeHtml(offer.survey_url)}" target="_blank" rel="noopener noreferrer"><span>Responder encuesta</span><i class="btn__arrow" aria-hidden="true"></i></a>
                    </aside>` : ''}
                </div>

                <form class="cform offer-form" id="application-form" aria-labelledby="form-title" novalidate>
                    <div>
                        <h2 class="offer-form__title" id="form-title">Postúlate a esta oferta</h2>
                        <p class="offer-form__lede">Cuéntanos quién eres y sube tu CV en PDF o Word (máx. 3 MB).</p>
                    </div>
                    <div class="field">
                        <input type="text" id="app-name" name="name" placeholder="Cómo te llamas" autocomplete="name" required>
                        <label for="app-name">Nombre completo</label>
                    </div>
                    <div class="field">
                        <input type="email" id="app-email" name="email" placeholder="Donde te respondemos" autocomplete="email" required>
                        <label for="app-email">Correo electrónico</label>
                    </div>
                    <div class="field">
                        <input type="tel" id="app-phone" name="phone" placeholder="Por si es más rápido llamarte" autocomplete="tel">
                        <label for="app-phone">Teléfono <span class="field__opt">(opcional)</span></label>
                    </div>
                    <label class="file-field" for="app-cv">
                        <input type="file" id="app-cv" name="cv" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required>
                        <span class="file-field__btn">Subir CV</span>
                        <span class="file-field__name" id="app-cv-name">PDF o Word, hasta 3 MB</span>
                    </label>
                    <div class="cform__foot">
                        <label class="check">
                            <input type="checkbox" id="app-consent" required>
                            <span class="check__box" aria-hidden="true"></span>
                            <span>Acepto la <a href="/privacidad.html">política de privacidad</a></span>
                        </label>
                        <button class="btn btn--blue btn--lg" type="submit" id="app-submit" data-magnetic><span>Enviar candidatura</span><i class="btn__arrow" aria-hidden="true"></i></button>
                    </div>
                    <p class="cform__status" id="app-status" role="status" aria-live="polite"></p>
                </form>
            </div>
        </section>
    `;

    const form = document.getElementById('application-form');
    const statusEl = document.getElementById('app-status');
    const submitBtn = document.getElementById('app-submit');
    const submitLabel = submitBtn.querySelector('span');
    const cvInput = document.getElementById('app-cv');
    const cvName = document.getElementById('app-cv-name');

    const setStatus = (text, kind) => {
        statusEl.textContent = text;
        statusEl.classList.toggle('is-ok', kind === 'ok');
        statusEl.classList.toggle('is-error', kind === 'error');
    };

    cvInput.addEventListener('change', () => {
        const file = cvInput.files[0];
        cvName.textContent = file ? file.name : 'PDF o Word, hasta 3 MB';
        cvInput.closest('.file-field').classList.toggle('is-filled', !!file);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setStatus('', null);

        if (!form.checkValidity()) {
            const firstInvalid = form.querySelector(':invalid');
            setStatus(firstInvalid?.id === 'app-consent'
                ? 'Para enviar la candidatura tienes que aceptar la política de privacidad.'
                : firstInvalid?.id === 'app-cv' ? 'Falta adjuntar tu CV.' : 'Revisa los campos marcados: falta alguno o no es válido.', 'error');
            firstInvalid?.focus();
            return;
        }

        const file = cvInput.files[0];
        if (!ALLOWED_CV_TYPES.includes(file.type)) {
            setStatus('El CV debe ser un PDF o un documento de Word (.doc/.docx).', 'error');
            return;
        }
        if (file.size > MAX_CV_BYTES) {
            setStatus('El CV no puede superar 3 MB.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitLabel.textContent = 'Enviando…';

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

            setStatus('Candidatura enviada correctamente. ¡Gracias por tu interés!', 'ok');
            form.reset();
            cvInput.dispatchEvent(new Event('change'));
        } catch (error) {
            console.error('Error:', error);
            setStatus(error.message || 'Hubo un error al enviar la candidatura. Intenta de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitLabel.textContent = 'Enviar candidatura';
        }
    });
}

// Draws the offer (or the "not available" state) and says which one it was.
export async function initOfertaDetail() {
    const root = document.getElementById('oferta-detail-root');
    if (!root) return null;

    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) {
        renderNotFound(root);
        return 'not-found';
    }

    const { data, error } = await supabase
        .from('job_openings')
        .select('id, title, description, survey_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

    if (error) console.error('Error cargando la oferta:', error);
    if (error || !data) {
        renderNotFound(root);
        return 'not-found';
    }

    renderOffer(root, data);
    return 'offer';
}
