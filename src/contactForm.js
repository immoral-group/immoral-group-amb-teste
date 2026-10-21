import { getRecaptchaToken } from './recaptcha.js';

// Contact form of immoral.es → centralised ingestion endpoint (api/contact.js).
// See docs/ARQUITECTURA-CONTACTO-CENTRALIZADO.md.
//
// The token identifies which form the message comes from (tokens_validos,
// label "contacto-web-immoral", managed from the /tokens panel). It is not a
// deep secret — it travels in the public bundle like the Supabase anon key;
// the real validation happens on the server with the service_role key.
export const CONTACT_FORM_TOKEN = '723d7c6ffc60a2e785227136401be8a46a6c89bf637e3f4e';
export const CONTACT_FORM_ENDPOINT = '/api/contact';

export const CONTACT_FORM_MESSAGES = {
    ok: 'Recibido. Te escribimos en menos de 24 horas laborables con nombre y apellidos, no desde un buzón automático.',
    error: 'No se ha enviado. Revisa el correo electrónico o escríbenos directamente a hola@immoral.es.',
};

/**
 * Sends the form fields (nombre, email, mensaje and any extra field) together
 * with the form token and a reCAPTCHA v3 token (action "contact_form").
 * Resolves with the server response or throws with its message.
 */
export async function sendContactForm(fields) {
    const recaptchaToken = await getRecaptchaToken('contact_form');
    const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token: CONTACT_FORM_TOKEN, recaptchaToken }),
    });
    let result = {};
    try { result = await response.json(); } catch (_) { /* non-JSON error page */ }
    if (!response.ok) throw new Error(result.message || 'Error al enviar el mensaje');
    return result;
}
