import { createClient } from '@supabase/supabase-js';

// Usa la service_role key (nunca expuesta al cliente) para poder insertar en
// contact_messages sin política de RLS pública: la única puerta de entrada es
// este endpoint, que exige un token válido de tokens_validos antes de escribir.
//
// createClient() se llama dentro del handler (no a nivel de módulo): si falta
// una env var, lanza de inmediato ("supabaseUrl is required"), y a nivel de
// módulo eso tira abajo toda la función (crash de Node antes de poder
// responder nada) en vez de devolver un JSON de error controlado.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no están configuradas en las variables de entorno');
    return res.status(500).json({ success: false, message: 'Servicio de ingesta no configurado' });
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { token, nombre, email, mensaje } = req.body;

  if (!token || !nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
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
