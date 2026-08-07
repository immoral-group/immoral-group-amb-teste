// Regenera casos-de-exito.html (grid + filtros) y un caso-<slug>.html por
// cada caso de éxito activo, a partir de los datos de Supabase. Se ejecuta
// antes de "vite dev"/"vite build" (predev/prebuild en package.json) para
// que lo gestionado desde /casos-admin esté siempre fresco antes de que Vite
// construya nada.
//
// Por qué build-time y no un fetch en el navegador (como equipo/ofertas/
// logos): las páginas de casos de éxito son las de más peso SEO del sitio —
// cada una necesita su propio <title>/meta/canonical/JSON-LD, indexable sin
// depender de que se ejecute JavaScript. Generarlas como HTML real en cada
// build conserva exactamente ese comportamiento; el precio es que un cambio
// guardado en el admin tarda 1-2 min en publicarse (dispara un redeploy en
// Vercel vía Deploy Hook, ver src/casosAdmin.js), en vez de verse al
// instante como equipo/ofertas/logos.
//
// Si Supabase no responde (red caída, credenciales ausentes en un checkout
// nuevo sin .env), el script avisa por consola y deja los ficheros
// existentes tal cual — un build no debe borrar el portafolio entero por un
// fallo de red puntual.

import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GRID_PAGE = join(ROOT, 'casos-de-exito.html');
const GENERATED_MARKER = '<!-- AUTO-GENERATED FROM SUPABASE — NO EDITAR A MANO, usa /casos-admin -->';

// Vite carga .env solo para su propio proceso — un script Node suelto
// ejecutado vía predev/prebuild no lo recibe automáticamente. En Vercel las
// env vars del proyecto ya están en process.env, así que esto es un no-op ahí.
function loadLocalEnv() {
  if (process.env.VITE_SUPABASE_URL) return;
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Línea en blanco = nuevo <p>, salto simple = <br> — mismo resultado visual
// que las páginas actuales, sin necesitar un editor de texto enriquecido.
function textToParagraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>\n              ')}</p>`)
    .join('\n            ');
}

function slugifyValue(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ---------------------------------------------------------------------------
// Bloques compartidos por todas las páginas de detalle (idénticos byte a
// byte en las 19 páginas actuales, confirmado por diff antes de extraerlos).
// ---------------------------------------------------------------------------

const HEAD_TOP = `<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;

const ORG_JSON_LD = `  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Immoral Group",
  "alternateName": "Immoral Growth Group",
  "url": "https://immoral.es/",
  "logo": "https://immoral.es/imgs/Menues/logo-menu-oscuro.png",
  "sameAs": [
    "https://www.instagram.com/immoral.group/",
    "https://www.linkedin.com/company/immoral-group/",
    "https://www.tiktok.com/@immoral.group",
    "https://www.youtube.com/@immoralmarketing"
  ]
}
  </script>`;

const HEAD_BOTTOM = `  <script type="module" src="/src/main.js"></script>
  <link rel="icon" type="image/svg+xml" href="imgs/favicon.svg">
  <!-- Matter.js CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"></script>
</head>`;

const NAV_AND_MOBILE_MENU = `<body class="bg-white overflow-visible">
  <!-- Menú Light -->
  <nav class="hidden xl:flex justify-between fixed inset-x-0 box-border px-10 pt-5 pb-5 font-black text-xs z-[100]">
    <a href="index.html" aria-label="Immoral — ir al inicio">
      <div><img src="/imgs/Menues/logo-menu-oscuro.png" alt=""></div>
    </a>
    <div>
      <div class="list-none flex flex-row items-center gap-12 text-black">

        <div class="w-35 items-center flex flex-col relative" id="dropdownButton">
          <div class="uppercase flex flex-row gap-3 justify-center" id="button">Quiénes Somos
            <img src="/imgs/Menues/arrowDown.svg" alt="arrowDown" class="w-3 invert">
          </div>
          <div
            class="mt-3 absolute left-0 top-full z-[100] w-50 hidden font-medium text-sm capitalize transition-all ease-out duration-300"
            id="dropdown">
            <ul class="flex flex-col bg-[#f7f7f7] text-black">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="nuestra-historia.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Nuestra historia</span>
                </li>
              </a>
              <a href="manifesto.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Manifesto</span>
                </li>
              </a>
              <a href="equipo.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Equipo</span>
                </li>
              </a>
            </ul>
          </div>
        </div>

        <div class="w-30 items-center flex flex-col relative" id="dropdownButton2">
          <div class="uppercase flex flex-row gap-3 justify-center" id="button2">Servicios
            <img src="/imgs/Menues/arrowDown.svg" alt="arrowDown" class="w-3 invert">
          </div>
          <div
            class="mt-3 absolute left-1/2 -translate-x-1/2 top-full z-[100] hidden w-52 font-medium text-sm capitalize transition-all ease-out duration-300"
            id="dropdown2">
            <ul class="flex flex-col bg-[#f7f7f7] text-black">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="publicidad-en-medios.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Publicidad en Medios</span>
                </li>
              </a>
              <a href="diseno-de-marca.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Diseño de Marca & Contenidos</span>
                </li>
              </a>
              <a href="gestion-de-redes.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Gestión de Redes Sociales</span>
                </li>
              </a>
              <a href="automatizacion-de-procesos.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Automatización de Procesos & IA</span>
                </li>
              </a>
              <a href="email-marketing.html">
                <li
                  class="py-3 px-5 border-b border-gray-300 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Email Marketing Automation & Embudos de Venta</span>
                </li>
              </a>
              <a href="influencer-marketing.html">
                <li
                  class="py-3 px-5 w-full text-center hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <span class="submenu-content">Influencer Marketing</span>
                </li>
              </a>
            </ul>
          </div>
        </div>
        <div class="w-30 items-center flex flex-col relative" id="dropdownButton3">
          <div class="uppercase flex flex-row gap-3 justify-center" id="button3">Verticales
            <img src="/imgs/Menues/arrowDown.svg" alt="arrowDown" class="w-3 invert">
          </div>
          <div
            class="mt-3 absolute left-0 top-full z-[100] hidden w-max font-medium capitalize transition-all ease-out duration-300"
            id="dropdown3">
            <ul class="flex flex-col bg-[#f7f7f7] text-black">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="https://imfashion.es/" target="_blank" rel="noopener noreferrer">
                <li
                  class="flex flex-col items-start gap-2 py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <img src="/imgs/Menues/logo-fashion.svg" alt="imfashion" class="h-7 w-auto">
                  <span class="text-sm font-light whitespace-nowrap submenu-content">Brandformance
                    para
                    moda</span>
                </li>
              </a>
              <a href="https://imfilms.es/" target="_blank" rel="noopener noreferrer">
                <li
                  class="flex flex-col items-start gap-2 py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <img src="/imgs/Menues/logo-films.svg" alt="imfilms" class="h-7 w-auto">
                  <span class="text-sm font-light whitespace-nowrap submenu-content">Publicidad para
                    cine</span>
                </li>
              </a>
              <a href="https://imcontent.es/" target="_blank" rel="noopener noreferrer">
                <li
                  class="flex flex-col items-start gap-2 py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <img src="/imgs/Menues/logo-content.svg" alt="imcontent" class="h-7 w-auto">
                  <span class="text-sm font-light whitespace-nowrap submenu-content">Contenido para
                    Social
                    Media</span>
                </li>
              </a>
              <a href="https://immoralia.es/" target="_blank" rel="noopener noreferrer">
                <li
                  class="flex flex-col items-start gap-2 py-4 px-5 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer submenu-item">
                  <img src="/imgs/Menues/logo-ia.svg" alt="immoralia" class="h-7 w-auto">
                  <span class="text-sm font-light whitespace-nowrap submenu-content">IA &
                    Automatizaciones</span>
                </li>
              </a>
            </ul>
          </div>
        </div>
        <a href="casos-de-exito.html" class="uppercase">
          <li>Casos de Éxito</li>
        </a>
        <a href="contacto.html"
          class="uppercase flex items-center self-center h-10 px-8 bg-blue-500 text-white rounded hover:bg-blue-600">
          <li>Contacto</li>
        </a>
      </div>
    </div>
  </nav>

  <!-- Mobile/Tablet Header (visible solo en móvil y tablet) -->
  <div
    class="bg-white xl:hidden fixed top-0 inset-x-0 z-50 box-border w-full flex items-center justify-between px-4 py-4"
    style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);">
    <a href="index.html"><img src="/imgs/Menues/logo-menu-oscuro.svg" alt="immoral" class="ml-4 h-6 w-auto"></a>
    <button id="mobileMenuOpenBtn" aria-label="Abrir menú"
      class="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6h16M4 12h16M4 18h16" stroke="#000" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </div>

  <!-- Overlay del Menú Móvil/Tablet -->
  <div id="mobileMenuOverlay" class="xl:hidden fixed inset-0 bg-white z-[60] hidden overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col h-[100dvh]">
      <div class="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 box-border w-full"
        style="padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);">
        <a href="index.html"><img src="/imgs/Menues/logo-menu-oscuro.svg" alt="immoral" class="ml-4 h-6 w-auto"></a>
        <button id="mobileMenuCloseBtn" aria-label="Cerrar menú"
          class="p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6l12 12M18 6l-12 12" stroke="#000" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="flex-1 px-5 sm:px-8 pt-2 pb-8 w-full max-w-[520px] mx-auto flex flex-col justify-evenly">
        <!-- QUIÉNES SOMOS -->
        <div class="border-b border-gray-200 pb-2">
          <button
            class="w-full flex items-center justify-center gap-2 text-black font-black text-2xl sm:text-3xl uppercase tracking-wide text-center py-4 sm:py-6"
            data-target="mobile-submenu-quienes" aria-expanded="false">
            QUIÉNES SOMOS
            <svg class="w-4 h-4 arrow-icon transition-transform" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <div id="mobile-submenu-quienes" class="hidden mt-4 overflow-hidden">
            <ul class="flex flex-col bg-[#f7f7f7] text-black rounded-md overflow-hidden text-center">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="nuestra-historia.html">
                <li class="py-4 px-5 border-b border-gray-300 w-full hover:bg-blue-50 hover:text-blue-600 transition">
                  Nuestra historia</li>
              </a>
              <a href="manifesto.html">
                <li class="py-4 px-5 border-b border-gray-300 w-full hover:bg-blue-50 hover:text-blue-600 transition">
                  Manifesto</li>
              </a>
              <a href="equipo.html">
                <li class="py-4 px-5 border-b border-gray-300 w-full hover:bg-blue-50 hover:text-blue-600 transition">
                  Equipo</li>
              </a>
            </ul>
          </div>
        </div>

        <!-- SERVICIOS -->
        <div class="border-b border-gray-200 pb-2">
          <button
            class="w-full flex items-center justify-center gap-2 text-black font-black text-2xl sm:text-3xl uppercase tracking-wide text-center py-4 sm:py-6"
            data-target="mobile-submenu-servicios" aria-expanded="false">
            SERVICIOS
            <svg class="w-4 h-4 arrow-icon transition-transform" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <div id="mobile-submenu-servicios" class="hidden mt-4 overflow-hidden">
            <ul class="flex flex-col bg-[#f7f7f7] text-black rounded-md overflow-hidden text-center">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="publicidad-en-medios.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">
                  Publicidad en medios</li>
              </a>
              <a href="diseno-de-marca.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">Diseño de
                  Marca & Contenidos</li>
              </a>
              <a href="gestion-de-redes.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">Gestión
                  de redes sociales</li>
              </a>
              <a href="automatizacion-de-procesos.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">
                  Automatización de procesos + IA</li>
              </a>
              <a href="email-marketing.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">Email
                  Marketing Automation & Embudos de Venta</li>
              </a>
              <a href="influencer-marketing.html">
                <li class="py-4 px-5 border-b border-gray-300 hover:bg-blue-50 hover:text-blue-600 transition">
                  Influencer Marketing</li>
              </a>
            </ul>
          </div>
        </div>

        <!-- VERTICALES -->
        <div class="border-b border-gray-200 pb-2">
          <button
            class="w-full flex items-center justify-center gap-2 text-black font-black text-2xl sm:text-3xl uppercase tracking-wide text-center py-4 sm:py-6"
            data-target="mobile-submenu-verticales" aria-expanded="false">
            VERTICALES
            <svg class="w-4 h-4 arrow-icon transition-transform" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
          <div id="mobile-submenu-verticales" class="hidden mt-4 overflow-hidden">
            <ul class="flex flex-col bg-[#f7f7f7] text-black rounded-md overflow-hidden text-center">
              <div class="w-full h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-700"></div>
              <a href="https://imfashion.es/" target="_blank" rel="noopener noreferrer">
                <li class="flex flex-col items-center py-4 px-5 border-b border-gray-300 hover:bg-blue-50 transition">
                  <img src="/imgs/Menues/logo-fashion.svg" alt="imfashion" class="h-9 w-auto mx-auto">
                  <span class="mt-2 text-base font-light">Brandformance para moda</span>
                </li>
              </a>
              <a href="https://imfilms.es/" target="_blank" rel="noopener noreferrer">
                <li class="flex flex-col items-center py-4 px-5 border-b border-gray-300 hover:bg-blue-50 transition">
                  <img src="/imgs/Menues/logo-films.svg" alt="imfilms" class="h-9 w-auto mx-auto">
                  <span class="mt-2 text-base font-light">Publicidad para cine</span>
                </li>
              </a>
              <a href="https://imcontent.es/" target="_blank" rel="noopener noreferrer">
                <li class="flex flex-col items-center py-4 px-5 border-b border-gray-300 hover:bg-blue-50 transition">
                  <img src="/imgs/Menues/logo-content.svg" alt="imcontent" class="h-9 w-auto mx-auto">
                  <span class="mt-2 text-base font-light">Contenido para Social Media</span>
                </li>
              </a>
              <a href="https://immoralia.es/" target="_blank" rel="noopener noreferrer">
                <li class="flex flex-col items-center py-4 px-5 hover:bg-blue-50 transition">
                  <img src="/imgs/Menues/logo-ia.svg" alt="immoralia" class="h-9 w-auto mx-auto">
                  <span class="mt-2 text-base font-light">IA & Automatizaciones</span>
                </li>
              </a>
            </ul>
          </div>
        </div>

        <!-- CASOS DE ÉXITO -->
        <a href="casos-de-exito.html"
          class="block text-black font-black text-2xl sm:text-3xl uppercase tracking-wide text-center py-4 sm:py-6">CASOS
          DE ÉXITO</a>

        <!-- CTA CONTACTO -->
        <div class="pt-2">
          <a href="contacto.html"
            class="block w-full max-w-[280px] mx-auto h-14 px-8 bg-blue-500 text-white rounded hover:bg-blue-600 text-lg sm:text-xl font-light text-center leading-[3.5rem]">CONTACTO</a>
        </div>
      </div>
    </div>
  </div>


  <section class="absolute w-screen xl:w-full h-screen overflow-hidden z-[1]">
    <!--<img src="images/bgcasos.png" alt="Hero Background"
      class="w-full h-screen object-cover top-0 object-right xl: object-center hidden xl:block">
    <img src="images/bgcasos.png" alt="Hero Background"
      class="w-full h-screen object-cover top-0 object-right xl: object-center xl:hidden">-->
  </section>`;

const FOOTER_AND_CLOSE = `  <!-- Footer -->
    <footer id="site-footer"></footer>
</body>

</html>`;

// ---------------------------------------------------------------------------
// Plantilla de una página de detalle
// ---------------------------------------------------------------------------

function testimonialsSectionHtml(testimonials) {
  if (!testimonials.length) return '';
  const cards = testimonials.map((t) => `              <div
                class="testimonial-card flex-shrink-0 w-full xl:w-[520px] bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mr-6">
                <h3 class="text-xl font-light text-[#4889eb] mb-2">${escapeHtml(t.highlight)}</h3>
                <p class="text-gray-700 mb-6">
                  ${escapeHtml(t.quote)}
                </p>
                <div class="flex items-center gap-3">
                  <img src="${escapeHtml(t.avatarUrl)}" alt="Logo de ${escapeHtml(t.brandName)}"
                    class="h-16 w-16 object-contain" />
                  <div>
                    <p class="text-gray-900 font-semibold">${escapeHtml(t.author_name.toUpperCase())}</p>
                    ${t.author_role ? `<p class="text-gray-600">${escapeHtml(t.author_role)}</p>` : ''}
                  </div>
                </div>
              </div>`).join('\n\n');

  return `

  <!--! Testimonials -->
  <!-- Simple Testimonials (nuevo diseño simplificado) -->
  <section class="w-full bg-white py-16 sm:py-20 xl:py-24">
    <div class="max-w-[1600px] mx-auto px-8">
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        <div>
          <h2 class="font-black text-3xl xl:text-5xl">
            <a class="">Lo que más valoran no </a><span class="hidden xl:inline"><br></span>
            <a class="">es solo lo que hacemos, </a><span class="hidden xl:inline"><br></span>
            <a class=""><span class="text-[#4889eb]">es cómo lo hacemos</span></a>
          </h2>
        </div>

        <div class="relative px-8 xl:px-12">
          <button id="simple-testimonials-prev" aria-label="Anterior"
            class="absolute left-0 xl:-left-16 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4889eb]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#000" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>

          <button id="simple-testimonials-next" aria-label="Siguiente"
            class="absolute right-0 xl:-right-16 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4889eb]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div id="simple-testimonials-carousel" class="overflow-hidden cursor-grab">
            <div class="testimonials-track flex transition-transform duration-300 ease-out">
${cards}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function resultsHtml(results) {
  return results.map((r) => `                  <div class="text-center">
                    <h2 class="text-[#4889eb] font-black text-5xl sm:text-6xl">${escapeHtml(r.value)}</h2>
                    <p class="reveal-lines font-light text-lg mt-2 text-gray-700">${escapeHtml(r.label)}</p>
                  </div>`).join('\n');
}

function renderDetailPage(cs) {
  const results = cs.case_study_results;
  const testimonials = cs.case_study_testimonials.map((t) => ({ ...t, avatarUrl: cs.logo_url, brandName: cs.brand_name }));

  return `${GENERATED_MARKER}
${HEAD_TOP}
  <title>${escapeHtml(cs.brand_name)} — Caso de éxito | Immoral</title>
  <meta name="description" content="${escapeHtml(cs.description).slice(0, 300)}">
  <link rel="canonical" href="https://immoral.es/caso-${escapeHtml(cs.slug)}">
${ORG_JSON_LD}
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Caso de éxito: ${escapeHtml(cs.brand_name).replace(/"/g, '\\"')}",
  "about": ${JSON.stringify(cs.description)},
  "url": "https://immoral.es/caso-${cs.slug}",
  "creator": {
    "@type": "Organization",
    "name": "Immoral Group",
    "url": "https://immoral.es/"
  }
}
  </script>
${HEAD_BOTTOM}

${NAV_AND_MOBILE_MENU}

  <!-- Hero Section - Case Study -->
  <section class="relative w-full py-8 xl:py-16 z-[5]">
    <div class="max-w-[95%] mx-auto px-4 xl:px-16 mt-40 mb-20">
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 xl:gap-16">
        <div class="reveal-group flex-1">
          <header class="mb-6 xl:mb-8">
            <p class="text-blue-500 text-xl xl:text-3xl font-light leading-relaxed mb-4 block-reveal">Caso de Éxito:</p>
            <h1 class="text-black text-4xl xl:text-6xl font-black leading-tight xl:leading-[78px] block-reveal">${escapeHtml(cs.brand_name)}</h1>
          </header>
          <div
            class="text-black text-lg xl:text-xl font-light leading-relaxed xl:leading-relaxed max-w-2xl reveal-lines">
            ${textToParagraphs(cs.description)}
          </div>
        </div>
        <div class="flex-shrink-0 xl:pr-20">
          <img class="w-24 h-20 xl:w-60 xl:h-24 object-contain" src="${escapeHtml(cs.logo_url)}" alt="Logo de ${escapeHtml(cs.brand_name)}" />
        </div>
      </div>
    </div>
  </section>
  <!-- Challenge Section -->
  <section class="relative w-full bg-black py-12 xl:py-16 z-[5]">
    <div class="max-w-7xl mx-auto px-4 xl:px-16">
      <div class="flex flex-col xl:flex-row xl:items-center gap-8 xl:gap-16">
        <div class="flex-shrink-0">
          <h2 class="text-white text-3xl xl:text-6xl font-black leading-tight xl:leading-[78px]">Reto</h2>
        </div>
        <div class="flex-1">
          <div class="text-white text-lg xl:text-xl font-light leading-relaxed reveal-lines">
            ${textToParagraphs(cs.challenge_text)}
          </div>
        </div>
      </div>
    </div>
  </section>
  <!-- Image Section -->
  <section class="relative w-full h-64 xl:h-[454px] overflow-hidden z-[5]">
    <img class="w-full h-full object-cover object-center" src="${escapeHtml(cs.mid_image_url)}"
      alt="${escapeHtml(cs.mid_image_alt)}" />
  </section>
  <!-- Solution and Results Section -->
  <section class="w-full bg-white py-12 xl:py-24 z-[5]">
    <div class="max-w-7xl mx-auto px-4 xl:px-16">
      <!-- Solution Subsection -->
      <div class="mb-16 xl:mb-24">
        <div class="flex flex-col xl:flex-row xl:items-start gap-8 xl:gap-16">
          <div class="flex-shrink-0">
            <h2 class="text-black text-3xl xl:text-6xl font-black leading-tight xl:leading-[78px]">La
              solución</h2>
          </div>
          <div class="flex-1">
            <div class="text-black text-lg xl:text-xl font-light leading-relaxed space-y-6">
              ${textToParagraphs(cs.solution_text)}
            </div>
          </div>
        </div>
      </div>

      <!-- Results Subsection -->
      <div class="pt-16">
        <div class="flex flex-col xl:flex-row xl:items-start gap-8 xl:gap-16 mb-12 xl:mb-16">
          <div class="flex-shrink-0">
            <h2
              class="text-black text-3xl xl:text-6xl font-black leading-tight xl:leading-[78px] text-center xl:text-left">
              Resultados</h2>
          </div>
          <div class="flex-1">
            <div class="w-full flex justify-center">
              <div class="w-full max-w-[800px] rounded-2xl py-8 px-10">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-16">
${resultsHtml(results)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>${testimonialsSectionHtml(testimonials)}

${FOOTER_AND_CLOSE}
`;
}

// ---------------------------------------------------------------------------
// Grid + filtros de casos-de-exito.html
// ---------------------------------------------------------------------------

function caseCardHtml(cs) {
  const sectorSlug = slugifyValue(cs.sector);
  const resultadoSlug = slugifyValue(cs.resultado);
  return `                <a href="caso-${cs.slug}.html" class="case-card group cursor-pointer" data-sector="${sectorSlug}"
                    data-resultado="${resultadoSlug}" data-logo="${escapeHtml(cs.logo_url)}">
                    <article class="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-80 xl:h-96 bg-black">
                        <img class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            src="${escapeHtml(cs.cover_image_url)}"
                            alt="${escapeHtml(cs.cover_image_alt)}"
                            loading="lazy" />
                        <video class="case-card-video absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
                            src="/videos/casos/${cs.slug}.mp4" muted loop playsinline preload="none"></video>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                            <div class="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
                                <span class="case-tag">${escapeHtml(cs.sector)}</span>
                                <span class="case-tag case-tag--result">${escapeHtml(cs.resultado)}</span>
                            </div>
                            <div class="absolute bottom-4 left-4 right-4">
                                <h3 class="text-white text-3xl xl:text-4xl font-bold leading-tight [text-shadow:_0px_0px_20px_rgb(0_0_0_/_0.8)]">
                                    ${escapeHtml(cs.brand_name.toUpperCase())}
                                </h3>
                            </div>
                        </div>
                    </article>
                </a>`;
}

function uniqueInOrder(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function filterPillsHtml(cases) {
  const sectors = uniqueInOrder(cases.map((c) => c.sector));
  const resultados = uniqueInOrder(cases.map((c) => c.resultado));

  const sectorPills = sectors.map((s) => `                        <button type="button" class="filter-pill" data-filter-group="sector"
                            data-filter-value="${slugifyValue(s)}">${escapeHtml(s)}</button>`).join('\n');
  const resultadoPills = resultados.map((r) => `                        <button type="button" class="filter-pill" data-filter-group="resultado"
                            data-filter-value="${slugifyValue(r)}">${escapeHtml(r)}</button>`).join('\n');

  return `                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-black uppercase tracking-wide text-black/40 mr-1">Sector</span>
                        <button type="button" class="filter-pill is-active" data-filter-group="sector"
                            data-filter-value="todos">Todos</button>
${sectorPills}
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-black uppercase tracking-wide text-black/40 mr-1">Resultado</span>
                        <button type="button" class="filter-pill is-active" data-filter-group="resultado"
                            data-filter-value="todos">Todos</button>
${resultadoPills}
                    </div>`;
}

function replaceBetweenMarkers(html, startMarker, endMarker, content) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No se encontraron los marcadores ${startMarker}/${endMarker} en casos-de-exito.html`);
  }
  const before = html.slice(0, start + startMarker.length);
  const after = html.slice(end);
  return `${before}\n${content}\n                    ${after}`;
}

function writeGridPage(cases) {
  let html = readFileSync(GRID_PAGE, 'utf-8');
  html = replaceBetweenMarkers(html, '<!-- CASOS_FILTERS_START -->', '<!-- CASOS_FILTERS_END -->', filterPillsHtml(cases));
  html = replaceBetweenMarkers(html, '<!-- CASOS_GRID_START -->', '<!-- CASOS_GRID_END -->', cases.map(caseCardHtml).join('\n\n'));
  writeFileSync(GRID_PAGE, html);
}

function writeDetailPages(cases) {
  for (const cs of cases) {
    writeFileSync(join(ROOT, `caso-${cs.slug}.html`), renderDetailPage(cs));
  }
}

// Borra los caso-*.html generados que ya no correspondan a ningún caso
// activo — solo toca ficheros que llevan el marcador de auto-generado, para
// no arriesgarse a borrar nada escrito a mano.
function pruneStaleDetailPages(cases) {
  const expected = new Set(cases.map((cs) => `caso-${cs.slug}.html`));
  const files = readdirSync(ROOT).filter((f) => /^caso-.+\.html$/.test(f));
  for (const file of files) {
    if (expected.has(file)) continue;
    const contents = readFileSync(join(ROOT, file), 'utf-8');
    if (contents.startsWith(GENERATED_MARKER)) {
      unlinkSync(join(ROOT, file));
      console.log(`[generate-case-studies] Eliminado ${file} (caso ya no activo).`);
    }
  }
}

async function main() {
  loadLocalEnv();

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[generate-case-studies] Faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY — se dejan los caso-*.html existentes sin tocar.');
    return;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('case_studies')
    .select('*, case_study_results(*), case_study_testimonials(*)')
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) {
    console.warn('[generate-case-studies] Error consultando Supabase, se dejan los ficheros existentes sin tocar:', error.message);
    return;
  }

  const cases = (data || []).map((c) => ({
    ...c,
    case_study_results: [...(c.case_study_results || [])].sort((a, b) => a.position - b.position),
    case_study_testimonials: [...(c.case_study_testimonials || [])].sort((a, b) => a.position - b.position),
  }));

  writeGridPage(cases);
  writeDetailPages(cases);
  pruneStaleDetailPages(cases);

  console.log(`[generate-case-studies] ${cases.length} caso(s) generado(s).`);
}

main().catch((err) => {
  console.error('[generate-case-studies] Error inesperado, se dejan los ficheros existentes sin tocar:', err);
});
