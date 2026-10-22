// Cookie notice for a first visit, on every page (Prisma pages via
// prisma-site.js / home-prisma.js, the older ones via main.js). It carries its
// own styles so it looks the same whether or not the page loads Tailwind.
//
// The choice lives in localStorage under the same keys that the preferences
// panel of /cookies.html reads and writes: cookie_consent, cookie_analytics,
// cookie_marketing. As the policy says, it is kept 12 months and then asked
// again (cookie_consent_date). Each choice fires a "cookie-consent" event on
// window ({ analytics, marketing }) for the tags that need it.

const KEEP_MS = 365 * 24 * 60 * 60 * 1000;

const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode: asked again next visit */ } },
};

function hasValidConsent() {
    if (store.get('cookie_consent') !== 'true') return false;
    const date = Number(store.get('cookie_consent_date'));
    // Consents saved before the date existed count from now on.
    if (!date) { store.set('cookie_consent_date', String(Date.now())); return true; }
    return Date.now() - date < KEEP_MS;
}

const CSS = `
#site-bottom-panel {
    --cb-blue: #1F5EFF; --cb-ink: #0C1A3D; --cb-ink-2: #44527A; --cb-line: #DDE4F2;
    position: fixed; z-index: 9000; left: clamp(12px, 2vw, 28px); bottom: clamp(12px, 2vw, 28px);
    width: min(440px, calc(100vw - 24px)); box-sizing: border-box;
    padding: 22px 22px 20px; border-radius: 24px 24px 24px 6px;
    font-family: 'Lexend', system-ui, sans-serif; color: var(--cb-ink); text-align: left;
    background: rgba(255, 255, 255, .86); border: 1.5px solid rgba(255, 255, 255, .95);
    -webkit-backdrop-filter: blur(22px) saturate(150%); backdrop-filter: blur(22px) saturate(150%);
    box-shadow: inset 0 1.5px 2px rgba(255, 255, 255, .95), 0 40px 80px -30px rgba(12, 26, 61, .45), 0 0 0 1px rgba(12, 26, 61, .06);
    opacity: 0; transform: translateY(24px);
    transition: opacity .5s cubic-bezier(.16, 1, .3, 1), transform .6s cubic-bezier(.16, 1, .3, 1);
}
#site-bottom-panel.is-in { opacity: 1; transform: none; }
#site-bottom-panel * { box-sizing: border-box; }
#site-bottom-panel .cb__eyebrow { margin: 0 0 8px; font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: var(--cb-blue); }
#site-bottom-panel .cb__text { margin: 0; font-size: 14px; font-weight: 300; line-height: 1.55; color: var(--cb-ink-2); }
#site-bottom-panel .cb__text a { color: var(--cb-ink); font-weight: 500; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(12, 26, 61, .3); }
#site-bottom-panel .cb__text a:hover { color: var(--cb-blue); text-decoration-color: currentColor; }
#site-bottom-panel .cb__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
#site-bottom-panel .cb__btn {
    flex: 1 1 0; min-width: 0; height: 44px; padding: 0 16px; border: 0; border-radius: 999px; cursor: pointer;
    font: 600 13px/1 'Lexend', system-ui, sans-serif; letter-spacing: -0.01em; white-space: nowrap;
    display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
    transition: background .3s, color .3s, box-shadow .3s;
}
#site-bottom-panel .cb__btn--ghost { background: transparent; color: var(--cb-ink); box-shadow: inset 0 0 0 1.5px var(--cb-line); }
#site-bottom-panel .cb__btn--ghost:hover { box-shadow: inset 0 0 0 1.5px var(--cb-ink); }
#site-bottom-panel .cb__btn--blue { background: var(--cb-blue); color: #fff; }
#site-bottom-panel .cb__btn--blue:hover { background: var(--cb-ink); }
#site-bottom-panel .cb__btn:focus-visible { outline: 2px solid var(--cb-blue); outline-offset: 3px; }
#site-bottom-panel .cb__more { flex-basis: 100%; margin-top: 2px; text-align: center; font-size: 12px; font-weight: 500; color: var(--cb-ink-2); text-decoration: none; }
#site-bottom-panel .cb__more:hover { color: var(--cb-blue); }
@media (prefers-reduced-motion: reduce) { #site-bottom-panel { transition: none; } }
`;

export function initBottomPanel() {
    if (hasValidConsent()) return;
    if (document.getElementById('site-bottom-panel')) return;

    if (!document.getElementById('site-bottom-panel-css')) {
        const style = document.createElement('style');
        style.id = 'site-bottom-panel-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    const banner = document.createElement('section');
    banner.id = 'site-bottom-panel';
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
        <p class="cb__eyebrow">Tu privacidad</p>
        <p class="cb__text">Usamos cookies propias, necesarias para que la web funcione, y de terceros, para medir el tráfico y personalizar la publicidad. Estas solo se activan si las aceptas. <a href="/cookies.html">Política de cookies</a></p>
        <div class="cb__actions">
            <button type="button" class="cb__btn cb__btn--ghost" data-cookies="reject">Rechazar</button>
            <button type="button" class="cb__btn cb__btn--blue" data-cookies="accept">Aceptar</button>
            <a class="cb__more" href="/cookies.html#preferencias">Configurar cookies</a>
        </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('is-in')));

    function save(analytics, marketing) {
        store.set('cookie_analytics', String(analytics));
        store.set('cookie_marketing', String(marketing));
        store.set('cookie_consent', 'true');
        store.set('cookie_consent_date', String(Date.now()));
        window.dispatchEvent(new CustomEvent('cookie-consent', { detail: { analytics, marketing } }));
        banner.classList.remove('is-in');
        setTimeout(() => banner.remove(), 600);
    }

    banner.querySelector('[data-cookies="accept"]').addEventListener('click', () => save(true, true));
    banner.querySelector('[data-cookies="reject"]').addEventListener('click', () => save(false, false));
}
