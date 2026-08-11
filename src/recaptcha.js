// reCAPTCHA v3 (invisible, sin challenge): mismo site key en las 4 webs del
// grupo, la secret key vive solo en el servidor de cada endpoint centralizado
// (api/contact.js, api/job-application.js). Extraído de main.js para no
// duplicar la carga del script entre el formulario de contacto y el de
// postulación a ofertas (oferta.html también carga main.js para nav/footer).
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
let recaptchaScriptPromise = null;

function loadRecaptchaScript() {
    if (recaptchaScriptPromise) return recaptchaScriptPromise;
    recaptchaScriptPromise = new Promise((resolve, reject) => {
        if (window.grecaptcha) return resolve();
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
        document.head.appendChild(script);
    });
    return recaptchaScriptPromise;
}

export async function getRecaptchaToken(action = 'contact_form') {
    if (!RECAPTCHA_SITE_KEY) return null;
    await loadRecaptchaScript();
    return new Promise((resolve) => {
        window.grecaptcha.ready(() => {
            window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve);
        });
    });
}
