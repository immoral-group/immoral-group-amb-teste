import { signOut } from './adminAuth.js';

// Shell compartido por todos los dashboards internos de Immoral — mismo header
// y sidebar en /admin, /ofertas y /roles. Patrón real replicado de
// entregas-immoral/src/app/admin/layout.tsx + AdminSidebar.tsx (header dark
// #111111 con logo, sidebar w-56 con nav agrupada), con los tokens de este
// proyecto (ver docs/DESIGN-REFERENCE.md, docs/IMMORAL-BRAND-GUIDELINES.md).
export const T = {
  page: 'bg-[#0D0D0D]',
  surface: 'bg-[#1C1C1C] border border-[#2E2E2E]',
  input: 'bg-[#141414] border border-[#2E2E2E] text-[#F5F5F5]',
  fileInput: 'text-[#5A5A5A] text-sm cursor-pointer file:mr-3 file:cursor-pointer file:rounded-[8px] file:border file:border-solid file:border-[#2E2E2E] file:bg-[#1C1C1C] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#F5F5F5] hover:file:bg-[#2E2E2E] file:transition-colors',
  radiusCard: 'rounded-[14px]',
  radiusSm: 'rounded-[8px]',
  textPrimary: 'text-[#F5F5F5]',
  textSecondary: 'text-[#8A8A8A]',
  textMuted: 'text-[#5A5A5A]',
  accent: 'bg-[#3980E4] hover:bg-[#2f6bc4] text-white',
  accentText: 'text-[#3980E4] hover:text-[#5b9aec]',
  success: 'text-[#22C55E]',
  successBorder: 'border-[#22C55E]',
  successBg: 'bg-[#22C55E]/[0.12]',
  destructive: 'text-[#E5484D] hover:text-[#f0787d]',
};

const ICONS = {
  users: '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2.5 19.5c0-3 2.9-5.5 6.5-5.5s6.5 2.5 6.5 5.5"/><path d="M16 7.5a2.5 2.5 0 1 1 0-5"/><path d="M14.5 14.5c2.8.4 4.9 2.4 4.9 5"/>',
  briefcase: '<rect x="2.5" y="7" width="15" height="10" rx="1.5"/><path d="M7 7V5.5A1.5 1.5 0 0 1 8.5 4h3A1.5 1.5 0 0 1 13 5.5V7"/><path d="M2.5 11.5h15"/>',
  usercog: '<path d="M8 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M2 18c0-2.8 2.7-5 6-5s6 2.2 6 5"/><circle cx="16" cy="15.5" r="2.3"/><path d="M16 12.3v.7M16 17.9v.7M18.6 15.5h-.7M14.1 15.5h-.7M17.9 13.6l-.5.5M14.6 17.4l-.5.5M17.9 17.4l-.5-.5M14.6 13.6l-.5-.5"/>',
  logs: '<path d="M4.5 2.5h8l4 4v10.5a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-14a.5.5 0 0 1 .5-.5Z"/><path d="M12.5 2.5V6a.5.5 0 0 0 .5.5h3.5"/><path d="M6.5 10.5h6M6.5 13.5h6M6.5 7.5h3"/>',
  mail: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3.5 5.5l6.5 5.5 6.5-5.5"/>',
  logos: '<rect x="2.5" y="2.5" width="8" height="8" rx="1.5"/><rect x="12.5" y="2.5" width="5" height="5" rx="1.5"/><rect x="12.5" y="10" width="5" height="7.5" rx="1.5"/><rect x="2.5" y="13" width="8" height="4.5" rx="1.5"/>',
  inbox: '<path d="M2.5 11.5h4l1.5 3h4l1.5-3h4"/><path d="M4.2 4.5h11.6a1 1 0 0 1 .97.76l1.63 6.5a1 1 0 0 1-.97 1.24H3.17a1 1 0 0 1-.97-1.24l1.63-6.5a1 1 0 0 1 .97-.76Z"/>',
  trophy: '<path d="M6 3.5h8v4a4 4 0 0 1-8 0v-4Z"/><path d="M6 4.5H3.5a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3"/><path d="M14 4.5h2.5a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3"/><path d="M10 11.5v3"/><path d="M7 17.5h6"/><path d="M8.3 14.5h3.4l.6 3h-4.6l.6-3Z"/>',
  key: '<circle cx="6.5" cy="13.5" r="3.5"/><path d="M9 11l7-7"/><path d="M13 7l2 2"/><path d="M16 4l2 2"/>',
};

function icon(name) {
  return `<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">${ICONS[name]}</svg>`;
}

/**
 * Renderiza el shell (header + sidebar) dentro de `root` y devuelve el
 * elemento `<main>` donde cada página inyecta su propio contenido.
 *
 * @param {HTMLElement} root
 * @param {{ activeHref: string, email: string, role: string, isAdmin: boolean }} opts
 */
export function renderShell(root, { activeHref, email, role, isAdmin }) {
  // Nav agrupada en 3 secciones (Gestión / Diseño / Desarrollo) para que el
  // sidebar no sea una lista plana de 6-9 links sin relación visual entre
  // ellos. Los ítems solo-admin (Postulaciones, Tokens, Roles) se filtran
  // dentro de su grupo en vez de agregarse aparte, así cada grupo mantiene
  // el mismo orden lógico se vea o no como admin.
  const navGroups = [
    {
      label: 'Gestión',
      items: [
        { href: '/admin', label: 'Equipo', icon: 'users' },
        { href: '/ofertas', label: 'Ofertas activas', icon: 'briefcase' },
        { href: '/mensajes', label: 'Mensajes', icon: 'mail' },
        ...(isAdmin ? [{ href: '/postulaciones', label: 'Postulaciones', icon: 'inbox' }] : []),
      ],
    },
    {
      label: 'Diseño',
      items: [
        { href: '/logos', label: 'Barra de logos', icon: 'logos' },
        { href: '/casos-admin', label: 'Casos de éxito', icon: 'trophy' },
      ],
    },
    {
      label: 'Desarrollo',
      items: [
        { href: '/logs', label: 'Logs', icon: 'logs' },
        ...(isAdmin ? [
          { href: '/tokens', label: 'Tokens', icon: 'key' },
          { href: '/roles', label: 'Roles', icon: 'usercog' },
        ] : []),
      ],
    },
  ];

  root.innerHTML = `
    <div class="min-h-screen ${T.page} flex flex-col font-sans">
      <header class="px-6 h-14 flex items-center justify-between flex-shrink-0 bg-[#111111]">
        <div class="flex items-center gap-3">
          <img src="/imgs/Menues/logo-menu-claro.png" alt="immoral" style="height:22px;display:block" />
          <div class="w-px h-4 bg-white/20"></div>
          <span class="text-sm font-medium text-white/70">Panel interno</span>
        </div>
        <div class="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer"
            class="text-sm text-white/60 hover:text-white flex items-center gap-1.5 mr-2">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><path d="M8 4.5H4.5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V12"/><path d="M11.5 3.5h5v5"/><path d="M16 4 8.5 11.5"/></svg>
            Ver la web
          </a>
          <span class="text-sm text-white/60">${email}</span>
          <span class="text-xs px-2 py-0.5 rounded-full capitalize bg-white/10 text-white/70">${role}</span>
          <button id="shell-signout" class="text-sm text-white/60 hover:text-white ml-2">Salir</button>
        </div>
      </header>
      <div class="flex flex-1 min-h-0">
        <nav class="w-56 border-r border-[#2E2E2E] px-3 py-4 flex flex-col flex-shrink-0 ${T.page}">
          ${navGroups.map((group, groupIndex) => `
            <div class="${groupIndex > 0 ? 'mt-4' : ''}">
              <div class="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${T.textMuted}">${group.label}</div>
              <div class="flex flex-col gap-0.5">
                ${group.items.map((item) => {
                  const active = activeHref === item.href;
                  return `
                    <a href="${item.href}"
                      class="px-3 py-2 ${T.radiusSm} text-sm transition-colors flex items-center gap-2.5 ${
                        active
                          ? `bg-[#1C1C1C] ${T.textPrimary} font-medium`
                          : `${T.textSecondary} hover:bg-[#1C1C1C] hover:${T.textPrimary}`
                      }">
                      ${icon(item.icon)}
                      ${item.label}
                    </a>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </nav>
        <main id="dashboard-content" class="flex-1 overflow-auto p-6"></main>
      </div>
    </div>
  `;

  document.getElementById('shell-signout').addEventListener('click', async () => {
    await signOut();
    window.location.href = '/admin';
  });

  return document.getElementById('dashboard-content');
}
