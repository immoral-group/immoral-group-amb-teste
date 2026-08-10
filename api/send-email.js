import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY no está configurada en las variables de entorno');
    return res.status(500).json({ success: false, message: 'Servicio de email no configurado' });
  }

  const { nombre, email, mensaje } = req.body;

  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }

  try {
    const data = await resend.emails.send({
      from: 'immoral.es <noreply@group.immoral.es>',
      to: ['gregory@immoral.es'], // TEMP: destinatario de prueba, volver a team@immoral.marketing luego
      subject: `Nuevo mensaje de contacto: ${nombre}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nuevo Mensaje</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; margin: 0; padding: 0; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #333333;">
            
            <!-- Header -->
            <div style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #333333;">
              <img src="https://immoral.es/imgs/Menues/logo-menu-claro.png" alt="IMMORAL" style="max-width: 200px; height: auto;">
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              <p style="font-size: 16px; line-height: 1.6; color: #cccccc; margin-top: 0;">Has recibido un nuevo mensaje desde el formulario web:</p>
              
              <div style="margin-top: 30px; margin-bottom: 30px;">
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666666; margin-bottom: 5px;">Nombre</p>
                <p style="font-size: 16px; color: #ffffff; margin-top: 0;">${nombre}</p>
                
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666666; margin-bottom: 5px; margin-top: 20px;">Email</p>
                <p style="font-size: 16px; color: #ffffff; margin-top: 0;"><a href="mailto:${email}" style="color: #2f80ed; text-decoration: none;">${email}</a></p>

                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666666; margin-bottom: 5px; margin-top: 20px;">Mensaje</p>
                <div style="background-color: #1f1f1f; padding: 20px; border-radius: 4px; color: #e5e5e5; font-size: 15px; line-height: 1.6;">
                  ${mensaje.replace(/\n/g, '<br>')}
                </div>
              </div>

              <div style="text-align: center; margin-top: 40px;">
                <a href="mailto:${email}" style="background-color: #2f80ed; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; font-size: 14px; text-transform: uppercase;">Responder</a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #0d0d0d; padding: 20px; text-align: center; font-size: 12px; color: #444444; border-top: 1px solid #222222;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Immoral Group. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Resend Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
