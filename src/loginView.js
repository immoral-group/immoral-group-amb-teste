import { signInWithPassword, signUpWithPassword, signInWithGoogle } from './adminAuth.js';

// Pantalla de acceso compartida por todos los paneles internos (/admin,
// /ofertas, /roles). Layout partido: animación de marca a la izquierda con el
// claim, formulario a la derecha sobre fondo claro — coherente con el sistema
// híbrido dark/light de los dashboards de Immoral (ver
// docs/DESIGN-REFERENCE.md) y con la paleta de marca
// (docs/IMMORAL-BRAND-GUIDELINES.md, sección 3.2).
//
// La animación se sirve como vídeo y no como el .gif original: el GIF pesa
// 16,5 MB y en vídeo son ~300 KB con la misma imagen. Es además el patrón que
// ya usa el resto del sitio (HABLEMOS.webm, CONTACTO.webm…).

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/**
 * Renderiza la pantalla de login dentro de `root`.
 * @param {HTMLElement} root
 * @param {() => void} onAuthenticated  Se llama tras un login correcto.
 * @param {string} [errorMessage]
 */
export function renderLoginView(root, onAuthenticated, errorMessage) {
  root.innerHTML = `
    <div class="min-h-screen w-full flex font-sans bg-[#F5F5F5]">

      <!-- Panel de la animación (izquierda): tarjeta negra redondeada, con
           margen arriba, abajo y a los lados. El fondo del vídeo es negro puro,
           así que se funde con la tarjeta sin costuras. -->
      <div class="hidden lg:flex w-1/2 shrink-0 p-5">
        <div class="relative flex-1 overflow-hidden rounded-[26px] bg-black">
          <!-- El personaje va anclado al borde inferior de la tarjeta -->
          <video class="absolute bottom-0 left-1/2 w-[78%] -translate-x-1/2"
            autoplay muted loop playsinline disablepictureinpicture aria-hidden="true" tabindex="-1">
            <source src="/login/imgs/ani-login.webm" type="video/webm" />
          </video>

          <a href="/" class="absolute top-9 left-9 z-10">
            <img src="/imgs/Menues/logo-menu-claro.png" alt="immoral" class="h-6 w-auto" />
          </a>

          <div class="absolute bottom-12 left-9 right-9 pointer-events-none">
            <h2 class="font-black text-white leading-[0.95] text-2xl xl:text-3xl">
              PIENSA.<br />
              CREA.<br />
              <span class="text-[#A8FFFF]">ESCALA.</span>
            </h2>
            <p class="mt-4 text-white/60 text-xs font-light max-w-xs">
              Panel interno de Immoral Group.
            </p>
          </div>
        </div>
      </div>

      <!-- Panel de formulario (derecha) -->
      <div class="flex-1 flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-sm">

          <!-- Logo visible solo en móvil, donde no hay panel de imagen -->
          <a href="/" class="lg:hidden block w-fit mx-auto mb-10">
            <img src="/imgs/Menues/logo-menu-oscuro.png" alt="immoral" class="h-6 w-auto" />
          </a>

          <h1 class="font-black text-[#111111] text-2xl uppercase tracking-tight text-center">
            Bienvenido de nuevo
          </h1>
          <p class="text-[#5E5E5E] text-sm text-center mt-2 mb-8">
            Accede con tu cuenta de Immoral para gestionar la web.
          </p>

          ${errorMessage ? `
            <div class="mb-6 px-4 py-3 rounded-[8px] bg-[#E5484D]/10 border border-[#E5484D]/30">
              <p class="text-[#B4232A] text-sm">${escapeHtml(errorMessage)}</p>
            </div>
          ` : ''}

          <form id="password-form" class="space-y-5">
            <div>
              <label for="email" class="block text-[#111111] text-sm font-medium mb-1.5">Email</label>
              <input type="email" id="email" placeholder="nombre@immoral.es" required autocomplete="email"
                class="w-full bg-white border border-[#D8D8D8] rounded-[8px] px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#8A8A8A] focus:outline-none focus:border-[#3980E4] focus:ring-1 focus:ring-[#3980E4] transition-colors" />
            </div>

            <div>
              <label for="password" class="block text-[#111111] text-sm font-medium mb-1.5">Contraseña</label>
              <input type="password" id="password" placeholder="Introduce tu contraseña" required autocomplete="current-password"
                class="w-full bg-white border border-[#D8D8D8] rounded-[8px] px-3.5 py-2.5 text-sm text-[#111111] placeholder-[#8A8A8A] focus:outline-none focus:border-[#3980E4] focus:ring-1 focus:ring-[#3980E4] transition-colors" />
            </div>

            <button type="submit"
              class="w-full bg-[#111111] hover:bg-[#3980E4] text-white rounded-[8px] py-2.5 text-sm font-medium transition-colors">
              Iniciar sesión
            </button>
          </form>

          <div class="flex items-center gap-3 my-6">
            <div class="h-px flex-1 bg-[#D8D8D8]"></div>
            <span class="text-[#8A8A8A] text-xs">o</span>
            <div class="h-px flex-1 bg-[#D8D8D8]"></div>
          </div>

          <button id="google-btn"
            class="w-full flex items-center justify-center gap-2.5 bg-white border border-[#D8D8D8] hover:border-[#8A8A8A] text-[#111111] rounded-[8px] py-2.5 text-sm font-medium transition-colors">
            <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"/>
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"/>
            </svg>
            Continuar con Google
          </button>

          <p class="text-[#8A8A8A] text-xs text-center mt-8">
            Solo cuentas <span class="text-[#5E5E5E]">@immoral.es</span> y <span class="text-[#5E5E5E]">@immoral.marketing</span>.
            <br />
            <button type="button" id="signup-btn" class="mt-2 text-[#3980E4] hover:underline">
              Primera vez aquí — crear cuenta
            </button>
          </p>

        </div>
      </div>
    </div>
  `;

  const fail = (message) => renderLoginView(root, onAuthenticated, message);

  document.getElementById('google-btn').addEventListener('click', async () => {
    const { error } = await signInWithGoogle();
    if (error) fail(error.message);
  });

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const { error } = await signInWithPassword(email, password);
    if (error) {
      fail(error.message);
      return;
    }
    onAuthenticated();
  });

  document.getElementById('signup-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) {
      fail('Rellena email y contraseña para crear la cuenta.');
      return;
    }
    const { error } = await signUpWithPassword(email, password);
    if (error) {
      fail(error.message);
      return;
    }
    onAuthenticated();
  });
}
