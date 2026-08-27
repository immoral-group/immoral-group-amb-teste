import { createClient } from '@supabase/supabase-js';

// Redirección real de los códigos QR dinámicos: /qr/:code (rewrite en
// vercel.json) → esta función busca el target_url actual en Supabase y
// redirige ahí. El QR impreso nunca cambia — solo el destino guardado en la
// tabla, editable desde /qr-codes sin reimprimir nada.
//
// Usa la service_role key (nunca expuesta al cliente) porque el lookup es
// público/anónimo por naturaleza (cualquiera que escanee el QR) y
// qr_codes no tiene política de RLS para anon — mismo patrón que
// api/contact.js con tokens_validos.

const FALLBACK_URL = 'https://immoral.es';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no están configuradas en las variables de entorno');
    return res.redirect(307, FALLBACK_URL);
  }

  const { code } = req.query;
  if (!code) {
    return res.redirect(307, FALLBACK_URL);
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: qr, error } = await supabase
    .from('qr_codes')
    .select('id, target_url, is_active, scan_count')
    .eq('slug', code)
    .maybeSingle();

  if (error) {
    console.error('Error buscando el código QR:', error);
    return res.redirect(307, FALLBACK_URL);
  }

  if (!qr || !qr.is_active) {
    return res.redirect(307, FALLBACK_URL);
  }

  // Se espera el incremento antes de redirigir: en una función serverless no
  // hay garantía de que un fire-and-forget siga corriendo después de que la
  // respuesta ya se envió (la instancia puede congelarse/terminar).
  const { error: updateError } = await supabase
    .from('qr_codes')
    .update({ scan_count: qr.scan_count + 1 })
    .eq('id', qr.id);
  if (updateError) console.error('Error incrementando scan_count:', updateError);

  return res.redirect(307, qr.target_url);
}
