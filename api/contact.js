import { createClient } from '@supabase/supabase-js';

// Endpoint de ingesta ÚNICO y centralizado para el grupo (decisión del
// techlead, 10/08): vive solo aquí — ninguna otra web del grupo (immoralia,
// imcontent, imfilms, el sitio de producción immoral-group-cliente...) tiene
// su propia copia de este endpoint ni de la service_role key. Cada web
// simplemente le hace un fetch cross-origin a esta URL con su propio token;
// por eso hace falta CORS.
const ALLOWED_ORIGINS = [
  'https://immoral.es',
  'https://www.immoral.es',
  'https://immoral-group-sigma.vercel.app',
  'https://immoralia.es',
  'https://www.immoralia.es',
  'https://immoralia.vercel.app',
  'https://imcontent.es',
  'https://www.imcontent.es',
  'https://imcontent-landing.vercel.app',
  'https://immoral-group-amb-teste.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

// Usa la service_role key (nunca expuesta al cliente) para poder insertar en
// contact_messages sin política de RLS pública: la única puerta de entrada es
// este endpoint, que exige un token válido de tokens_validos antes de escribir.
//
// createClient() se llama dentro del handler (no a nivel de módulo): si falta
// una env var, lanza de inmediato ("supabaseUrl is required"), y a nivel de
// módulo eso tira abajo toda la función (crash de Node antes de poder
// responder nada) en vez de devolver un JSON de error controlado.

// reCAPTCHA v3 (score-based, sin challenge visual): cada una de las 4 webs
// del grupo obtiene un token en el cliente y lo manda aquí junto al resto del
// formulario; la verificación real (secret key) vive solo en este endpoint
// centralizado, nunca en el cliente. Umbral estándar recomendado por Google.
const RECAPTCHA_SCORE_THRESHOLD = 0.5;
const RECAPTCHA_ACTION = 'contact_form';

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const params = new URLSearchParams({ secret, response: token });
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await response.json();
  const ok = Boolean(data.success) && data.action === RECAPTCHA_ACTION && (data.score ?? 0) >= RECAPTCHA_SCORE_THRESHOLD;
  return { ok, data };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RECAPTCHA_SECRET_KEY) {
    console.error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RECAPTCHA_SECRET_KEY no están configuradas en las variables de entorno');
    return res.status(500).json({ success: false, message: 'Servicio de ingesta no configurado' });
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { token, nombre, email, mensaje, recaptchaToken } = req.body;

  if (!token || !nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'Falta la verificación anti-spam' });
  }

  const { ok: captchaOk, data: captchaData } = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    console.warn('reCAPTCHA rechazado:', captchaData);
    return res.status(403).json({ success: false, message: 'No se pudo verificar que sos humano. Intenta de nuevo.' });
  }

  const { data: tokenRow, error: tokenError } = await supabase
    .from('tokens_validos')
    .select('etiqueta')
    .eq('token', token)
    .maybeSingle();

  if (tokenError) {
    console.error('Error validando el token:', tokenError);
    return res.status(500).json({ success: false, message: 'Error validando la petición' });
  }
  if (!tokenRow) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }

  const { error: insertError } = await supabase
    .from('contact_messages')
    .insert({ nombre, email, mensaje, etiqueta: tokenRow.etiqueta });

  if (insertError) {
    console.error('Error guardando el mensaje:', insertError);
    return res.status(500).json({ success: false, message: 'Error guardando el mensaje' });
  }

  return res.status(200).json({ success: true });
}
