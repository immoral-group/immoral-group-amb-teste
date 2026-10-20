# Home color — copia de exploración

Fecha: 2026-09-30. Solicitud del usuario: duplicar la home y explorar un diseño joven y luminoso con la paleta de marca y referencias Bullcito, Revolt y Ninch.

- CA-01: `index.html` y los estilos compartidos permanecen intactos. La propuesta vive en `index-color.html`, con CSS y JS independientes.
- CA-02: Se conservan los textos, cifras, enlaces de servicios, testimonios y preguntas frecuentes de la home original.
- CA-03: Predominan blanco, cian #A8FFFF y azules #3980E4 / #1C39BB; animaciones de entrada, scroll e interacción con movimiento reducido y fallback sin WebGL.
- CA-04: Navegación, FAQ y testimonios funcionan con teclado y en móvil. No hay desbordamiento horizontal del documento.
- CA-05: La copia se incluye en Vite con `noindex,follow`. Build y revisión visual escritorio/móvil completados antes de entregar. Sin despliegue.

Historial: v1 — especificación inicial y alcance autorizado por el usuario.

Validación final: 86 bloques editoriales conservados mediante `scripts/verify-home-color.mjs`; recursos y enlaces locales existentes. SHA256 de index.html sin cambios. Sintaxis JS y diff sin errores. Revisión visual en escritorio y móvil (390 px), menú, FAQ, pausa/reanudación y carrusel circular con teclado comprobados. Sin imágenes rotas, errores de consola ni desbordamiento horizontal en las vistas revisadas. Build independiente de index-color.html correcto. El build global está bloqueado por un carácter de control preexistente en caso-angelanavarro.html:45; ese archivo no se modificó. No desplegado.
