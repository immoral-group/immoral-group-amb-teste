import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Postulaciones a ofertas activas (/oferta.html?slug=...): mismo patrón que
// api/contact.js — service_role key (nunca expuesta al cliente) para poder
// insertar en job_applications sin política de RLS pública, reCAPTCHA v3 para
// filtrar spam, y aquí además se valida que la oferta exista y siga activa
// antes de aceptar el CV.
//
// A diferencia de contact.js este endpoint es específico de este sitio (las
// ofertas solo se publican en /equipo de amb-teste), así que no necesita CORS
// cross-origin: el fetch siempre viene del mismo dominio que sirve esta
// función serverless.

const RECAPTCHA_SCORE_THRESHOLD = 0.5;
const RECAPTCHA_ACTION = 'job_application';

// El body JSON lleva el CV en base64 (~33% más pesado que el binario) más el
// resto de campos; el límite por defecto de Vercel para el body de una
// función serverless es 4.5MB, así que se deja margen de sobra.
const MAX_CV_BYTES = 3 * 1024 * 1024;
const ALLOWED_CV_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RECAPTCHA_SECRET_KEY) {
    console.error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RECAPTCHA_SECRET_KEY no están configuradas en las variables de entorno');
    return res.status(500).json({ success: false, message: 'Servicio de postulación no configurado' });
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { jobOpeningId, fullName, email, phone, recaptchaToken, cvBase64, cvFilename, cvMimeType } = req.body;

  if (!jobOpeningId || !fullName || !email || !cvBase64 || !cvFilename) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'Falta la verificación anti-spam' });
  }

  const { ok: captchaOk, data: captchaData } = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    console.warn('reCAPTCHA rechazado:', captchaData);
    return res.status(403).json({ success: false, message: 'No se pudo verificar que sos humano. Intenta de nuevo.' });
  }

  if (!ALLOWED_CV_MIME_TYPES.includes(cvMimeType)) {
    return res.status(400).json({ success: false, message: 'El CV debe ser un PDF o un documento de Word (.doc/.docx)' });
  }

  const cvBuffer = Buffer.from(cvBase64, 'base64');
  if (cvBuffer.length > MAX_CV_BYTES) {
    return res.status(400).json({ success: false, message: 'El CV no puede superar 3MB' });
  }

  const { data: offer, error: offerError } = await supabase
    .from('job_openings')
    .select('id, title')
    .eq('id', jobOpeningId)
    .eq('is_active', true)
    .maybeSingle();

  if (offerError) {
    console.error('Error validando la oferta:', offerError);
    return res.status(500).json({ success: false, message: 'Error validando la oferta' });
  }
  if (!offer) {
    return res.status(404).json({ success: false, message: 'Esta oferta ya no está activa' });
  }

  const cvPath = `${offer.id}/${randomUUID()}-${cvFilename}`;
  const { error: uploadError } = await supabase.storage.from('job-applications').upload(cvPath, cvBuffer, {
    contentType: cvMimeType,
  });
  if (uploadError) {
    console.error('Error subiendo el CV:', uploadError);
    return res.status(500).json({ success: false, message: 'Error subiendo el CV' });
  }

  const { error: insertError } = await supabase.from('job_applications').insert({
    job_opening_id: offer.id,
    job_title: offer.title,
    full_name: fullName,
    email,
    phone: phone || null,
    cv_path: cvPath,
    cv_filename: cvFilename,
  });

  if (insertError) {
    console.error('Error guardando la postulación:', insertError);
    return res.status(500).json({ success: false, message: 'Error guardando la postulación' });
  }

  return res.status(200).json({ success: true });
}
